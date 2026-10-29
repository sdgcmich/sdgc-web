"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability, hasCapability } from "@/features/auth/authorization";
import type { Database, Json } from "@/types/database";
import { optimizeImage } from "@/lib/media/optimizer";
import { getStorageProvider } from "@/lib/storage/provider";
import { validateUploadFile } from "@/lib/storage/upload-security";
import {
  DEFAULT_ABOUT_SECTIONS,
  DEFAULT_GARDEN_WALK_HIGHLIGHTS,
  DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
  DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
  DEFAULT_HOMEPAGE_CONTACT_CTA,
  DEFAULT_HOMEPAGE_HIGHLIGHTS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_STORY,
  DEFAULT_JOIN_PAGE_DATA,
  DEFAULT_SITE_CONTACT,
  type ContactCtaSection,
  type HomePageStory,
  type JoinPageData,
  type PageSection,
  type SiteContactSettings,
  type ValueHighlight,
  type VisitorGuideCard,
  type VolunteerCtaSection,
} from "@/features/content/queries";
import type { ActionResult, AdminVenueRecord } from "./types";

export async function createVenueAction(input: {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  url?: string;
}): Promise<ActionResult<AdminVenueRecord>> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  if (!input.name?.trim()) {
    return { success: false, error: "Venue name is required" };
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || "Saugatuck",
      state: input.state?.trim() || "MI",
      postal_code: input.postalCode?.trim() || "49453",
      url: input.url?.trim() || null,
    })
    .select("id, name, address, city, state, postal_code, url")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "venue.created",
    entity_type: "venue",
    entity_id: data.id,
    details: { name: input.name.trim(), city: input.city },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return {
    success: true,
    message: "Venue created successfully",
    data: {
      id: data.id,
      name: data.name,
      address: data.address ?? undefined,
      city: data.city ?? undefined,
      state: data.state ?? undefined,
      postalCode: data.postal_code ?? undefined,
      url: data.url ?? undefined,
    },
  };
}

export async function createEventAction(input: {
  title: string;
  slug: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  status: "published" | "draft" | "cancelled";
  venueId?: string;
  description?: string;
  featuredImage?: string;
  requiresTickets?: boolean;
  ticketPriceCents?: number;
  studentPriceCents?: number;
  childPriceCents?: number;
}): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const endsAt =
    input.endsAt || new Date(new Date(input.startsAt).getTime() + 2 * 3600000).toISOString();
  const description = input.description || input.title;

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      slug: input.slug,
      starts_at: input.startsAt,
      ends_at: endsAt,
      excerpt: input.category || null,
      category: input.category || null,
      status: input.status,
      venue_id: input.venueId || null,
      description,
      featured_image: input.featuredImage?.trim() || null,
      requires_tickets: Boolean(input.requiresTickets),
      ticket_price_cents: input.ticketPriceCents ?? 2000,
      student_price_cents: input.studentPriceCents ?? 1000,
      child_price_cents: input.childPriceCents ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit event
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.created",
    entity_type: "event",
    entity_id: data.id,
    details: { title: input.title, slug: input.slug, status: input.status },
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event created successfully", data };
}

