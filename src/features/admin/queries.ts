import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/features/auth/authorization";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import type {
  AdminMetrics,
  AdminMemberRecord,
  AdminDuesRecord,
  AdminEventRecord,
  AdminPageRecord,
  AdminMessageRecord,
  DisbursementRecord,
  FinancialLedgerSummary,
} from "./types";

export async function getAdminOverviewStats(): Promise<AdminMetrics> {
  const supabase = await createClient();

  const { data: activeTerm } = await supabase
    .from("membership_terms")
    .select("id, year")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  let membersQuery = supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (activeTerm?.id) {
    membersQuery = membersQuery.eq("term_id", activeTerm.id);
  }

  const [membersRes, pendingRes, paymentsRes, eventsRes, messagesRes, ticketsRes] =
    await Promise.all([
      membersQuery,
      supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString()),
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("status", "unread"),
      supabase
        .from("ticket_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed"),
    ]);

  const queryError =
    membersRes.error ||
    pendingRes.error ||
    paymentsRes.error ||
    eventsRes.error ||
    messagesRes.error;

  if (queryError) {
    throw new Error(`Failed to load administrative metrics: ${queryError.message}`);
  }

  return {
    totalMembers: membersRes.count ?? 0,
    pendingApprovals: pendingRes.count ?? 0,
    unreconciledPayments: paymentsRes.count ?? 0,
    upcomingEvents: eventsRes.count ?? 0,
    unreadMessages: messagesRes.count ?? 0,
    totalTickets: ticketsRes.count ?? 0,
  };
}

export async function getAdminMembers(): Promise<AdminMemberRecord[]> {
  await requireCapability(["members.manage", "memberships.approve"]);
  const supabase = await createClient();

  const { data: roster, error } = await supabase.rpc("get_admin_member_roster");

  if (error || !roster) {
    console.error("Error fetching admin member roster:", error);
    return [];
  }

  // Get roles map for all roster users
  const userIds = [...new Set((roster as Array<{ user_id: string }>).map((r) => r.user_id))];
  const { data: rolesRes } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", userIds);

  const rolesMap = new Map<string, string[]>();
  for (const r of rolesRes ?? []) {
    const list = rolesMap.get(r.user_id) ?? [];
    list.push(r.role);
    rolesMap.set(r.user_id, list);
  }

  return (roster as Array<Record<string, unknown>>).map((m) => {
    const roles = rolesMap.get(m.user_id as string) ?? ["member"];
    if (!roles.includes("member")) roles.unshift("member");

    const firstName = (m.first_name as string) || "";
    const lastName = (m.last_name as string) || "";
    const fullName = `${firstName} ${lastName}`.trim() || (m.username as string);

    return {
      id: m.id as string,
      userId: m.user_id as string,
      username: m.username as string,
      name: fullName,
      email: m.email as string,
      year: Number(m.term_year),
      applicationStatus: (m.status as AdminMemberRecord["applicationStatus"]) || "pending",
      paymentStatus:
        m.payment_status === "confirmed"
          ? "confirmed"
          : m.payment_status === "failed"
            ? "failed"
            : "pending",
      paymentMethod: (m.payment_method as string) || undefined,
      isApproved: m.status === "approved",
      isMasterGardener: Boolean(m.is_master_gardener),
      version: Number(m.version),
      roles,
      appliedAt: m.applied_at as string,
      phone: (m.phone as string) || undefined,
      altPhone: (m.alt_phone as string) || undefined,
      addressLine1: (m.address_line1 as string) || undefined,
      addressLine2: (m.address_line2 as string) || undefined,
      city: (m.city as string) || undefined,
      state: (m.state as string) || undefined,
      postalCode: (m.postal_code as string) || undefined,
      spouseFirstName: (m.spouse_first_name as string) || undefined,
      gardeningInterests: (m.gardening_interests as string) || undefined,
      workExperience: (m.work_experience as string) || undefined,
      volunteerExperience:
        (m.volunteer_experience as string) || (m.work_experience as string) || undefined,
      adminNotes: (m.admin_notes as string) || undefined,
      directoryOptOut: Boolean(m.directory_opt_out),
    };
  });
}

export async function getAdminDuesRecords(): Promise<AdminDuesRecord[]> {
  await requireCapability("dues.reconcile");
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      membership_id,
      amount_cents,
      payment_method,
      status,
      notes,
      reconciled_at,
      reconciled_by,
      created_at,
      profiles!inner (
        username,
        first_name,
        last_name
      ),
      membership_terms!inner (
        year
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !payments) {
    return [];
  }

  return payments.map((p) => {
    const prof = p.profiles;
    return {
      id: p.id,
      membershipId: p.membership_id,
      memberName: `${prof.first_name} ${prof.last_name}`.trim(),
      memberUsername: prof.username,
      year: p.membership_terms.year,
      amountCents: p.amount_cents,
      paymentMethod: p.payment_method as "credit_card" | "check" | "cash",
      status: p.status as "pending" | "confirmed" | "failed" | "refunded",
      notes: p.notes ?? undefined,
      reconciledAt: p.reconciled_at ?? undefined,
      reconciledBy: p.reconciled_by ?? undefined,
      createdAt: p.created_at,
    };
  });
}

