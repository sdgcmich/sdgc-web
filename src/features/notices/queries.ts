import { createClient } from "@/lib/supabase/server";
import {
  type AttachmentType,
  type Notice,
  type NoticeAttachment,
  type NoticeCategory,
  detectAttachmentType,
  isValidNoticeCategory,
  isValidNoticePriority,
} from "./types";

interface NoticeDbRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  author_id: string | null;
  attachments?: unknown;
  created_at: string;
  updated_at: string;
  profiles?:
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null;
}

function mapNoticeRow(row: NoticeDbRow): Notice {
  const authorProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const authorName = authorProfile
    ? `${authorProfile.first_name || ""} ${authorProfile.last_name || ""}`.trim()
    : null;

  let attachments: NoticeAttachment[] = [];
  if (Array.isArray(row.attachments)) {
    attachments = row.attachments
      .filter(
        (a): a is Record<string, unknown> =>
          typeof a === "object" && a !== null && typeof (a as { url?: unknown }).url === "string",
      )
      .map((a) => {
        const url = (a.url as string).trim();
        const name = typeof a.name === "string" && a.name.trim() ? a.name.trim() : "Attachment";
        const type =
          typeof a.type === "string"
            ? (a.type as AttachmentType)
            : detectAttachmentType(name || url);
        const sizeBytes = typeof a.sizeBytes === "number" ? a.sizeBytes : undefined;
        return { name, url, type, sizeBytes };
      });
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    category: isValidNoticeCategory(row.category) ? row.category : "general",
    priority: isValidNoticePriority(row.priority) ? row.priority : "normal",
    isPinned: Boolean(row.is_pinned),
    isPublished: Boolean(row.is_published),
    publishedAt: row.published_at || row.created_at,
    expiresAt: row.expires_at,
    authorId: row.author_id,
    authorName,
    attachments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all published, active notices for the public Notice Board.
 * Pinned notices appear first, followed by newest published notices.
 */
export async function getPublishedNotices(category?: NoticeCategory): Promise<Notice[]> {
  const supabase = await createClient();

  let query = supabase
    .from("notices")
    .select(
      `
      id,
      title,
      slug,
      content,
      excerpt,
      category,
      priority,
      is_pinned,
      is_published,
      published_at,
      expires_at,
      author_id,
      attachments,
      created_at,
      updated_at
    `,
    )
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching published notices:", error);
    return [];
  }

  return (data as NoticeDbRow[]).map(mapNoticeRow);
}

/**
 * Fetch a single notice by its URL slug.
 */
export async function getNoticeBySlug(slug: string): Promise<Notice | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notices")
    .select(
      `
      id,
      title,
      slug,
      content,
      excerpt,
      category,
      priority,
      is_pinned,
      is_published,
      published_at,
      expires_at,
      author_id,
      attachments,
      created_at,
      updated_at
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapNoticeRow(data as NoticeDbRow);
}

/**
 * Admin view: Fetch all notices with pagination and draft status.
 */
export async function getAllNoticesAdmin(): Promise<Notice[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notices")
    .select(
      `
      id,
      title,
      slug,
      content,
      excerpt,
      category,
      priority,
      is_pinned,
      is_published,
      published_at,
      expires_at,
      author_id,
      attachments,
      created_at,
      updated_at,
      profiles:author_id (
        first_name,
        last_name
      )
    `,
    )
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching admin notices:", error);
    return [];
  }

  return (data as NoticeDbRow[]).map(mapNoticeRow);
}
