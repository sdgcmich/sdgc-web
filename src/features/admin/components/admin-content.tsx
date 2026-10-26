"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RichMarkdownEditor } from "@/components/ui/rich-markdown-editor";
import type { AdminPageRecord } from "../types";
import {
  updatePageAction,
  updateHomePageContentAction,
  updateAboutPageContentAction,
  updateGardenWalkContentAction,
  updateJoinPageContentAction,
} from "../actions";
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
  type ContactCtaSection,
  type HomePageStory,
  type JoinPageData,
  type PageContent,
  type PageSection,
  type ValueHighlight,
  type VisitorGuideCard,
  type VolunteerCtaSection,
} from "@/features/content/types";

interface AdminContentProps {
  initialPages: AdminPageRecord[];
  initialHomeContent?: PageContent | null;
  initialAboutContent?: PageContent | null;
  initialGardenWalkContent?: PageContent | null;
  initialJoinContent?: JoinPageData | null;
}

type TabType = "pages" | "homepage" | "about" | "garden-walk" | "join";

export function AdminContent({
  initialPages,
  initialHomeContent,
  initialAboutContent,
  initialGardenWalkContent,
  initialJoinContent,
}: AdminContentProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("pages");
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

  // ----------------------------------------------------
  // 1. Homepage CMS State
  // ----------------------------------------------------
  const [homeHeroBadge, setHomeHeroBadge] = React.useState(
    initialHomeContent?.heroBadge || "Cultivating Community Since 1928 • 501(c)(3) Nonprofit",
  );
  const [homeMotto, setHomeMotto] = React.useState(
    initialHomeContent?.subtitle ||
      "We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas.",
  );
  const [homeHighlights, setHomeHighlights] = React.useState<string[]>(
    initialHomeContent?.heroHighlights && initialHomeContent.heroHighlights.length > 0
      ? initialHomeContent.heroHighlights
      : DEFAULT_HOMEPAGE_HIGHLIGHTS,
  );
  const [homeSections, setHomeSections] = React.useState<PageSection[]>(
    initialHomeContent?.sections && initialHomeContent.sections.length > 0
      ? initialHomeContent.sections
      : DEFAULT_HOMEPAGE_SECTIONS,
  );
  const [homeStory, setHomeStory] = React.useState<HomePageStory>(
    initialHomeContent?.story || DEFAULT_HOMEPAGE_STORY,
  );
  const [homeContactCta, setHomeContactCta] = React.useState<ContactCtaSection>(
    initialHomeContent?.contactCta || DEFAULT_HOMEPAGE_CONTACT_CTA,
  );
  const [isSavingHome, setIsSavingHome] = React.useState(false);

  // ----------------------------------------------------
  // 2. About Page CMS State
  // ----------------------------------------------------
  const [aboutHeroBadge, setAboutHeroBadge] = React.useState(
    initialAboutContent?.heroBadge || "Dedicated Since 1928",
  );
  const [aboutTitle, setAboutTitle] = React.useState(
    initialAboutContent?.title || "About Our Club",
  );
  const [aboutSubtitle, setAboutSubtitle] = React.useState(
    initialAboutContent?.subtitle ||
      "Civic beautification, education, scholarships, and friendship since 1928 across Saugatuck and Douglas, Michigan.",
  );
  const [aboutSections, setAboutSections] = React.useState<PageSection[]>(
    initialAboutContent?.sections && initialAboutContent.sections.length > 0
      ? initialAboutContent.sections
      : DEFAULT_ABOUT_SECTIONS,
  );
  const [isSavingAbout, setIsSavingAbout] = React.useState(false);

  // ----------------------------------------------------
  // 3. Garden Walk CMS State
  // ----------------------------------------------------
  const [gwHeroBadge, setGwHeroBadge] = React.useState(
    initialGardenWalkContent?.heroBadge || "Premier Lakeshore Horticultural Event",
  );
  const [gwTitle, setGwTitle] = React.useState(
    initialGardenWalkContent?.title || "Annual Garden Walk",
  );
  const [gwSubtitle, setGwSubtitle] = React.useState(
    initialGardenWalkContent?.subtitle ||
      "Explore the annual Saugatuck Douglas Garden Walk: tour exquisite private gardens and support local community beautification and scholarships.",
  );
  const [gwPriceNote, setGwPriceNote] = React.useState(
    initialGardenWalkContent?.priceNote ||
      "Advance tickets: $20 • Day of tour: $25. All ticket proceeds directly fund club civic beautification planters, parks, and youth horticulture scholarships.",
  );
  const [gwHighlights, setGwHighlights] = React.useState<ValueHighlight[]>(
    initialGardenWalkContent?.valueHighlights && initialGardenWalkContent.valueHighlights.length > 0
      ? initialGardenWalkContent.valueHighlights
      : DEFAULT_GARDEN_WALK_HIGHLIGHTS,
  );
  const [gwVisitorGuide, setGwVisitorGuide] = React.useState<VisitorGuideCard[]>(
    initialGardenWalkContent?.visitorGuide && initialGardenWalkContent.visitorGuide.length > 0
      ? initialGardenWalkContent.visitorGuide
      : DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
  );
  const [gwVolunteerCta, setGwVolunteerCta] = React.useState<VolunteerCtaSection>(
    initialGardenWalkContent?.volunteerCta || DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
  );
  const [isSavingGw, setIsSavingGw] = React.useState(false);

  // ----------------------------------------------------
  // 4. Membership & Join CMS State
  // ----------------------------------------------------
  const [joinBadge, setJoinBadge] = React.useState(
    initialJoinContent?.badge || DEFAULT_JOIN_PAGE_DATA.badge,
  );
  const [joinTitle, setJoinTitle] = React.useState(
    initialJoinContent?.title || DEFAULT_JOIN_PAGE_DATA.title,
  );
  const [joinIntroHeading, setJoinIntroHeading] = React.useState(
    initialJoinContent?.introHeading || DEFAULT_JOIN_PAGE_DATA.introHeading,
  );
  const [joinCheckPayment, setJoinCheckPayment] = React.useState(
    initialJoinContent?.checkPayment || DEFAULT_JOIN_PAGE_DATA.checkPayment,
  );
  const [joinBenefits, setJoinBenefits] = React.useState<string[]>(
    initialJoinContent?.benefits && initialJoinContent.benefits.length > 0
      ? initialJoinContent.benefits
      : DEFAULT_JOIN_PAGE_DATA.benefits,
  );
  const [isSavingJoin, setIsSavingJoin] = React.useState(false);

  // Sync external props on change
  React.useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  // Modal Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingPage) setEditingPage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingPage]);

  const handleOpenEdit = (p: AdminPageRecord) => {
    if (p.slug === "home") {
      setActiveTab("homepage");
      return;
    }
    if (p.slug === "about" || p.slug === "aboutourclub") {
      setActiveTab("about");
      return;
    }
    if (p.slug === "garden-walk") {
      setActiveTab("garden-walk");
      return;
    }
    if (p.slug === "join") {
      setActiveTab("join");
      return;
    }
    setEditingPage(p);
    setEditTitle(p.title);
    setEditSubtitle(p.subtitle || "");
    setEditContent(p.content || "");
    setEditStatus(p.status);
  };

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

  // ----------------------------------------------------
  // Save Handlers for CMS Tabs
  // ----------------------------------------------------
  const handleSaveHomeCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHome(true);
    setIsError(false);
    setNotice(null);

    try {
      const res = await updateHomePageContentAction({
        heroBadge: homeHeroBadge.trim(),
        heroHighlights: homeHighlights.filter(Boolean),
        motto: homeMotto.trim(),
        sections: homeSections,
        story: homeStory,
        contactCta: homeContactCta,
      });

      if (res.success) {
        setNotice(
          "Homepage hero banner, 4 Core Pillars, and community story updated successfully.",
        );
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

  const handleSaveAboutCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAbout(true);
    setIsError(false);
    setNotice(null);

    try {
      const res = await updateAboutPageContentAction({
        heroBadge: aboutHeroBadge.trim(),
        title: aboutTitle.trim(),
        subtitle: aboutSubtitle.trim(),
        sections: aboutSections,
      });

      if (res.success) {
        setNotice("About Us 5 core program sections and story updated successfully.");
      } else {
        setIsError(true);
        setNotice(`Failed to save About Us content: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSavingAbout(false);
    }
  };

  const handleSaveGardenWalkCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGw(true);
    setIsError(false);
    setNotice(null);

    try {
      const res = await updateGardenWalkContentAction({
        heroBadge: gwHeroBadge.trim(),
        title: gwTitle.trim(),
        subtitle: gwSubtitle.trim(),
        priceNote: gwPriceNote.trim(),
        highlights: gwHighlights,
        visitorGuide: gwVisitorGuide,
        volunteerCta: gwVolunteerCta,
      });

      if (res.success) {
        setNotice("Garden Walk visitor guide, highlights, and volunteer CTA updated successfully.");
      } else {
        setIsError(true);
        setNotice(`Failed to save Garden Walk content: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSavingGw(false);
    }
  };

  const handleSaveJoinCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingJoin(true);
    setIsError(false);
    setNotice(null);

    try {
      const res = await updateJoinPageContentAction({
        badge: joinBadge.trim(),
        title: joinTitle.trim(),
        introHeading: joinIntroHeading.trim(),
        checkPayment: joinCheckPayment,
        benefits: joinBenefits.filter(Boolean),
      });

      if (res.success) {
        setNotice("Membership & Join page copy and payment instructions updated successfully.");
      } else {
        setIsError(true);
        setNotice(`Failed to save Join page content: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSavingJoin(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tab Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Site Copy &amp; Structured CMS
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mt-2 tracking-tight">
            Page Content &amp; Site Copy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage static structured page copy, community mission statements, and civic program
            highlights across all public routes.
          </p>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar rounded-xl border border-border/60 bg-muted/40 p-1 text-xs font-semibold gap-1 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === "pages"
                ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Pages ({pages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("homepage")}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === "homepage"
                ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home CMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === "about"
                ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            About Us CMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("garden-walk")}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === "garden-walk"
                ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Garden Walk CMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={`shrink-0 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === "join"
                ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Join &amp; Dues CMS
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-xl p-4 text-xs font-medium border ${
            isError
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-primary/10 border-primary/20 text-primary"
          }`}
          role="status"
        >
          {notice}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: ALL PAGES TABLE                               */}
      {/* ==================================================== */}
      {activeTab === "pages" && (
        <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Page Title &amp; Slug</th>
                  <th className="p-4">Summary / Subtitle</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pages.map((p) => (
                  <tr key={p.slug} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="font-semibold text-foreground text-sm">{p.title}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{p.slug}</div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                      {p.subtitle || p.content?.slice(0, 80) || "—"}
                    </td>
                    <td className="p-4">
                      {p.status === "published" ? (
                        <Badge variant="success" className="capitalize text-[11px]">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="capitalize text-[11px]">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "Default"}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(p)}
                        className="rounded-lg text-xs"
                      >
                        Edit Copy
                      </Button>
                      <Link
                        href={p.slug === "home" ? "/" : (`/${p.slug}` as Route)}
                        prefetch={false}
                        target="_blank"
                        className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs"
                      >
                        View ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: HOMEPAGE CMS                                  */}
      {/* ==================================================== */}
      {activeTab === "homepage" && (
        <form onSubmit={handleSaveHomeCMS} className="space-y-8">
          {/* Hero Banner Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Hero Header &amp; Mission Motto
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update the top badge, primary club motto, and key statistics banner on the home
                  page.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Reset Homepage Hero & 4 Pillars to authentic club defaults?")) {
                    setHomeHeroBadge("Cultivating Community Since 1928 • 501(c)(3) Nonprofit");
                    setHomeHighlights(DEFAULT_HOMEPAGE_HIGHLIGHTS);
                    setHomeMotto(
                      "We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas.",
                    );
                    setHomeSections(DEFAULT_HOMEPAGE_SECTIONS);
                    setHomeStory(DEFAULT_HOMEPAGE_STORY);
                    setHomeContactCta(DEFAULT_HOMEPAGE_CONTACT_CTA);
                  }
                }}
                className="rounded-xl text-xs"
              >
                Reset Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Hero Top Badge Text
                </span>
                <Input
                  value={homeHeroBadge}
                  onChange={(e) => setHomeHeroBadge(e.target.value)}
                  placeholder="e.g. Cultivating Community Since 1928 • 501(c)(3) Nonprofit"
                  className="rounded-xl border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Club Mission Motto
                </span>
                <Input
                  value={homeMotto}
                  onChange={(e) => setHomeMotto(e.target.value)}
                  placeholder="Official club motto"
                  className="rounded-xl border-border/60"
                />
              </div>
            </div>

            {/* Highlights Bar Items */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Hero Highlights Bar (3 Badges)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["highlight-slot-1", "highlight-slot-2", "highlight-slot-3"] as const).map(
                  (slotKey, slotIdx) => (
                    <Input
                      key={slotKey}
                      value={homeHighlights[slotIdx] || ""}
                      onChange={(e) => {
                        const updated = [...homeHighlights];
                        updated[slotIdx] = e.target.value;
                        setHomeHighlights(updated);
                      }}
                      placeholder={`Highlight badge #${slotIdx + 1}`}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          {/* 4 Core Pillars Section */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              The Four Core Pillars (Activities &amp; Programs)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homeSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Pillar #{idx + 1}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {sec.id}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">
                        Pillar Heading
                      </span>
                      <Input
                        value={sec.heading}
                        onChange={(e) => {
                          const updated = [...homeSections];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = {
                            ...cur,
                            id: cur.id || `section-${idx}`,
                            heading: e.target.value,
                          };
                          setHomeSections(updated);
                        }}
                        className="rounded-xl border-border/60 text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">
                        Body Paragraphs (One per line)
                      </span>
                      <textarea
                        value={sec.body.join("\n")}
                        onChange={(e) => {
                          const updated = [...homeSections];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = {
                            ...cur,
                            id: cur.id || `section-${idx}`,
                            body: e.target.value.split("\n").filter(Boolean),
                          };
                          setHomeSections(updated);
                        }}
                        rows={4}
                        className="w-full rounded-xl border border-border/60 bg-background p-3 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="block text-[11px] font-medium text-muted-foreground">
                          Button CTA Label
                        </span>
                        <Input
                          value={sec.callToAction?.label || ""}
                          onChange={(e) => {
                            const updated = [...homeSections];
                            const cur = updated[idx];
                            if (!cur) return;
                            updated[idx] = {
                              ...cur,
                              id: cur.id || `section-${idx}`,
                              callToAction: {
                                label: e.target.value,
                                href: cur.callToAction?.href || "/about",
                              },
                            };
                            setHomeSections(updated);
                          }}
                          className="rounded-xl border-border/60 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[11px] font-medium text-muted-foreground">
                          Button CTA Link
                        </span>
                        <Input
                          value={sec.callToAction?.href || ""}
                          onChange={(e) => {
                            const updated = [...homeSections];
                            const cur = updated[idx];
                            if (!cur) return;
                            updated[idx] = {
                              ...cur,
                              id: cur.id || `section-${idx}`,
                              callToAction: {
                                label: cur.callToAction?.label || "Learn More",
                                href: e.target.value,
                              },
                            };
                            setHomeSections(updated);
                          }}
                          className="rounded-xl border-border/60 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Welcoming Community Story & Stats */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-serif text-xl font-bold text-foreground border-b border-border/60 pb-3">
              Community Story &amp; Numerical Stats
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-foreground">Story Heading</span>
                  <Input
                    value={homeStory.heading}
                    onChange={(e) => setHomeStory({ ...homeStory, heading: e.target.value })}
                    className="rounded-xl border-border/60"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-foreground">
                    Story Narrative
                  </span>
                  <textarea
                    value={homeStory.body}
                    onChange={(e) => setHomeStory({ ...homeStory, body: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-border/60 bg-background p-3 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* 4 Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Founded Year
                  </span>
                  <Input
                    value={homeStory.statYear}
                    onChange={(e) => setHomeStory({ ...homeStory, statYear: e.target.value })}
                    className="rounded-xl border-border/60 font-serif font-bold text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Active Members
                  </span>
                  <Input
                    value={homeStory.statMembers}
                    onChange={(e) => setHomeStory({ ...homeStory, statMembers: e.target.value })}
                    className="rounded-xl border-border/60 font-serif font-bold text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Civic Pots
                  </span>
                  <Input
                    value={homeStory.statPots}
                    onChange={(e) => setHomeStory({ ...homeStory, statPots: e.target.value })}
                    className="rounded-xl border-border/60 font-serif font-bold text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Annual Grants
                  </span>
                  <Input
                    value={homeStory.statGrants}
                    onChange={(e) => setHomeStory({ ...homeStory, statGrants: e.target.value })}
                    className="rounded-xl border-border/60 font-serif font-bold text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Inquiries CTA Section */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground border-b border-border/60 pb-3">
              Contact Inquiries Call-to-Action Banner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-foreground">Badge Text</span>
                <Input
                  value={homeContactCta.badge}
                  onChange={(e) => setHomeContactCta({ ...homeContactCta, badge: e.target.value })}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-foreground">Heading</span>
                <Input
                  value={homeContactCta.heading}
                  onChange={(e) =>
                    setHomeContactCta({ ...homeContactCta, heading: e.target.value })
                  }
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <span className="block text-xs font-semibold text-foreground">
                  Description Body
                </span>
                <textarea
                  value={homeContactCta.body}
                  onChange={(e) => setHomeContactCta({ ...homeContactCta, body: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border/60 bg-background p-3 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-foreground">
                  Primary Button Label
                </span>
                <Input
                  value={homeContactCta.primaryLabel}
                  onChange={(e) =>
                    setHomeContactCta({ ...homeContactCta, primaryLabel: e.target.value })
                  }
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-foreground">
                  Primary Button Link
                </span>
                <Input
                  value={homeContactCta.primaryHref}
                  onChange={(e) =>
                    setHomeContactCta({ ...homeContactCta, primaryHref: e.target.value })
                  }
                  className="rounded-xl border-border/60 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingHome}
              className="rounded-xl px-8 py-3 font-semibold shadow-xs"
            >
              {isSavingHome ? "Saving Homepage Copy..." : "Save Homepage Content"}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ABOUT US CMS                                  */}
      {/* ==================================================== */}
      {activeTab === "about" && (
        <form onSubmit={handleSaveAboutCMS} className="space-y-8">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  About Us Header &amp; Overview
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage the top badge, heading, subtitle, and the 5 key historical and civic
                  program sections.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Reset About Us sections to standard club defaults?")) {
                    setAboutHeroBadge("Dedicated Since 1928");
                    setAboutTitle("About Our Club");
                    setAboutSubtitle(
                      "Civic beautification, education, scholarships, and friendship since 1928 across Saugatuck and Douglas, Michigan.",
                    );
                    setAboutSections(DEFAULT_ABOUT_SECTIONS);
                  }
                }}
                className="rounded-xl text-xs"
              >
                Reset Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Top Badge
                </span>
                <Input
                  value={aboutHeroBadge}
                  onChange={(e) => setAboutHeroBadge(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Page Title
                </span>
                <Input
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  className="rounded-xl border-border/60 font-serif font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Subtitle
                </span>
                <Input
                  value={aboutSubtitle}
                  onChange={(e) => setAboutSubtitle(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
            </div>
          </div>

          {/* 5 Program & Story Sections */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              The Five Club Story &amp; Program Sections
            </h2>

            {aboutSections.map((sec, idx) => (
              <div
                key={sec.id}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Section #{idx + 1}:
                    </span>
                    <span className="font-serif font-bold text-foreground">{sec.heading}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {sec.id}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-8 space-y-3">
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">Heading</span>
                      <Input
                        value={sec.heading}
                        onChange={(e) => {
                          const updated = [...aboutSections];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = {
                            ...cur,
                            id: cur.id || `about-sec-${idx}`,
                            heading: e.target.value,
                          };
                          setAboutSections(updated);
                        }}
                        className="rounded-xl border-border/60 text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">
                        Body Content (Rich Markdown / Multiple paragraphs)
                      </span>
                      <textarea
                        value={sec.body.join("\n\n")}
                        onChange={(e) => {
                          const updated = [...aboutSections];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = {
                            ...cur,
                            id: cur.id || `about-sec-${idx}`,
                            body: e.target.value.split("\n\n").filter(Boolean),
                          };
                          setAboutSections(updated);
                        }}
                        rows={5}
                        className="w-full rounded-xl border border-border/60 bg-background p-3 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-3">
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">Image URL</span>
                      <Input
                        value={sec.image || ""}
                        onChange={(e) => {
                          const updated = [...aboutSections];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = {
                            ...cur,
                            id: cur.id || `about-sec-${idx}`,
                            image: e.target.value,
                          };
                          setAboutSections(updated);
                        }}
                        placeholder="/images/..."
                        className="rounded-xl border-border/60 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">
                        Image Alt Text
                      </span>
                      <Input
                        value={sec.imageAlt || ""}
                        onChange={(e) => {
                          const updated = [...aboutSections];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = {
                            ...cur,
                            id: cur.id || `about-sec-${idx}`,
                            imageAlt: e.target.value,
                          };
                          setAboutSections(updated);
                        }}
                        placeholder="Descriptive alt text"
                        className="rounded-xl border-border/60 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingAbout}
              className="rounded-xl px-8 py-3 font-semibold shadow-xs"
            >
              {isSavingAbout ? "Saving About Us..." : "Save About Us Content"}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* TAB 4: GARDEN WALK CMS                               */}
      {/* ==================================================== */}
      {activeTab === "garden-walk" && (
        <form onSubmit={handleSaveGardenWalkCMS} className="space-y-8">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Garden Walk Header &amp; Tour Logistics
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage the tour page badge, pricing notices, visitor guide cards, and volunteer
                  CTA.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Reset Garden Walk content to standard club defaults?")) {
                    setGwHeroBadge("Premier Lakeshore Horticultural Event");
                    setGwTitle("Annual Garden Walk");
                    setGwSubtitle(
                      "Explore the annual Saugatuck Douglas Garden Walk: tour exquisite private gardens and support local community beautification and scholarships.",
                    );
                    setGwPriceNote(
                      "Advance tickets: $20 • Day of tour: $25. All ticket proceeds directly fund club civic beautification planters, parks, and youth horticulture scholarships.",
                    );
                    setGwHighlights(DEFAULT_GARDEN_WALK_HIGHLIGHTS);
                    setGwVisitorGuide(DEFAULT_GARDEN_WALK_VISITOR_GUIDE);
                    setGwVolunteerCta(DEFAULT_GARDEN_WALK_VOLUNTEER_CTA);
                  }
                }}
                className="rounded-xl text-xs"
              >
                Reset Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Hero Top Badge
                </span>
                <Input
                  value={gwHeroBadge}
                  onChange={(e) => setGwHeroBadge(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Page Title
                </span>
                <Input
                  value={gwTitle}
                  onChange={(e) => setGwTitle(e.target.value)}
                  className="rounded-xl border-border/60 font-serif font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Subtitle
                </span>
                <Input
                  value={gwSubtitle}
                  onChange={(e) => setGwSubtitle(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Advance &amp; Day-Of Ticket Pricing Notice
                </span>
                <Input
                  value={gwPriceNote}
                  onChange={(e) => setGwPriceNote(e.target.value)}
                  className="rounded-xl border-border/60 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Visitor Guide & Tips (4 Cards) */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Visitor Guide &amp; Tour Logistics (4 Cards)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(
                ["visitor-card-1", "visitor-card-2", "visitor-card-3", "visitor-card-4"] as const
              ).map((slotKey, idx) => {
                const card = gwVisitorGuide[idx] || { emoji: "🌸", title: "", description: "" };
                return (
                  <div
                    key={slotKey}
                    className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={card.emoji}
                        onChange={(e) => {
                          const updated = [...gwVisitorGuide];
                          updated[idx] = { ...card, emoji: e.target.value };
                          setGwVisitorGuide(updated);
                        }}
                        className="w-12 text-center rounded-lg border-border/60 text-base"
                      />
                      <Input
                        value={card.title}
                        onChange={(e) => {
                          const updated = [...gwVisitorGuide];
                          updated[idx] = { ...card, title: e.target.value };
                          setGwVisitorGuide(updated);
                        }}
                        className="flex-1 rounded-lg border-border/60 font-serif font-bold text-xs"
                      />
                    </div>
                    <textarea
                      value={card.description}
                      onChange={(e) => {
                        const updated = [...gwVisitorGuide];
                        updated[idx] = { ...card, description: e.target.value };
                        setGwVisitorGuide(updated);
                      }}
                      rows={4}
                      className="w-full rounded-xl border border-border/60 bg-background p-2.5 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volunteer CTA Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground border-b border-border/60 pb-3">
              Host a Garden or Volunteer CTA Banner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-foreground">Badge Text</span>
                <Input
                  value={gwVolunteerCta.badge}
                  onChange={(e) => setGwVolunteerCta({ ...gwVolunteerCta, badge: e.target.value })}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-foreground">Heading</span>
                <Input
                  value={gwVolunteerCta.heading}
                  onChange={(e) =>
                    setGwVolunteerCta({ ...gwVolunteerCta, heading: e.target.value })
                  }
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <span className="block text-xs font-semibold text-foreground">
                  Description Body
                </span>
                <textarea
                  value={gwVolunteerCta.body}
                  onChange={(e) => setGwVolunteerCta({ ...gwVolunteerCta, body: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border/60 bg-background p-3 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingGw}
              className="rounded-xl px-8 py-3 font-semibold shadow-xs"
            >
              {isSavingGw ? "Saving Garden Walk..." : "Save Garden Walk Content"}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* TAB 5: MEMBERSHIP & JOIN CMS                         */}
      {/* ==================================================== */}
      {activeTab === "join" && (
        <form onSubmit={handleSaveJoinCMS} className="space-y-8">
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Membership Registration Page Copy
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage the registration header badge, check payment instructions, and member
                  benefits list.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Reset Membership & Join copy to standard club defaults?")) {
                    setJoinBadge(DEFAULT_JOIN_PAGE_DATA.badge);
                    setJoinTitle(DEFAULT_JOIN_PAGE_DATA.title);
                    setJoinIntroHeading(DEFAULT_JOIN_PAGE_DATA.introHeading);
                    setJoinCheckPayment(DEFAULT_JOIN_PAGE_DATA.checkPayment);
                    setJoinBenefits(DEFAULT_JOIN_PAGE_DATA.benefits);
                  }
                }}
                className="rounded-xl text-xs"
              >
                Reset Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Hero Top Badge
                </span>
                <Input
                  value={joinBadge}
                  onChange={(e) => setJoinBadge(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Page Title
                </span>
                <Input
                  value={joinTitle}
                  onChange={(e) => setJoinTitle(e.target.value)}
                  className="rounded-xl border-border/60 font-serif font-bold"
                />
              </div>
            </div>

            {/* Check Payment Instructions */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Paying by Personal Check Instructions Box
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-foreground">Box Heading</span>
                  <Input
                    value={joinCheckPayment.heading}
                    onChange={(e) =>
                      setJoinCheckPayment({ ...joinCheckPayment, heading: e.target.value })
                    }
                    className="rounded-xl border-border/60"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-foreground">
                    Make Check Payable To
                  </span>
                  <Input
                    value={joinCheckPayment.payableTo}
                    onChange={(e) =>
                      setJoinCheckPayment({ ...joinCheckPayment, payableTo: e.target.value })
                    }
                    className="rounded-xl border-border/60 font-semibold"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="block text-xs font-semibold text-foreground">
                    Instructions Note
                  </span>
                  <Input
                    value={joinCheckPayment.instructions}
                    onChange={(e) =>
                      setJoinCheckPayment({ ...joinCheckPayment, instructions: e.target.value })
                    }
                    className="rounded-xl border-border/60 text-xs"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="block text-xs font-semibold text-foreground">
                    Mailing Address
                  </span>
                  <Input
                    value={joinCheckPayment.address}
                    onChange={(e) =>
                      setJoinCheckPayment({ ...joinCheckPayment, address: e.target.value })
                    }
                    className="rounded-xl border-border/60 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Member Benefits List */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Member Benefits List (One per line)
              </h3>
              <textarea
                value={joinBenefits.join("\n")}
                onChange={(e) => setJoinBenefits(e.target.value.split("\n").filter(Boolean))}
                rows={6}
                className="w-full rounded-xl border border-border/60 bg-background p-3 text-xs leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingJoin}
              className="rounded-xl px-8 py-3 font-semibold shadow-xs"
            >
              {isSavingJoin ? "Saving Join Copy..." : "Save Join Content"}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* STANDARD PAGE EDIT MODAL WITH RICH MARKDOWN EDITOR   */}
      {/* ==================================================== */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  Edit Copy: {editingPage.title}
                </h2>
                <p className="text-xs text-muted-foreground font-mono">/{editingPage.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-foreground">Page Title</span>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="rounded-xl border-border/60 font-serif font-bold text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-foreground">Status</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "published" | "draft")}
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-foreground">
                  Subtitle / Meta Description
                </span>
                <Input
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="Optional brief summary"
                  className="rounded-xl border-border/60 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-foreground">
                  Page Content (Rich Markdown)
                </span>
                <RichMarkdownEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Write page content in rich Markdown..."
                  minHeight="340px"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPage(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs px-6 font-semibold shadow-xs"
                >
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
