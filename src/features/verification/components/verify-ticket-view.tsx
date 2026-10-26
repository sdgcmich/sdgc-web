"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { TicketVerificationResult } from "../types";
import { gateCheckInTicketAction } from "../actions";

interface VerifyTicketViewProps {
  initialResult: TicketVerificationResult;
}

export function VerifyTicketView({ initialResult }: VerifyTicketViewProps) {
  const [result, setResult] = useState<TicketVerificationResult>(initialResult);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleCheckIn = async (undo = false) => {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await gateCheckInTicketAction(result.orderReference, undo);
      if (res.success && res.data) {
        setResult(res.data);
        setActionMessage(
          undo
            ? "Check-in reverted. Pass is reset to confirmed."
            : "✓ Attendee successfully admitted & pass checked in!",
        );
      } else {
        setActionMessage(res.error || "Gate operation failed.");
      }
    } catch {
      setActionMessage("An unexpected error occurred during check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyCheckedIn = result.status === "checked_in";
  const isValid = result.status === "valid";
  const isCancelled = result.status === "cancelled" || result.status === "refunded";
  const isNotFound = result.status === "not_found";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Gatekeeper App Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Event Gate Verification
          </span>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Ticket Credential Status
          </h1>
        </div>
        <Link
          href={"/verify/ticket" as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Scan Next
        </Link>
      </div>

      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs font-semibold text-foreground text-center animate-in fade-in"
        >
          {actionMessage}
        </div>
      )}

      {/* Main Status Badge */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-center border-2 shadow-sm space-y-3 transition-colors ${
          isValid
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 text-emerald-950 dark:text-emerald-100"
            : isAlreadyCheckedIn
              ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 text-amber-950 dark:text-amber-100"
              : isCancelled
                ? "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-rose-500/5 text-rose-950 dark:text-rose-100"
                : "border-border bg-card text-foreground"
        }`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-xs border border-border">
          {isValid ? (
            <svg
              aria-hidden="true"
              className="h-9 w-9 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : isAlreadyCheckedIn ? (
            <svg
              aria-hidden="true"
              className="h-9 w-9 text-amber-600 dark:text-amber-400"
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
          ) : (
            <svg
              aria-hidden="true"
              className="h-9 w-9 text-rose-600 dark:text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isValid
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : isAlreadyCheckedIn
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                  : "bg-rose-500/20 text-rose-800 dark:text-rose-300"
            }`}
          >
            {isValid
              ? "✓ Valid Pass • Ready for Admission"
              : isAlreadyCheckedIn
                ? "Already Checked In / Admitted"
                : isCancelled
                  ? "Void / Cancelled Pass"
                  : "Pass Not Found"}
          </span>
          <h2 className="mt-2 font-serif text-3xl font-extrabold text-foreground">
            {result.purchaserName || "Unknown Attendee"}
          </h2>
          <p className="mt-1 font-mono text-sm font-semibold text-muted-foreground tracking-wider">
            {result.orderReference}
          </p>
        </div>

        {isAlreadyCheckedIn && result.checkedInAt && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Admitted: </span>
            {new Date(result.checkedInAt).toLocaleString("en-US", {
              timeZone: "America/Detroit",
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {result.checkedInByName && (
              <span className="block mt-0.5">by Gate Staff: {result.checkedInByName}</span>
            )}
          </div>
        )}
      </div>

      {/* Ticket Details Card */}
      {!isNotFound && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Event Details
            </span>
            <h3 className="font-serif text-xl font-bold text-foreground">{result.eventTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {result.eventDate} • {result.eventTime}
            </p>
            <p className="text-xs text-muted-foreground font-medium">📍 {result.eventLocation}</p>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 text-sm space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Total Guests to Admit</span>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-mono text-base font-bold text-primary">
                {result.ticketQuantity ?? 1} guest{(result.ticketQuantity ?? 1) > 1 ? "s" : ""}
              </span>
            </div>

            {((result.studentQuantity ?? 0) > 0 || (result.childQuantity ?? 0) > 0) && (
              <div className="text-xs text-muted-foreground border-t border-border/60 pt-2 flex flex-wrap gap-2">
                <span className="font-medium text-foreground">Pass Breakdown:</span>
                <span>
                  {Math.max(
                    0,
                    (result.ticketQuantity ?? 1) -
                      (result.studentQuantity ?? 0) -
                      (result.childQuantity ?? 0),
                  )}{" "}
                  General Admission
                </span>
                {(result.studentQuantity ?? 0) > 0 && (
                  <span>• {result.studentQuantity} Student</span>
                )}
                {(result.childQuantity ?? 0) > 0 && <span>• {result.childQuantity} Child</span>}
              </div>
            )}

            <div className="flex justify-between text-xs text-muted-foreground border-t border-border/60 pt-2">
              <span>Contact Email</span>
              <span className="font-medium text-foreground">{result.purchaserEmail}</span>
            </div>
            {result.purchaserPhone && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Contact Phone</span>
                <span className="font-medium text-foreground">{result.purchaserPhone}</span>
              </div>
            )}
            {result.couponCode && (
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>Applied Coupon</span>
                <span className="font-mono font-bold">{result.couponCode}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            {isValid ? (
              <button
                type="button"
                onClick={() => handleCheckIn(false)}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-center text-base font-bold text-white shadow-md hover:bg-emerald-500 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {isSubmitting
                  ? "Admitting Attendee..."
                  : `Admit & Check In (${result.ticketQuantity ?? 1} Guest${(result.ticketQuantity ?? 1) > 1 ? "s" : ""})`}
              </button>
            ) : isAlreadyCheckedIn ? (
              <div className="space-y-2">
                <div className="w-full rounded-2xl bg-amber-500/15 border border-amber-500/30 py-3 px-4 text-center text-xs font-semibold text-amber-800 dark:text-amber-300">
                  This pass was already scanned & admitted at the gate.
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckIn(true)}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 text-center text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Undo Check-In (Reset to Confirmed)"}
                </button>
              </div>
            ) : null}

            <Link
              href={"/verify/ticket" as Route}
              className="block w-full rounded-2xl border border-border bg-card px-4 py-3 text-center text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
            >
              Scan Another Ticket or Member ID
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
