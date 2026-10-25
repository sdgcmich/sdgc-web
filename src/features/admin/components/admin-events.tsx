"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  formatDetroitDateTimeLocal,
  formatEventDateTime,
  parseDetroitDateTimeLocal,
} from "@/features/events/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { AdminEventRecord, AdminVenueRecord } from "../types";
import {
  createEventAction,
  createVenueAction,
  deleteEventAction,
  updateEventAction,
} from "../actions";
import { resolveMediaUrl } from "@/lib/storage/media-url";

interface AdminEventsProps {
  initialEvents: AdminEventRecord[];
  initialVenues?: AdminVenueRecord[];
}

const PRESET_EVENT_BANNERS = [
  {
    label: "Garden Walk & Flowers",
    url: resolveMediaUrl("/images/wordpress/2O8A6013-653x653-1.jpg"),
  },
  {
    label: "Holiday Swag Workshop",
    url: resolveMediaUrl("/images/wordpress/DSC_7044-651x651-1.jpg"),
  },
  {
    label: "Member Tea & Luncheon",
    url: resolveMediaUrl("/images/wordpress/DSC_0553-1349x1349-1.jpg"),
  },
  {
    label: "Gardening & Landscape",
    url: resolveMediaUrl("/images/wordpress/2O8A6596-1000x1000-1.jpg"),
  },
  {
    label: "Waterfront & Civic",
    url: resolveMediaUrl("/images/wordpress/2O8A5979-scaled-e1746814119349.jpeg"),
  },
];

function insertFormatting(
  textarea: HTMLTextAreaElement | null,
  before: string,
  after: string,
  setValue: (val: string) => void,
) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);
  const replacement = before + (selected || "sample text") + after;
  const newValue = text.substring(0, start) + replacement + text.substring(end);
  setValue(newValue);
  setTimeout(() => {
    textarea.focus();
    const cursorStart = start + before.length;
    const cursorEnd = cursorStart + (selected ? selected.length : 11);
    textarea.setSelectionRange(cursorStart, cursorEnd);
  }, 10);
}

