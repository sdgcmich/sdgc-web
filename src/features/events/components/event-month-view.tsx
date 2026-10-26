"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEventTime, getMonthMatrix } from "../calendar";
import { getMembershipYear } from "@/features/membership/rules";
import type { EventSummary } from "../types";

interface EventMonthViewProps {
  events: EventSummary[];
  initialYear?: number;
  initialMonth?: number;
  error?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventMonthView({ events, initialYear, initialMonth, error }: EventMonthViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nowInDetroit = React.useMemo(() => new Date(), []);
  const currentDetroitYear = React.useMemo(
    () => getMembershipYear(nowInDetroit, "America/Detroit"),
    [nowInDetroit],
  );
  const currentDetroitMonth = React.useMemo(
    () =>
      Number.parseInt(
        new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", month: "numeric" }).format(
          nowInDetroit,
        ),
        10,
      ),
    [nowInDetroit],
  );

  const effectiveInitialYear = initialYear ?? currentDetroitYear;
  const effectiveInitialMonth = initialMonth ?? currentDetroitMonth;

  const [year, setYear] = React.useState(effectiveInitialYear);
  const [month, setMonth] = React.useState(effectiveInitialMonth);

  // Keep state in sync if props change
  React.useEffect(() => {
    if (initialYear && initialYear !== year) setYear(initialYear);
    if (initialMonth && initialMonth !== month) setMonth(initialMonth);
  }, [initialYear, initialMonth, year, month]);

  const updateYearMonth = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("year", String(newYear));
    params.set("month", String(newMonth));
    router.replace(`/events/month?${params.toString()}`, { scroll: false });
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      updateYearMonth(year - 1, 12);
    } else {
      updateYearMonth(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      updateYearMonth(year + 1, 1);
    } else {
      updateYearMonth(year, month + 1);
    }
  };

  const handleResetToday = () => {
    updateYearMonth(currentDetroitYear, currentDetroitMonth);
  };

  const matrix = React.useMemo(() => {
    return getMonthMatrix(year, month, events);
  }, [year, month, events]);

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-md border border-border bg-card p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Previous month"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleResetToday}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
          >
            Current Month
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-md border border-border bg-card p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Next month"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive"
          role="alert"
        >
          <p className="text-base font-semibold">Unable to load calendar events</p>
          <p className="text-xs mt-1 text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Responsive Calendar Grid */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="truncate px-1">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {matrix.flatMap((week) =>
            week.map((cell) => (
              <div
                key={cell.date}
                className={`min-h-[75px] sm:min-h-[110px] p-1 sm:p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth
                    ? "bg-card text-foreground"
                    : "bg-muted/30 text-muted-foreground/60"
                } ${cell.isToday ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center ${
                      cell.isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.events.length > 0 && (
                    <>
                      <span className="hidden sm:inline-block text-[10px] font-bold text-primary">
                        {cell.events.length} event{cell.events.length > 1 ? "s" : ""}
                      </span>
                      <span
                        className="sm:hidden h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                        title={`${cell.events.length} event(s)`}
                      />
                    </>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {cell.events.map((e) => (
                    <Link
                      key={e.id}
                      href={`/event/${e.slug}`}
                      className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] sm:text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                      title={`${e.title} (${formatEventTime(e.startsAt)})`}
                    >
                      <span className="hidden sm:inline font-semibold">
                        {formatEventTime(e.startsAt)}{" "}
                      </span>
                      <span className="truncate">{e.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
