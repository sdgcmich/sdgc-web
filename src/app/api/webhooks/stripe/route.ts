import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";

export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  // 1. Verify webhook signature
  const isValid = stripePaymentProvider.verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: {
    id: string;
    type: string;
    data: {
      object: {
        id: string;
        client_reference_id?: string;
        payment_intent?: string;
        payment_status?: string;
        amount_total?: number;
        currency?: string;
        metadata?: Record<string, string>;
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 2. Event Deduplication: Prevent duplicate replay of already processed events
  const { data: existingProcessed } = await supabase
    .from("payments")
    .select("id, status")
    .eq("provider_event_id", event.id)
    .maybeSingle();

  if (existingProcessed) {
    return NextResponse.json({
      received: true,
      deduplicated: true,
      message: `Event ${event.id} already processed. Skipping duplicate execution.`,
    });
  }

  const sessionObj = event.data?.object;

  // 3. Process supported events
  switch (event.type) {
    case "checkout.session.completed": {
      // Must be confirmed paid by provider
      if (sessionObj?.payment_status && sessionObj.payment_status !== "paid") {
        return NextResponse.json(
          { error: `Payment not completed: status is ${sessionObj.payment_status}` },
          { status: 400 },
        );
      }

      // Check if this checkout session is for an event ticket order
      if (sessionObj?.metadata?.type === "ticket_order" || sessionObj?.metadata?.orderReference) {
        const orderRef = sessionObj.metadata.orderReference;
        const ticketOrderId = sessionObj.metadata.ticketOrderId;

        const { data: ticketOrder } = await supabase
          .from("ticket_orders")
          .select("id, order_reference, status, total_amount_cents")
          .or(
            `id.eq.${ticketOrderId || "00000000-0000-0000-0000-000000000000"},order_reference.eq.${orderRef}`,
          )
          .maybeSingle();

        if (ticketOrder) {
          if (ticketOrder.status !== "confirmed") {
            await supabase
              .from("ticket_orders")
              .update({
                status: "confirmed",
                stripe_session_id: sessionObj.id,
                stripe_payment_intent_id: sessionObj.payment_intent || null,
                notes: `Paid via Stripe Checkout (${sessionObj.id})`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", ticketOrder.id);

            await supabase.from("audit_events").insert({
              action: "ticket_order.confirmed",
              entity_type: "ticket_order",
              entity_id: ticketOrder.id,
              details: {
                event_id: event.id,
                order_reference: ticketOrder.order_reference,
                stripe_session_id: sessionObj.id,
                amount_total: sessionObj.amount_total,
              },
            });
          }

          return NextResponse.json({
            received: true,
            ticket_order_confirmed: true,
            order_reference: ticketOrder.order_reference,
          });
        }
      }

      const paymentId = sessionObj?.client_reference_id || sessionObj?.metadata?.paymentId;

      if (!paymentId) {
        return NextResponse.json(
          { error: "Missing payment reference identifier" },
          { status: 400 },
        );
      }

      // Fetch expected payment record
      const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select("id, status, amount_cents, currency")
        .eq("id", paymentId)
        .maybeSingle();

      if (fetchError || !payment) {
        return NextResponse.json({ error: "Expected payment record not found" }, { status: 404 });
      }

      // Already confirmed under another event
      if (payment.status === "confirmed") {
        return NextResponse.json({
          received: true,
          deduplicated: true,
          message: "Payment already confirmed.",
        });
      }

      if (payment.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot transition payment from ${payment.status} to confirmed` },
          { status: 400 },
        );
      }

      // Authoritative validation of amount and currency
      if (
        typeof sessionObj.amount_total === "number" &&
        sessionObj.amount_total !== payment.amount_cents
      ) {
        return NextResponse.json(
          {
            error: `Payment amount mismatch: expected ${payment.amount_cents}, received ${sessionObj.amount_total}`,
          },
          { status: 400 },
        );
      }

      if (
        sessionObj.currency &&
        sessionObj.currency.toLowerCase() !== payment.currency.toLowerCase()
      ) {
        return NextResponse.json(
          {
            error: `Payment currency mismatch: expected ${payment.currency}, received ${sessionObj.currency}`,
          },
          { status: 400 },
        );
      }

      const providerTxId = sessionObj.payment_intent || sessionObj.id;

      // Atomic state transition guard: only update if status is still pending
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "confirmed",
          provider_event_id: event.id,
          provider_session_id: sessionObj.id,
          provider_transaction_id: providerTxId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("status", "pending");

      if (updateError) {
        return NextResponse.json(
          { error: `Database update failed: ${updateError.message}` },
          { status: 500 },
        );
      }

      // Audit log
      await supabase.from("audit_events").insert({
        action: "payment.confirmed",
        entity_type: "payment",
        entity_id: paymentId,
        details: {
          event_id: event.id,
          provider: "stripe",
          provider_session_id: sessionObj.id,
          provider_transaction_id: providerTxId,
          amount_total: sessionObj.amount_total,
          currency: sessionObj.currency,
        },
      });

      // STRICT BYLAW REQUIREMENT: Membership status is NOT automatically approved!
      // It remains 'pending' awaiting manual staff approval.
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntentId = sessionObj?.id;
      const paymentId = sessionObj?.metadata?.paymentId || sessionObj?.client_reference_id;
      if (paymentIntentId || paymentId) {
        let query = supabase
          .from("payments")
          .update({
            status: "failed",
            provider_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .eq("status", "pending");

        if (paymentId) {
          query = query.eq("id", paymentId);
        } else if (paymentIntentId) {
          query = query.or(
            `provider_transaction_id.eq.${paymentIntentId},provider_session_id.eq.${paymentIntentId}`,
          );
        }

        const { error: failError } = await query;

        if (failError) {
          return NextResponse.json(
            { error: `Failed payment update error: ${failError.message}` },
            { status: 500 },
          );
        }

        // Audit log for payment failure
        await supabase.from("audit_events").insert({
          action: "payment.failed",
          entity_type: "payment",
          entity_id: paymentId || paymentIntentId || "unknown",
          details: {
            event_id: event.id,
            provider: "stripe",
            provider_transaction_id: paymentIntentId,
            reason: sessionObj?.metadata?.failure_reason || "payment_intent_failed",
          },
        });
      }
      break;
    }

    case "charge.refunded": {
      const chargeId = sessionObj?.id;
      const txId = sessionObj?.payment_intent || chargeId;
      const paymentId = sessionObj?.metadata?.paymentId;
      if (txId || paymentId) {
        let query = supabase
          .from("payments")
          .update({
            status: "refunded",
            provider_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .eq("status", "confirmed");

        if (paymentId) {
          query = query.eq("id", paymentId);
        } else if (txId) {
          query = query.or(`provider_transaction_id.eq.${txId},provider_session_id.eq.${txId}`);
        }

        const { error: refundError } = await query;

        if (refundError) {
          return NextResponse.json(
            { error: `Refund update error: ${refundError.message}` },
            { status: 500 },
          );
        }

        // Audit log for payment refund
        await supabase.from("audit_events").insert({
          action: "payment.refunded",
          entity_type: "payment",
          entity_id: paymentId || txId || "unknown",
          details: {
            event_id: event.id,
            provider: "stripe",
            provider_transaction_id: txId,
          },
        });
      }
      break;
    }

    default:
      // Ignore unhandled event types with 200 OK
      break;
  }

  return NextResponse.json({ received: true });
}
