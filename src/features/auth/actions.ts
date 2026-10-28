"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ActionResult } from "@/features/auth/types";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  unenrollMfaSchema,
} from "@/features/auth/validation";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { sanitizeReturnTo } from "./redirects";

async function resolveIdentifierToEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }

  // Lookup email for username using service role on server
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    return trimmed;
  }

  const env = getPublicSupabaseEnv();
  const admin = createAdminClient<Database>(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", trimmed.toLowerCase())
    .maybeSingle();

  if (!profile) {
    // Return dummy email so signInWithPassword fails with uniform timing/error
    return "nonexistent-user@invalid.local";
  }

  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  return userData?.user?.email ?? "nonexistent-user@invalid.local";
}

async function resolveDefaultDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = (userRoles || []).map((r) => r.role);
  const isStaffOrAdmin = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
  return isStaffOrAdmin ? "/admin" : "/profile";
}

export async function loginAction(formData: FormData): Promise<ActionResult<{ returnTo: string }>> {
  const rawIdentifier = formData.get("identifier");
  const rawPassword = formData.get("password");
  const rawReturnTo = formData.get("returnTo");

  const parseResult = loginSchema.safeParse({
    identifier: rawIdentifier,
    password: rawPassword,
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: "Please provide a valid username/email and password.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const { identifier, password } = parseResult.data;
  const targetEmail = await resolveIdentifierToEmail(identifier);

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password,
  });

  if (error) {
    // Return a generic error to prevent username or email enumeration
    return {
      success: false,
      error: "Invalid username, email, or password.",
    };
  }

  revalidatePath("/", "layout");

  // Determine intended landing destination
  let destination = sanitizeReturnTo(rawReturnTo as string | null, "");
  if (!destination || destination === "/profile") {
    const userId = authData.user?.id;
    destination = userId ? await resolveDefaultDestination(supabase, userId) : "/profile";
  }

  // Check if user has MFA TOTP enabled (step-up authentication requirement AAL2)
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
    return {
      success: true,
      data: {
        returnTo: `/mfa-verify?returnTo=${encodeURIComponent(destination)}`,
      },
    };
  }

  return {
    success: true,
    data: { returnTo: destination },
  };
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult<void>> {
  const currentPassword = (formData.get("currentPassword") as string) || "";
  const newPassword = (formData.get("newPassword") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  const parseResult = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the password errors below.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return {
      success: false,
      error: "You must be signed in to change your password.",
    };
  }

  // Check assurance level: if user has MFA enrolled, elevate to AAL2 before modifying password
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
    return {
      success: false,
      error: "Two-factor authentication (AAL2) verification required before changing password.",
    };
  }

  // 1. Verify current password by attempting re-authentication
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return {
      success: false,
      error: "The current password you entered is incorrect.",
      fieldErrors: {
        currentPassword: ["The current password you entered is incorrect."],
      },
    };
  }

  // 2. Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  // 3. Log password change in audit events
  try {
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      action: "auth.password_changed",
      entity_type: "user",
      entity_id: user.id,
      details: {
        email: user.email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Non-blocking
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: undefined,
  };
}

export async function registerAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (key === "projectInterests") {
      if (!rawData[key]) rawData[key] = [];
      (rawData[key] as string[]).push(value as string);
    } else if (key === "masterGardener" || key === "directoryOptOut") {
      rawData[key] = value === "true" || value === "on";
    } else if (key === "birthMonth" || key === "birthDay") {
      const num = Number(value);
      rawData[key] = Number.isNaN(num) || num === 0 ? undefined : num;
    } else {
      rawData[key] = value;
    }
  });

  const parseResult = registerSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const data = parseResult.data;
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

  // Create Auth user with full metadata so database trigger provisions profile, interests, and term atomically
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/profile`,
      data: {
        username: (
          data.username ||
          data.firstName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "member"
        ).toLowerCase(),
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phoneHome || null,
        secondary_phone: data.phoneCell || null,
        address_line1: data.addressLine1 || null,
        address_line2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.zipCode || null,
        birth_month: data.birthMonth || null,
        birth_day: data.birthDay || null,
        spouse_name: data.spouseFirstName || null,
        is_master_gardener: data.masterGardener,
        directory_opt_out: data.directoryOptOut ?? false,
        gardening_interests: data.gardeningInterests || null,
        volunteer_experience: data.volunteerExperience || null,
        interests_experience: data.interestsExperience || data.gardeningInterests || null,
        project_interests: data.projectInterests,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Failed to create account. Please try again.",
    };
  }

  const userId = authData.user.id;
  revalidatePath("/", "layout");
  return {
    success: true,
    data: { userId },
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(identifier: string): Promise<ActionResult<string>> {
  const trimmed = identifier?.trim();
  if (!trimmed) {
    return {
      success: false,
      error: "Please enter your username or email address.",
    };
  }

  const targetEmail = await resolveIdentifierToEmail(trimmed);
  if (targetEmail.includes("@") && !targetEmail.endsWith("@invalid.local")) {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

    await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${siteUrl}/reset-password`,
    });
  }

  // Always return success to prevent username or email enumeration
  return {
    success: true,
    data: "If an account matches that username or email, a password recovery link has been sent.",
  };
}

export async function resetPasswordAction(newPassword: string): Promise<ActionResult<void>> {
  if (!newPassword || newPassword.length < 12) {
    return {
      success: false,
      error: "Password must be at least 12 characters.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: undefined,
  };
}

export async function unenrollMfaAction(formData: FormData): Promise<ActionResult<void>> {
  const password = (formData.get("password") as string) || "";
  const factorId = (formData.get("factorId") as string) || "";

  const parseResult = unenrollMfaSchema.safeParse({ password, factorId });
  if (!parseResult.success) {
    return {
      success: false,
      error: "Current password is required to remove two-factor authentication.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return {
      success: false,
      error: "You must be signed in to manage two-factor authentication.",
    };
  }

  // Re-verify current password before allowing factor removal
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (verifyError) {
    return {
      success: false,
      error: "The password you entered is incorrect.",
      fieldErrors: {
        password: ["The password you entered is incorrect."],
      },
    };
  }

  // Unenroll MFA factor
  const { error: unenrollError } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (unenrollError) {
    return {
      success: false,
      error: unenrollError.message,
    };
  }

  // Audit event
  try {
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      action: "auth.mfa_unenrolled",
      entity_type: "user",
      entity_id: user.id,
      details: {
        factor_id: factorId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Non-blocking
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: undefined,
  };
}
