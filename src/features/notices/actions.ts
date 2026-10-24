"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/features/auth/authorization";
import type { ActionResult } from "@/features/auth/types";
import type { Json } from "@/types/database";
import { type NoticeCategory, type NoticePriority, slugifyNoticeTitle } from "./types";

// uses slugifyNoticeTitle from types

export async function createNoticeAction(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  const user = await requireCapability("content.manage");

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const excerpt = (formData.get("excerpt") as string)?.trim() || null;
  const category = (formData.get("category") as NoticeCategory) || "general";
  const priority = (formData.get("priority") as NoticePriority) || "normal";
  const isPinned = formData.get("isPinned") === "true" || formData.get("isPinned") === "on";
  const isPublished =
    formData.get("isPublished") === "true" || formData.get("isPublished") === "on";

  if (!title || title.length < 3) {
    return {
      success: false,
      error: "Title must be at least 3 characters long.",
    };
  }

  if (!content || content.length < 10) {
    return {
      success: false,
      error: "Content must be at least 10 characters long.",
    };
  }

  const finalSlug = rawSlug ? slugifyNoticeTitle(rawSlug) : slugifyNoticeTitle(title);

  const attachmentsRaw = formData.get("attachments") as string | null;
  let attachments: NonNullable<Json> = [];
  if (attachmentsRaw) {
    try {
      const parsed = JSON.parse(attachmentsRaw);
      if (Array.isArray(parsed)) {
        attachments = parsed.filter(
          (a) =>
            typeof a === "object" &&
            a !== null &&
            typeof a.url === "string" &&
            a.url.trim().length > 0,
        ) as NonNullable<Json>;
      }
    } catch {
      // Ignore parse errors
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .insert({
      title,
      slug: finalSlug,
      content,
      excerpt,
      category,
      priority,
      is_pinned: isPinned,
      is_published: isPublished,
      attachments,
      author_id: user.id,
      published_at: new Date().toISOString(),
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A notice with this slug or title already exists. Please choose a unique title.",
      };
    }
    return {
      success: false,
      error: error.message || "Failed to create notice.",
    };
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");

  return {
    success: true,
    data: { slug: data.slug },
  };
}

export async function updateNoticeAction(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  await requireCapability("content.manage");

  const id = (formData.get("id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const excerpt = (formData.get("excerpt") as string)?.trim() || null;
  const category = (formData.get("category") as NoticeCategory) || "general";
  const priority = (formData.get("priority") as NoticePriority) || "normal";
  const isPinned = formData.get("isPinned") === "true" || formData.get("isPinned") === "on";
  const isPublished =
    formData.get("isPublished") === "true" || formData.get("isPublished") === "on";

  if (!id) {
    return { success: false, error: "Notice ID is missing." };
  }

  if (!title || title.length < 3) {
    return { success: false, error: "Title must be at least 3 characters." };
  }

  if (!content || content.length < 10) {
    return { success: false, error: "Content must be at least 10 characters." };
  }

  const finalSlug = rawSlug ? slugifyNoticeTitle(rawSlug) : slugifyNoticeTitle(title);

  const attachmentsRaw = formData.get("attachments") as string | null;
  let attachments: NonNullable<Json> = [];
  if (attachmentsRaw) {
    try {
      const parsed = JSON.parse(attachmentsRaw);
      if (Array.isArray(parsed)) {
        attachments = parsed.filter(
          (a) =>
            typeof a === "object" &&
            a !== null &&
            typeof a.url === "string" &&
            a.url.trim().length > 0,
        ) as NonNullable<Json>;
      }
    } catch {
      // Ignore parse errors
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notices")
    .update({
      title,
      slug: finalSlug,
      content,
      excerpt,
      category,
      priority,
      is_pinned: isPinned,
      is_published: isPublished,
      attachments,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to update notice.",
    };
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");
  revalidatePath(`/notices/${finalSlug}`);

  return {
    success: true,
    data: { slug: finalSlug },
  };
}

export async function deleteNoticeAction(id: string): Promise<ActionResult<void>> {
  await requireCapability("content.manage");

  const supabase = await createClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to delete notice.",
    };
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");

  return {
    success: true,
    data: undefined,
  };
}

export async function togglePinNoticeAction(
  id: string,
  isPinned: boolean,
): Promise<ActionResult<void>> {
  await requireCapability("content.manage");

  const supabase = await createClient();
  const { error } = await supabase
    .from("notices")
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");

  return { success: true, data: undefined };
}

export async function togglePublishNoticeAction(
  id: string,
  isPublished: boolean,
): Promise<ActionResult<void>> {
  await requireCapability("content.manage");

  const supabase = await createClient();
  const { error } = await supabase
    .from("notices")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");

  return { success: true, data: undefined };
}
