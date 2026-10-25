"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Notice } from "../types";
import { MarkdownContent } from "@/components/ui/markdown-content";

interface NoticeDetailProps {
  notice: Notice;
}

export function NoticeDetail({ notice }: NoticeDetailProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Non-blocking
    }
  };

  const formattedDate = new Date(notice.publishedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="space-y-8 max-w-4xl mx-auto">
      {/* Back Link & Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <Link
          href={"/notices" as Route}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Notice Board
        </Link>

        <button
          type="button"
          onClick={handleCopyLink}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          {copied ? "Link Copied!" : "Share Notice"}
        </button>
      </div>

      {/* Main Notice Article */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {notice.category}
            </span>
            {notice.isPinned && (
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                ★ Pinned Announcement
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            {notice.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>Published {formattedDate}</span>
            <span>&bull;</span>
            <span>{notice.authorName ? `Posted by ${notice.authorName}` : "Club Officers"}</span>
          </div>
        </div>

        {notice.excerpt && (
          <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-4 text-sm font-medium text-foreground leading-relaxed">
            {notice.excerpt}
          </div>
        )}

        {/* Content Body with rich Markdown formatting & typography */}
        <div className="pt-2">
          <MarkdownContent content={notice.content} />
        </div>

        {/* Attachments Section */}
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="pt-4 border-t border-border/60 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-primary"
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
              <span>Attached Documents &amp; Files ({notice.attachments.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notice.attachments.map((att) => {
                const isPdf = att.type === "pdf" || att.name.toLowerCase().endsWith(".pdf");
                const isImage =
                  att.type === "image" || /\.(jpe?g|png|webp|gif|svg)$/i.test(att.name);

                return (
                  <a
                    key={att.url}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 hover:border-primary/50 hover:bg-muted/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                          isPdf
                            ? "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/25"
                            : isImage
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25"
                              : "bg-primary/15 text-primary border border-primary/25"
                        }`}
                      >
                        {isPdf ? "PDF" : isImage ? "IMG" : "DOC"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {att.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Click to open / download
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
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
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info & inquiries */}
        <div className="border-t border-border/60 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            Questions regarding this announcement? Reach out through our{" "}
            <Link href={"/contact" as Route} className="text-primary font-semibold hover:underline">
              Contact Page
            </Link>
            .
          </p>
          <Link
            href={"/notices" as Route}
            className="text-xs font-bold text-primary hover:underline"
          >
            &larr; View All Club Notices
          </Link>
        </div>
      </div>
    </article>
  );
}
