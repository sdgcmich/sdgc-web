import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { formatEventDate, formatEventTime } from "../calendar";
import type { EventSummary } from "../types";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/ui/markdown-content";

interface EventDetailCardProps {
  event: EventSummary;
  prevEvent?: EventSummary;
  nextEvent?: EventSummary;
}

export function EventDetailCard({ event, prevEvent, nextEvent }: EventDetailCardProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <Link
          href={"/events" as Route}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Events Calendar
        </Link>
        <div className="text-xs text-muted-foreground">
          Club Timezone: <span className="font-semibold text-foreground">{event.timezone}</span>
        </div>
      </div>

      {/* Main Event Article */}
      <article className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="flex items-center space-x-3">
            {event.category && <Badge variant="secondary">{event.category}</Badge>}
            {event.isPast && <Badge variant="outline">Past Event</Badge>}
            {event.isCancelled && <Badge variant="destructive">Cancelled</Badge>}
          </div>
        </div>

        {event.featuredImage && (
          <div className="relative mt-6 aspect-video max-h-80 w-full overflow-hidden rounded-xl border border-border bg-muted shadow-xs">
            <Image
              src={event.featuredImage}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        <h1 className="mt-6 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
          {event.title}
        </h1>

        {/* Date and Venue Banner */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4 border border-border">
          <div className="flex items-start space-x-3">
            <svg
              className="h-5 w-5 text-primary mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date & Time
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatEventDate(event.startsAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatEventTime(event.startsAt)} – {formatEventTime(event.endsAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <svg
              className="h-5 w-5 text-primary mt-0.5 shrink-0"
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Venue & Location
              </p>
              <p className="text-sm font-medium text-foreground">{event.venueName}</p>
              {event.venueAddress && (
                <p className="text-xs text-muted-foreground">{event.venueAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description Body */}
        <div className="mt-8 border-t border-border pt-6">
          <MarkdownContent content={event.description} />
        </div>

        {/* Ticket / Action Section */}
        {event.ticketUrl && (
          <div
            id="tickets"
            className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-serif text-lg font-bold text-primary">Tickets & Registration</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Advance registration or ticket purchase available for this event.
              </p>
            </div>
            <Link
              href={event.ticketUrl as Route}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Get Tickets &rarr;
            </Link>
          </div>
        )}

        {/* Calendar Subscription / Export */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={`/event/${event.slug}/ics`}
            download={`${event.slug}.ics`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
            aria-label="Export event to iCalendar file"
          >
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add to Calendar (.ics)
          </a>
          <a
            href="/events/feed.ics"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors shadow-2xs"
            aria-label="Subscribe to full club calendar feed"
          >
            Subscribe to All Club Events (.ics)
          </a>
        </div>

        {/* Adjacent Events Navigation */}
        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row justify-between gap-4 text-sm">
          {prevEvent ? (
            <Link
              href={`/event/${prevEvent.slug}`}
              className="text-left text-primary hover:underline"
            >
              <span className="block text-xs text-muted-foreground">&larr; Previous Event</span>
              <span className="font-semibold">{prevEvent.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextEvent ? (
            <Link
              href={`/event/${nextEvent.slug}`}
              className="text-right text-primary hover:underline"
            >
              <span className="block text-xs text-muted-foreground">Next Event &rarr;</span>
              <span className="font-semibold">{nextEvent.title}</span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </article>

      <div className="text-center">
        <Link
          href="/events"
          className="inline-flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span>&larr; Return to all events calendar</span>
        </Link>
      </div>
    </div>
  );
}
