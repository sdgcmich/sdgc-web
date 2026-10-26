"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import type { TicketEvent, TicketOrder } from "../types";
import {
  processTicketOrderAction,
  getTicketOrderByReferenceAction,
  reconcileTicketCheckoutSessionAction,
} from "../actions";

interface TicketsCheckoutProps {
  events: TicketEvent[];
}

export function TicketsCheckout({ events }: TicketsCheckoutProps) {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get("order_ref");
  const sessionId = searchParams.get("session_id");
  const paymentStatus = searchParams.get("payment_status");
  const isSuccess = searchParams.get("success") === "true" || paymentStatus === "success";

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "gw-2026");
  const [quantity, setQuantity] = useState<number>(2);
  const [purchaserName, setPurchaserName] = useState<string>("");
  const [purchaserEmail, setPurchaserEmail] = useState<string>("");
  const [purchaserPhone, setPurchaserPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<TicketOrder | null>(null);

  useEffect(() => {
    if (!confirmedOrder) {
      if (sessionId && isSuccess) {
        setIsSubmitting(true);
        reconcileTicketCheckoutSessionAction(sessionId, orderRef || undefined)
          .then((res) => {
            setIsSubmitting(false);
            if (res.success && res.data) {
              setConfirmedOrder(res.data);
              window.history.replaceState({}, "", "/tickets-checkout");
            } else if (orderRef) {
              getTicketOrderByReferenceAction(orderRef).then((orderRes) => {
                if (orderRes.success && orderRes.data) {
                  setConfirmedOrder(orderRes.data);
                }
              });
            }
          })
          .catch(() => {
            setIsSubmitting(false);
            if (orderRef) {
              getTicketOrderByReferenceAction(orderRef).then((orderRes) => {
                if (orderRes.success && orderRes.data) {
                  setConfirmedOrder(orderRes.data);
                }
              });
            }
          });
      } else if (orderRef && isSuccess) {
        setIsSubmitting(true);
        getTicketOrderByReferenceAction(orderRef).then((res) => {
          setIsSubmitting(false);
          if (res.success && res.data) {
            setConfirmedOrder(res.data);
          }
        });
      }
    }
  }, [sessionId, orderRef, isSuccess, confirmedOrder]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const unitPrice = selectedEvent ? selectedEvent.advancePriceCents / 100 : 20;
  const dayOfPrice = selectedEvent ? selectedEvent.dayOfPriceCents / 100 : 25;
  const totalPrice = unitPrice * quantity;
  const totalSavings = (dayOfPrice - unitPrice) * quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!purchaserName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!purchaserEmail.trim() || !purchaserEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address to receive your ticket pass.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await processTicketOrderAction({
        eventId: selectedEventId,
        quantity,
        purchaserName: purchaserName.trim(),
        purchaserEmail: purchaserEmail.trim(),
        purchaserPhone: purchaserPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to process ticket order.");
      } else if (res.data) {
        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
          return;
        }
        setConfirmedOrder(res.data);
      }
    } catch {
      setErrorMessage("An unexpected error occurred while placing your ticket order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-6">
        {/* Success Header */}
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8 text-center space-y-3 shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              confirmedOrder.status === "confirmed"
                ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-500/15 border border-amber-500/25 text-amber-800 dark:text-amber-300"
            }`}
          >
            {confirmedOrder.status === "confirmed"
              ? "Verified Order Confirmed • Stripe Checkout"
              : "Preview Mode • Simulated Order Confirmed"}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Advance Tour Reservation Confirmed!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Thank you for supporting the Saugatuck Douglas Garden Club. Your official event pass is
            ready below.
          </p>
        </div>

        {/* Official Ticket Pass Card */}
        <div
          id="ticket-receipt"
          className="rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden"
        >
          {/* Decorative Corner Notch */}
          <div className="absolute top-0 right-0 bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
            Advance Pass
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4 gap-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Order Reference Code
              </span>
              <p
                id="order-reference-code"
                className="font-mono text-2xl font-bold text-primary tracking-wider"
              >
                {confirmedOrder.orderReference}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Issued Date
              </span>
              <p className="text-sm font-medium text-foreground">
                {new Date(confirmedOrder.createdAt).toLocaleDateString("en-US", {
                  timeZone: "America/Detroit",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Featured Event
              </span>
              <h3 className="font-serif text-2xl font-bold text-foreground">
                {confirmedOrder.eventTitle}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-2xl border border-border/60">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Tour Date:</span>
                <span className="font-semibold text-foreground">{confirmedOrder.eventDate}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Tour Hours:</span>
                <span className="font-semibold text-foreground">{confirmedOrder.eventTime}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground block font-medium">
                  Check-In Location:
                </span>
                <span className="font-semibold text-foreground">
                  {confirmedOrder.eventLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Admissions Table */}
          <div className="rounded-2xl bg-muted/40 p-4 space-y-2.5 border border-border/60 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admissions Quantity</span>
              <span className="font-semibold text-foreground">
                {confirmedOrder.ticketQuantity} admission
                {confirmedOrder.ticketQuantity > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Unit Price</span>
              <span className="text-foreground">
                ${(confirmedOrder.unitPriceCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-2.5 text-base font-bold">
              <span className="text-foreground">Total Paid (Simulated)</span>
              <span className="text-primary text-lg">
                ${(confirmedOrder.totalCents / 100).toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-sm border-t border-border/80 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pass Holder Information
            </h4>
            <p className="font-medium text-foreground">
              {confirmedOrder.purchaserName} • {confirmedOrder.purchaserEmail}
              {confirmedOrder.purchaserPhone && ` • ${confirmedOrder.purchaserPhone}`}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">Tour Check-In Instructions:</p>
            <p className="leading-relaxed">{confirmedOrder.checkInInstructions}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`/api/tickets/${confirmedOrder.orderReference}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Ticket Pass (PDF)
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl border border-border bg-card px-5 py-3.5 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Print Pass
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setQuantity(2);
              }}
              className="rounded-2xl border border-border bg-card px-5 py-3.5 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          No Advance Ticket Sales Currently Open
        </h2>
        <p className="text-sm text-muted-foreground">
          There are currently no published events with online advance ticket checkout available.
          Please check back closer to our scheduled tour dates or view our upcoming schedule on the
          events calendar.
        </p>
        <div className="pt-4">
          <Link
            href={"/events" as Route}
            className="inline-flex items-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Events Calendar &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Simulation Ribbon Banner */}
      <div
        className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
        role="alert"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-semibold">Local Simulation Preview</span>
          <span className="text-muted-foreground hidden sm:inline">&bull;</span>
          <span className="text-muted-foreground">
            No real financial transactions will be processed.
          </span>
        </div>
        <span className="text-[11px] font-mono uppercase bg-amber-500/20 px-2 py-0.5 rounded text-amber-900 dark:text-amber-300 self-start sm:self-auto">
          Demo Sandbox
        </span>
      </div>

      {/* Hero Header */}
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
          Official Advance Tour Passes
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          Event Ticket Checkout
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Secure advance admissions for the Annual Garden Walk and club community events. Enjoy
          advance savings and directly support Saugatuck-Douglas civic plantings and scholarships.
        </p>
      </div>

      {/* Membership Distinction Card */}
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs text-foreground flex items-start gap-3">
        <svg
          className="h-5 w-5 text-primary shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">Club Membership vs. Tour Passes</p>
          <p className="text-muted-foreground leading-relaxed">
            Event tickets provide admission to public tours. To join as an active club member or
            cover annual dues ($50/year), please complete our{" "}
            <Link
              href={"/join" as Route}
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Membership Application
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Left, Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {errorMessage && (
            <div
              className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive font-medium"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {/* Event Selection */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <label htmlFor="event-select" className="text-sm font-bold text-foreground block">
              1. Select Ticketed Event
            </label>
            <div className="relative">
              <select
                id="event-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.date}) — ${(evt.advancePriceCents / 100).toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
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
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>

            {selectedEvent && (
              <div className="rounded-2xl bg-muted/30 p-3.5 border border-border/50 text-xs space-y-1">
                <p className="font-semibold text-foreground">{selectedEvent.title}</p>
                <p className="text-muted-foreground">{selectedEvent.location}</p>
              </div>
            )}
          </div>

          {/* Ticket Quantity Stepper */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <span className="block text-sm font-bold text-foreground">2. Number of Admissions</span>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-2xl border border-border bg-muted/20 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground hover:bg-muted font-bold text-lg shadow-2xs transition-colors cursor-pointer"
                  aria-label="Decrease tickets"
                >
                  &minus;
                </button>
                <span className="font-mono text-xl font-bold text-foreground w-12 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground hover:bg-muted font-bold text-lg shadow-2xs transition-colors cursor-pointer"
                  aria-label="Increase tickets"
                >
                  &#43;
                </button>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 4, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuantity(count)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      quantity === count
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <span className="text-muted-foreground">
                ${unitPrice.toFixed(2)} each in advance &bull; ${dayOfPrice.toFixed(2)} day of tour
              </span>
              {totalSavings > 0 && (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  You save ${totalSavings.toFixed(2)} in advance!
                </span>
              )}
            </div>
          </div>

          {/* Purchaser Contact Information */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground">3. Purchaser Contact Details</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="purchaser-name"
                  className="text-xs font-semibold text-foreground block mb-1.5"
                >
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="purchaser-name"
                  type="text"
                  required
                  value={purchaserName}
                  onChange={(e) => setPurchaserName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="purchaser-email"
                  className="text-xs font-semibold text-foreground block mb-1.5"
                >
                  Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  id="purchaser-email"
                  type="email"
                  required
                  value={purchaserEmail}
                  onChange={(e) => setPurchaserEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Your ticket pass and check-in instructions will be delivered to this address.
                </span>
              </div>

              <div>
                <label
                  htmlFor="purchaser-phone"
                  className="text-xs font-semibold text-foreground block mb-1.5"
                >
                  Phone Number <span className="text-muted-foreground text-[11px]">(Optional)</span>
                </label>
                <input
                  id="purchaser-phone"
                  type="tel"
                  value={purchaserPhone}
                  onChange={(e) => setPurchaserPhone(e.target.value)}
                  placeholder="(269) 555-0199"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="purchaser-notes"
                  className="text-xs font-semibold text-foreground block mb-1.5"
                >
                  Tour Accommodations / Special Notes{" "}
                  <span className="text-muted-foreground text-[11px]">(Optional)</span>
                </label>
                <textarea
                  id="purchaser-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Accessibility needs, special check-in notes, or comments..."
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !purchaserName.trim() || !purchaserEmail.trim()}
            className="w-full rounded-2xl bg-primary px-8 py-4 text-center font-serif text-lg font-bold text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  aria-hidden="true"
                  className="animate-spin h-5 w-5 text-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Processing Ticket Order...
              </span>
            ) : (
              `Confirm Advance Tour Order ($${totalPrice.toFixed(2)})`
            )}
          </button>
        </form>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-border/80 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Order Breakdown
              </span>
              <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
                Tour Order Summary
              </h2>
            </div>

            {selectedEvent && (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-foreground text-sm">{selectedEvent.title}</p>
                <div className="text-muted-foreground space-y-1">
                  <p>
                    {selectedEvent.date} • {selectedEvent.time}
                  </p>
                  <p>{selectedEvent.location}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm border-t border-border/80 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-semibold text-foreground">
                  {quantity} admission{quantity > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Advance Price</span>
                <span className="text-foreground">${unitPrice.toFixed(2)} each</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Processing Fees</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  FREE (Covered by Club)
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-border/80 pt-3 text-lg font-bold">
                <span className="font-serif text-foreground">Total Due</span>
                <span className="font-serif text-2xl text-primary font-bold">
                  ${totalPrice.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Civic Commitment Card */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
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
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
                <span>100% Civic Beautification Fund</span>
              </div>
              <p className="leading-relaxed">
                All ticket proceeds directly fund Saugatuck Douglas Garden Club civic plantings,
                public urns, landscape maintenance, and local student horticulture scholarships.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
