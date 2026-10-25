import { getDetroitMonthBounds } from "@/features/events/calendar";
import { getMembershipYear } from "@/features/membership/rules";
import { EventMonthView } from "@/features/events/components/event-month-view";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { listEvents } from "@/features/events/queries";

export const metadata = {
  title: "Events Calendar (Month View)",
  description:
    "Monthly calendar view of Saugatuck Douglas Garden Club workshops, civic plantings, and tour dates.",
};

interface EventsMonthPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    query?: string;
    category?: string;
  }>;
}

export default async function EventsMonthPage(props: EventsMonthPageProps) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const defaultYear = getMembershipYear(now, "America/Detroit");
  const defaultMonth = Number.parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", month: "numeric" }).format(now),
    10,
  );

  const parsedYear = searchParams.year ? Number.parseInt(searchParams.year, 10) : defaultYear;
  const year =
    Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : defaultYear;

  const parsedMonth = searchParams.month ? Number.parseInt(searchParams.month, 10) : defaultMonth;
  const month =
    Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : defaultMonth;

  const { startIso, endIso } = getDetroitMonthBounds(year, month);

  const { events, error } = await listEvents({
    view: "month",
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
            Monthly View
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Events Month Calendar
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Browse club events across the calendar year. Click any event to view schedule details.
          </p>
        </div>
      </div>

      <EventViewSelector currentView="month" />

      <EventMonthView events={events} initialYear={year} initialMonth={month} error={error} />
    </div>
  );
}
