import type { Metadata } from "next";
import { GateScanner } from "@/features/verification/components/gate-scanner";

export const metadata: Metadata = {
  title: "Ticket Gate Scanner | Saugatuck Douglas Garden Club",
  description:
    "Scan attendee QR codes from mobile or enter order reference for instant event admission.",
};

export default function TicketScannerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <GateScanner mode="ticket" />
    </div>
  );
}
