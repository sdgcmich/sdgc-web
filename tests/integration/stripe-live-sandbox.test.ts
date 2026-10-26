import "./setup";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as stripeWebhookPost } from "@/app/api/webhooks/stripe/route";
import { GET as getTicketPdf } from "@/app/api/tickets/[orderReference]/pdf/route";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";

describe("Live Stripe Sandbox API Verification", () => {
  it.runIf(Boolean(process.env.STRIPE_SECRET_KEY))(
    "creates a real Stripe Checkout Session on Stripe's servers using sandbox keys",
    async () => {
      const config = stripePaymentProvider.getConfigStatus();
      expect(config.isConfigured).toBe(true);
      expect(config.isTestMode).toBe(true);
      expect(config.secretKeyAvailable).toBe(true);

      const testPaymentId = `live_test_pay_${crypto.randomUUID().slice(0, 8)}`;
      const testMembershipId = `live_test_mem_${crypto.randomUUID().slice(0, 8)}`;

      // Call real Stripe API
      const result = await stripePaymentProvider.createCheckoutSession({
        paymentId: testPaymentId,
        amountCents: 5000,
        currency: "USD",
        returnPath: "http://127.0.0.1:3000/membership",
        membershipId: testMembershipId,
        userId: "usr_sandbox_test",
        termYear: 2026,
        customerEmail: "sandbox.tester@example.com",
      });

      // Verify Stripe returned a real checkout session
      expect(result.providerReference).toBeDefined();
      expect(result.providerReference).toMatch(/^cs_test_/);
      expect(result.checkoutUrl).toBeDefined();
      expect(result.checkoutUrl).toContain("checkout.stripe.com");

      // Fetch the session directly from Stripe API to verify its server state
      const secretKey = process.env.STRIPE_SECRET_KEY;
      const stripeGetRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${result.providerReference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      expect(stripeGetRes.status).toBe(200);
      const sessionData = await stripeGetRes.json();
      expect(sessionData.id).toBe(result.providerReference);
      expect(sessionData.amount_total).toBe(5000);
      expect(sessionData.currency).toBe("usd");
      expect(sessionData.status).toBe("open");
      expect(sessionData.metadata.paymentId).toBe(testPaymentId);
      expect(sessionData.metadata.membershipId).toBe(testMembershipId);
      expect(sessionData.metadata.termYear).toBe("2026");
    },
  );

  it.runIf(Boolean(process.env.STRIPE_SECRET_KEY))(
    "creates a real Stripe Ticket Checkout Session on Stripe servers and verifies live session state",
    async () => {
      const testOrderId = `live_tkt_order_${crypto.randomUUID().slice(0, 8)}`;
      const testOrderRef = `SDGC-TKT-2026-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

      // Call real Stripe API for ticket checkout
      const result = await stripePaymentProvider.createTicketCheckoutSession({
        ticketOrderId: testOrderId,
        orderReference: testOrderRef,
        eventTitle: "Annual Saugatuck-Douglas Garden Walk",
        quantity: 2,
        unitPriceCents: 2000,
        currency: "USD",
        returnPath: "/tickets-checkout",
        purchaserEmail: "ticket.tester@example.com",
        purchaserName: "Ticket Tester",
      });

      expect(result.providerReference).toBeDefined();
      expect(result.providerReference).toMatch(/^cs_test_/);
      expect(result.checkoutUrl).toBeDefined();
      expect(result.checkoutUrl).toContain("checkout.stripe.com");

      // Verify on Stripe servers
      const secretKey = process.env.STRIPE_SECRET_KEY;
      const stripeRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${result.providerReference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      expect(stripeRes.status).toBe(200);
      const sessionData = await stripeRes.json();
      expect(sessionData.id).toBe(result.providerReference);
      expect(sessionData.amount_total).toBe(4000); // 2 x $20.00 = $40.00
      expect(sessionData.currency).toBe("usd");
      expect(sessionData.status).toBe("open");
      expect(sessionData.metadata.ticketOrderId).toBe(testOrderId);
      expect(sessionData.metadata.orderReference).toBe(testOrderRef);
      expect(sessionData.metadata.quantity).toBe("2");
      expect(sessionData.metadata.type).toBe("ticket_order");
    },
  );

  it.runIf(Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET))(
    "verifies ticket order webhook confirmation and PDF ticket generation",
    async () => {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      // Find an event ID from events
      const { data: eventRow } = await supabase.from("events").select("id").limit(1).single();
      expect(eventRow).toBeDefined();
      if (!eventRow) throw new Error("No event found for test");

      const orderRef = `SDGC-TKT-2026-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const { data: order, error: insertErr } = await supabase
        .from("ticket_orders")
        .insert({
          order_reference: orderRef,
          event_id: eventRow.id,
          purchaser_name: "Live Sandbox Visitor",
          purchaser_email: "sandbox.visitor@example.com",
          purchaser_phone: "269-555-0123",
          ticket_quantity: 2,
          unit_price_cents: 2000,
          total_amount_cents: 4000,
          status: "pending",
        })
        .select("id, order_reference")
        .single();

      expect(insertErr).toBeNull();
      expect(order).toBeDefined();
      if (!order) throw new Error("Failed to insert ticket order");

      // Simulate Stripe webhook checkout.session.completed
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
      const fakeSessionId = `cs_test_sim_${crypto.randomUUID().slice(0, 8)}`;
      const fakePaymentIntentId = `pi_test_sim_${crypto.randomUUID().slice(0, 8)}`;

      const webhookPayload = JSON.stringify({
        id: `evt_test_${crypto.randomUUID().slice(0, 8)}`,
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: {
            id: fakeSessionId,
            object: "checkout.session",
            amount_total: 4000,
            currency: "usd",
            payment_status: "paid",
            payment_intent: fakePaymentIntentId,
            metadata: {
              type: "ticket_order",
              ticketOrderId: order.id,
              orderReference: orderRef,
            },
          },
        },
      });

      const signature = stripePaymentProvider.generateWebhookSignature(
        webhookPayload,
        webhookSecret,
      );

      const webhookReq = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": signature,
        },
        body: webhookPayload,
      });

      const webhookResponse = await stripeWebhookPost(webhookReq);

      expect(webhookResponse.status).toBe(200);

      // Verify the ticket order in database transitioned to confirmed
      const { data: updatedOrder } = await supabase
        .from("ticket_orders")
        .select("status, stripe_payment_intent_id")
        .eq("id", order.id)
        .single();

      expect(updatedOrder?.status).toBe("confirmed");
      expect(updatedOrder?.stripe_payment_intent_id).toBe(fakePaymentIntentId);

      // Verify the PDF download endpoint returns a valid PDF
      const pdfResponse = await getTicketPdf(
        new Request(`http://127.0.0.1:3000/api/tickets/${orderRef}/pdf`),
        {
          params: Promise.resolve({ orderReference: orderRef }),
        },
      );
      expect(pdfResponse.status).toBe(200);
      expect(pdfResponse.headers.get("content-type")).toContain("application/pdf");

      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      expect(pdfBuffer.subarray(0, 8).toString("latin1")).toContain("%PDF-1.4");
      expect(pdfBuffer.subarray(pdfBuffer.length - 10).toString("latin1")).toContain("%%EOF");
    },
  );
});
