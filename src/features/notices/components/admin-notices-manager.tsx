"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownContent } from "@/components/ui/markdown-content";
import {
  type AttachmentType,
  type Notice,
  type NoticeAttachment,
  type NoticeCategory,
  type NoticePriority,
  detectAttachmentType,
} from "../types";
import {
  createNoticeAction,
  updateNoticeAction,
  deleteNoticeAction,
  togglePinNoticeAction,
  togglePublishNoticeAction,
} from "../actions";

interface AdminNoticesManagerProps {
  initialNotices: Notice[];
}

export function AdminNoticesManager({ initialNotices }: AdminNoticesManagerProps) {
  const [notices, setNotices] = React.useState<Notice[]>(initialNotices);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingNotice, setEditingNotice] = React.useState<Notice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = React.useState<Notice | null>(null);

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [category, setCategory] = React.useState<NoticeCategory>("general");
  const [priority, setPriority] = React.useState<NoticePriority>("normal");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isPinned, setIsPinned] = React.useState(false);
  const [isPublished, setIsPublished] = React.useState(true);
  const [previewTab, setPreviewTab] = React.useState<"edit" | "preview">("edit");
  const [attachments, setAttachments] = React.useState<NoticeAttachment[]>([]);
  const [newAttachName, setNewAttachName] = React.useState("");
  const [newAttachUrl, setNewAttachUrl] = React.useState("");
  const [newAttachType, setNewAttachType] = React.useState<AttachmentType>("pdf");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync state if initialNotices changes
  React.useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  const handleOpenCreateModal = () => {
    setEditingNotice(null);
    setTitle("");
    setSlug("");
    setCategory("general");
    setPriority("normal");
    setExcerpt("");
    setContent("");
    setIsPinned(false);
    setIsPublished(true);
    setAttachments([]);
    setNewAttachName("");
    setNewAttachUrl("");
    setNewAttachType("pdf");
    setFormError(null);
    setPreviewTab("edit");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setSlug(notice.slug);
    setCategory(notice.category);
    setPriority(notice.priority);
    setExcerpt(notice.excerpt || "");
    setContent(notice.content);
    setIsPinned(notice.isPinned);
    setIsPublished(notice.isPublished);
    setAttachments(notice.attachments || []);
    setNewAttachName("");
    setNewAttachUrl("");
    setNewAttachType("pdf");
    setFormError(null);
    setPreviewTab("edit");
    setIsModalOpen(true);
  };

  const handleAddAttachment = () => {
    if (!newAttachUrl.trim()) return;
    const finalType = newAttachType || detectAttachmentType(newAttachName || newAttachUrl);
    const newAttach: NoticeAttachment = {
      name: newAttachName.trim() || "Attached File",
      url: newAttachUrl.trim(),
      type: finalType,
    };
    setAttachments((prev) => [...prev, newAttach]);
    setNewAttachName("");
    setNewAttachUrl("");
    setNewAttachType("pdf");
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingNotice) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (editingNotice) formData.append("id", editingNotice.id);
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("category", category);
      formData.append("priority", priority);
      formData.append("excerpt", excerpt);
      formData.append("content", content);
      formData.append("isPinned", String(isPinned));
      formData.append("isPublished", String(isPublished));
      formData.append("attachments", JSON.stringify(attachments));

      const res = editingNotice
        ? await updateNoticeAction(formData)
        : await createNoticeAction(formData);

      if (!res.success) {
        setFormError(res.error || "Operation failed.");
      } else {
        setIsModalOpen(false);
        // Refresh local state
        window.location.reload();
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (notice: Notice) => {
    const nextState = !notice.isPinned;
    setNotices((prev) => prev.map((n) => (n.id === notice.id ? { ...n, isPinned: nextState } : n)));
    await togglePinNoticeAction(notice.id, nextState);
  };

  const handleTogglePublish = async (notice: Notice) => {
    const nextState = !notice.isPublished;
    setNotices((prev) =>
      prev.map((n) => (n.id === notice.id ? { ...n, isPublished: nextState } : n)),
    );
    await togglePublishNoticeAction(notice.id, nextState);
  };

  const handleDeleteConfirm = async () => {
    if (!noticeToDelete) return;
    const targetId = noticeToDelete.id;
    setNotices((prev) => prev.filter((n) => n.id !== targetId));
    setNoticeToDelete(null);
    await deleteNoticeAction(targetId);
  };

  // Metrics
  const totalCount = notices.length;
  const publishedCount = notices.filter((n) => n.isPublished).length;
  const pinnedCount = notices.filter((n) => n.isPinned).length;
  const urgentCount = notices.filter((n) => n.category === "urgent").length;

  const filteredNotices = notices.filter((n) => {
    const matchesCat = selectedCategory === "all" ? true : n.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Club Content &amp; Communications
          </span>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Notice Board &amp; Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Author and publish club bulletins, meeting updates, frost warnings, and volunteer calls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={"/notices" as Route}
            target="_blank"
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
          >
            <span>View Public Board</span>
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </Link>
          <Button onClick={handleOpenCreateModal} className="rounded-xl">
            + Create New Notice
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Total Bulletins</p>
          <p className="text-2xl font-bold text-foreground font-mono">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Active Published</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Pinned Alerts</p>
          <p className="text-2xl font-bold text-primary font-mono">{pinnedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Urgent Warnings</p>
          <p className="text-2xl font-bold text-destructive font-mono">{urgentCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="w-full sm:w-80">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices by keyword..."
            className="rounded-xl h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="admin-category-filter"
            className="text-xs text-muted-foreground font-medium"
          >
            Category:
          </label>
          <select
            id="admin-category-filter"
            aria-label="Filter notices by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="urgent">Urgent</option>
            <option value="meeting">Club Meeting</option>
            <option value="volunteer">Volunteer Call</option>
            <option value="beautification">Civic Beautification</option>
            <option value="event">Garden Walk &amp; Event</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Notices Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Title &amp; Slug</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5 text-center">Pinned</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Published Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredNotices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No notices match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredNotices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground text-sm max-w-xs sm:max-w-md truncate">
                        {notice.title}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        /{notice.slug}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted">
                        {notice.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          notice.priority === "urgent" || notice.priority === "high"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {notice.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(notice)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          notice.isPinned
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                        title="Toggle Pinned Status"
                      >
                        {notice.isPinned ? "★ Pinned" : "☆ Unpinned"}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(notice)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          notice.isPublished
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {notice.isPublished ? "Live" : "Draft"}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                      {new Date(notice.publishedAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(notice)}
                        className="text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoticeToDelete(notice)}
                        className="text-destructive hover:underline font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-border/80 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  {editingNotice ? "Edit Notice Bulletin" : "Create New Club Notice"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Announcements appear on the public Notice Board and in member feeds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold p-1 cursor-pointer"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div
                className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive font-medium"
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <Label htmlFor="notice-title" required>
                  Notice Title
                </Label>
                <Input
                  id="notice-title"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Frost Advisory & Autumn Perennial Care Guide"
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="notice-category">Category</Label>
                  <select
                    id="notice-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent Alert</option>
                    <option value="meeting">Club Meeting</option>
                    <option value="volunteer">Volunteer Call</option>
                    <option value="beautification">Civic Beautification</option>
                    <option value="event">Garden Walk &amp; Event</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notice-priority">Priority</Label>
                  <select
                    id="notice-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NoticePriority)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notice-slug">Custom URL Slug</Label>
                  <Input
                    id="notice-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="frost-advisory-guide"
                    className="rounded-xl text-xs font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notice-excerpt">Short Summary / Excerpt</Label>
                <textarea
                  id="notice-excerpt"
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise 1-2 sentence overview for cards and notifications..."
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Content with Markdown Tabs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notice-content" required>
                    Notice Content (Markdown Supported)
                  </Label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("edit")}
                      className={`px-2.5 py-1 rounded-md font-semibold ${
                        previewTab === "edit"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("preview")}
                      className={`px-2.5 py-1 rounded-md font-semibold ${
                        previewTab === "preview"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {previewTab === "edit" ? (
                  <textarea
                    id="notice-content"
                    rows={8}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Detailed notice body, schedules, bullet points, volunteer requirements..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                ) : (
                  <div className="rounded-xl border border-border bg-muted/20 p-4 min-h-[160px] text-xs leading-relaxed text-foreground">
                    {content ? (
                      <MarkdownContent content={content} />
                    ) : (
                      <span className="text-muted-foreground italic">No content typed yet.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-foreground">
                      Attachments (PDFs, Images, Documents)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Attach downloadable files, event maps, or meeting minutes.
                    </p>
                  </div>
                  {attachments.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {attachments.length} {attachments.length === 1 ? "file" : "files"}
                    </span>
                  )}
                </div>

                {/* List of existing attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={att.url}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                            {att.type || "file"}
                          </span>
                          <div className="min-w-0 truncate">
                            <p className="font-semibold text-foreground truncate">{att.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{att.url}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new attachment row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-border/60">
                  <div className="sm:col-span-5">
                    <Input
                      placeholder="File title (e.g. Garden Tour Map.pdf)"
                      value={newAttachName}
                      onChange={(e) => setNewAttachName(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="URL or file link (https://...)"
                      value={newAttachUrl}
                      onChange={(e) => {
                        setNewAttachUrl(e.target.value);
                        if (!newAttachName) {
                          const parts = e.target.value.split("/");
                          const last = parts[parts.length - 1];
                          if (last?.includes(".")) {
                            setNewAttachName(decodeURIComponent(last));
                          }
                        }
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={newAttachType}
                      onChange={(e) => setNewAttachType(e.target.value as AttachmentType)}
                      aria-label="File format"
                      className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                      <option value="doc">Document</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex items-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddAttachment}
                      disabled={!newAttachUrl.trim()}
                      className="w-full h-8 text-xs font-semibold px-2"
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Pin to top of Notice Board (★ Pinned)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Publish Notice immediately</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !title || !content}>
                  {isSubmitting
                    ? "Saving Notice..."
                    : editingNotice
                      ? "Save Changes"
                      : "Create Notice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {noticeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Delete Notice Bulletin?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong>"{noticeToDelete.title}"</strong>? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setNoticeToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
                Delete Notice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
