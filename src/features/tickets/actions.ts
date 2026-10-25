"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/features/auth/types";
import { requireCapability } from "@/features/auth/authorization";
import { isSimulationAllowed } from "@/features/payments/local-provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ticketCheckoutSchema } from "./validation";
import type {
  TicketCheckoutInput,
  TicketEvent,
  TicketFilterInput,
  TicketOrder,
  TicketOrderListItem,
  TicketStats,
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
        "id, slug, title, starts_at, ends_at, description, ticket_url, venues(name, city, state)",
      )
      .not("ticket_url", "is", null)
      .eq("status", "published")
      .order("starts_at", { ascending: true });

    if (data && data.length > 0) {
      for (const row of data) {
        const startDate = new Date(row.starts_at);
        const venueInfo = row.venues as { name?: string; city?: string; state?: string } | null;
        const location = venueInfo?.name
          ? `${venueInfo.name}, ${venueInfo.city || "Saugatuck"}, ${venueInfo.state || "MI"}`
          : "Saugatuck & Douglas, MI";

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
          advancePriceCents: 2000,
          dayOfPriceCents: 2500,
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
  if (!isSimulationAllowed()) {
    return {
      success: false,
      error:
        "Online ticket orders are currently in simulated preview mode. Ticket sales simulation is only allowed in local test environments with LOCAL_PAYMENTS_SIMULATION=true.",
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
  const totalCents = input.quantity * selectedEvent.advancePriceCents;

  const supabase = createAdminClient();

  // Persist order directly into ticket_orders table
  const { data: insertedOrder, error: insertError } = await supabase
    .from("ticket_orders")
    .insert({
      order_reference: orderReference,
      event_id: selectedEvent.id,
      purchaser_name: input.purchaserName,
      purchaser_email: input.purchaserEmail,
      purchaser_phone: input.purchaserPhone || null,
      ticket_quantity: input.quantity,
      unit_price_cents: selectedEvent.advancePriceCents,
      total_amount_cents: totalCents,
      status: "confirmed",
      notes: input.notes || "Advance online ticket reservation",
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
    unitPriceCents: selectedEvent.advancePriceCents,
    totalCents,
    purchaserName: input.purchaserName,
    purchaserEmail: input.purchaserEmail,
    purchaserPhone: input.purchaserPhone || null,
    status: "confirmed",
    notes: input.notes || null,
    createdAt: insertedOrder.created_at,
    checkInInstructions:
      "SIMULATED ORDER ONLY (No Payment Collected). Please bring this simulated confirmation receipt to the Tour Check-In Table at Saugatuck City Hall on the morning of the event.",
  };

  safeRevalidatePath("/admin/tickets");
  safeRevalidatePath("/tickets-checkout");

  return {
    success: true,
    data: order,
  };
}

export async function listAdminTicketOrdersAction(filters: TicketFilterInput = {}): Promise<{
  orders: TicketOrderListItem[];
  stats: TicketStats;
  events: TicketEvent[];
}> {
  await requireCapability("events.manage");
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
  const user = await requireCapability("events.manage");
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
  const user = await requireCapability("events.manage");
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
