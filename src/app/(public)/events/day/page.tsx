import { getDetroitDateString, getDetroitDayBounds } from "@/features/events/calendar";
import { EventDayView } from "@/features/events/components/event-day-view";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { listEvents } from "@/features/events/queries";

export const metadata = {
  title: "Events Calendar (Day View)",
  description: "Daily schedule view of Saugatuck Douglas Garden Club activities and programs.",
};

interface EventsDayPageProps {
  searchParams: Promise<{
    date?: string;
    query?: string;
    category?: string;
  }>;
}

export default async function EventsDayPage(props: EventsDayPageProps) {
  const searchParams = await props.searchParams;
  const todayDetroit = getDetroitDateString(new Date().toISOString());
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const date =
    searchParams.date && dateRegex.test(searchParams.date) ? searchParams.date : todayDetroit;

  const { startIso, endIso } = getDetroitDayBounds(date);

  const { events, error } = await listEvents({
    view: "day",
    date,
    from: startIso,
    to: endIso,
    query: searchParams.query,
    category: searchParams.category,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase mb-2">
            Daily Schedule
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Event Daily Schedule
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            View all club activities scheduled for a specific date in America/Detroit time.
          </p>
        </div>
      </div>

      <EventViewSelector currentView="day" />

      <EventDayView events={events} initialDate={date} error={error} />
    </div>
  );
}
