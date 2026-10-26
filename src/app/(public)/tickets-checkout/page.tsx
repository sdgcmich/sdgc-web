import { Suspense } from "react";
import type { Metadata } from "next";
import { getTicketEvents } from "@/features/tickets/actions";
import { TicketsCheckout } from "@/features/tickets/components/tickets-checkout";

export const metadata: Metadata = {
  title: "Event Tickets & Advance Admissions | Saugatuck Douglas Garden Club",
  description:
    "Order advance tickets for Saugatuck Douglas Garden Club community events and our annual Garden Walk fundraiser.",
};

export default async function TicketsCheckoutPage() {
  const events = await getTicketEvents();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-muted-foreground">Loading checkout...</div>
        }
      >
        <TicketsCheckout events={events} />
      </Suspense>
    </div>
  );
}
