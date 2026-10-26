import "server-only";

import { requireUser } from "@/features/auth/authorization";
import type {
  ApplicationStatus,
  DirectoryMember,
  MemberProfile,
  MembershipSummary,
  PaymentStatus,
  ProjectInterestCode,
} from "@/features/membership/types";
import { getMembershipYear, isMembershipActive } from "@/features/membership/rules";
import { createClient } from "@/lib/supabase/server";

export async function getOwnProfile(): Promise<MemberProfile | null> {
  const user = await requireUser("/profile");
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const { data: interestsData } = await supabase
    .from("profile_interests")
    .select("project_code")
    .eq("user_id", user.id);

  const projectInterests = (interestsData?.map((i) => i.project_code) ??
    []) as ProjectInterestCode[];

  return {
    userId: profile.id,
    username: profile.username,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: user.email,
    phoneHome: profile.phone ?? undefined,
    phoneCell: profile.secondary_phone ?? undefined,
    addressLine1: profile.address_line1 ?? undefined,
    addressLine2: profile.address_line2 ?? undefined,
    city: profile.city ?? undefined,
    state: profile.state ?? undefined,
    zipCode: profile.postal_code ?? undefined,
    birthMonth: profile.birth_month ?? undefined,
    birthDay: profile.birth_day ?? undefined,
    spouseFirstName: profile.spouse_name ?? undefined,
    masterGardener: profile.is_master_gardener,
    directoryOptOut: profile.directory_opt_out ?? false,
    gardeningInterests: profile.gardening_interests ?? undefined,
    volunteerExperience: profile.volunteer_experience ?? undefined,
    interestsExperience: profile.interests_experience ?? undefined,
    projectInterests,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function getOwnMembershipSummary(
  targetYear?: number,
): Promise<MembershipSummary | null> {
  const user = await requireUser("/profile");
  const supabase = await createClient();

  const requestedYear = targetYear ?? getMembershipYear(new Date(), "America/Detroit");

  // Find membership for the specific requested term
  const { data: membership } = await supabase
    .from("memberships")
    .select(
      `
      id,
      user_id,
      status,
      approved_at,
      approved_by,
      membership_terms!inner(id, year, dues_cents, opens_at, closes_at)
    `,
    )
    .eq("user_id", user.id)
    .eq("membership_terms.year", requestedYear)
    .maybeSingle();

  // STRICT BYLAW & AUDIT REQUIREMENT (V11-03):
  // Separate historical membership records from current-term renewal eligibility.
  // Do NOT silently fall back to an old year's membership as if it was current!
  if (!membership) {
    return null;
  }

  // Find payments for this membership (prioritize confirmed over pending)
  const { data: payments } = await supabase
    .from("payments")
    .select("status, payment_method, amount_cents")
    .eq("membership_id", membership.id)
    .order("created_at", { ascending: false });

  const payment =
    payments?.find((p) => p.status === "confirmed" || p.status === "succeeded") ?? payments?.[0];

  const isApproved = membership.status === "approved";
  const isSuspended = membership.status === "suspended";
  const termYear = membership.membership_terms.year;
  const duesCents = membership.membership_terms.dues_cents;

  const isActive = isMembershipActive(
    {
      approved: isApproved,
      suspended: isSuspended,
      year: termYear,
      status: membership.status,
    },
    new Date(),
  );

  return {
    id: membership.id,
    userId: membership.user_id,
    year: termYear,
    duesCents,
    currency: "USD",
    applicationStatus: membership.status as ApplicationStatus,
    paymentStatus: (payment?.status as PaymentStatus) || "unpaid",
    paymentMethod: payment?.payment_method === "check" ? "check" : "credit_card",
    isApproved,
    isSuspended,
    approvedAt: membership.approved_at ?? undefined,
    approvedBy: membership.approved_by ?? undefined,
    isActive,
  };
}

export async function getMemberDirectory(): Promise<DirectoryMember[]> {
  await requireUser("/directory");
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("member_directory")
    .select("*")
    .order("last_name", { ascending: true });

  if (error || !members) {
    return [];
  }

  return members.map((p) => {
    const interests = Array.isArray(p.project_interests)
      ? (p.project_interests as unknown as string[])
      : [];

    return {
      id: p.id ?? "",
      username: p.username ?? "",
      firstName: p.first_name ?? "",
      lastName: p.last_name ?? "",
      fullName: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      phone: p.phone ?? undefined,
      secondaryPhone: p.secondary_phone ?? undefined,
      city: p.city ?? undefined,
      state: p.state ?? undefined,
      isMasterGardener: Boolean(p.is_master_gardener),
      gardeningInterests: p.gardening_interests ?? undefined,
      volunteerExperience: p.volunteer_experience ?? undefined,
      interestsExperience: p.interests_experience ?? undefined,
      projectInterests: interests,
    };
  });
}
