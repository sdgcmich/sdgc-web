"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import type { ActionResult } from "@/features/auth/types";
import { requireUser } from "@/features/auth/authorization";
import type { MemberProfileInput } from "@/features/membership/types";
import { memberProfileSchema } from "@/features/membership/validation";
import { getStorageProvider } from "@/lib/storage/provider";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnProfileAction(
  input: MemberProfileInput,
): Promise<ActionResult<void>> {
  await requireUser("/profile");

  const parseResult = memberProfileSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const data = parseResult.data;
  const supabase = await createClient();

  // Atomically update profile, username handle, and project interests via database transaction RPC
  const { error: rpcError } = await supabase.rpc("update_member_profile", {
    p_first_name: data.firstName,
    p_last_name: data.lastName,
    p_username: data.username.toLowerCase(),
    p_spouse_name: data.spouseFirstName || undefined,
    p_phone: data.phoneHome || undefined,
    p_secondary_phone: data.phoneCell || undefined,
    p_address_line1: data.addressLine1 || undefined,
    p_address_line2: data.addressLine2 || undefined,
    p_city: data.city || undefined,
    p_state: data.state || undefined,
    p_postal_code: data.zipCode || undefined,
    p_birth_month: data.birthMonth ?? undefined,
    p_birth_day: data.birthDay ?? undefined,
    p_is_master_gardener: data.masterGardener,
    p_directory_opt_out: data.directoryOptOut ?? false,
    p_gardening_interests: data.gardeningInterests || undefined,
    p_volunteer_experience: data.volunteerExperience || undefined,
    p_project_interests: data.projectInterests,
  });

  if (rpcError) {
    return {
      success: false,
      error: `Failed to update profile: ${rpcError.message}`,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/directory");
  revalidatePath("/admin/members");
  return {
    success: true,
    data: undefined,
  };
}

export async function uploadProfilePhotoAction(
  formData: FormData,
): Promise<ActionResult<{ avatarUrl: string }>> {
  const user = await requireUser("/profile");
  const file = formData.get("avatar") as File | null;

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please select an image file to upload." };
  }

  // Allowed mime types
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Only JPEG, PNG, WebP, and GIF images are supported.",
    };
  }

  // 5MB maximum file upload
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { success: false, error: "Profile photo must be less than 5MB." };
  }

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Resize to standard 512x512 square WebP (cover fit, center crop, 85% quality)
    const resizedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const storage = getStorageProvider();
    const fileName = `avatar-${Date.now()}.webp`;
    const storagePath = `${user.id}/${fileName}`;

    const uploadResult = await storage.upload({
      bucket: "avatars",
      path: storagePath,
      buffer: resizedBuffer,
      contentType: "image/webp",
    });

    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        avatar_url: uploadResult.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    revalidatePath("/profile");
    revalidatePath("/directory");
    revalidatePath("/admin/members");

    return {
      success: true,
      data: { avatarUrl: uploadResult.url },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process image";
    return { success: false, error: message };
  }
}

export async function removeProfilePhotoAction(): Promise<ActionResult<void>> {
  const user = await requireUser("/profile");
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/directory");
  revalidatePath("/admin/members");

  return { success: true, data: undefined };
}
