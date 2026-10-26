import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTicketPassPdf, type TicketPassData } from "@/lib/pdf/ticket-pass-pdf";

interface RouteParams {
  params: Promise<{
    orderReference: string;
  }>;
}

export async function GET(_request: Request, context: RouteParams) {
  try {
    const { orderReference } = await context.params;

    if (!orderReference?.trim()) {
      return NextResponse.json({ error: "Order reference is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("ticket_orders")
      .select(
        `
        id,
        order_reference,
        purchaser_name,
        purchaser_email,
        ticket_quantity,
        unit_price_cents,
        total_amount_cents,
        status,
        created_at,
        stripe_payment_intent_id,
        stripe_session_id,
        events (
          title,
          starts_at,
          ends_at,
          venues (
            name,
            address,
            city,
            state,
            postal_code
          )
        )
      `,
      )
      .eq("order_reference", orderReference.trim().toUpperCase())
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Ticket order not found." }, { status: 404 });
    }

    const event = order.events as unknown as {
      title?: string;
      starts_at?: string;
      ends_at?: string;
      venues?: {
        name?: string;
        address?: string;
        city?: string;
        state?: string;
        postal_code?: string;
      };
    } | null;

    const eventStartDate = event?.starts_at ? new Date(event.starts_at) : new Date();
    const eventEndDate = event?.ends_at ? new Date(event.ends_at) : null;

    const eventDateStr = eventStartDate.toLocaleDateString("en-US", {
      timeZone: "America/Detroit",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const eventTimeStr = eventEndDate
      ? `${eventStartDate.toLocaleTimeString("en-US", {
          timeZone: "America/Detroit",
          hour: "numeric",
          minute: "2-digit",
        })} – ${eventEndDate.toLocaleTimeString("en-US", {
          timeZone: "America/Detroit",
          hour: "numeric",
          minute: "2-digit",
        })}`
      : eventStartDate.toLocaleTimeString("en-US", {
          timeZone: "America/Detroit",
          hour: "numeric",
          minute: "2-digit",
        });

    const venue = event?.venues;
    const venueName = venue?.name || "Saugatuck-Douglas Area Private Gardens";
    const venueAddress = venue?.address
      ? `${venue.address}, ${venue.city || "Saugatuck"}, ${venue.state || "MI"} ${venue.postal_code || ""}`.trim()
      : "Check in at Registration Tent to pick up tour guidebook & map";

    const purchaseDateStr = new Date(order.created_at).toLocaleDateString("en-US", {
      timeZone: "America/Detroit",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const ticketPassData: TicketPassData = {
      orderReference: order.order_reference,
      purchaserName: order.purchaser_name,
      purchaserEmail: order.purchaser_email,
      eventName: event?.title || "Annual Saugatuck Douglas Garden Walk",
      eventDate: eventDateStr,
      eventTime: eventTimeStr,
      venueName,
      venueAddress,
      ticketCount: order.ticket_quantity,
      ticketType: "Advance Admission",
      totalAmountCents: order.total_amount_cents,
      currency: "USD",
      paymentStatus: order.status === "confirmed" ? "PAID" : order.status.toUpperCase(),
      purchaseDate: purchaseDateStr,
      transactionReference: order.stripe_payment_intent_id || order.stripe_session_id || undefined,
    };

    const pdfBuffer = generateTicketPassPdf(ticketPassData);

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="SDGC-Ticket-Pass-${order.order_reference}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate ticket PDF." },
      { status: 500 },
    );
  }
}