export async function approveMembershipAction(input: {
  membershipId: string;
  expectedVersion?: number;
  waiveDues?: boolean;
  waiverReason?: string;
}): Promise<ActionResult> {
  await requireCapability(["members.manage", "memberships.approve"]);
  const supabase = await createClient();

  // Call atomic PostgreSQL procedure
  const { data, error } = await supabase.rpc("approve_membership", {
    p_membership_id: input.membershipId,
    p_expected_version: input.expectedVersion,
    p_waive_dues: input.waiveDues ?? false,
    p_waiver_reason: input.waiverReason,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; new_version?: number };
  if (!result.success) {
    return { success: false, error: result.error || "Approval failed" };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Membership approved successfully", data: result };
}

export async function reconcilePaymentAction(input: {
  paymentId: string;
  notes?: string;
}): Promise<ActionResult> {
  await requireCapability("dues.reconcile");
  const supabase = await createClient();

  // Call atomic PostgreSQL procedure
  const { data, error } = await supabase.rpc("reconcile_payment", {
    p_payment_id: input.paymentId,
    p_notes: input.notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || "Reconciliation failed" };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Payment reconciled and confirmed" };
}

// codeql[js/user-controlled-bypass] Step-up re-authentication verifies caller credentials via Supabase Auth
async function verifyStepUpAuthorization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorEmail: string,
  credentials: { password?: string; totp?: string },
): Promise<{ verified: boolean; method?: "password" | "totp"; error?: string }> {
  const pwd = credentials.password?.trim();
  const totp = credentials.totp?.trim();

  if (pwd) {
    // codeql[js/user-controlled-bypass]
    const { error } = await supabase.auth.signInWithPassword({
      email: actorEmail,
      password: pwd,
    });
    if (error) {
      return {
        verified: false,
        error: "Step-up authentication failed: Incorrect account password.",
      };
    }
    return { verified: true, method: "password" };
  }

  if (totp) {
    // codeql[js/user-controlled-bypass]
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
    if (!verifiedTotp) {
      return {
        verified: false,
        error:
          "No verified authenticator app enrolled. Please authenticate using your account password.",
      };
    }

    const { error: totpErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId: verifiedTotp.id,
      code: totp,
    });
    if (totpErr) {
      return {
        verified: false,
        error: "Step-up authentication failed: Invalid 6-digit authenticator code.",
      };
    }
    return { verified: true, method: "totp" };
  }

  return {
    verified: false,
    error:
      "Step-up re-authentication required: Please enter your account password or 6-digit authenticator code to modify staff roles.",
  };
}

export async function setUserRolesAction(input: {
  userId: string;
  roles: ("super_admin" | "admin" | "editor" | "treasurer")[];
  password?: string;
  totp?: string;
}): Promise<ActionResult> {
  const actor = await requireCapability("roles.manage");
  const actorIsSuperAdmin = await hasCapability("roles.admin", actor.id);
  const supabase = await createClient();

  const VALID_ROLES = new Set(["super_admin", "admin", "editor", "treasurer"]);
  for (const r of input.roles) {
    if (!VALID_ROLES.has(r)) {
      return { success: false, error: `Invalid role code: ${r}` };
    }
  }

  // Fetch target user's current roles
  const { data: currentRolesData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", input.userId);
  const currentRoles = (currentRolesData?.map((r) => r.role) || []) as string[];

  // Determine if roles are changing
  const sortedCurrent = [...currentRoles].sort();
  const sortedNext = [...input.roles].sort();
  const rolesChanged =
    sortedCurrent.length !== sortedNext.length || sortedCurrent.some((r, i) => r !== sortedNext[i]);

  if (!rolesChanged) {
    return { success: true, message: "No role changes detected." };
  }

  // 1. Role Hierarchy Enforcement:
  // - Only super_admin can grant, modify, or revoke super_admin
  if (currentRoles.includes("super_admin") || input.roles.includes("super_admin")) {
    if (!actorIsSuperAdmin) {
      return {
        success: false,
        error:
          "Access denied: Only a Super Administrator can assign, modify, or remove the Super Admin role.",
      };
    }
  }

  // - Only super_admin can promote or demote admin
  if (currentRoles.includes("admin") || input.roles.includes("admin")) {
    if (!actorIsSuperAdmin) {
      return {
        success: false,
        error:
          "Access denied: Only a Super Administrator can promote or demote an Administrator. Normal administrators can only manage Editor and Treasurer roles.",
      };
    }
  }

  // 2. Sudo / Step-Up Re-Authentication Requirement
  if (!input.password?.trim() && !input.totp?.trim()) {
    return {
      success: false,
      error:
        "Step-up re-authentication required: Please enter your account password or 6-digit authenticator code to modify staff roles.",
    };
  }

  // codeql[js/user-controlled-bypass] Re-authenticates actor using verified Supabase credentials
  const stepUp = await verifyStepUpAuthorization(supabase, actor.email, {
    password: input.password,
    totp: input.totp,
  });

  if (!stepUp.verified) {
    return {
      success: false,
      error: stepUp.error || "Step-up re-authentication failed.",
    };
  }

  // 3. Last Super Admin Protection
  if (currentRoles.includes("super_admin") && !input.roles.includes("super_admin")) {
    const { count, error: countErr } = await supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "super_admin")
      .neq("user_id", input.userId);

    if (countErr || (count !== null && count < 1)) {
      return { success: false, error: "Cannot remove the last Super Administrator" };
    }
  }

  // 4. Last Admin Protection
  if (currentRoles.includes("admin") && !input.roles.includes("admin")) {
    const { count, error: countErr } = await supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin")
      .neq("user_id", input.userId);

    if (countErr || (count !== null && count < 1)) {
      return { success: false, error: "Cannot remove the last administrator" };
    }
  }

  // 5. Update user roles via RPC
  const { error: rpcError } = await supabase.rpc("set_user_roles", {
    p_target_user_id: input.userId,
    p_new_roles: input.roles,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  // 6. Record Audit Event
  try {
    await supabase.from("audit_events").insert({
      actor_id: actor.id,
      action: "roles.updated",
      entity_type: "user",
      entity_id: input.userId,
      details: {
        previous_roles: currentRoles,
        new_roles: input.roles,
        verified_via: stepUp.method || "password",
      },
    });
  } catch {
    // Non-blocking
  }

  revalidatePath("/admin/members");
  return { success: true, message: "Staff roles updated successfully" };
}

export interface AdminCreateMemberInput {
  email: string;
  fullName: string;
  username?: string;
  phone?: string;
  role?: "member" | "editor" | "treasurer" | "admin";
  status?: "approved" | "pending";
  waiveDues?: boolean;
  password?: string;
  sendRecoveryEmail?: boolean;
}

export async function adminCreateMemberAction(
  input: AdminCreateMemberInput,
): Promise<ActionResult<{ userId: string; recoveryLink?: string }>> {
  const actor = await requireCapability("members.manage");
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const trimmedEmail = input.email?.trim().toLowerCase();
  if (!trimmedEmail?.includes("@")) {
    return { success: false, error: "A valid email address is required" };
  }

  const trimmedName = input.fullName?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: "Full name is required" };
  }

  const parts = trimmedName.split(/\s+/);
  const firstName = parts[0] || "Member";
  const lastName = parts.slice(1).join(" ") || "Friend";

  let username = input.username
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (!username) {
    const emailPrefix = trimmedEmail.split("@")[0] ?? "member";
    const base = emailPrefix.replace(/[^a-z0-9_]/g, "") || "member";
    const randSuffix = randomInt(1000, 10000);
    username = `${base}_${randSuffix}`;
  }

  // Check username collision in profiles
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingProfile) {
    username = `${username}_${randomInt(100, 1000)}`;
  }

  const tempPassword = input.password?.trim() || `${crypto.randomUUID()}!Aa1`;

  // Create Auth User
  const { data: userData, error: createErr } = await adminClient.auth.admin.createUser({
    email: trimmedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      username,
      phone: input.phone?.trim() || null,
    },
  });

  if (createErr || !userData.user) {
    return {
      success: false,
      error: createErr?.message || "Failed to create user account in authentication service",
    };
  }

  const newUserId = userData.user.id;

  // Retrieve the membership created by on_auth_user_created trigger
  const { data: membership } = await adminClient
    .from("memberships")
    .select("id, term_id")
    .eq("user_id", newUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isApproved = input.status !== "pending";

  if (membership) {
    await adminClient
      .from("memberships")
      .update({
        status: isApproved ? "approved" : "pending",
        approved_at: isApproved ? new Date().toISOString() : null,
        approved_by: isApproved ? actor.id : null,
        notes: input.waiveDues ? "Created by admin (dues waived)" : "Created by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", membership.id);

    if (input.waiveDues && isApproved) {
      await adminClient.from("payments").insert({
        membership_id: membership.id,
        user_id: newUserId,
        term_id: membership.term_id,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "check",
        provider: "admin_manual",
        status: "confirmed",
        reconciled_at: new Date().toISOString(),
        reconciled_by: actor.id,
        notes: "Comped / Waived by administrator on creation",
      });
    }
  }

  // Assign role if privileged role requested
  if (input.role && input.role !== "member") {
    if (input.role === "admin" || (input.role as string) === "super_admin") {
      const actorIsSuperAdmin = await hasCapability("roles.admin", actor.id);
      if (!actorIsSuperAdmin) {
        return {
          success: false,
          error: "Only a Super Administrator can assign the Administrator role to new members.",
        };
      }
    }
    await supabase.rpc("set_user_roles", {
      p_target_user_id: newUserId,
      p_new_roles: [input.role],
    });
  }

  // Generate recovery link if requested or if no password provided
  let recoveryLink: string | undefined;
  if (input.sendRecoveryEmail || !input.password) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
    try {
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: trimmedEmail,
        options: {
          redirectTo: `${siteUrl}/reset-password`,
        },
      });
      recoveryLink = linkData?.properties?.action_link;
    } catch (e) {
      console.warn("Could not generate recovery link:", e);
    }
  }

  await supabase.from("audit_events").insert({
    actor_id: actor.id,
    action: "member.created_by_admin",
    entity_type: "member",
    entity_id: newUserId,
    details: {
      email: trimmedEmail,
      username,
      role: input.role || "member",
      status: isApproved ? "approved" : "pending",
      waiveDues: Boolean(input.waiveDues),
    },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");

  return {
    success: true,
    message: `Account for ${trimmedName} (${trimmedEmail}) successfully created.`,
    data: {
      userId: newUserId,
      recoveryLink,
    },
  };
}

export async function adminToggleMemberBanAction(input: {
  userId: string;
  membershipId: string;
  suspend: boolean;
  reason?: string;
}): Promise<ActionResult> {
  const actor = await requireCapability("members.manage");
  const actorIsSuperAdmin = await hasCapability("roles.admin", actor.id);
  const supabase = await createClient();
  const adminClient = createAdminClient();

  if (input.suspend) {
    // Check target's roles
    const { data: targetRolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", input.userId);
    const targetRoles = (targetRolesData?.map((r) => r.role) || []) as string[];

    // Hierarchy protections:
    if (targetRoles.includes("super_admin")) {
      if (!actorIsSuperAdmin) {
        return {
          success: false,
          error:
            "Access denied: Only a Super Administrator can suspend a Super Administrator account.",
        };
      }

      // Protect last super admin
      const { count: superCount } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .neq("user_id", input.userId);

      if (superCount !== null && superCount < 1) {
        return {
          success: false,
          error: "Cannot suspend or ban the last Super Administrator.",
        };
      }
    }

    if (targetRoles.includes("admin")) {
      if (!actorIsSuperAdmin) {
        return {
          success: false,
          error:
            "Access denied: Only a Super Administrator can suspend an Administrator. Normal administrators can only manage standard members, Editors, and Treasurers.",
        };
      }

      // Protect last admin
      const { count: adminCount } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin")
        .neq("user_id", input.userId);

      if (adminCount !== null && adminCount < 1) {
        return {
          success: false,
          error: "Cannot suspend or ban the last Administrator.",
        };
      }
    }

    const { error: memErr } = await supabase
      .from("memberships")
      .update({
        status: "suspended",
        notes: input.reason?.trim()
          ? `Suspended: ${input.reason.trim()}`
          : "Suspended by administrator",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.membershipId);

    if (memErr) {
      return { success: false, error: memErr.message };
    }

    const { error: banErr } = await adminClient.auth.admin.updateUserById(input.userId, {
      ban_duration: "876000h",
    });

    if (banErr) {
      console.warn("Auth ban notice:", banErr.message);
    }

    await supabase.from("audit_events").insert({
      actor_id: actor.id,
      action: "member.suspended",
      entity_type: "member",
      entity_id: input.userId,
      details: { membership_id: input.membershipId, reason: input.reason?.trim() },
    });

    revalidatePath("/admin/members");
    revalidatePath("/admin");
    revalidatePath("/directory");
    return {
      success: true,
      message: "Member account has been suspended and banned from signing in.",
    };
  }

  const { error: memErr } = await supabase
    .from("memberships")
    .update({
      status: "approved",
      notes: "Reinstated by administrator",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.membershipId);

  if (memErr) {
    return { success: false, error: memErr.message };
  }

  const { error: unbanErr } = await adminClient.auth.admin.updateUserById(input.userId, {
    ban_duration: "none",
  });

  if (unbanErr) {
    console.warn("Auth unban notice:", unbanErr.message);
  }

  await supabase.from("audit_events").insert({
    actor_id: actor.id,
    action: "member.reinstated",
    entity_type: "member",
    entity_id: input.userId,
    details: { membership_id: input.membershipId },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return {
    success: true,
    message: "Member account has been reinstated and access restored.",
  };
}

export async function adminRecoverMemberAccountAction(input: {
  userId: string;
  email: string;
}): Promise<ActionResult<{ recoveryLink?: string }>> {
  const actor = await requireCapability("members.manage");
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: input.email.trim(),
    options: {
      redirectTo: `${siteUrl}/reset-password`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    await supabase.auth.resetPasswordForEmail(input.email.trim(), {
      redirectTo: `${siteUrl}/reset-password`,
    });
  } catch (err) {
    console.warn("Direct password reset dispatch note:", err);
  }

  await supabase.from("audit_events").insert({
    actor_id: actor.id,
    action: "member.recovery_requested",
    entity_type: "member",
    entity_id: input.userId,
    details: { email: input.email.trim() },
  });

  return {
    success: true,
    message: `Password recovery link successfully generated for ${input.email}.`,
    data: {
      recoveryLink: data?.properties?.action_link,
    },
  };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.deleted",
    entity_type: "event",
    entity_id: id,
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event removed successfully" };
}

export async function updatePageAction(
  slug: string,
  input: {
    title: string;
    subtitle?: string;
    content?: string;
    status: "published" | "draft";
  },
): Promise<ActionResult> {
  const user = await requireCapability("content.manage");
  const supabase = await createClient();

  const updateData: {
    title: string;
    meta_description: string | null;
    status: "published" | "draft";
    updated_at: string;
    content?: string;
  } = {
    title: input.title,
    meta_description: input.subtitle || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.content !== undefined) {
    updateData.content = input.content;
  }

  const { error } = await supabase.from("pages").update(updateData).eq("slug", slug);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "page.updated",
    entity_type: "page",
    entity_id: slug,
    details: input,
  });

  revalidatePath(`/`);
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/content");
  return { success: true, message: "Page copy updated successfully" };
}

export async function updateMessageStatusAction(
  id: string,
  status: "unread" | "read" | "archived",
): Promise<ActionResult> {
  const user = await requireCapability("messages.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      triaged_by: user.id,
      triaged_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true, message: "Message status updated" };
}

export async function updateEventAction(input: {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  status: "published" | "draft" | "cancelled";
  description?: string;
  venueId?: string;
  venueName?: string;
  featuredImage?: string | null;
  requiresTickets?: boolean;
  ticketPriceCents?: number;
  studentPriceCents?: number;
  childPriceCents?: number;
}): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const endsAt =
    input.endsAt || new Date(new Date(input.startsAt).getTime() + 2 * 3600000).toISOString();

  let targetVenueId: string | null | undefined = input.venueId;
  if (targetVenueId === undefined && input.venueName) {
    const { data: matchedVenue } = await supabase
      .from("venues")
      .select("id")
      .ilike("name", input.venueName.trim())
      .limit(1)
      .maybeSingle();
    if (matchedVenue) {
      targetVenueId = matchedVenue.id;
    }
  }

  const updatePayload: Database["public"]["Tables"]["events"]["Update"] = {
    title: input.title,
    slug: input.slug,
    starts_at: input.startsAt,
    ends_at: endsAt,
    excerpt: input.category || null,
    category: input.category || null,
    status: input.status,
    description: input.description || input.title,
    updated_at: new Date().toISOString(),
  };

  if (targetVenueId !== undefined) {
    updatePayload.venue_id = targetVenueId;
  }

  if (input.featuredImage !== undefined) {
    updatePayload.featured_image = input.featuredImage?.trim() || null;
  }

  if (input.requiresTickets !== undefined) {
    updatePayload.requires_tickets = input.requiresTickets;
  }

  if (input.ticketPriceCents !== undefined) {
    updatePayload.ticket_price_cents = input.ticketPriceCents;
  }

  if (input.studentPriceCents !== undefined) {
    updatePayload.student_price_cents = input.studentPriceCents;
  }

  if (input.childPriceCents !== undefined) {
    updatePayload.child_price_cents = input.childPriceCents;
  }

  const { error } = await supabase.from("events").update(updatePayload).eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.updated",
    entity_type: "event",
    entity_id: input.id,
    details: input,
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event updated successfully" };
}

export async function updateDuesRateAction(input: {
  year: number;
  duesCents: number;
}): Promise<ActionResult> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_dues_rate", {
    p_term_year: input.year,
    p_dues_cents: input.duesCents,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/membership");
  revalidatePath("/join");
  return { success: true, message: "Annual dues rate updated successfully", data };
}

export async function updateMembershipTermAction(input: {
  termId: string;
  duesCents?: number;
  opensAt?: string;
  closesAt?: string;
}): Promise<ActionResult> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_membership_term", {
    p_term_id: input.termId,
    p_dues_cents: input.duesCents,
    p_opens_at: input.opensAt,
    p_closes_at: input.closesAt,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/membership");
  revalidatePath("/join");
  return { success: true, message: "Membership term updated successfully", data };
}

export async function createMembershipTermAction(input: {
  year: number;
  duesCents: number;
  opensAt: string;
  closesAt: string;
  currency?: string;
}): Promise<ActionResult> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_membership_term", {
    p_year: input.year,
    p_dues_cents: input.duesCents,
    p_opens_at: input.opensAt,
    p_closes_at: input.closesAt,
    p_currency: input.currency ?? "USD",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/membership");
  revalidatePath("/join");
  return { success: true, message: "New membership term created successfully", data };
}

