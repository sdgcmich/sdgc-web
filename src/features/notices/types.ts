export type NoticeCategory =
  "general" | "urgent" | "meeting" | "volunteer" | "event" | "beautification";

export type NoticePriority = "low" | "normal" | "high" | "urgent";

export type AttachmentType = "pdf" | "image" | "doc" | "other";

export interface NoticeAttachment {
  name: string;
  url: string;
  type?: AttachmentType;
  sizeBytes?: number;
}

export interface Notice {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: NoticeCategory;
  priority: NoticePriority;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
  expiresAt: string | null;
  authorId: string | null;
  authorName?: string | null;
  attachments?: NoticeAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  category: NoticeCategory;
  priority: NoticePriority;
  isPinned: boolean;
  isPublished: boolean;
  attachments?: NoticeAttachment[];
}

export interface UpdateNoticeInput extends CreateNoticeInput {
  id: string;
}

export function slugifyNoticeTitle(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function isValidNoticeCategory(cat: string): cat is NoticeCategory {
  return ["general", "urgent", "meeting", "volunteer", "event", "beautification"].includes(cat);
}

export function isValidNoticePriority(p: string): p is NoticePriority {
  return ["low", "normal", "high", "urgent"].includes(p);
}

export function detectAttachmentType(urlOrName: string): AttachmentType {
  const lower = urlOrName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|webp|gif|svg|avif)$/.test(lower)) return "image";
  if (/\.(docx?|odt|rtf|txt|csv|xlsx?|pptx?)$/.test(lower)) return "doc";
  return "other";
}
