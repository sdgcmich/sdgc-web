"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/authorization";
import type { ActionResult } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InitiateDuesInput, InitiateDuesResult } from "./types";
import { localPaymentProvider } from "./local-provider";
import { stripePaymentProvider } from "./stripe-provider";

import { getMembershipYear } from "@/features/membership/rules";

export async function initiateDuesPaymentAction(
  input: InitiateDuesInput,
): Promise<ActionResult<InitiateDuesResult>> {
  try {
    // 1. Authorize user server identity
    const user = await requireUser("/membership");
    const targetYear = input.termYear ?? getMembershipYear(new Date(), "America/Detroit");

    if (input.method !== "credit_card" && input.method !== "check") {
      return {
        success: false,
        error: "Invalid payment method selected. Must be credit_card or check.",
      };
    }

    const supabase = await createClient();

    // 2. Fetch authoritative term rate and dates from database (never trust client amounts)
    const { data: term, error: termError } = await supabase
      .from("membership_terms")
      .select("id, year, dues_cents, currency, opens_at, closes_at")
      .eq("year", targetYear)
      .maybeSingle();

    if (termError || !term) {
      return {
        success: false,
        error: `Membership term for year ${targetYear} is not currently configured.`,
      };
    }

    // 3. Find or create user's membership row for this term
    let membershipId: string;
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("term_id", term.id)
      .maybeSingle();

    if (existingMembership) {
      membershipId = existingMembership.id;
    } else {
      const { data: newMembership, error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: user.id,
          term_id: term.id,
          status: "pending",
        })
        .select("id")
        .single();

      if (membershipError || !newMembership) {
        return {
          success: false,
          error: `Could not initialize membership: ${membershipError?.message ?? "unknown error"}`,
        };
      }
      membershipId = newMembership.id;
    }

    // 4. Check for already confirmed or pending payments to strictly prevent duplicate dues charges (PCI DSS & Idempotency)
    const { data: existingConfirmedPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("membership_id", membershipId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existingConfirmedPayment) {
      return {
        success: false,
        error: `Annual dues for calendar year ${targetYear} have already been paid and confirmed. No additional payment is required.`,
      };
    }

    // 4b. Guard against concurrent duplicate pending payment intents within 2 hours
    const { data: existingPendingPayment } = await supabase
      .from("payments")
      .select("id, status, created_at, payment_method")
      .eq("membership_id", membershipId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPendingPayment) {
      const createdTime = new Date(existingPendingPayment.created_at).getTime();
      const elapsedMinutes = (Date.now() - createdTime) / (1000 * 60);
      if (elapsedMinutes < 120) {
        return {
          success: false,
          error: `A dues payment for calendar year ${targetYear} is already in progress / awaiting verification. Please wait for confirmation or cancel the pending attempt before trying again.`,
        };
      }
    }

    // 5. Insert initial payment record as 'pending'
    const isCard = input.method === "credit_card";
    const isSimulation = process.env.LOCAL_PAYMENTS_SIMULATION === "true";
    const stripeStatus = stripePaymentProvider.getConfigStatus();

    const providerName = isCard ? (isSimulation ? "simulated" : "stripe") : "check";
    const notesText = isCard
      ? isSimulation
        ? "Online card checkout via local simulated test adapter"
        : "Online card checkout via Stripe Checkout"
      : "Check to be mailed to P.O. Box 1011, Douglas, MI 49406";

    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        membership_id: membershipId,
        term_id: term.id,
        amount_cents: term.dues_cents, // Authoritative rate from database: $50.00 (5000 cents)
        currency: "USD",
        payment_method: input.method,
        status: "pending",
        provider: providerName,
        notes: notesText,
      })
      .select("id")
      .single();

    if (paymentError || !newPayment) {
      return {
        success: false,
        error: `Failed to record payment intent: ${paymentError?.message ?? "unknown error"}`,
      };
    }

    // 6. Handle payment flow
    let finalStatus: "pending" | "confirmed" = "pending";
    let message: string;
    let checkoutUrl: string | undefined;

    if (isCard) {
      if (isSimulation) {
        // Local simulation: confirm payment via server admin client (simulating webhook execution)
        const checkout = await localPaymentProvider.createCheckout({
          paymentId: newPayment.id,
          amountCents: term.dues_cents,
          currency: "USD",
          returnPath: "/membership",
          membershipId,
        });

        const admin = createAdminClient();
        const { error: confirmError } = await admin
          .from("payments")
          .update({
            status: "confirmed",
            provider_transaction_id: checkout.providerReference,
            provider_event_id: `evt_${checkout.providerReference}`,
          })
          .eq("id", newPayment.id);

        if (confirmError) {
          return {
            success: false,
            error: `Failed to confirm simulated transaction: ${confirmError.message}`,
          };
        }

        finalStatus = "confirmed";
        const formattedAmount = `$${(term.dues_cents / 100).toFixed(2)} ${term.currency}`;
        // CRITICAL: We intentionally do NOT change membership status to approved!
        // Club bylaws mandate that online payment confirmation leaves membership pending manual staff approval.
        message = `Payment Simulation: Card payment of ${formattedAmount} recorded as CONFIRMED. As required by club bylaws, your membership remains PENDING manual approval by staff.`;
      } else if (stripeStatus.isConfigured) {
        // Production or Sandbox Stripe Checkout Session
        const targetReturnPath = input.returnPath || "/dues";
        const checkout = await stripePaymentProvider.createCheckoutSession({
          paymentId: newPayment.id,
          amountCents: term.dues_cents,
          currency: "USD",
          returnPath: targetReturnPath,
          membershipId,
          termYear: targetYear,
          userId: user.id,
          customerEmail: user.email,
        });

        const admin = createAdminClient();
        await admin
          .from("payments")
          .update({
            provider: "stripe",
            provider_transaction_id: checkout.providerReference,
          })
          .eq("id", newPayment.id);

        finalStatus = "pending";
        checkoutUrl = checkout.checkoutUrl;
        message = "Redirecting to secure Stripe Checkout...";
      } else {
        return {
          success: false,
          error:
            "Online card payments are currently being configured. Please select 'Check' or contact the club treasurer.",
        };
      }
    } else {
      const formattedAmount = `$${(term.dues_cents / 100).toFixed(2)} ${term.currency}`;
      // Paper check mailing instructions
      message = `Check Instructions: Please mail your ${formattedAmount} check payable to 'SDGC' to P.O. Box 1011, Douglas, MI 49406. Staff will reconcile your check upon receipt and activate your membership.`;
    }

    revalidatePath("/dues");
    revalidatePath("/membership");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        paymentId: newPayment.id,
        status: finalStatus,
        method: input.method,
        amountCents: term.dues_cents,
        message,
        checkoutUrl,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment initialization failed",
    };
  }
}

