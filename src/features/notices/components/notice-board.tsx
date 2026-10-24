"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Notice, NoticeCategory } from "../types";

interface NoticeBoardProps {
  initialNotices: Notice[];
}

const CATEGORIES: { id: NoticeCategory | "all"; label: string }[] = [
  { id: "all", label: "All Notices" },
  { id: "urgent", label: "Urgent Alerts" },
  { id: "meeting", label: "Club Meetings" },
  { id: "volunteer", label: "Volunteer Calls" },
  { id: "beautification", label: "Civic Projects" },
  { id: "event", label: "Garden Walk & Events" },
  { id: "general", label: "General" },
];

function getCategoryBadge(category: NoticeCategory) {
  switch (category) {
    case "urgent":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Urgent Notice
        </span>
      );
    case "meeting":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
          Club Meeting
        </span>
      );
    case "volunteer":
      return (
        <span className="inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
          Volunteer Call
        </span>
      );
    case "beautification":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          Civic Beautification
        </span>
      );
    case "event":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
          Garden Walk &amp; Event
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-muted border border-border/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          General
        </span>
      );
  }
}

export function NoticeBoard({ initialNotices }: NoticeBoardProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<NoticeCategory | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredNotices = React.useMemo(() => {
    return initialNotices.filter((n) => {
      const matchesCategory = selectedCategory === "all" ? true : n.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        n.title.toLowerCase().includes(query) ||
        n.excerpt?.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [initialNotices, selectedCategory, searchQuery]);

  const pinnedNotices = filteredNotices.filter((n) => n.isPinned);
  const regularNotices = filteredNotices.filter((n) => !n.isPinned);

  return (
    <div className="space-y-10">
      {/* Search & Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <svg
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements, meetings, frost guides..."
              className="w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-medium shrink-0">
            Showing {filteredNotices.length} of {initialNotices.length} notices
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-xs scale-102"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned & Urgent Hero Section */}
      {pinnedNotices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H7.5m9 0h1.5a1.5 1.5 0 011.5 1.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 011.5 20.25v-15A1.5 1.5 0 013 3.75h4.5"
              />
            </svg>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Pinned &amp; High Priority Announcements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pinnedNotices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(notice.category)}
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        ★ Pinned
                      </span>
                      {notice.attachments && notice.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <svg
                            aria-hidden="true"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.37l-9.4 9.401a1.5 1.5 0 11-2.122-2.122l8.03-8.03"
                            />
                          </svg>
                          <span>
                            {notice.attachments.length}{" "}
                            {notice.attachments.length === 1 ? "file" : "files"}
                          </span>
                        </span>
                      )}
                    </div>
                    <time className="text-[11px] text-muted-foreground font-mono">
                      {new Date(notice.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    <Link href={`/notices/${notice.slug}` as Route}>{notice.title}</Link>
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {notice.excerpt || notice.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <span className="text-xs text-muted-foreground">
                    {notice.authorName ? `By ${notice.authorName}` : "Club Board"}
                  </span>
                  <Link
                    href={`/notices/${notice.slug}` as Route}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Read Full Notice &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Regular Notices Grid */}
      <div className="space-y-4">
        {pinnedNotices.length > 0 && regularNotices.length > 0 && (
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            All Club Announcements
          </h2>
        )}

        {regularNotices.length === 0 && pinnedNotices.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">
              No matching notices found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search query or selecting a different category filter above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-primary hover:underline pt-2 inline-block cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNotices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getCategoryBadge(notice.category)}
                      {notice.attachments && notice.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <svg
                            aria-hidden="true"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.37l-9.4 9.401a1.5 1.5 0 11-2.122-2.122l8.03-8.03"
                            />
                          </svg>
                          <span>
                            {notice.attachments.length}{" "}
                            {notice.attachments.length === 1 ? "file" : "files"}
                          </span>
                        </span>
                      )}
                    </div>
                    <time className="text-[11px] text-muted-foreground font-mono">
                      {new Date(notice.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    <Link href={`/notices/${notice.slug}` as Route}>{notice.title}</Link>
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {notice.excerpt || notice.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">
                    {notice.authorName ? `By ${notice.authorName}` : "Club Board"}
                  </span>
                  <Link
                    href={`/notices/${notice.slug}` as Route}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Read &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
