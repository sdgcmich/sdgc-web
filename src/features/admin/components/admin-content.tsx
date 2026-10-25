"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RichMarkdownEditor } from "@/components/ui/rich-markdown-editor";
import type { AdminPageRecord } from "../types";
import { updatePageAction, updateHomePageContentAction } from "../actions";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_STORY,
  type HomePageStory,
  type PageContent,
  type PageSection,
} from "@/features/content/types";

interface AdminContentProps {
  initialPages: AdminPageRecord[];
  initialHomeContent?: PageContent | null;
}

export function AdminContent({ initialPages, initialHomeContent }: AdminContentProps) {
  const [activeTab, setActiveTab] = React.useState<"pages" | "homepage">("pages");
  const [pages, setPages] = React.useState<AdminPageRecord[]>(initialPages);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);

  // Standard Page Edit Modal State
  const [editingPage, setEditingPage] = React.useState<AdminPageRecord | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSubtitle, setEditSubtitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"published" | "draft">("published");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Homepage CMS Structured State
  const [homeMotto, setHomeMotto] = React.useState(
    initialHomeContent?.subtitle ||
      "We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas.",
  );
  const [homeSections, setHomeSections] = React.useState<PageSection[]>(
    initialHomeContent?.sections && initialHomeContent.sections.length > 0
      ? initialHomeContent.sections
      : DEFAULT_HOMEPAGE_SECTIONS,
  );
  const [homeStory, setHomeStory] = React.useState<HomePageStory>(
    initialHomeContent?.story || DEFAULT_HOMEPAGE_STORY,
  );
  const [isSavingHome, setIsSavingHome] = React.useState(false);

  React.useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  React.useEffect(() => {
    if (initialHomeContent) {
      if (initialHomeContent.subtitle) setHomeMotto(initialHomeContent.subtitle);
      if (initialHomeContent.sections && initialHomeContent.sections.length > 0) {
        setHomeSections(initialHomeContent.sections);
      }
      if (initialHomeContent.story) setHomeStory(initialHomeContent.story);
    }
  }, [initialHomeContent]);

  const handleOpenEdit = (p: AdminPageRecord) => {
    if (p.slug === "home") {
      setActiveTab("homepage");
      return;
    }
    setEditingPage(p);
    setEditTitle(p.title);
    setEditSubtitle(p.subtitle || "");
    setEditContent(p.content || "");
    setEditStatus(p.status);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingPage) setEditingPage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingPage]);

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editTitle.trim()) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await updatePageAction(editingPage.slug, {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || undefined,
        content: editContent.trim(),
        status: editStatus,
      });

      if (res.success) {
        setPages((prev) =>
          prev.map((p) =>
            p.slug === editingPage.slug
              ? {
                  ...p,
                  title: editTitle.trim(),
                  subtitle: editSubtitle.trim() || undefined,
                  content: editContent.trim(),
                  status: editStatus,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
        setNotice(`Page copy for "${editTitle}" updated successfully.`);
        setEditingPage(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update page: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSectionChange = (
    index: number,
    field: "heading" | "image" | "imageAlt" | "bodyText" | "ctaLabel" | "ctaHref",
    value: string,
  ) => {
    setHomeSections((prev) => {
      const copy = [...prev];
      const current = copy[index];
      if (!current) return prev;
      const target: PageSection = { ...current };
      if (field === "bodyText") {
        target.body = value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (field === "ctaLabel") {
        target.callToAction = {
          label: value,
          href: target.callToAction?.href || "/about",
        };
      } else if (field === "ctaHref") {
        target.callToAction = {
          label: target.callToAction?.label || "Learn More",
          href: value,
        };
      } else if (field === "heading") {
        target.heading = value;
      } else if (field === "image") {
        target.image = value;
      } else if (field === "imageAlt") {
        target.imageAlt = value;
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleStoryChange = (field: keyof HomePageStory, value: string) => {
    setHomeStory((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetHomeDefaults = () => {
    if (confirm("Reset Homepage 4 Pillars and community story to authentic club defaults?")) {
      setHomeSections(DEFAULT_HOMEPAGE_SECTIONS);
      setHomeStory(DEFAULT_HOMEPAGE_STORY);
    }
  };

  const handleSaveHomeCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHome(true);
    setIsError(false);
    setNotice(null);

    try {
      const res = await updateHomePageContentAction({
        motto: homeMotto.trim(),
        sections: homeSections,
        story: homeStory,
      });

      if (res.success) {
        setNotice("Homepage motto, 4 Core Pillars, and Community Story updated successfully.");
      } else {
        setIsError(true);
        setNotice(`Failed to save homepage content: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSavingHome(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Page Content & Site Copy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage static structured page copy, community mission statements, and civic program
            highlights.
          </p>
        </div>

        {/* Tab Navigation Toggle */}
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeTab === "pages"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Pages ({pages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("homepage")}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeTab === "homepage"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Homepage 4 Pillars CMS
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-lg p-3 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
          role="status"
        >
          {notice}
        </div>
      )}

      {/* TAB 1: Pages Table */}
      {activeTab === "pages" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border font-semibold text-sm">
            Managed Club Pages ({pages.length})
          </div>
          <div className="overflow-x-auto min-w-[700px]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Page Title</th>
                  <th className="p-4">Slug / Path</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pages.map((p) => {
                  const url = p.slug === "home" ? "/" : `/${p.slug}`;
                  const isHome = p.slug === "home";
                  return (
                    <tr key={p.slug} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-foreground block">{p.title}</span>
                        {p.subtitle && (
                          <span className="text-xs text-muted-foreground block truncate max-w-xs">
                            {p.subtitle}
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        <Link href={url as Route} className="hover:underline">
                          {url}
                        </Link>
                      </td>
                      <td className="p-4">
                        {p.status === "published" ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant={isHome ? "primary" : "outline"}
                          onClick={() => handleOpenEdit(p)}
                        >
                          {isHome ? "Edit 4 Pillars CMS" : "Edit Copy"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Homepage 4 Pillars Structured CMS Editor */}
      {activeTab === "homepage" && (
        <form onSubmit={handleSaveHomeCMS} className="space-y-8">
          {/* Section 1: Hero Motto */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-serif text-lg font-bold text-foreground">
                Hero Club Motto & Mission Lead
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetHomeDefaults}
                disabled={isSavingHome}
              >
                Reset to Authentic Defaults
              </Button>
            </div>

            <div>
              <label
                htmlFor="home-motto-input"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Hero Motto (Rendered in Italic Under SDGC Title)
              </label>
              <textarea
                id="home-motto-input"
                rows={2}
                value={homeMotto}
                onChange={(e) => setHomeMotto(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: The 4 Core Pillars */}
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                The Four Core Pillars (Activities & Purpose)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displayed in the 2x2 featured grid on the homepage with high-res photography.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {homeSections.map((section, idx) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="font-serif font-bold text-sm text-foreground">
                      Pillar #{idx + 1}: {section.heading}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {section.id}
                    </Badge>
                  </div>

                  <div>
                    <label
                      htmlFor={`pillar-heading-${idx}`}
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Heading
                    </label>
                    <Input
                      id={`pillar-heading-${idx}`}
                      value={section.heading}
                      onChange={(e) => handleSectionChange(idx, "heading", e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`pillar-body-${idx}`}
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Body Paragraphs (One per line)
                    </label>
                    <textarea
                      id={`pillar-body-${idx}`}
                      rows={3}
                      value={section.body.join("\n")}
                      onChange={(e) => handleSectionChange(idx, "bodyText", e.target.value)}
                      className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`pillar-image-${idx}`}
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                      >
                        Image Path
                      </label>
                      <Input
                        id={`pillar-image-${idx}`}
                        value={section.image || ""}
                        onChange={(e) => handleSectionChange(idx, "image", e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`pillar-alt-${idx}`}
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                      >
                        Image Alt Text
                      </label>
                      <Input
                        id={`pillar-alt-${idx}`}
                        value={section.imageAlt || ""}
                        onChange={(e) => handleSectionChange(idx, "imageAlt", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`pillar-cta-label-${idx}`}
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                      >
                        CTA Button Label
                      </label>
                      <Input
                        id={`pillar-cta-label-${idx}`}
                        value={section.callToAction?.label || ""}
                        onChange={(e) => handleSectionChange(idx, "ctaLabel", e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`pillar-cta-href-${idx}`}
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                      >
                        CTA Target URL
                      </label>
                      <Input
                        id={`pillar-cta-href-${idx}`}
                        value={section.callToAction?.href || ""}
                        onChange={(e) => handleSectionChange(idx, "ctaHref", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Welcoming Community Story & Stat Badges */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-bold text-foreground border-b border-border pb-3">
              Welcoming Community Story & 1928 Heritage Narrative
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="story-heading-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Story Heading
                </label>
                <Input
                  id="story-heading-input"
                  value={homeStory.heading}
                  onChange={(e) => handleStoryChange("heading", e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="story-image-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Story Image Path
                </label>
                <Input
                  id="story-image-input"
                  value={homeStory.image}
                  onChange={(e) => handleStoryChange("image", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="story-body-input"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Story Narrative Body
              </label>
              <textarea
                id="story-body-input"
                rows={4}
                value={homeStory.body}
                onChange={(e) => handleStoryChange("body", e.target.value)}
                className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
              />
            </div>

            {/* 4 Stat Badges */}
            <div className="pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                4 Community Stat Badges
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label
                    htmlFor="stat-founded"
                    className="block text-[11px] font-medium text-muted-foreground mb-1"
                  >
                    Badge 1 (Founded Year)
                  </label>
                  <Input
                    id="stat-founded"
                    value={homeStory.statYear}
                    onChange={(e) => handleStoryChange("statYear", e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="stat-members"
                    className="block text-[11px] font-medium text-muted-foreground mb-1"
                  >
                    Badge 2 (Members)
                  </label>
                  <Input
                    id="stat-members"
                    value={homeStory.statMembers}
                    onChange={(e) => handleStoryChange("statMembers", e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="stat-pots"
                    className="block text-[11px] font-medium text-muted-foreground mb-1"
                  >
                    Badge 3 (Civic Pots)
                  </label>
                  <Input
                    id="stat-pots"
                    value={homeStory.statPots}
                    onChange={(e) => handleStoryChange("statPots", e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="stat-grants"
                    className="block text-[11px] font-medium text-muted-foreground mb-1"
                  >
                    Badge 4 (Annual Grants)
                  </label>
                  <Input
                    id="stat-grants"
                    value={homeStory.statGrants}
                    onChange={(e) => handleStoryChange("statGrants", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" disabled={isSavingHome}>
              {isSavingHome ? "Saving Homepage CMS..." : "Save Homepage & Pillars"}
            </Button>
          </div>
        </form>
      )}

      {/* Page Edit Modal for standard pages */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-page-modal-title"
            className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 id="edit-page-modal-title" className="font-serif text-xl font-bold text-foreground">
              Edit Page: {editingPage.slug}
            </h2>
            <form onSubmit={handleSavePage} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-page-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Page Title *
                </label>
                <Input
                  id="edit-page-title"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-page-subtitle"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Subtitle / Mission Lead
                </label>
                <textarea
                  id="edit-page-subtitle"
                  rows={2}
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <RichMarkdownEditor
                  id="edit-page-content"
                  label="Page Body Content"
                  value={editContent}
                  onChange={setEditContent}
                  rows={14}
                  minHeight="320px"
                  placeholder="Enter detailed page content in Markdown (headings, lists, links, bold, italic)..."
                  helperText="Use the formatting toolbar or keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K). Switch to Preview to view the rendered output."
                />
              </div>

              <div>
                <label
                  htmlFor="edit-page-status"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Status
                </label>
                <select
                  id="edit-page-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "published" | "draft")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPage(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
