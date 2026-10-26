"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/features/admin/types";
import { requireCapability } from "@/features/auth/authorization";
import { isSimulationAllowed } from "@/features/payments/local-provider";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ticketCheckoutSchema } from "./validation";
import type {
  TicketCheckoutInput,
  TicketCoupon,
  TicketEvent,
  TicketFilterInput,
  TicketOrder,
  TicketOrderListItem,
  TicketStats,
  ValidateCouponResult,
} from "./types";

function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback outside Next.js request context (e.g. integration test runners)
  }
}

export async function getTicketEvents(): Promise<TicketEvent[]> {
  const events: TicketEvent[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, title, starts_at, ends_at, description, ticket_url, requires_tickets, ticket_price_cents, student_price_cents, child_price_cents, venues(name, city, state)",
      )
      .eq("status", "published")
      .order("starts_at", { ascending: true });

    if (data && data.length > 0) {
      // Filter events that require tickets or have ticket_url configured
      const ticketingEvents = data.filter(
        (row) => row.requires_tickets === true || row.ticket_url !== null,
      );

      // Sort upcoming events first (soonest expiring / starts_at closest to now ascending)
      const nowMs = Date.now();
      ticketingEvents.sort((a, b) => {
        const aTime = new Date(a.starts_at).getTime();
        const bTime = new Date(b.starts_at).getTime();
        const aUpcoming = aTime >= nowMs;
        const bUpcoming = bTime >= nowMs;
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        return aTime - bTime;
      });

      for (const row of ticketingEvents) {
        const startDate = new Date(row.starts_at);
        const venueInfo = row.venues as { name?: string; city?: string; state?: string } | null;
        const location = venueInfo?.name
          ? `${venueInfo.name}, ${venueInfo.city || "Saugatuck"}, ${venueInfo.state || "MI"}`
          : "Saugatuck & Douglas, MI";

        const advancePrice = row.ticket_price_cents ?? 1500;
        const studentPrice = row.student_price_cents ?? 1000;
        const childPrice = row.child_price_cents ?? 0;

        events.push({
          id: row.id,
          slug: row.slug,
          title: row.title,
          date: startDate.toLocaleDateString("en-US", {
            timeZone: "America/Detroit",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: startDate.toLocaleTimeString("en-US", {
            timeZone: "America/Detroit",
            hour: "numeric",
            minute: "2-digit",
          }),
          location,
          advancePriceCents: advancePrice,
          dayOfPriceCents: advancePrice + 500,
          studentPriceCents: studentPrice,
          childPriceCents: childPrice,
          requiresTickets: Boolean(row.requires_tickets),
          startsAt: row.starts_at,
          description: row.description || "",
        });
      }
    }
  } catch {
    // Return empty events on query failure
  }

  return events;
}

export async function processTicketOrderAction(
  rawInput: TicketCheckoutInput,
): Promise<ActionResult<TicketOrder>> {
  const isSimulation = isSimulationAllowed();
  const stripeStatus = stripePaymentProvider.getConfigStatus();

  if (!isSimulation && !stripeStatus.isConfigured) {
    return {
      success: false,
      error:
        "Online ticket checkout is currently unavailable. Please check back later or purchase tickets at the event gate.",
    };
  }

  const parsed = ticketCheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid ticket order details.",
    };
  }

  const input = parsed.data;
  const events = await getTicketEvents();
  const selectedEvent = events.find(
    (e) =>
      e.id === input.eventId ||
      e.slug === input.eventId ||
      (input.eventId === "gw-2026" && e.slug.includes("garden-walk")),
  );

  if (!selectedEvent) {
    return {
      success: false,
      error: "The selected event is not available for online advance ticket orders.",
    };
  }

  const yearMatch =
    selectedEvent.slug.match(/\b(20\d\d)\b/) || selectedEvent.date.match(/\b(20\d\d)\b/);
  const eventYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const orderSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const orderReference = `SDGC-TKT-${eventYear}-${orderSuffix}`;

  const studentQuantity = Math.max(0, input.studentQuantity ?? 0);
  const childQuantity = Math.max(0, input.childQuantity ?? 0);
  const adultQuantity = Math.max(0, input.quantity - studentQuantity - childQuantity);

  const adultPriceCents = selectedEvent.advancePriceCents;
  const studentPriceCents = selectedEvent.studentPriceCents;
  const childPriceCents = selectedEvent.childPriceCents;

  const subtotalCents =
    adultQuantity * adultPriceCents +
    studentQuantity * studentPriceCents +
    childQuantity * childPriceCents;

  // Coupon evaluation
  let discountAmountCents = 0;
  let appliedCouponCode: string | null = null;

  if (input.couponCode?.trim()) {
    const couponValidation = await validateCouponCodeAction(
      input.couponCode.trim(),
      selectedEvent.id,
      subtotalCents,
    );
    if (couponValidation.success && couponValidation.data?.valid) {
      discountAmountCents = couponValidation.data.calculatedDiscountCents ?? 0;
      appliedCouponCode = couponValidation.data.code ?? input.couponCode.trim().toUpperCase();

      // Non-blocking increment of coupon times_used
      const supabaseAdmin = createAdminClient();
      supabaseAdmin
        .from("event_coupons")
        .select("id, times_used")
        .ilike("code", appliedCouponCode ?? "")
        .maybeSingle()
        .then(({ data: cRow }) => {
          if (cRow) {
            supabaseAdmin
              .from("event_coupons")
              .update({
                times_used: (cRow.times_used ?? 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", cRow.id)
              .then();
          }
        });
    }
  }

  const totalCents = Math.max(0, subtotalCents - discountAmountCents);

  const supabase = createAdminClient();

  // If running in local simulation mode
  if (isSimulation) {
    const { data: insertedOrder, error: insertError } = await supabase
      .from("ticket_orders")
      .insert({
        order_reference: orderReference,
        event_id: selectedEvent.id,
        purchaser_name: input.purchaserName,
        purchaser_email: input.purchaserEmail,
        purchaser_phone: input.purchaserPhone || null,
        ticket_quantity: input.quantity,
        student_quantity: studentQuantity,
        child_quantity: childQuantity,
        coupon_code: appliedCouponCode,
        discount_amount_cents: discountAmountCents,
        unit_price_cents: selectedEvent.advancePriceCents,
        total_amount_cents: totalCents,
        status: "confirmed",
        notes: input.notes || "Advance online ticket reservation (simulated)",
      })
      .select("id, order_reference, created_at")
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Could not save ticket reservation: ${insertError.message}`,
      };
    }

    const order: TicketOrder = {
      orderId: insertedOrder.id,
      orderReference,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventDate: selectedEvent.date,
      eventTime: selectedEvent.time,
      eventLocation: selectedEvent.location,
      ticketQuantity: input.quantity,
      studentQuantity,
      childQuantity,
      couponCode: appliedCouponCode,
      discountAmountCents,
      unitPriceCents: selectedEvent.advancePriceCents,
      totalCents,
      purchaserName: input.purchaserName,
      purchaserEmail: input.purchaserEmail,
      purchaserPhone: input.purchaserPhone || null,
      status: "confirmed",
      notes: input.notes || null,
      createdAt: insertedOrder.created_at,
      checkInInstructions:
        "SIMULATED ORDER ONLY (No Payment Collected). Please bring this confirmation pass or mobile QR code to the Tour Check-In Table at Saugatuck City Hall on the morning of the event.",
    };

    safeRevalidatePath("/admin/tickets");
    safeRevalidatePath("/tickets-checkout");

    return {
      success: true,
      data: order,
    };
  }

  // Real or Sandbox Stripe Checkout flow
  const { data: insertedOrder, error: insertError } = await supabase
    .from("ticket_orders")
    .insert({
      order_reference: orderReference,
      event_id: selectedEvent.id,
      purchaser_name: input.purchaserName,
      purchaser_email: input.purchaserEmail,
      purchaser_phone: input.purchaserPhone || null,
      ticket_quantity: input.quantity,
      student_quantity: studentQuantity,
      child_quantity: childQuantity,
      coupon_code: appliedCouponCode,
      discount_amount_cents: discountAmountCents,
      unit_price_cents: selectedEvent.advancePriceCents,
      total_amount_cents: totalCents,
      status: "pending",
      notes: input.notes || "Pending Stripe Checkout payment",
    })
    .select("id, order_reference, created_at")
    .single();

  if (insertError) {
    const isMissingTable =
      insertError.message?.toLowerCase().includes("ticket_orders") ||
      insertError.code === "PGRST204";
    const errorMessage = isMissingTable
      ? "Ticket orders table is not yet provisioned on this database environment. Please apply the latest database migration in your Supabase SQL Editor."
      : `Could not initialize ticket reservation: ${insertError.message}`;
    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    const checkout = await stripePaymentProvider.createTicketCheckoutSession({
      ticketOrderId: insertedOrder.id,
      orderReference,
      eventTitle: selectedEvent.title,
      quantity: 1,
      unitPriceCents: totalCents,
      currency: "USD",
      returnPath: "/tickets-checkout",
      purchaserEmail: input.purchaserEmail,
      purchaserName: input.purchaserName,
      eventId: selectedEvent.id,
    });

    await supabase
      .from("ticket_orders")
      .update({ stripe_session_id: checkout.providerReference })
      .eq("id", insertedOrder.id);

    const order: TicketOrder = {
      orderId: insertedOrder.id,
      orderReference,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventDate: selectedEvent.date,
      eventTime: selectedEvent.time,
      eventLocation: selectedEvent.location,
      ticketQuantity: input.quantity,
      studentQuantity,
      childQuantity,
      couponCode: appliedCouponCode,
      discountAmountCents,
      unitPriceCents: selectedEvent.advancePriceCents,
      totalCents,
      purchaserName: input.purchaserName,
      purchaserEmail: input.purchaserEmail,
      purchaserPhone: input.purchaserPhone || null,
      status: "pending",
      notes: input.notes || null,
      createdAt: insertedOrder.created_at,
      checkInInstructions:
        "Please present your official digital pass or printed confirmation receipt at the Tour Check-In Table on the morning of the event.",
      checkoutUrl: checkout.checkoutUrl,
    };

    safeRevalidatePath("/admin/tickets");
    safeRevalidatePath("/tickets-checkout");

    return {
      success: true,
      data: order,
    };
  } catch (err: unknown) {
    // Clean up or mark failed
    await supabase.from("ticket_orders").delete().eq("id", insertedOrder.id);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to create Stripe checkout session for tickets.",
    };
  }
}

export async function getTicketOrderByReferenceAction(
  orderReference: string,
): Promise<ActionResult<TicketOrder>> {
  try {
    const supabase = createAdminClient();
    const { data: orderRow, error: orderError } = await supabase
      .from("ticket_orders")
      .select(
        "id, order_reference, event_id, purchaser_name, purchaser_email, purchaser_phone, ticket_quantity, unit_price_cents, total_amount_cents, status, notes, created_at, checked_in_at, checked_in_by, events(id, title, starts_at, ends_at, description, venues(name, address, city, state, postal_code))",
      )
      .eq("order_reference", orderReference.trim().toUpperCase())
      .maybeSingle();

    if (orderError || !orderRow) {
      return {
        success: false,
        error: `Ticket order not found with reference ${orderReference}`,
      };
    }

    const event = orderRow.events as {
      id: string;
      title: string;
      starts_at: string;
      ends_at: string;
      description: string;
      venues?: {
        name: string;
        address?: string;
        city: string;
        state: string;
        postal_code?: string;
      } | null;
    } | null;

    let eventDate = "July 11, 2026";
    let eventTime = "10:00 AM – 4:00 PM";
    let eventLocation = "Saugatuck City Hall, 102 Butler St, Saugatuck, MI 49453";

    if (event?.starts_at) {
      const d = new Date(event.starts_at);
      eventDate = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Detroit",
      });
      eventTime = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Detroit",
      });
    }

    if (event?.venues) {
      eventLocation = `${event.venues.name}, ${event.venues.city}, ${event.venues.state}`;
    }

    const order: TicketOrder = {
      orderId: orderRow.id,
      orderReference: orderRow.order_reference,
      eventId: orderRow.event_id || "",
      eventTitle: event?.title || "47th Annual Garden Walk Fundraiser",
      eventDate,
      eventTime,
      eventLocation,
      ticketQuantity: orderRow.ticket_quantity,
      unitPriceCents: orderRow.unit_price_cents,
      totalCents: orderRow.total_amount_cents,
      purchaserName: orderRow.purchaser_name,
      purchaserEmail: orderRow.purchaser_email,
      purchaserPhone: orderRow.purchaser_phone || null,
      status: orderRow.status as TicketOrder["status"],
      notes: orderRow.notes,
      checkedInAt: orderRow.checked_in_at,
      checkedInBy: orderRow.checked_in_by,
      createdAt: orderRow.created_at,
      checkInInstructions:
        "Please present your official digital pass or printed confirmation receipt at the Tour Check-In Table on the morning of the event.",
    };

    return {
      success: true,
      data: order,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load ticket order.",
    };
  }
}

export async function listAdminTicketOrdersAction(filters: TicketFilterInput = {}): Promise<{
  orders: TicketOrderListItem[];
  stats: TicketStats;
  events: TicketEvent[];
}> {
  await requireCapability(["events.manage", "dues.reconcile"]);
  const supabase = await createClient();

  let query = supabase
    .from("ticket_orders")
    .select(
      `
      id,
      order_reference,
      event_id,
      purchaser_name,
      purchaser_email,
      purchaser_phone,
      ticket_quantity,
      student_quantity,
      child_quantity,
      coupon_code,
      discount_amount_cents,
      unit_price_cents,
      total_amount_cents,
      status,
      notes,
      checked_in_at,
      checked_in_by,
      created_at,
      updated_at,
      events (
        title,
        slug
      ),
      checked_in_profile:profiles!ticket_orders_checked_in_by_fkey (
        first_name,
        last_name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (filters.eventId && filters.eventId !== "all") {
    query = query.eq("event_id", filters.eventId);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();
    query = query.or(
      `purchaser_name.ilike.%${q}%,purchaser_email.ilike.%${q}%,order_reference.ilike.%${q}%`,
    );
  }

  const { data: rows, error } = await query;
  if (error || !rows) {
    return {
      orders: [],
      stats: {
        totalOrders: 0,
        totalTicketsSold: 0,
        totalRevenueCents: 0,
        checkedInCount: 0,
        pendingCount: 0,
      },
      events: await getTicketEvents(),
    };
  }

  const orders: TicketOrderListItem[] = rows.map((r) => {
    const event = r.events as { title?: string; slug?: string } | null;
    const profile = r.checked_in_profile as { first_name?: string; last_name?: string } | null;
    const checkedInByName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : null;

    return {
      id: r.id,
      orderReference: r.order_reference,
      eventId: r.event_id,
      eventTitle: event?.title || "Annual Garden Walk",
      eventSlug: event?.slug || "garden-walk",
      purchaserName: r.purchaser_name,
      purchaserEmail: r.purchaser_email,
      purchaserPhone: r.purchaser_phone,
      ticketQuantity: r.ticket_quantity,
      studentQuantity: r.student_quantity ?? 0,
      childQuantity: r.child_quantity ?? 0,
      couponCode: r.coupon_code ?? null,
      discountAmountCents: r.discount_amount_cents ?? 0,
      unitPriceCents: r.unit_price_cents,
      totalAmountCents: r.total_amount_cents,
      status: r.status as TicketOrderListItem["status"],
      notes: r.notes,
      checkedInAt: r.checked_in_at,
      checkedInByName,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  // Calculate stats from all orders (or filtered set)
  let totalTicketsSold = 0;
  let totalRevenueCents = 0;
  let checkedInCount = 0;
  let pendingCount = 0;

  for (const o of orders) {
    if (o.status !== "cancelled" && o.status !== "refunded") {
      totalTicketsSold += o.ticketQuantity;
      totalRevenueCents += o.totalAmountCents;
    }
    if (o.status === "checked_in") {
      checkedInCount += o.ticketQuantity;
    } else if (o.status === "confirmed") {
      pendingCount += o.ticketQuantity;
    }
  }

  return {
    orders,
    stats: {
      totalOrders: orders.length,
      totalTicketsSold,
      totalRevenueCents,
      checkedInCount,
      pendingCount,
    },
    events: await getTicketEvents(),
  };
}

export async function checkInTicketOrderAction(
  orderId: string,
  undo = false,
): Promise<ActionResult<{ status: string; checkedInAt: string | null }>> {
  const user = await requireCapability(["events.manage", "dues.reconcile"]);
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const nextStatus = undo ? "confirmed" : "checked_in";
  const checkedInAt = undo ? null : nowIso;
  const checkedInBy = undo ? null : user.id;

  const { error } = await supabase
    .from("ticket_orders")
    .update({
      status: nextStatus,
      checked_in_at: checkedInAt,
      checked_in_by: checkedInBy,
      updated_at: nowIso,
    })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: undo ? "ticket.checkin_reverted" : "ticket.checked_in",
    entity_type: "ticket_order",
    entity_id: orderId,
    details: { status: nextStatus },
  });

  safeRevalidatePath("/admin/tickets");
  return {
    success: true,
    data: { status: nextStatus, checkedInAt },
  };
}

export async function cancelTicketOrderAction(
  orderId: string,
  reason?: string,
): Promise<ActionResult<{ status: string }>> {
  const user = await requireCapability(["events.manage", "dues.reconcile"]);
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("ticket_orders")
    .select("notes")
    .eq("id", orderId)
    .single();

  const existingNotes = existing?.notes ? `${existing.notes} | ` : "";
  const updatedNotes = `${existingNotes}Cancelled: ${reason || "By Administrator"}`;

  const { error } = await supabase
    .from("ticket_orders")
    .update({
      status: "cancelled",
      notes: updatedNotes,
      updated_at: nowIso,
    })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "ticket.cancelled",
    entity_type: "ticket_order",
    entity_id: orderId,
    details: { reason },
  });

  safeRevalidatePath("/admin/tickets");
  return {
    success: true,
    data: { status: "cancelled" },
  };
}

/**
 * Reconciles a Stripe Checkout Session for event tickets upon user return.
 * - Confirms ticket order in ticket_orders table.
 * - Associates stripe_payment_intent_id.
 * - Idempotent: safe against duplicate deliveries or page reloads.
 */
export async function reconcileTicketCheckoutSessionAction(
  sessionId: string,
  orderRef?: string,
): Promise<ActionResult<TicketOrder>> {
  try {
    if (!sessionId?.startsWith("cs_")) {
      return { success: false, error: "Invalid checkout session identifier." };
    }

    const session = await stripePaymentProvider.retrieveCheckoutSession(sessionId);
    if (session.paymentStatus !== "paid" && session.status !== "complete") {
      return {
        success: false,
        error: `Checkout session is not paid (status: ${session.status}, payment_status: ${session.paymentStatus}).`,
      };
    }

    const targetOrderRef = orderRef || session.metadata.orderReference;
    if (!targetOrderRef) {
      return { success: false, error: "Missing order reference in checkout session metadata." };
    }

    const supabase = createAdminClient();
    const { data: existingOrder, error: fetchError } = await supabase
      .from("ticket_orders")
      .select("*, events(title, starts_at, venues(name, city, state))")
      .eq("order_reference", targetOrderRef)
      .maybeSingle();

    if (fetchError || !existingOrder) {
      return { success: false, error: "Ticket order record not found." };
    }

    if (existingOrder.status !== "confirmed") {
      await supabase
        .from("ticket_orders")
        .update({
          status: "confirmed",
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.paymentIntentId || null,
          notes: "Confirmed via Stripe Checkout session return verification.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingOrder.id);

      await supabase.from("audit_events").insert({
        action: "ticket.reconciled",
        entity_type: "ticket_order",
        entity_id: existingOrder.id,
        details: {
          sessionId: session.id,
          paymentIntentId: session.paymentIntentId,
          orderReference: targetOrderRef,
          amountCents: session.amountTotal,
        },
      });
    }

    const event = existingOrder.events as {
      title?: string;
      starts_at?: string;
      venues?: { name?: string; city?: string; state?: string } | null;
    } | null;

    const startDate = event?.starts_at ? new Date(event.starts_at) : new Date();
    const venueInfo = event?.venues;
    const location = venueInfo?.name
      ? `${venueInfo.name}, ${venueInfo.city || "Saugatuck"}, ${venueInfo.state || "MI"}`
      : "Saugatuck & Douglas, MI";

    const order: TicketOrder = {
      orderId: existingOrder.id,
      orderReference: existingOrder.order_reference,
      eventId: existingOrder.event_id || "",
      eventTitle: event?.title || "Annual Garden Walk Fundraiser",
      eventDate: startDate.toLocaleDateString("en-US", {
        timeZone: "America/Detroit",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      eventTime: startDate.toLocaleTimeString("en-US", {
        timeZone: "America/Detroit",
        hour: "numeric",
        minute: "2-digit",
      }),
      eventLocation: location,
      ticketQuantity: existingOrder.ticket_quantity,
      unitPriceCents: existingOrder.unit_price_cents,
      totalCents: existingOrder.total_amount_cents,
      purchaserName: existingOrder.purchaser_name,
      purchaserEmail: existingOrder.purchaser_email,
      purchaserPhone: existingOrder.purchaser_phone || null,
      status: "confirmed",
      notes: existingOrder.notes || null,
      createdAt: existingOrder.created_at,
      checkInInstructions:
        "Please present this confirmed ticket pass (printed or digital PDF) at the Garden Walk check-in desk at Saugatuck City Hall on tour day.",
    };

    safeRevalidatePath("/admin/tickets");
    safeRevalidatePath("/tickets-checkout");

    return { success: true, data: order };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reconcile ticket session.",
    };
  }
}

/**
 * Validate a coupon or promo code for ticket checkout.
 * Safe for public checkout use.
 */
export async function validateCouponCodeAction(
  code: string,
  eventId?: string,
  subtotalCents?: number,
): Promise<ActionResult<ValidateCouponResult>> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: "Please enter a coupon code." };
  }

  try {
    const supabase = await createClient();
    const { data: coupon, error } = await supabase
      .from("event_coupons")
      .select(
        "id, code, description, discount_type, discount_value, event_id, valid_from, valid_until, max_uses, times_used, is_active",
      )
      .ilike("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !coupon) {
      return {
        success: true,
        data: { valid: false, message: "Invalid or inactive coupon code." },
      };
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return {
        success: true,
        data: { valid: false, message: "This coupon code is not active yet." },
      };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return {
        success: true,
        data: { valid: false, message: "This coupon code has expired." },
      };
    }

    if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
      return {
        success: true,
        data: { valid: false, message: "This coupon has reached its maximum redemptions." },
      };
    }

    if (coupon.event_id && eventId && coupon.event_id !== eventId) {
      return {
        success: true,
        data: { valid: false, message: "This coupon is not valid for the selected event." },
      };
    }

    let calculatedDiscountCents = 0;
    const baseAmount = subtotalCents ?? 0;
    if (coupon.discount_type === "percentage") {
      calculatedDiscountCents = Math.round((baseAmount * coupon.discount_value) / 100);
    } else {
      calculatedDiscountCents = Math.min(baseAmount, coupon.discount_value);
    }

    const discountLabel =
      coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% off`
        : `$${(coupon.discount_value / 100).toFixed(2)} off`;

    return {
      success: true,
      data: {
        valid: true,
        code: coupon.code,
        discountType: coupon.discount_type as "percentage" | "fixed_amount",
        discountValue: coupon.discount_value,
        calculatedDiscountCents,
        message: coupon.description || `Applied ${discountLabel}!`,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to validate coupon code.",
    };
  }
}

/**
 * List all coupons for admin ticket configuration.
 */
export async function listAdminCouponsAction(): Promise<ActionResult<TicketCoupon[]>> {
  await requireCapability(["events.manage", "dues.reconcile"]);
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("event_coupons")
    .select(
      `
      id,
      code,
      description,
      discount_type,
      discount_value,
      event_id,
      valid_from,
      valid_until,
      max_uses,
      times_used,
      is_active,
      created_at,
      events (
        title
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !rows) {
    return { success: false, error: error?.message || "Failed to load coupons." };
  }

  const coupons: TicketCoupon[] = rows.map((r) => {
    const event = r.events as { title?: string } | null;
    return {
      id: r.id,
      code: r.code,
      description: r.description,
      discountType: r.discount_type as "percentage" | "fixed_amount",
      discountValue: r.discount_value,
      eventId: r.event_id,
      eventTitle: event?.title || null,
      validFrom: r.valid_from,
      validUntil: r.valid_until,
      maxUses: r.max_uses,
      timesUsed: r.times_used,
      isActive: r.is_active,
      createdAt: r.created_at,
    };
  });

  return { success: true, data: coupons };
}

/**
 * Create a new coupon code for events.
 */
export async function createCouponAction(input: {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  eventId?: string;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
}): Promise<ActionResult<TicketCoupon>> {
  const user = await requireCapability("events.manage");
  const cleanCode = input.code.trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 3) {
    return { success: false, error: "Coupon code must be at least 3 characters." };
  }
  if (input.discountValue <= 0) {
    return { success: false, error: "Discount value must be greater than 0." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_coupons")
    .insert({
      code: cleanCode,
      description: input.description?.trim() || null,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      event_id: input.eventId && input.eventId !== "all" ? input.eventId : null,
      valid_from: input.validFrom ? new Date(input.validFrom).toISOString() : null,
      valid_until: input.validUntil ? new Date(input.validUntil).toISOString() : null,
      max_uses: input.maxUses ? Math.max(1, input.maxUses) : null,
      is_active: true,
    })
    .select("id, code, created_at")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "coupon.created",
    entity_type: "event_coupon",
    entity_id: data.id,
    details: {
      code: cleanCode,
      discountType: input.discountType,
      discountValue: input.discountValue,
    },
  });

  safeRevalidatePath("/admin/tickets");
  safeRevalidatePath("/tickets-checkout");

  return {
    success: true,
    message: `Coupon "${cleanCode}" created successfully.`,
  };
}

/**
 * Toggle active status of a coupon.
 */
export async function toggleCouponActiveAction(
  couponId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_coupons")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", couponId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: isActive ? "coupon.activated" : "coupon.deactivated",
    entity_type: "event_coupon",
    entity_id: couponId,
    details: { isActive },
  });

  safeRevalidatePath("/admin/tickets");
  safeRevalidatePath("/tickets-checkout");
  return { success: true };
}

/**
 * Delete a coupon.
 */
export async function deleteCouponAction(couponId: string): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const { error } = await supabase.from("event_coupons").delete().eq("id", couponId);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "coupon.deleted",
    entity_type: "event_coupon",
    entity_id: couponId,
  });

  safeRevalidatePath("/admin/tickets");
  safeRevalidatePath("/tickets-checkout");
  return { success: true };
}