/**
 * Reconciles a Stripe Checkout Session synchronously upon user return or verification refresh.
 * Industry best practice & PCI DSS compliance:
 * - Direct server-to-Stripe API verification prevents forged or premature success redirects.
 * - Idempotently updates the payment to 'confirmed' if Stripe reports 'paid' / 'complete'.
 * - Preserves SDGC bylaws: membership status remains 'pending' awaiting manual staff review.
 * - Writes immutable audit log entry.
 */
export async function reconcileDuesPaymentSessionAction(
  sessionId: string,
): Promise<ActionResult<{ paymentId: string; status: "confirmed"; amountCents: number }>> {
  try {
    if (!sessionId?.startsWith("cs_")) {
      return { success: false, error: "Invalid checkout session identifier." };
    }

    const user = await requireUser("/dues");
    const admin = createAdminClient();

    // 1. Retrieve session directly from Stripe API
    const session = await stripePaymentProvider.retrieveCheckoutSession(sessionId);

    // 2. Validate session payment status
    if (session.paymentStatus !== "paid" && session.status !== "complete") {
      return {
        success: false,
        error: `Checkout session is not paid (status: ${session.status}, payment_status: ${session.paymentStatus}).`,
      };
    }

    // 3. Security check: Ensure session belongs to this user or payment intent
    const sessionUserId = session.metadata.userId;
    const paymentId = session.metadata.paymentId || session.clientReferenceId;

    let paymentQuery = admin
      .from("payments")
      .select("id, status, user_id, amount_cents, membership_id");

    if (paymentId) {
      paymentQuery = paymentQuery.eq("id", paymentId);
    } else {
      paymentQuery = paymentQuery.eq("provider_transaction_id", session.id);
    }

    const { data: payment, error: fetchError } = await paymentQuery.maybeSingle();

    if (fetchError || !payment) {
      return { success: false, error: "Matching payment intent record not found in system." };
    }

    // Authorization check
    if (payment.user_id !== user.id && sessionUserId !== user.id) {
      return { success: false, error: "Unauthorized: Payment record belongs to another member." };
    }

    // 4. If already confirmed, return success idempotently
    if (payment.status === "confirmed") {
      return {
        success: true,
        data: {
          paymentId: payment.id,
          status: "confirmed",
          amountCents: payment.amount_cents,
        },
      };
    }

    // 5. Update payment to confirmed
    const { error: updateError } = await admin
      .from("payments")
      .update({
        status: "confirmed",
        provider: "stripe",
        provider_transaction_id: session.paymentIntentId || session.id,
        provider_event_id: session.id,
        notes: "Online card checkout confirmed via Stripe session return reconciliation.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      return { success: false, error: `Failed to confirm payment: ${updateError.message}` };
    }

    // 6. Log audit event
    await admin.from("audit_events").insert({
      action: "payments.reconciled",
      actor_id: user.id,
      entity_type: "payment",
      entity_id: payment.id,
      details: {
        sessionId: session.id,
        paymentIntentId: session.paymentIntentId,
        amountCents: session.amountTotal,
        source: "return_reconciliation",
      },
    });

    revalidatePath("/dues");
    revalidatePath("/membership");
    revalidatePath("/profile");
    revalidatePath("/admin/dues");

    return {
      success: true,
      data: {
        paymentId: payment.id,
        status: "confirmed",
        amountCents: payment.amount_cents,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reconcile checkout session.",
    };
  }
}

/**
 * Cancels an active pending payment intent to release the lock and allow retry or payment method change.
 */
export async function cancelPendingDuesPaymentAction(input?: {
  paymentId?: string;
  termYear?: number;
}): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const user = await requireUser("/dues");
    const admin = createAdminClient();

    let query = admin
      .from("payments")
      .select("id, status, user_id, membership_id")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (input?.paymentId) {
      query = query.eq("id", input.paymentId);
    }

    const { data: pendingPayments, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !pendingPayments || pendingPayments.length === 0) {
      return {
        success: false,
        error: "No active pending payment intent found to cancel.",
      };
    }

    const payment = pendingPayments[0];
    if (!payment) {
      return {
        success: false,
        error: "No active pending payment intent found to cancel.",
      };
    }

    // Transition pending payment to failed (representing cancelled before completion)
    const { error: cancelError } = await admin
      .from("payments")
      .update({
        status: "failed",
        notes: "Payment intent cancelled by member before completion.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (cancelError) {
      return {
        success: false,
        error: `Failed to cancel payment intent: ${cancelError.message}`,
      };
    }

    // Log audit event
    await admin.from("audit_events").insert({
      action: "payments.intent_cancelled",
      actor_id: user.id,
      entity_type: "payment",
      entity_id: payment.id,
      details: {
        reason: "member_requested_cancellation",
      },
    });

    revalidatePath("/dues");
    revalidatePath("/membership");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        success: true,
        message: "Pending payment intent was cancelled. You may now submit a new payment.",
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel payment intent.",
    };
  }
}