export async function getAdminEvents(): Promise<AdminEventRecord[]> {
  await requireCapability("events.manage");
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      slug,
      starts_at,
      ends_at,
      excerpt,
      category,
      status,
      description,
      venue_id,
      featured_image,
      venues (
        name
      )
    `,
    )
    .order("starts_at", { ascending: true });

  if (error || !events) {
    return [];
  }

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    category: e.category ?? e.excerpt ?? undefined,
    status: e.status as "published" | "draft" | "cancelled",
    venueName: e.venues?.name ?? undefined,
    venueId: e.venue_id ?? undefined,
    description: e.description,
    featuredImage: e.featured_image ? resolveMediaUrl(e.featured_image) : undefined,
  }));
}

export async function getAdminPages(): Promise<AdminPageRecord[]> {
  await requireCapability("content.manage");
  const supabase = await createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, slug, title, content, meta_description, status, updated_at")
    .order("title", { ascending: true });

  if (error || !pages) {
    return [];
  }

  return pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.meta_description ?? undefined,
    content: p.content ?? undefined,
    status: p.status as "published" | "draft",
    updatedAt: p.updated_at,
  }));
}

export async function getAdminMessages(): Promise<AdminMessageRecord[]> {
  await requireCapability("messages.manage");
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select(
      "id, name, email, phone, sender_type, category, subject, attachment_url, message, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !messages) {
    return [];
  }

  return messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone ?? undefined,
    senderType: m.sender_type ?? undefined,
    category: m.category ?? undefined,
    subject: m.subject ?? undefined,
    attachmentUrl: m.attachment_url ?? undefined,
    message: m.message,
    status: m.status as "unread" | "read" | "archived",
    createdAt: m.created_at,
  }));
}

export async function getAdminTerms(): Promise<
  Array<{
    id: string;
    year: number;
    duesCents: number;
    currency: string;
    opensAt: string;
    closesAt: string;
  }>
> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("membership_terms")
    .select("id, year, dues_cents, currency, opens_at, closes_at")
    .order("year", { ascending: false });

  return (terms ?? []).map((t) => ({
    id: t.id,
    year: t.year,
    duesCents: t.dues_cents,
    currency: t.currency,
    opensAt: t.opens_at,
    closesAt: t.closes_at,
  }));
}

export async function getAdminVenues(): Promise<import("./types").AdminVenueRecord[]> {
  const supabase = await createClient();
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, address, city, state, postal_code, url")
    .order("name", { ascending: true });

  return (venues ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address ?? undefined,
    city: v.city ?? undefined,
    state: v.state ?? undefined,
    postalCode: v.postal_code ?? undefined,
    url: v.url ?? undefined,
  }));
}

export async function getAdminDisbursements(): Promise<DisbursementRecord[]> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("disbursements")
    .select(
      "id, amount_cents, category, payee, description, reference_number, disbursed_at, created_by, created_at",
    )
    .order("disbursed_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching disbursements:", error);
    return [];
  }

  return data.map((d) => ({
    id: d.id,
    amountCents: d.amount_cents,
    category: d.category,
    payee: d.payee,
    description: d.description,
    referenceNumber: d.reference_number ?? undefined,
    disbursedAt: d.disbursed_at,
    createdBy: d.created_by ?? undefined,
    createdAt: d.created_at,
  }));
}

export async function getFinancialLedgerSummary(): Promise<FinancialLedgerSummary> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const [duesRes, ticketsRes, disbursementsRes] = await Promise.all([
    supabase.from("payments").select("amount_cents, status").eq("status", "confirmed"),
    supabase
      .from("ticket_orders")
      .select("total_amount_cents, ticket_quantity, status")
      .in("status", ["confirmed", "checked_in"]),
    supabase.from("disbursements").select("amount_cents"),
  ]);

  const totalDuesRevenueCents = (duesRes.data ?? []).reduce(
    (acc, row) => acc + (row.amount_cents || 0),
    0,
  );
  const duesPaymentCount = duesRes.data?.length ?? 0;

  const totalTicketRevenueCents = (ticketsRes.data ?? []).reduce(
    (acc, row) => acc + (row.total_amount_cents || 0),
    0,
  );
  const ticketOrderCount = ticketsRes.data?.length ?? 0;
  const totalTicketsSold = (ticketsRes.data ?? []).reduce(
    (acc, row) => acc + (row.ticket_quantity || 0),
    0,
  );

  const totalOtherRevenueCents = 0;
  const totalGrossRevenueCents =
    totalDuesRevenueCents + totalTicketRevenueCents + totalOtherRevenueCents;

  const totalDisbursedCents = (disbursementsRes.data ?? []).reduce(
    (acc, row) => acc + (row.amount_cents || 0),
    0,
  );
  const disbursementCount = disbursementsRes.data?.length ?? 0;

  const netAvailableBalanceCents = totalGrossRevenueCents - totalDisbursedCents;

  return {
    totalDuesRevenueCents,
    duesPaymentCount,
    totalTicketRevenueCents,
    ticketOrderCount,
    totalTicketsSold,
    totalOtherRevenueCents,
    totalGrossRevenueCents,
    totalDisbursedCents,
    disbursementCount,
    netAvailableBalanceCents,
  };
}
