"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/admin/types";
import type { TicketVerificationResult, MemberVerificationResult } from "./types";

function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Non-blocking fallback outside Next.js request context
  }
}

/**
 * Verify a ticket pass by its public order reference (e.g. SDGC-TKT-2027-A8B9C1).
 * Safe for gate attendants and ticket holders.
 */
export async function verifyTicketAction(
  orderReference: string,
): Promise<ActionResult<TicketVerificationResult>> {
  const cleanRef = orderReference.trim().toUpperCase();
  if (!cleanRef) {
    return {
      success: false,
      error: "Please provide a valid ticket order reference.",
    };
  }

  try {
    const supabase = createAdminClient();

    const { data: order, error } = await supabase
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
        unit_price_cents,
        total_amount_cents,
        discount_amount_cents,
        coupon_code,
        status,
        notes,
        checked_in_at,
        checked_in_by,
        created_at,
        events (
          title,
          slug,
          starts_at,
          ends_at,
          venues (
            name,
            city,
            state
          )
        ),
        checked_in_profile:profiles!ticket_orders_checked_in_by_fkey (
          first_name,
          last_name
        )
      `,
      )
      .eq("order_reference", cleanRef)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!order) {
      return {
        success: true,
        data: {
          status: "not_found",
          orderReference: cleanRef,
          message: "No ticket record found matching this reference code.",
        },
      };
    }

    const eventData = order.events as {
      title?: string;
      slug?: string;
      starts_at?: string;
      ends_at?: string;
      venues?: { name?: string; city?: string; state?: string } | null;
    } | null;

    let eventDate = "Date TBA";
    let eventTime = "Time TBA";
    let eventLocation = "Saugatuck & Douglas, MI";

    if (eventData?.starts_at) {
      const start = new Date(eventData.starts_at);
      eventDate = start.toLocaleDateString("en-US", {
        timeZone: "America/Detroit",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      eventTime = start.toLocaleTimeString("en-US", {
        timeZone: "America/Detroit",
        hour: "numeric",
        minute: "2-digit",
      });
      if (eventData.venues?.name) {
        eventLocation = `${eventData.venues.name}, ${eventData.venues.city || "Saugatuck"}, ${eventData.venues.state || "MI"}`;
      }
    }

    const checkedInProfile = order.checked_in_profile as {
      first_name?: string;
      last_name?: string;
    } | null;
    const checkedInByName = checkedInProfile
      ? `${checkedInProfile.first_name || ""} ${checkedInProfile.last_name || ""}`.trim()
      : null;

    let verificationStatus: TicketVerificationResult["status"] = "valid";
    if (order.status === "checked_in") {
      verificationStatus = "checked_in";
    } else if (order.status === "cancelled") {
      verificationStatus = "cancelled";
    } else if (order.status === "refunded") {
      verificationStatus = "refunded";
    }

    return {
      success: true,
      data: {
        status: verificationStatus,
        orderReference: order.order_reference,
        orderId: order.id,
        purchaserName: order.purchaser_name,
        purchaserEmail: order.purchaser_email,
        purchaserPhone: order.purchaser_phone,
        ticketQuantity: order.ticket_quantity,
        studentQuantity: order.student_quantity ?? 0,
        childQuantity: order.child_quantity ?? 0,
        unitPriceCents: order.unit_price_cents,
        totalAmountCents: order.total_amount_cents,
        discountAmountCents: order.discount_amount_cents ?? 0,
        couponCode: order.coupon_code,
        eventTitle: eventData?.title || "Saugatuck Douglas Garden Club Tour",
        eventDate,
        eventTime,
        eventLocation,
        checkedInAt: order.checked_in_at,
        checkedInByName,
        notes: order.notes,
        createdAt: order.created_at,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to verify ticket pass.",
    };
  }
}

/**
 * Gate check-in action. Invoked by gate attendants to admit attendees into the venue.
 */
export async function gateCheckInTicketAction(
  orderReference: string,
  undo = false,
): Promise<ActionResult<TicketVerificationResult>> {
  const cleanRef = orderReference.trim().toUpperCase();
  if (!cleanRef) {
    return { success: false, error: "Order reference is required." };
  }

  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    const supabase = createAdminClient();

    // Verify order exists
    const { data: order, error: findError } = await supabase
      .from("ticket_orders")
      .select("id, status")
      .eq("order_reference", cleanRef)
      .maybeSingle();

    if (findError || !order) {
      return { success: false, error: "Ticket order not found." };
    }

    const nowIso = new Date().toISOString();
    const nextStatus = undo ? "confirmed" : "checked_in";
    const checkedInAt = undo ? null : nowIso;
    const checkedInBy = undo ? null : user?.id || null;

    const { error: updateError } = await supabase
      .from("ticket_orders")
      .update({
        status: nextStatus,
        checked_in_at: checkedInAt,
        checked_in_by: checkedInBy,
        updated_at: nowIso,
      })
      .eq("id", order.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Optional audit event if staff is logged in
    if (user?.id) {
      await supabase.from("audit_events").insert({
        actor_id: user.id,
        action: undo ? "ticket.gate_checkin_reverted" : "ticket.gate_admitted",
        entity_type: "ticket_order",
        entity_id: order.id,
        details: { orderReference: cleanRef, status: nextStatus },
      });
    }

    safeRevalidatePath("/admin/tickets");
    safeRevalidatePath(`/verify/ticket/${cleanRef}`);

    // Return refreshed verification status
    return await verifyTicketAction(cleanRef);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gate check-in failed. Please try again.",
    };
  }
}

/**
 * Verify Member Status and Credential ID.
 * Looks up member by user ID, member number, or username.
 */
export async function verifyMemberAction(
  codeOrId: string,
): Promise<ActionResult<MemberVerificationResult>> {
  const cleanInput = codeOrId.trim();
  if (!cleanInput) {
    return {
      success: false,
      error: "Please enter a Member ID, Username, or Reference Code.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Extract raw prefix if SDGC-MBR-XXXXXXXX format
    let lookupTerm = cleanInput;
    if (lookupTerm.toUpperCase().startsWith("SDGC-MBR-")) {
      lookupTerm = lookupTerm.slice(9);
    }

    // Query profiles matching UUID prefix, username, or credential code via RPC
    const { data: profiles, error } = await supabase.rpc("lookup_member_credential", {
      lookup_code: lookupTerm,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const profile = profiles?.[0];
    if (!profile) {
      return {
        success: true,
        data: {
          status: "not_found",
          memberCode: cleanInput.toUpperCase(),
          message: "No registered club member found for this credential.",
        },
      };
    }

    // Check membership terms and status
    const { data: memberships } = await supabase
      .from("memberships")
      .select("status, membership_terms(year, opens_at, closes_at)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const activeMembership = memberships?.[0];
    const termInfo = activeMembership?.membership_terms as {
      year?: number;
      opens_at?: string;
      closes_at?: string;
    } | null;

    const currentYear = new Date().getFullYear();
    const isApproved = activeMembership?.status === "approved";
    const termYear = termInfo?.year ?? currentYear;
    const memberCode = `SDGC-MBR-${profile.id.slice(0, 8).toUpperCase()}`;

    const memberSinceYear = new Date(profile.created_at).getFullYear();

    return {
      success: true,
      data: {
        status: isApproved ? "active" : "expired",
        memberCode,
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username,
        username: profile.username,
        city: profile.city ?? undefined,
        state: profile.state ?? undefined,
        isMasterGardener: Boolean(profile.is_master_gardener),
        termYear,
        validTerm: `${termYear}–${termYear + 1} Season`,
        memberSince: String(memberSinceYear),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to verify member credential.",
    };
  }
}
