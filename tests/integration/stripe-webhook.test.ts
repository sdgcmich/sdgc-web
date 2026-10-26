import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { createServiceClient, createAuthClient } from "./setup";
import { POST } from "@/features/payments/../../app/api/webhooks/stripe/route";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";

describe("Stripe Webhook Flow & Bylaw Compliance (Integration)", () => {
  const webhookSecret = "whsec_integration_test_secret_key_999";
  let serviceClient: ReturnType<typeof createServiceClient>;
  let pendingUser: Awaited<ReturnType<typeof createAuthClient>>;
  let originalWebhookSecret: string | undefined;
  let testTermId: string;
  let testTermDuesCents: number;
  let testMembershipId: string;

  beforeAll(async () => {
    serviceClient = createServiceClient();
    pendingUser = await createAuthClient("pending@sdgc.local");
    originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

    // 1. Fetch current term
    const { data: term } = await serviceClient
      .from("membership_terms")
      .select("id, dues_cents")
      .eq("year", 2026)
      .single();
    if (!term) throw new Error("Membership term 2026 not found");
    testTermId = term.id;
    testTermDuesCents = term.dues_cents;

    // 2. Fetch or create pending membership for pending member
    const { data: existingMem } = await serviceClient
      .from("memberships")
      .select("id, status")
      .eq("user_id", pendingUser.userId)
      .eq("term_id", testTermId)
      .maybeSingle();

    if (existingMem) {
      testMembershipId = existingMem.id;
      await serviceClient
        .from("memberships")
        .update({ status: "pending" })
        .eq("id", testMembershipId);
    } else {
      const { data: newMem } = await serviceClient
        .from("memberships")
        .insert({
          user_id: pendingUser.userId,
          term_id: testTermId,
          status: "pending",
        })
        .select("id")
        .single();
      if (!newMem) throw new Error("Failed to create membership");
      testMembershipId = newMem.id;
    }
  });

  afterAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  });

  it("rejects webhook requests with missing or invalid signature headers", async () => {
    const payload = JSON.stringify({ id: "evt_invalid_01", type: "checkout.session.completed" });
    const req = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid webhook signature/i);
  });

  it("rejects requests when payload is malformed JSON despite valid signature", async () => {
    const malformedBody = "{ invalid_json_payload: ";
    const signature = stripePaymentProvider.generateWebhookSignature(malformedBody, webhookSecret);

    const req = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": signature,
        "Content-Type": "application/json",
      },
      body: malformedBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Malformed webhook payload/i);
  });

  it("processes checkout.session.completed, confirms payment, preserves pending membership bylaw, and prevents duplicates", async () => {
    // 1. Create a pending payment record
    const { data: payment, error: pError } = await serviceClient
      .from("payments")
      .insert({
        user_id: pendingUser.userId,
        membership_id: testMembershipId,
        term_id: testTermId,
        amount_cents: testTermDuesCents,
        currency: "USD",
        payment_method: "credit_card",
        status: "pending",
        provider: "stripe",
      })
      .select("id")
      .single();

    expect(pError).toBeNull();
    expect(payment).toBeDefined();
    if (!payment) return;

    const eventId = `evt_test_checkout_${Date.now()}`;
    const sessionId = `cs_test_${Date.now()}`;
    const txId = `pi_test_${Date.now()}`;

    const eventPayload = JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionId,
          client_reference_id: payment.id,
          payment_intent: txId,
          payment_status: "paid",
          amount_total: testTermDuesCents,
          currency: "usd",
          metadata: {
            paymentId: payment.id,
            membershipId: testMembershipId,
            userId: pendingUser.userId,
            termYear: "2026",
          },
        },
      },
    });

    const signature = stripePaymentProvider.generateWebhookSignature(eventPayload, webhookSecret);

    const req = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": signature,
        "Content-Type": "application/json",
      },
      body: eventPayload,
    });

    // 2. Send webhook
    const res = await POST(req);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.received).toBe(true);

    // 3. Verify payment updated to confirmed with provider references
    const { data: verifiedPayment } = await serviceClient
      .from("payments")
      .select("status, provider_event_id, provider_session_id, provider_transaction_id")
      .eq("id", payment.id)
      .single();

    expect(verifiedPayment?.status).toBe("confirmed");
    expect(verifiedPayment?.provider_event_id).toBe(eventId);
    expect(verifiedPayment?.provider_session_id).toBe(sessionId);
    expect(verifiedPayment?.provider_transaction_id).toBe(txId);

    // 4. STRICT BYLAW VERIFICATION: Membership MUST remain pending approval!
    const { data: verifiedMem } = await serviceClient
      .from("memberships")
      .select("status")
      .eq("id", testMembershipId)
      .single();

    expect(verifiedMem?.status).toBe("pending");

    // 5. Verify audit log entry
    const { data: auditLogs } = await serviceClient
      .from("audit_events")
      .select("action, entity_id, details")
      .eq("action", "payment.confirmed")
      .eq("entity_id", payment.id);

    expect(auditLogs && auditLogs.length > 0).toBe(true);

    // 6. Test Idempotency / Duplicate Delivery: Sending exact same event again
    const duplicateReq = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": signature,
        "Content-Type": "application/json",
      },
      body: eventPayload,
    });

    const dupRes = await POST(duplicateReq);
    expect(dupRes.status).toBe(200);
    const dupBody = await dupRes.json();
    expect(dupBody.received).toBe(true);
    expect(dupBody.deduplicated).toBe(true);
  });

  it("rejects payments when amount or currency is mismatched", async () => {
    // Create a pending payment
    const { data: payment } = await serviceClient
      .from("payments")
      .insert({
        user_id: pendingUser.userId,
        membership_id: testMembershipId,
        term_id: testTermId,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "credit_card",
        status: "pending",
        provider: "stripe",
      })
      .select("id")
      .single();

    if (!payment) return;

    // Tampered amount event: 3000 instead of 5000
    const tamperedAmountPayload = JSON.stringify({
      id: `evt_tamper_amt_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_tamper_amt_${Date.now()}`,
          client_reference_id: payment.id,
          payment_status: "paid",
          amount_total: 3000, // MISMATCH
          currency: "usd",
        },
      },
    });

    const sigAmt = stripePaymentProvider.generateWebhookSignature(
      tamperedAmountPayload,
      webhookSecret,
    );

    const reqAmt = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": sigAmt,
        "Content-Type": "application/json",
      },
      body: tamperedAmountPayload,
    });

    const resAmt = await POST(reqAmt);
    expect(resAmt.status).toBe(400);
    const bodyAmt = await resAmt.json();
    expect(bodyAmt.error).toMatch(/Payment amount mismatch/i);

    // Verify payment is still pending
    const { data: pCheck } = await serviceClient
      .from("payments")
      .select("status")
      .eq("id", payment.id)
      .single();
    expect(pCheck?.status).toBe("pending");

    // Clean up
    await serviceClient.from("payments").delete().eq("id", payment.id);
  });

  it("handles payment_intent.payment_failed and charge.refunded events", async () => {
    // 1. Create a payment to test failure
    const txId = `pi_fail_${Date.now()}`;
    const { data: failPayment } = await serviceClient
      .from("payments")
      .insert({
        user_id: pendingUser.userId,
        membership_id: testMembershipId,
        term_id: testTermId,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "credit_card",
        status: "pending",
        provider: "stripe",
        provider_transaction_id: txId,
      })
      .select("id")
      .single();

    if (!failPayment) return;

    const failPayload = JSON.stringify({
      id: `evt_fail_${Date.now()}`,
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: txId,
          metadata: { paymentId: failPayment.id, failure_reason: "card_declined" },
        },
      },
    });

    const failSig = stripePaymentProvider.generateWebhookSignature(failPayload, webhookSecret);
    const failReq = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": failSig, "Content-Type": "application/json" },
      body: failPayload,
    });

    const failRes = await POST(failReq);
    expect(failRes.status).toBe(200);

    const { data: updatedFailPayment } = await serviceClient
      .from("payments")
      .select("status")
      .eq("id", failPayment.id)
      .single();
    expect(updatedFailPayment?.status).toBe("failed");

    // 2. Create a confirmed payment to test refund
    const refundTxId = `pi_refund_${Date.now()}`;
    const { data: refundPayment } = await serviceClient
      .from("payments")
      .insert({
        user_id: pendingUser.userId,
        membership_id: testMembershipId,
        term_id: testTermId,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "credit_card",
        status: "confirmed",
        provider: "stripe",
        provider_transaction_id: refundTxId,
      })
      .select("id")
      .single();

    if (!refundPayment) return;

    const refundPayload = JSON.stringify({
      id: `evt_refund_${Date.now()}`,
      type: "charge.refunded",
      data: {
        object: {
          id: `ch_refund_${Date.now()}`,
          payment_intent: refundTxId,
          metadata: { paymentId: refundPayment.id },
        },
      },
    });

    const refundSig = stripePaymentProvider.generateWebhookSignature(refundPayload, webhookSecret);
    const refundReq = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": refundSig, "Content-Type": "application/json" },
      body: refundPayload,
    });

    const refundRes = await POST(refundReq);
    expect(refundRes.status).toBe(200);

    const { data: updatedRefundPayment } = await serviceClient
      .from("payments")
      .select("status")
      .eq("id", refundPayment.id)
      .single();
    expect(updatedRefundPayment?.status).toBe("refunded");

    // Clean up
    await serviceClient.from("payments").delete().eq("id", failPayment.id);
    await serviceClient.from("payments").delete().eq("id", refundPayment.id);
  });
});