export function AdminEvents({ initialEvents, initialVenues = [] }: AdminEventsProps) {
  const [events, setEvents] = React.useState<AdminEventRecord[]>(initialEvents);
  const [venues, setVenues] = React.useState<AdminVenueRecord[]>(initialVenues);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newStartsAt, setNewStartsAt] = React.useState("2026-11-15T10:00");
  const [newEndsAt, setNewEndsAt] = React.useState("2026-11-15T12:00");
  const [newCategory, setNewCategory] = React.useState("Workshops & Presentations");
  const [newStatus, setNewStatus] = React.useState<"published" | "draft" | "cancelled">(
    "published",
  );
  const [newVenueId, setNewVenueId] = React.useState<string>("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newFeaturedImage, setNewFeaturedImage] = React.useState("");
  const [newDescriptionTab, setNewDescriptionTab] = React.useState<"write" | "preview">("write");
  const newTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Inline Venue Creator State
  const [showVenueCreator, setShowVenueCreator] = React.useState(false);
  const [venueName, setVenueName] = React.useState("");
  const [venueAddress, setVenueAddress] = React.useState("");
  const [venueCity, setVenueCity] = React.useState("Saugatuck");
  const [venueState, setVenueState] = React.useState("MI");
  const [venuePostalCode, setVenuePostalCode] = React.useState("49453");
  const [venueUrl, setVenueUrl] = React.useState("");
  const [isSubmittingVenue, setIsSubmittingVenue] = React.useState(false);

  // Edit Event Form State
  const [editingEvent, setEditingEvent] = React.useState<AdminEventRecord | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSlug, setEditSlug] = React.useState("");
  const [editStartsAt, setEditStartsAt] = React.useState("");
  const [editEndsAt, setEditEndsAt] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"published" | "draft" | "cancelled">(
    "published",
  );
  const [editDescription, setEditDescription] = React.useState("");
  const [editVenueName, setEditVenueName] = React.useState("");
  const [editVenueId, setEditVenueId] = React.useState<string | undefined>(undefined);
  const [editFeaturedImage, setEditFeaturedImage] = React.useState("");
  const [editDescriptionTab, setEditDescriptionTab] = React.useState<"write" | "preview">("write");
  const editTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleOpenEdit = (e: AdminEventRecord) => {
    setEditingEvent(e);
    setEditTitle(e.title);
    setEditSlug(e.slug);
    setEditStartsAt(formatDetroitDateTimeLocal(e.startsAt));
    setEditEndsAt(e.endsAt ? formatDetroitDateTimeLocal(e.endsAt) : "");
    setEditCategory(e.category || "Workshops & Presentations");
    setEditStatus((e.status as "published" | "draft" | "cancelled") || "published");
    setEditDescription(e.description || "");
    setEditVenueName(e.venueName || "");
    setEditVenueId(e.venueId);
    setEditFeaturedImage(e.featuredImage || "");
    setEditDescriptionTab("write");
    setShowVenueCreator(false);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (editingEvent) setEditingEvent(null);
        setShowVenueCreator(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, editingEvent]);

  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  React.useEffect(() => {
    if (initialVenues) {
      setVenues(initialVenues);
    }
  }, [initialVenues]);

  const handleCreateVenue = async (targetMode: "new" | "edit") => {
    if (!venueName.trim()) return;
    setIsSubmittingVenue(true);
    try {
      const res = await createVenueAction({
        name: venueName.trim(),
        address: venueAddress.trim() || undefined,
        city: venueCity.trim() || undefined,
        state: venueState.trim() || undefined,
        postalCode: venuePostalCode.trim() || undefined,
        url: venueUrl.trim() || undefined,
      });

      if (res.success && res.data) {
        const createdVenue = res.data;
        setVenues((prev) => [...prev, createdVenue]);
        if (targetMode === "new") {
          setNewVenueId(createdVenue.id);
        } else {
          setEditVenueId(createdVenue.id);
          setEditVenueName(createdVenue.name);
        }
        setShowVenueCreator(false);
        setVenueName("");
        setVenueAddress("");
        setVenueUrl("");
        setNotice(`Venue "${createdVenue.name}" created and selected.`);
      } else {
        setIsError(true);
        setNotice(`Failed to create venue: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred creating venue");
    } finally {
      setIsSubmittingVenue(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setNewSlug(slugified);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedSlug = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/(^-|-$)+/g, "");
    if (!newTitle.trim() || !sanitizedSlug) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const startsAtIso = parseDetroitDateTimeLocal(newStartsAt);
      const endsAtIso = newEndsAt ? parseDetroitDateTimeLocal(newEndsAt) : undefined;
      const matchedVenue = venues.find((v) => v.id === newVenueId);
      const res = await createEventAction({
        title: newTitle.trim(),
        slug: sanitizedSlug,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        category: newCategory,
        status: newStatus,
        venueId: newVenueId || undefined,
        description: newDescription.trim() || undefined,
        featuredImage: newFeaturedImage.trim() || undefined,
      });

      if (res.success && res.data) {
        const createdId = (res.data as { id: string }).id;
        setEvents((prev) => [
          ...prev,
          {
            id: createdId,
            title: newTitle.trim(),
            slug: sanitizedSlug,
            startsAt: startsAtIso,
            endsAt: endsAtIso,
            category: newCategory,
            status: newStatus,
            venueId: newVenueId || undefined,
            venueName: matchedVenue ? matchedVenue.name : undefined,
            description: newDescription.trim() || undefined,
            featuredImage: newFeaturedImage.trim() || undefined,
          },
        ]);
        setNotice(`Event "${newTitle}" created and saved successfully.`);
        setIsModalOpen(false);
        setNewTitle("");
        setNewSlug("");
        setNewVenueId("");
        setNewDescription("");
        setNewFeaturedImage("");
        setShowVenueCreator(false);
      } else {
        setIsError(true);
        setNotice(`Failed to create event: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingEvent) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const startsAtIso = parseDetroitDateTimeLocal(editStartsAt);
      const endsAtIso = editEndsAt ? parseDetroitDateTimeLocal(editEndsAt) : undefined;
      const res = await updateEventAction({
        id: editingEvent.id,
        title: editTitle.trim(),
        slug: editSlug.trim(),
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        category: editCategory,
        status: editStatus,
        description: editDescription.trim() || undefined,
        venueId: editVenueId ?? editingEvent.venueId,
        venueName: editVenueName.trim() || undefined,
        featuredImage: editFeaturedImage.trim() || null,
      });

      if (res.success) {
        setEvents((prev) =>
          prev.map((item) =>
            item.id === editingEvent.id
              ? {
                  ...item,
                  title: editTitle.trim(),
                  slug: editSlug.trim(),
                  startsAt: startsAtIso,
                  endsAt: endsAtIso,
                  category: editCategory,
                  status: editStatus,
                  description: editDescription.trim() || undefined,
                  venueId: editVenueId ?? editingEvent.venueId,
                  venueName: editVenueName.trim() || undefined,
                  featuredImage: editFeaturedImage.trim() || null,
                }
              : item,
          ),
        );
        setNotice(`Event "${editTitle}" updated successfully.`);
        setEditingEvent(null);
        setShowVenueCreator(false);
      } else {
        setIsError(true);
        setNotice(`Failed to update event: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}"?`)) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteEventAction(id);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setNotice(`Event "${title}" removed.`);
      } else {
        setIsError(true);
        setNotice(`Failed to delete event: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Events & Calendar Scheduling
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule club meetings, workshops, presentations, plant sales, and the annual Garden
            Walk.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl shadow-2xs">
          + Add New Event
        </Button>
      </div>

      {notice && (
        <div
          className={`rounded-xl p-3.5 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Event Title</th>
                <th className="p-4">Date & Time (Detroit)</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Category / Excerpt</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No scheduled events found.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        {e.featuredImage && (
                          <Image
                            src={e.featuredImage}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-10 w-10 shrink-0 rounded-md object-cover border border-border"
                          />
                        )}
                        <Link
                          href={`/event/${encodeURIComponent(e.slug.replace(/[^a-zA-Z0-9_-]/g, ""))}`}
                          className="hover:underline"
                        >
                          {e.title}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatEventDateTime(e.startsAt)}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {e.venueName || "Location Announced Upon Registration"}
                    </td>
                    <td className="p-4 max-w-xs">
                      {e.category && (
                        <span className="text-xs text-muted-foreground line-clamp-2 block leading-snug">
                          {e.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {e.status === "published" ? (
                        <Badge variant="success">Published</Badge>
                      ) : e.status === "cancelled" ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => handleOpenEdit(e)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() => handleDelete(e.id, e.title)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-modal-title"
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2
              id="create-event-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Create New Club Event
            </h2>
            <p className="text-xs text-muted-foreground">
              Published events will appear on the public /events calendar, homepage spotlight, and
              RSS feeds.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="new-event-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Event Title *
                </label>
                <Input
                  id="new-event-title"
                  required
                  placeholder="e.g. Annual Holiday Swag Workshop"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="new-event-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  URL Slug *
                </label>
                <Input
                  id="new-event-slug"
                  required
                  placeholder="annual-holiday-swag-workshop"
                  value={newSlug}
                  onChange={(e) =>
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-event-starts-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Starts At (Detroit Time) *
                  </label>
                  <Input
                    id="new-event-starts-at"
                    required
                    type="datetime-local"
                    value={newStartsAt}
                    onChange={(e) => setNewStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-event-ends-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Ends At
                  </label>
                  <Input
                    id="new-event-ends-at"
                    type="datetime-local"
                    value={newEndsAt}
                    onChange={(e) => setNewEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-event-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="new-event-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="Workshops & Presentations">Workshops & Presentations</option>
                    <option value="Civic Workdays">Civic Workdays</option>
                    <option value="Social Gatherings">Social Gatherings</option>
                    <option value="Annual Fundraiser">Annual Fundraiser</option>
                    <option value="Executive Committee">Executive Committee</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="new-event-status"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Publishing Status
                  </label>
                  <select
                    id="new-event-status"
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as "published" | "draft" | "cancelled")
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Venue Selector with Inline Creator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="new-event-venue"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Venue Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVenueCreator((prev) => !prev)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {showVenueCreator ? "Cancel Inline Venue" : "+ Add New Venue"}
                  </button>
                </div>

                {showVenueCreator && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-foreground">Create and Link New Venue</p>
                    <Input
                      placeholder="Venue Name * (e.g. Huntree Nursery)"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Street Address (e.g. 12656 60th St)"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      className="text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={venueCity}
                        onChange={(e) => setVenueCity(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="State"
                        value={venueState}
                        onChange={(e) => setVenueState(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Zip"
                        value={venuePostalCode}
                        onChange={(e) => setVenuePostalCode(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <Input
                      placeholder="Website URL (optional)"
                      value={venueUrl}
                      onChange={(e) => setVenueUrl(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSubmittingVenue || !venueName.trim()}
                        onClick={() => handleCreateVenue("new")}
                      >
                        {isSubmittingVenue ? "Saving..." : "Save & Select Venue"}
                      </Button>
                    </div>
                  </div>
                )}

                <select
                  id="new-event-venue"
                  value={newVenueId}
                  onChange={(e) => setNewVenueId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">No Venue / Virtual or TBA</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.city ? ` (${v.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Banner / Featured Image Picker */}
              <div className="space-y-2">
                <label
                  htmlFor="new-event-image"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Featured Image / Banner
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground py-1">Quick Presets:</span>
                  {PRESET_EVENT_BANNERS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setNewFeaturedImage(preset.url)}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="new-event-image"
                    placeholder="https://... or /images/wordpress/..."
                    value={newFeaturedImage}
                    onChange={(e) => setNewFeaturedImage(e.target.value)}
                    className="text-sm"
                  />
                  {newFeaturedImage && (
                    <button
                      type="button"
                      onClick={() => setNewFeaturedImage("")}
                      className="text-xs text-rose-600 hover:underline shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {newFeaturedImage && (
                  <div className="relative mt-2 h-28 w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={newFeaturedImage}
                      alt="Banner Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Rich Markdown Description Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="new-event-description"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Description & Schedule (Markdown / Rich Formatting)
                  </label>
                  <div className="flex items-center space-x-1 rounded-md border border-border bg-muted/30 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewDescriptionTab("write")}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        newDescriptionTab === "write"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDescriptionTab("preview")}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        newDescriptionTab === "preview"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {newDescriptionTab === "write" ? (
                  <div className="space-y-1.5">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-input bg-muted/40 p-1.5 text-xs">
                      <button
                        type="button"
                        title="Bold"
                        onClick={() =>
                          insertFormatting(newTextareaRef.current, "**", "**", setNewDescription)
                        }
                        className="px-2 py-1 font-bold rounded hover:bg-muted text-foreground"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        title="Italic"
                        onClick={() =>
                          insertFormatting(newTextareaRef.current, "*", "*", setNewDescription)
                        }
                        className="px-2 py-1 italic rounded hover:bg-muted text-foreground"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        title="Heading 3"
                        onClick={() =>
                          insertFormatting(newTextareaRef.current, "### ", "", setNewDescription)
                        }
                        className="px-2 py-1 font-bold rounded hover:bg-muted text-foreground"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        title="Bullet List"
                        onClick={() =>
                          insertFormatting(newTextareaRef.current, "- ", "", setNewDescription)
                        }
                        className="px-2 py-1 rounded hover:bg-muted text-foreground"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        title="Numbered List"
                        onClick={() =>
                          insertFormatting(newTextareaRef.current, "1. ", "", setNewDescription)
                        }
                        className="px-2 py-1 rounded hover:bg-muted text-foreground"
                      >
                        1. List
                      </button>
                      <button
                        type="button"
                        title="Quote"
                        onClick={() =>
                          insertFormatting(newTextareaRef.current, "> ", "", setNewDescription)
                        }
                        className="px-2 py-1 rounded hover:bg-muted text-foreground"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        title="Hyperlink"
                        onClick={() =>
                          insertFormatting(
                            newTextareaRef.current,
                            "[",
                            "](https://example.com)",
                            setNewDescription,
                          )
                        }
                        className="px-2 py-1 underline rounded hover:bg-muted text-primary"
                      >
                        Link
                      </button>
                    </div>
                    <textarea
                      id="new-event-description"
                      ref={newTextareaRef}
                      rows={5}
                      placeholder="Use bold, lists, and headings to detail event activities, requirements, and refreshments..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full rounded-b-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="min-h-[140px] rounded-md border border-input bg-muted/20 p-4">
                    <MarkdownContent
                      content={newDescription || "*No event description written yet.*"}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-event-modal-title"
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2
              id="edit-event-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Edit Club Event
            </h2>
            <p className="text-xs text-muted-foreground">
              Modify event schedule dates, venue location, description formatting, and banner image.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-event-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Event Title *
                </label>
                <Input
                  id="edit-event-title"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-event-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  URL Slug *
                </label>
                <Input
                  id="edit-event-slug"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-event-starts-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Starts At (Detroit) *
                  </label>
                  <Input
                    id="edit-event-starts-at"
                    type="datetime-local"
                    required
                    value={editStartsAt}
                    onChange={(e) => setEditStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-event-ends-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Ends At (Detroit)
                  </label>
                  <Input
                    id="edit-event-ends-at"
                    type="datetime-local"
                    value={editEndsAt}
                    onChange={(e) => setEditEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-event-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="edit-event-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                  >
                    <option value="Workshops & Presentations">Workshops & Presentations</option>
                    <option value="Civic Workdays">Civic Workdays</option>
                    <option value="Social Gatherings">Social Gatherings</option>
                    <option value="Annual Fundraiser">Annual Fundraiser</option>
                    <option value="Executive Committee">Executive Committee</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="edit-event-status"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="edit-event-status"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as "published" | "draft" | "cancelled")
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Edit Venue Selector with Inline Creator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="edit-event-venue"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Venue Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVenueCreator((prev) => !prev)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {showVenueCreator ? "Cancel Inline Venue" : "+ Add New Venue"}
                  </button>
                </div>

                {showVenueCreator && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-foreground">Create and Link New Venue</p>
                    <Input
                      placeholder="Venue Name * (e.g. Huntree Nursery)"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Street Address (e.g. 12656 60th St)"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      className="text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={venueCity}
                        onChange={(e) => setVenueCity(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="State"
                        value={venueState}
                        onChange={(e) => setVenueState(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Zip"
                        value={venuePostalCode}
                        onChange={(e) => setVenuePostalCode(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <Input
                      placeholder="Website URL (optional)"
                      value={venueUrl}
                      onChange={(e) => setVenueUrl(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSubmittingVenue || !venueName.trim()}
                        onClick={() => handleCreateVenue("edit")}
                      >
                        {isSubmittingVenue ? "Saving..." : "Save & Select Venue"}
                      </Button>
                    </div>
                  </div>
                )}

                <select
                  id="edit-event-venue"
                  value={editVenueId || ""}
                  onChange={(e) => {
                    const vid = e.target.value;
                    setEditVenueId(vid || undefined);
                    const matched = venues.find((v) => v.id === vid);
                    setEditVenueName(matched ? matched.name : "");
                  }}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                >
                  <option value="">No Venue / Virtual or TBA</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.city ? ` (${v.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Featured Banner */}
              <div className="space-y-2">
                <label
                  htmlFor="edit-event-image"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Featured Image / Banner
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground py-1">Quick Presets:</span>
                  {PRESET_EVENT_BANNERS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setEditFeaturedImage(preset.url)}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="edit-event-image"
                    placeholder="https://... or /images/wordpress/..."
                    value={editFeaturedImage}
                    onChange={(e) => setEditFeaturedImage(e.target.value)}
                    className="text-sm"
                  />
                  {editFeaturedImage && (
                    <button
                      type="button"
                      onClick={() => setEditFeaturedImage("")}
                      className="text-xs text-rose-600 hover:underline shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {editFeaturedImage && (
                  <div className="relative mt-2 h-28 w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={editFeaturedImage}
                      alt="Banner Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Rich Markdown Description Editor for Edit Modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="edit-event-description"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Description & Schedule (Markdown / Rich Formatting)
                  </label>
                  <div className="flex items-center space-x-1 rounded-md border border-border bg-muted/30 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditDescriptionTab("write")}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        editDescriptionTab === "write"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDescriptionTab("preview")}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        editDescriptionTab === "preview"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {editDescriptionTab === "write" ? (
                  <div className="space-y-1.5">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-input bg-muted/40 p-1.5 text-xs">
                      <button
                        type="button"
                        title="Bold"
                        onClick={() =>
                          insertFormatting(editTextareaRef.current, "**", "**", setEditDescription)
                        }
                        className="px-2 py-1 font-bold rounded hover:bg-muted text-foreground"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        title="Italic"
                        onClick={() =>
                          insertFormatting(editTextareaRef.current, "*", "*", setEditDescription)
                        }
                        className="px-2 py-1 italic rounded hover:bg-muted text-foreground"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        title="Heading 3"
                        onClick={() =>
                          insertFormatting(editTextareaRef.current, "### ", "", setEditDescription)
                        }
                        className="px-2 py-1 font-bold rounded hover:bg-muted text-foreground"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        title="Bullet List"
                        onClick={() =>
                          insertFormatting(editTextareaRef.current, "- ", "", setEditDescription)
                        }
                        className="px-2 py-1 rounded hover:bg-muted text-foreground"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        title="Numbered List"
                        onClick={() =>
                          insertFormatting(editTextareaRef.current, "1. ", "", setEditDescription)
                        }
                        className="px-2 py-1 rounded hover:bg-muted text-foreground"
                      >
                        1. List
                      </button>
                      <button
                        type="button"
                        title="Quote"
                        onClick={() =>
                          insertFormatting(editTextareaRef.current, "> ", "", setEditDescription)
                        }
                        className="px-2 py-1 rounded hover:bg-muted text-foreground"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        title="Hyperlink"
                        onClick={() =>
                          insertFormatting(
                            editTextareaRef.current,
                            "[",
                            "](https://example.com)",
                            setEditDescription,
                          )
                        }
                        className="px-2 py-1 underline rounded hover:bg-muted text-primary"
                      >
                        Link
                      </button>
                    </div>
                    <textarea
                      id="edit-event-description"
                      ref={editTextareaRef}
                      rows={5}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-b-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="min-h-[140px] rounded-md border border-input bg-muted/20 p-4">
                    <MarkdownContent
                      content={editDescription || "*No event description written yet.*"}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingEvent(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
