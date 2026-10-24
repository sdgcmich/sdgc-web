"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatEventDateTime } from "../calendar";
import type { EventSummary } from "../types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface EventListViewProps {
  events: EventSummary[];
  error?: string;
  initialQuery?: string;
  initialCategory?: string;
}

const STANDARD_CATEGORIES = [
  "Workshops & Presentations",
  "Community Projects",
  "Club Business",
  "Social & Special Events",
  "Garden Walk",
];

function getCategoryBadge(category?: string) {
  if (!category) return null;
  const lower = category.toLowerCase();
  let colorClasses = "bg-primary/10 text-primary border-primary/20";
  if (lower.includes("garden walk")) {
    colorClasses = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
  } else if (lower.includes("workshop") || lower.includes("presentation")) {
    colorClasses = "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30";
  } else if (lower.includes("community") || lower.includes("project")) {
    colorClasses = "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30";
  } else if (lower.includes("social") || lower.includes("special")) {
    colorClasses = "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30";
  } else if (lower.includes("business")) {
    colorClasses = "bg-muted text-muted-foreground border-border/80";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colorClasses}`}
    >
      {category}
    </span>
  );
}

export function EventListView({
  events,
  error,
  initialQuery = "",
  initialCategory = "all",
}: EventListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = React.useState<string>(initialCategory);

  const categories = React.useMemo(() => {
    const set = new Set<string>(STANDARD_CATEGORIES);
    for (const e of events) {
      if (e.category) set.add(e.category);
    }
    return Array.from(set);
  }, [events]);

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat);
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (cat !== "all") params.set("category", cat);
    const qs = params.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as Route, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, categoryFilter]);

  const upcomingEvents = filteredEvents.filter((e) => !e.isPast);
  const pastEvents = filteredEvents.filter((e) => e.isPast);

  return (
    <div className="space-y-8">
      {error && (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive"
          role="alert"
        >
          <p className="text-base font-semibold">Unable to load calendar events</p>
          <p className="text-xs mt-1 text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Search and Category Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="w-full lg:max-w-xs">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <Input
            id="event-search"
            placeholder="Search events by keyword or venue..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => handleCategorySelect("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <section aria-labelledby="upcoming-events-heading">
        <h2
          id="upcoming-events-heading"
          className="font-serif text-2xl font-bold text-foreground mb-4"
        >
          Upcoming Events ({upcomingEvents.length})
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No upcoming events match your search criteria.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="p-6 transition-colors hover:bg-muted/40">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-xl font-semibold text-primary">
                      <Link
                        href={`/event/${event.slug}`}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {event.title}
                      </Link>
                    </h3>
                    {getCategoryBadge(event.category)}
                  </div>
                  <time dateTime={event.startsAt} className="text-sm font-medium text-foreground">
                    {formatEventDateTime(event.startsAt)}
                  </time>
                </div>

                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{event.venueName}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href={`/event/${event.slug}/ics`}
                      download={`${event.slug}.ics`}
                      className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      title="Add to calendar (.ics)"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      <span>Add to Calendar</span>
                    </a>
                    {event.ticketUrl && (
                      <Link
                        href={event.ticketUrl as Route}
                        className="font-medium text-primary hover:underline"
                      >
                        Tickets &amp; RSVP &rarr;
                      </Link>
                    )}
                    <Link
                      href={`/event/${event.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Past Events Archive Section */}
      {pastEvents.length > 0 && (
        <section aria-labelledby="past-events-heading" className="pt-6 border-t border-border">
          <h2
            id="past-events-heading"
            className="font-serif text-xl font-semibold text-muted-foreground mb-4"
          >
            Past Events Archive ({pastEvents.length})
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card/60">
            {pastEvents.map((event) => (
              <article
                key={event.id}
                className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
              >
                <div>
                  <h3 className="text-base font-medium text-foreground">
                    <Link href={`/event/${event.slug}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">{event.venueName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Past Event</Badge>
                  <time dateTime={event.startsAt} className="text-xs text-muted-foreground">
                    {formatEventDateTime(event.startsAt)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
