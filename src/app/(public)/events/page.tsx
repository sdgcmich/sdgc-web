import { listEvents } from "@/features/events/queries";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { EventListView } from "@/features/events/components/event-list-view";
import { serializeJsonLd } from "@/lib/jsonld";

export const metadata = {
  title: "Events Calendar (List View)",
  description:
    "Upcoming gardening workshops, monthly membership meetings, civic planting days, and Garden Walk events in Saugatuck and Douglas, MI.",
};

interface EventsListPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
  }>;
}

export default async function EventsListPage(props: EventsListPageProps) {
  const searchParams = await props.searchParams;
  const { events, error } = await listEvents({
    view: "list",
    query: searchParams.query,
    category: searchParams.category,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const eventsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((e, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: e.title,
        description: e.description,
        startDate: e.startsAt,
        endDate: e.endsAt,
        url: `${siteUrl}/event/${encodeURIComponent(e.slug)}`,
        location: {
          "@type": "Place",
          name: e.venueName,
        },
      },
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safely serialized
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventsJsonLd) }}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/60 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            What&apos;s Blooming
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
            Events Calendar
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Join us for community workshops, educational lectures, civic planting workbees, and our
            premier Garden Walk fundraiser.
          </p>
        </div>

        <a
          href="/events/feed.ics"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-colors shrink-0 shadow-2xs"
          title="Subscribe to iCalendar feed in Apple Calendar, Google Calendar, or Outlook"
        >
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
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <span>Subscribe Calendar (.ics)</span>
        </a>
      </div>

      <EventViewSelector currentView="list" />

      <EventListView
        events={events}
        error={error}
        initialQuery={searchParams.query}
        initialCategory={searchParams.category}
      />
    </div>
  );
}
