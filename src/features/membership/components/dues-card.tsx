"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { MembershipSummary, PaymentStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  initiateDuesPaymentAction,
  reconcileDuesPaymentSessionAction,
  cancelPendingDuesPaymentAction,
} from "@/features/payments/actions";

import type { PaymentRecord } from "@/features/payments/types";

interface DuesCardProps {
  membership: MembershipSummary;
  isLoggedIn?: boolean;
  paymentHistory?: PaymentRecord[];
}

export function DuesCard({ membership, isLoggedIn, paymentHistory }: DuesCardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id");
  const paymentStatusParam = searchParams.get("payment_status");
  const isSuccessParam = searchParams.get("success") === "true";

  const [selectedMethod, setSelectedMethod] = React.useState<"credit_card" | "check">(
    "credit_card",
  );
  const [paymentActionMessage, setPaymentActionMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isReconciling, setIsReconciling] = React.useState(false);
  const [currentPaymentStatus, setCurrentPaymentStatus] = React.useState<PaymentStatus>(
    membership.paymentStatus,
  );
  const [confirmedPaymentId, setConfirmedPaymentId] = React.useState<string | null>(
    paymentHistory?.find((p) => p.status === "confirmed")?.id || null,
  );

  const isConfirmed = currentPaymentStatus === "confirmed";
  const isPending = currentPaymentStatus === "pending";

  // Synchronous session reconciliation on Stripe redirect return
  React.useEffect(() => {
    if (sessionId && (paymentStatusParam === "success" || isSuccessParam || !paymentStatusParam)) {
      let isMounted = true;
      setIsReconciling(true);
      setPaymentActionMessage("Connecting to Stripe to verify your transaction...");

      reconcileDuesPaymentSessionAction(sessionId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success) {
            setCurrentPaymentStatus("confirmed");
            setConfirmedPaymentId(res.data.paymentId);
            setPaymentActionMessage(
              "Payment verified and confirmed! Your official 501(c)(3) dues receipt is ready below. Per club bylaws, membership approval remains pending staff review.",
            );
            window.history.replaceState({}, "", window.location.pathname);
            router.refresh();
          } else {
            setErrorMessage(res.error || "Failed to verify transaction with Stripe.");
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to verify transaction with Stripe.",
          );
        })
        .finally(() => {
          if (isMounted) setIsReconciling(false);
        });

      return () => {
        isMounted = false;
      };
    }

    if (paymentStatusParam === "cancelled") {
      setPaymentActionMessage(
        "Stripe checkout was cancelled. No charges were made to your account. You may choose a payment method and try again.",
      );
      // Automatically cancel the pending payment intent in database to release lock immediately
      cancelPendingDuesPaymentAction().then(() => {
        setCurrentPaymentStatus("unpaid");
        router.refresh();
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [sessionId, paymentStatusParam, isSuccessParam, router]);

  const handlePay = async () => {
    setErrorMessage(null);

    // If anonymous/unauthenticated, prompt to sign in or register
    if (!isLoggedIn && !membership.userId) {
      setPaymentActionMessage(
        "Please sign in to your member account or register as a new member to submit your annual dues.",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const res = await initiateDuesPaymentAction({
        method: selectedMethod,
        termYear: membership.year,
        returnPath: window.location.pathname,
      });

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      setPaymentActionMessage(res.data.message);
      setCurrentPaymentStatus(res.data.status);
      if (res.data.status === "confirmed") {
        setConfirmedPaymentId(res.data.paymentId);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred while processing dues payment.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPending = async () => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const res = await cancelPendingDuesPaymentAction();
      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }
      setCurrentPaymentStatus("unpaid");
      setPaymentActionMessage(res.data.message);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to cancel pending payment intent.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshStatus = () => {
    setIsReconciling(true);
    router.refresh();
    setTimeout(() => {
      setIsReconciling(false);
    }, 1000);
  };

  const formattedDues = `$${(membership.duesCents / 100).toFixed(2)}`;
  const effectiveReceiptId =
    confirmedPaymentId || paymentHistory?.find((p) => p.status === "confirmed")?.id;

  return (
    <div className="space-y-6">
      {/* Current Status Overview Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Membership Term
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Calendar Year {membership.year}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Term duration: January 1, {membership.year} – December 31, {membership.year}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {membership.isActive ? (
              <Badge variant="success">Active Member</Badge>
            ) : membership.isApproved ? (
              <Badge variant="default">Approved</Badge>
            ) : isConfirmed ? (
              <Badge variant="warning">Payment Confirmed &bull; Pending Staff Approval</Badge>
            ) : isPending ? (
              membership.paymentMethod === "check" ? (
                <Badge variant="warning">Check Awaiting Clearance</Badge>
              ) : (
                <Badge variant="warning">Checkout In Progress</Badge>
              )
            ) : (
              <Badge variant="outline">Payment Due</Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
            <span className="text-xs text-muted-foreground block">Annual Dues Rate</span>
            <span className="text-lg font-bold text-foreground">
              {formattedDues} {membership.currency}
            </span>
          </div>

          <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
            <span className="text-xs text-muted-foreground block">Payment Status</span>
            <span className="text-lg font-bold capitalize text-foreground">
              {currentPaymentStatus === "unpaid"
                ? "No payment submitted"
                : isPending && membership.paymentMethod === "check"
                  ? "Check Awaiting Clearance"
                  : isPending
                    ? "Checkout In Progress"
                    : currentPaymentStatus}
            </span>
          </div>

          <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
            <span className="text-xs text-muted-foreground block">Approval Decision</span>
            <span className="text-lg font-bold text-foreground">
              {membership.isApproved
                ? "Approved by Staff"
                : currentPaymentStatus === "unpaid"
                  ? "Awaiting Payment"
                  : "Awaiting Verification"}
            </span>
          </div>
        </div>

        {effectiveReceiptId && (
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">
              Official tax-deductible invoice and receipt available for your records.
            </span>
            <a
              href={`/api/payments/receipt/${effectiveReceiptId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
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
              Download Official Dues Receipt (PDF)
            </a>
          </div>
        )}
      </div>

      {paymentActionMessage && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground space-y-2"
          role="status"
        >
          <p className="font-semibold text-primary">Transaction Notice</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{paymentActionMessage}</p>
          {!isLoggedIn && !membership.userId && (
            <div className="flex gap-3 pt-2">
              <Link
                href="/login?returnTo=/membership"
                className="text-xs font-semibold text-primary underline hover:text-primary/80"
              >
                Sign In &rarr;
              </Link>
              <Link
                href="/join"
                className="text-xs font-semibold text-primary underline hover:text-primary/80"
              >
                Register as Member &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive space-y-1"
          role="alert"
        >
          <p className="font-semibold">Unable to Process Payment</p>
          <p className="text-xs leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Payment Selection and Dues Payment */}
      {isConfirmed ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
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
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {membership.year} Annual Dues Paid &amp; Confirmed
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your annual dues payment of {formattedDues} {membership.currency} has been received
                and confirmed. Pursuant to SDGC bylaws, all memberships remain pending manual review
                and approval by club officers. Duplicate dues payments for the same calendar term
                are strictly blocked.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 cursor-default"
            >
              {membership.year} Dues Paid &amp; Confirmed
            </button>

            {effectiveReceiptId && (
              <a
                href={`/api/payments/receipt/${effectiveReceiptId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
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
                Download Official 501(c)(3) Dues Receipt (PDF)
              </a>
            )}
          </div>
        </div>
      ) : isPending ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <svg
                aria-hidden="true"
                className={`w-5 h-5 ${isReconciling ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {membership.paymentMethod === "check"
                  ? "Check Received &bull; Awaiting Clearance"
                  : "Card Checkout In Progress"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {membership.paymentMethod === "check"
                  ? `An annual dues payment of ${formattedDues} by check is awaiting treasurer verification and bank clearance.`
                  : `An annual dues card transaction of ${formattedDues} was initiated. If you completed payment in Stripe, click "Check / Refresh Status". If you did not finish or want to use another method, click "Cancel Pending Intent & Retry".`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={isProcessing || isReconciling}
              onClick={handleRefreshStatus}
              className="rounded-xl text-xs"
            >
              {isReconciling ? "Verifying with Stripe..." : "Check / Refresh Status"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isProcessing || isReconciling}
              onClick={handleCancelPending}
              className="rounded-xl text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Cancel Pending Intent &amp; Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-foreground">Dues Payment Options</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Choose your preferred payment method. Saugatuck Douglas Garden Club does NOT support
              automatic recurring renewals. Dues must be renewed annually.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedMethod("credit_card")}
              className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                selectedMethod === "credit_card"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                  : "border-border/60 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">
                  Stripe Online Checkout (Cards &bull; Apple Pay &bull; Google Pay)
                </span>
                <span className="text-xs font-bold text-primary">{formattedDues}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Secure electronic payment via Stripe. Requires subsequent manual staff review for
                membership activation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("check")}
              className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                selectedMethod === "check"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                  : "border-border/60 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">Mail-In Paper Check</span>
                <span className="text-xs font-bold text-primary">{formattedDues}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Payable to SDGC, P.O. Box 1011, Douglas, MI 49406. Membership activation requires
                check clearance AND manual staff approval.
              </p>
            </button>
          </div>

          {selectedMethod === "check" ? (
            <div className="rounded-xl bg-muted/50 p-4 border border-border/60 text-xs text-foreground space-y-2">
              <p className="font-semibold text-sm">Mailing Instructions for Check Payment:</p>
              <p>
                1. Make check payable to:{" "}
                <span className="font-bold">Saugatuck Douglas Garden Club (SDGC)</span>
              </p>
              <p>
                2. Amount:{" "}
                <span className="font-bold">
                  {formattedDues} {membership.currency}
                </span>
              </p>
              <p>3. Memo line: Write your username or full name</p>
              <p>
                4. Mail to:{" "}
                <span className="font-bold">SDGC, P.O. Box 1011, Douglas, MI 49406</span>
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground border-t border-border/60 pt-2 italic">
                Important: Per club bylaws, membership activation requires both financial clearance
                of your check and manual administrative approval.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/30 p-4 border border-border/60 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">PCI DSS Level 1 Hosted Checkout:</p>
              <p>
                Card payments are processed securely through Stripe Checkout. Card numbers and
                sensitive payment credentials are never stored or transmitted through SDGC servers.
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={handlePay}
            disabled={isProcessing || isConfirmed || isPending || isReconciling}
            size="lg"
            className="w-full sm:w-auto rounded-xl shadow-2xs"
          >
            {isProcessing || isReconciling
              ? "Processing..."
              : isConfirmed
                ? `${membership.year} Dues Paid & Confirmed`
                : isPending
                  ? "Payment In Progress (Cannot Pay Again)"
                  : selectedMethod === "credit_card"
                    ? `Pay ${formattedDues} Dues Online`
                    : "Confirm Check Mailing Plan"}
          </Button>
        </div>
      )}

      {/* Owner Payment History */}
      {paymentHistory && paymentHistory.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-foreground">Payment History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal transaction record for your SDGC membership dues.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs text-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "America/Detroit",
                      })}
                    </td>
                    <td className="p-3 text-xs text-foreground capitalize">
                      {p.paymentMethod === "check" ? "Paper Check" : "Online Card"}
                    </td>
                    <td className="p-3 text-xs font-semibold text-foreground">
                      ${(p.amountCents / 100).toFixed(2)} {p.currency}
                    </td>
                    <td className="p-3">
                      {p.status === "confirmed" ? (
                        <Badge variant="success">Confirmed</Badge>
                      ) : p.status === "failed" ? (
                        <Badge variant="destructive">Failed / Cancelled</Badge>
                      ) : p.status === "refunded" ? (
                        <Badge variant="outline">Refunded</Badge>
                      ) : p.paymentMethod === "check" ? (
                        <Badge variant="warning">Awaiting Clearance</Badge>
                      ) : (
                        <Badge variant="warning">Checkout In Progress</Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs text-right font-mono">
                      {p.status === "confirmed" ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-muted-foreground">
                            {p.notes || p.providerTransactionId || "—"}
                          </span>
                          <a
                            href={`/api/payments/receipt/${p.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans font-semibold text-primary hover:underline inline-flex items-center gap-1"
                            title="Download Official PDF Receipt"
                          >
                            PDF &darr;
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {p.notes || p.providerTransactionId || "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