export async function adminUpdateMemberProfileAction(input: {
  userId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  spouseFirstName?: string;
  isMasterGardener?: boolean;
  directoryOptOut?: boolean;
  gardeningInterests?: string;
  workExperience?: string;
  volunteerExperience?: string;
  notes?: string;
}): Promise<ActionResult> {
  await requireCapability("members.manage");
  const supabase = await createClient();

  let fName = input.firstName || "";
  let lName = input.lastName || "";
  if (!fName && !lName && input.fullName) {
    const parts = input.fullName.trim().split(/\s+/);
    fName = parts[0] || "";
    lName = parts.slice(1).join(" ") || "";
  }

  const { error } = await supabase.rpc("admin_update_member_profile", {
    target_user_id: input.userId,
    p_first_name: fName || undefined,
    p_last_name: lName || undefined,
    p_phone: input.phone || undefined,
    p_alt_phone: input.altPhone || undefined,
    p_address_line1: input.addressLine1 || undefined,
    p_address_line2: input.addressLine2 || undefined,
    p_city: input.city || undefined,
    p_state: input.state || undefined,
    p_postal_code: input.postalCode || undefined,
    p_spouse_first_name: input.spouseFirstName || undefined,
    p_is_master_gardener: input.isMasterGardener,
    p_directory_opt_out: input.directoryOptOut,
    p_gardening_interests: input.gardeningInterests || undefined,
    p_work_experience: input.workExperience || input.volunteerExperience || undefined,
    p_notes: input.notes || undefined,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Member profile updated successfully" };
}

export async function updateMediaAssetAction(input: {
  id: string;
  altText: string;
  caption?: string;
  isPublic?: boolean;
}): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("media_assets")
    .update({
      alt_text: input.altText,
      caption: input.caption || null,
      is_public: input.isPublic ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.updated",
    entity_type: "media_asset",
    entity_id: input.id,
    details: input,
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return { success: true, message: "Media metadata updated successfully" };
}

export async function deleteMediaAssetAction(id: string): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  // Retrieve storage path before deletion
  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (asset?.storage_path) {
    const isStaticAsset =
      asset.storage_path.startsWith("/images/") ||
      asset.storage_path.startsWith("http://") ||
      asset.storage_path.startsWith("https://");

    if (!isStaticAsset) {
      const { error: storageError } = await supabase.storage
        .from("club-media")
        .remove([asset.storage_path]);

      if (storageError) {
        return {
          success: false,
          error: `Failed to remove storage object: ${storageError.message}`,
        };
      }
    }
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.deleted",
    entity_type: "media_asset",
    entity_id: id,
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return { success: true, message: "Media item removed successfully" };
}

export async function createMediaAssetAction(input: {
  storagePath: string;
  mimeType?: string;
  sizeBytes?: number;
  altText: string;
  caption?: string;
  isPublic?: boolean;
  width?: number;
  height?: number;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      storage_path: input.storagePath,
      mime_type: input.mimeType || "image/jpeg",
      size_bytes: input.sizeBytes || 0,
      alt_text: input.altText,
      caption: input.caption || null,
      is_public: input.isPublic ?? true,
      width: input.width || 1200,
      height: input.height || 800,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.created",
    entity_type: "media_asset",
    entity_id: data.id,
    details: { storagePath: input.storagePath, altText: input.altText },
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return { success: true, message: "Photo uploaded and published", data: { id: data.id } };
}

export async function uploadMediaAssetAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; storagePath: string; url: string }>> {
  const user = await requireCapability("media.manage");
  const file = formData.get("file") as File | null;
  const altText = (formData.get("altText") as string) || "";
  const caption = (formData.get("caption") as string) || "";
  const isPublic = formData.get("isPublic") !== "false";
  const albumId = (formData.get("albumId") as string) || null;

  if (!file || file.size === 0) {
    return { success: false, error: "Please select an image file to upload." };
  }
  if (!altText.trim()) {
    return { success: false, error: "Alternative text is required for accessibility." };
  }

  // Strictly validate uploaded media against magic bytes and security policies
  const validation = await validateUploadFile(file, {
    category: "image",
    maxSizeBytes: 20 * 1024 * 1024,
    fallbackBase: "gallery",
  });

  if (!validation.valid || !validation.sanitizedBuffer) {
    return {
      success: false,
      error: validation.error || "Image file validation failed.",
    };
  }

  const supabase = await createClient();

  let optimized: Awaited<ReturnType<typeof optimizeImage>>;
  try {
    optimized = await optimizeImage(validation.sanitizedBuffer);
  } catch (optErr) {
    return {
      success: false,
      error: `Image optimization error: ${optErr instanceof Error ? optErr.message : "processing failed"}`,
    };
  }

  const uploadBuffer = optimized.optimizedBuffer;
  const mimeType = optimized.mimeType;
  const width = optimized.width;
  const height = optimized.height;
  const sizeBytes = optimized.sizeBytes;

  const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`;
  const storagePath = `gallery/${fileName}`;

  const storage = getStorageProvider();
  let uploadResult: { storagePath: string; url: string; provider: string };

  try {
    uploadResult = await storage.upload({
      bucket: "club-media",
      path: storagePath,
      buffer: uploadBuffer,
      contentType: mimeType,
    });
  } catch (err: unknown) {
    return {
      success: false,
      error: `Storage upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  const { data, error: dbError } = await supabase
    .from("media_assets")
    .insert({
      storage_path: uploadResult.url || uploadResult.storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      alt_text: altText.trim(),
      caption: caption.trim() || null,
      is_public: isPublic,
      width,
      height,
    })
    .select("id")
    .single();

  if (dbError) {
    await storage.delete("club-media", uploadResult.storagePath).catch(() => {});
    return { success: false, error: `Database record creation failed: ${dbError.message}` };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.uploaded",
    entity_type: "media_asset",
    entity_id: data.id,
    details: { storagePath: uploadResult.storagePath, altText, provider: uploadResult.provider },
  });

  if (albumId) {
    const { data: existingItems } = await supabase
      .from("album_items")
      .select("sort_order")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existingItems?.[0]?.sort_order ?? 0) + 1;

    await supabase.from("album_items").insert({
      album_id: albumId,
      media_asset_id: data.id,
      sort_order: nextOrder,
    });

    const { data: album } = await supabase
      .from("albums")
      .select("cover_asset_id, slug")
      .eq("id", albumId)
      .single();

    if (album && !album.cover_asset_id) {
      await supabase.from("albums").update({ cover_asset_id: data.id }).eq("id", albumId);
    }
    if (album?.slug) {
      revalidatePath(`/gallery/${album.slug}`);
    }
  }

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return {
    success: true,
    message: "Photo uploaded and auto-optimized successfully",
    data: { id: data.id, storagePath: uploadResult.storagePath, url: uploadResult.url },
  };
}

export async function updateSiteContactAction(
  input: Partial<SiteContactSettings>,
): Promise<ActionResult> {
  const user = await requireCapability("settings.manage");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_contact")
    .maybeSingle();

  const merged: SiteContactSettings = {
    ...DEFAULT_SITE_CONTACT,
    ...((existing?.value as Partial<SiteContactSettings>) || {}),
    ...input,
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "site_contact",
    value: merged as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "Primary contact details, mailing address, meeting location, and club motto",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "settings.updated",
    entity_type: "site_settings",
    entity_id: "site_contact",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true, message: "Site contact settings updated successfully" };
}

export async function updateHomePageContentAction(input: {
  motto?: string;
  heroBadge?: string;
  heroHighlights?: string[];
  story?: Partial<HomePageStory>;
  sections?: PageSection[];
  contactCta?: Partial<ContactCtaSection>;
}): Promise<ActionResult> {
  const user = await requireCapability(["settings.manage", "content.manage"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "homepage_content")
    .maybeSingle();

  const currentVal =
    (existing?.value as {
      heroBadge?: string;
      heroHighlights?: string[];
      story?: Partial<HomePageStory>;
      sections?: PageSection[];
      motto?: string;
      contactCta?: Partial<ContactCtaSection>;
    } | null) || {};

  const newVal = {
    heroBadge: input.heroBadge !== undefined ? input.heroBadge : currentVal.heroBadge,
    heroHighlights:
      input.heroHighlights && input.heroHighlights.length > 0
        ? input.heroHighlights
        : currentVal.heroHighlights || DEFAULT_HOMEPAGE_HIGHLIGHTS,
    motto: input.motto !== undefined ? input.motto : currentVal.motto,
    story: {
      ...DEFAULT_HOMEPAGE_STORY,
      ...(currentVal.story || {}),
      ...(input.story || {}),
    },
    sections: input.sections || currentVal.sections || DEFAULT_HOMEPAGE_SECTIONS,
    contactCta: {
      ...DEFAULT_HOMEPAGE_CONTACT_CTA,
      ...(currentVal.contactCta || {}),
      ...(input.contactCta || {}),
    },
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "homepage_content",
    value: newVal as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "Homepage motto, hero badges, 4 core pillars, and community story",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Also sync motto to site_contact if motto was modified
  if (input.motto) {
    const { data: contactData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_contact")
      .maybeSingle();

    if (contactData?.value && typeof contactData.value === "object") {
      await supabase
        .from("site_settings")
        .update({
          value: {
            ...contactData.value,
            motto: input.motto,
          } as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
          updated_at: new Date().toISOString(),
        })
        .eq("key", "site_contact");
    }
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "content.updated",
    entity_type: "site_settings",
    entity_id: "homepage_content",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true, message: "Homepage copy & pillars updated successfully" };
}

export async function updateAboutPageContentAction(input: {
  heroBadge?: string;
  title?: string;
  subtitle?: string;
  sections?: PageSection[];
}): Promise<ActionResult> {
  const user = await requireCapability(["settings.manage", "content.manage"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "about_content")
    .maybeSingle();

  const currentVal =
    (existing?.value as {
      heroBadge?: string;
      title?: string;
      subtitle?: string;
      sections?: PageSection[];
    } | null) || {};

  const newVal = {
    heroBadge: input.heroBadge !== undefined ? input.heroBadge : currentVal.heroBadge,
    title: input.title !== undefined ? input.title : currentVal.title,
    subtitle: input.subtitle !== undefined ? input.subtitle : currentVal.subtitle,
    sections: input.sections || currentVal.sections || DEFAULT_ABOUT_SECTIONS,
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "about_content",
    value: newVal as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "About Us structured story, history, and community programs",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Also sync title and subtitle to pages table if modified
  if (input.title || input.subtitle) {
    await supabase
      .from("pages")
      .update({
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.subtitle ? { meta_description: input.subtitle.trim() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("slug", "about");
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "content.updated",
    entity_type: "site_settings",
    entity_id: "about_content",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/about");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
  return { success: true, message: "About Us page content updated successfully" };
}

export async function updateGardenWalkContentAction(input: {
  heroBadge?: string;
  title?: string;
  subtitle?: string;
  priceNote?: string;
  highlights?: ValueHighlight[];
  visitorGuide?: VisitorGuideCard[];
  volunteerCta?: Partial<VolunteerCtaSection>;
}): Promise<ActionResult> {
  const user = await requireCapability(["settings.manage", "content.manage"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "garden_walk_content")
    .maybeSingle();

  const currentVal =
    (existing?.value as {
      heroBadge?: string;
      title?: string;
      subtitle?: string;
      priceNote?: string;
      highlights?: ValueHighlight[];
      visitorGuide?: VisitorGuideCard[];
      volunteerCta?: Partial<VolunteerCtaSection>;
    } | null) || {};

  const newVal = {
    heroBadge: input.heroBadge !== undefined ? input.heroBadge : currentVal.heroBadge,
    title: input.title !== undefined ? input.title : currentVal.title,
    subtitle: input.subtitle !== undefined ? input.subtitle : currentVal.subtitle,
    priceNote: input.priceNote !== undefined ? input.priceNote : currentVal.priceNote,
    highlights: input.highlights || currentVal.highlights || DEFAULT_GARDEN_WALK_HIGHLIGHTS,
    visitorGuide:
      input.visitorGuide || currentVal.visitorGuide || DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
    volunteerCta: {
      ...DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
      ...(currentVal.volunteerCta || {}),
      ...(input.volunteerCta || {}),
    },
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "garden_walk_content",
    value: newVal as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "Annual Garden Walk visitor guide, highlights, and volunteer CTA",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Also sync title and subtitle to pages table if modified
  if (input.title || input.subtitle) {
    await supabase
      .from("pages")
      .update({
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.subtitle ? { meta_description: input.subtitle.trim() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("slug", "garden-walk");
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "content.updated",
    entity_type: "site_settings",
    entity_id: "garden_walk_content",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/garden-walk");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
  return { success: true, message: "Garden Walk page content updated successfully" };
}

export async function updateJoinPageContentAction(input: {
  badge?: string;
  title?: string;
  introHeading?: string;
  checkPayment?: {
    heading?: string;
    instructions?: string;
    payableTo?: string;
    address?: string;
  };
  benefits?: string[];
}): Promise<ActionResult> {
  const user = await requireCapability(["settings.manage", "content.manage"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "join_content")
    .maybeSingle();

  const currentVal = (existing?.value as Partial<JoinPageData> | null) || {};

  const newVal: JoinPageData = {
    badge:
      input.badge !== undefined ? input.badge : currentVal.badge || DEFAULT_JOIN_PAGE_DATA.badge,
    title:
      input.title !== undefined ? input.title : currentVal.title || DEFAULT_JOIN_PAGE_DATA.title,
    introHeading:
      input.introHeading !== undefined
        ? input.introHeading
        : currentVal.introHeading || DEFAULT_JOIN_PAGE_DATA.introHeading,
    checkPayment: {
      heading:
        input.checkPayment?.heading ||
        currentVal.checkPayment?.heading ||
        DEFAULT_JOIN_PAGE_DATA.checkPayment.heading,
      instructions:
        input.checkPayment?.instructions ||
        currentVal.checkPayment?.instructions ||
        DEFAULT_JOIN_PAGE_DATA.checkPayment.instructions,
      payableTo:
        input.checkPayment?.payableTo ||
        currentVal.checkPayment?.payableTo ||
        DEFAULT_JOIN_PAGE_DATA.checkPayment.payableTo,
      address:
        input.checkPayment?.address ||
        currentVal.checkPayment?.address ||
        DEFAULT_JOIN_PAGE_DATA.checkPayment.address,
    },
    benefits:
      input.benefits && input.benefits.length > 0
        ? input.benefits
        : currentVal.benefits || DEFAULT_JOIN_PAGE_DATA.benefits,
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "join_content",
    value: newVal as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "Membership registration page instructions, check payment details, and benefits",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "content.updated",
    entity_type: "site_settings",
    entity_id: "join_content",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/join");
  revalidatePath("/membership");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
  return { success: true, message: "Membership & Join page content updated successfully" };
}

// ==========================================
// ALBUM ACTIONS
// ==========================================

export async function createAlbumAction(input: {
  title: string;
  slug?: string;
  description?: string;
  year?: number;
  category?: string;
  isPublic?: boolean;
}): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  if (!input.title?.trim()) {
    return { success: false, error: "Album title is required" };
  }

  const generatedSlug =
    input.slug?.trim() ||
    input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (!generatedSlug) {
    return { success: false, error: "A valid album slug is required" };
  }

  const { data, error } = await supabase
    .from("albums")
    .insert({
      title: input.title.trim(),
      slug: generatedSlug,
      description: input.description?.trim() || null,
      year: input.year || new Date().getFullYear(),
      category: input.category?.trim() || "Garden Walk",
      is_public: input.isPublic ?? true,
    })
    .select("id, slug")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "album.created",
    entity_type: "album",
    entity_id: data.id,
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  return { success: true, message: "Album created successfully", data };
}

export async function updateAlbumAction(input: {
  id: string;
  title: string;
  slug: string;
  description?: string;
  year?: number;
  category?: string;
  isPublic?: boolean;
  coverAssetId?: string | null;
}): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  if (!input.title?.trim()) {
    return { success: false, error: "Album title is required" };
  }

  const { error } = await supabase
    .from("albums")
    .update({
      title: input.title.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      year: input.year || null,
      category: input.category?.trim() || "Garden Walk",
      is_public: input.isPublic ?? true,
      cover_asset_id: input.coverAssetId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "album.updated",
    entity_type: "album",
    entity_id: input.id,
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/gallery");
  revalidatePath(`/gallery/${input.slug}`);
  revalidatePath("/admin/media");
  return { success: true, message: "Album updated successfully" };
}

export async function deleteAlbumAction(id: string): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  await supabase.from("album_items").delete().eq("album_id", id);
  const { error } = await supabase.from("albums").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "album.deleted",
    entity_type: "album",
    entity_id: id,
    details: { id },
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  return { success: true, message: "Album deleted successfully" };
}

export async function addMediaToAlbumAction(
  albumId: string,
  mediaAssetIds: string[],
): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  if (!mediaAssetIds || mediaAssetIds.length === 0) {
    return { success: false, error: "No media assets selected" };
  }

  const { data: existingItems } = await supabase
    .from("album_items")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let currentOrder = (existingItems?.[0]?.sort_order ?? 0) + 1;

  const inserts = mediaAssetIds.map((media_asset_id) => ({
    album_id: albumId,
    media_asset_id,
    sort_order: currentOrder++,
  }));

  const { error } = await supabase
    .from("album_items")
    .upsert(inserts, { onConflict: "album_id,media_asset_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: album } = await supabase
    .from("albums")
    .select("cover_asset_id, slug")
    .eq("id", albumId)
    .single();

  if (album && !album.cover_asset_id && mediaAssetIds[0]) {
    await supabase.from("albums").update({ cover_asset_id: mediaAssetIds[0] }).eq("id", albumId);
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "album.media_added",
    entity_type: "album",
    entity_id: albumId,
    details: { albumId, count: mediaAssetIds.length },
  });

  revalidatePath("/gallery");
  if (album?.slug) {
    revalidatePath(`/gallery/${album.slug}`);
  }
  revalidatePath("/admin/media");
  return { success: true, message: `${mediaAssetIds.length} photos added to album` };
}

export async function removeMediaFromAlbumAction(
  albumId: string,
  mediaAssetId: string,
): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("album_items")
    .delete()
    .eq("album_id", albumId)
    .eq("media_asset_id", mediaAssetId);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: album } = await supabase
    .from("albums")
    .select("cover_asset_id, slug")
    .eq("id", albumId)
    .single();

  if (album?.cover_asset_id === mediaAssetId) {
    const { data: nextItem } = await supabase
      .from("album_items")
      .select("media_asset_id")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    await supabase
      .from("albums")
      .update({ cover_asset_id: nextItem?.media_asset_id || null })
      .eq("id", albumId);
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "album.media_removed",
    entity_type: "album",
    entity_id: albumId,
    details: { albumId, mediaAssetId },
  });

  revalidatePath("/gallery");
  if (album?.slug) {
    revalidatePath(`/gallery/${album.slug}`);
  }
  revalidatePath("/admin/media");
  return { success: true, message: "Photo removed from album" };
}

export async function setAlbumCoverAction(
  albumId: string,
  mediaAssetId: string,
): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  const { data: album, error } = await supabase
    .from("albums")
    .update({ cover_asset_id: mediaAssetId, updated_at: new Date().toISOString() })
    .eq("id", albumId)
    .select("slug")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "album.cover_set",
    entity_type: "album",
    entity_id: albumId,
    details: { albumId, mediaAssetId },
  });

  revalidatePath("/gallery");
  if (album?.slug) {
    revalidatePath(`/gallery/${album.slug}`);
  }
  revalidatePath("/admin/media");
  return { success: true, message: "Album cover image updated" };
}

export async function createDisbursementAction(input: {
  amountDollars: string;
  category: string;
  payee: string;
  description: string;
  referenceNumber?: string;
  disbursedAt?: string;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const parsedDollars = parseFloat(input.amountDollars);
  if (Number.isNaN(parsedDollars) || parsedDollars <= 0) {
    return { success: false, error: "Please enter a valid positive dollar amount." };
  }

  const amountCents = Math.round(parsedDollars * 100);
  if (!input.category.trim()) {
    return { success: false, error: "Please provide an expense/withdrawal category." };
  }
  if (!input.payee.trim()) {
    return { success: false, error: "Please provide a payee or recipient name." };
  }
  if (!input.description.trim()) {
    return {
      success: false,
      error: "Please provide a description or purpose for this withdrawal.",
    };
  }

  const disbursedAt = input.disbursedAt
    ? new Date(input.disbursedAt).toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase
    .from("disbursements")
    .insert({
      amount_cents: amountCents,
      category: input.category.trim(),
      payee: input.payee.trim(),
      description: input.description.trim(),
      reference_number: input.referenceNumber?.trim() || null,
      disbursed_at: disbursedAt,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to record disbursement." };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "treasury.disbursement_created",
    entity_type: "disbursement",
    entity_id: data.id,
    details: {
      amountCents,
      category: input.category.trim(),
      payee: input.payee.trim(),
      referenceNumber: input.referenceNumber?.trim(),
    },
  });

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  return {
    success: true,
    message: "Disbursement recorded successfully in accounting books.",
    data: { id: data.id },
  };
}

export async function deleteDisbursementAction(id: string): Promise<ActionResult> {
  const user = await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { error } = await supabase.from("disbursements").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "treasury.disbursement_deleted",
    entity_type: "disbursement",
    entity_id: id,
    details: { id },
  });

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  return { success: true, message: "Disbursement entry removed." };
}
