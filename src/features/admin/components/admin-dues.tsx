"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { formatDetroitDateTimeLocal, parseDetroitDateTimeLocal } from "@/features/events/calendar";
import type { AdminDuesRecord, AdminTermRecord, FinancialLedgerSummary } from "../types";
import {
  createMembershipTermAction,
  reconcilePaymentAction,
  updateMembershipTermAction,
} from "../actions";

interface AdminDuesProps {
  initialRecords: AdminDuesRecord[];
  initialTerms?: AdminTermRecord[];
  initialSummary?: FinancialLedgerSummary;
  initialStatusFilter?: string;
}

function formatInclusiveTermDates(opensAt: string, closesAt: string): string {
  try {
    const start = new Date(opensAt);
    const end = new Date(closesAt);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      timeZone: "America/Detroit",
    };
    const startStr = start.toLocaleDateString("en-US", options);
    const endStr = end.toLocaleDateString("en-US", {
      ...options,
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  } catch {
    return `${opensAt.slice(0, 10)} to ${closesAt.slice(0, 10)}`;
  }
}

export function AdminDues({
  initialRecords,
  initialTerms = [],
  initialSummary,
  initialStatusFilter,
}: AdminDuesProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "dues" | "terms">("overview");
  const [records, setRecords] = React.useState<AdminDuesRecord[]>(initialRecords);
  const [terms, setTerms] = React.useState<AdminTermRecord[]>(initialTerms);
  const [summary, setSummary] = React.useState<FinancialLedgerSummary | undefined>(initialSummary);

  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter || "all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);
  const [reconcileNotes, setReconcileNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Pagination for Dues
  const [duesPage, setDuesPage] = React.useState(1);
  const [duesPageSize, setDuesPageSize] = React.useState(10);

  // Term editing & deadline extension modal state
  const [editingTerm, setEditingTerm] = React.useState<AdminTermRecord | null>(null);
  const [editAmountDollars, setEditAmountDollars] = React.useState<string>("");
  const [editOpensAt, setEditOpensAt] = React.useState<string>("");
  const [editClosesAt, setEditClosesAt] = React.useState<string>("");

  // New Term Modal State
  const [isCreatingTerm, setIsCreatingTerm] = React.useState(false);
  const [newTermYear, setNewTermYear] = React.useState<number>(new Date().getFullYear() + 1);
  const [newTermDollars, setNewTermDollars] = React.useState<string>("50.00");
  const [newTermOpensAt, setNewTermOpensAt] = React.useState<string>(
    `${new Date().getFullYear() + 1}-01-01T00:00`,
  );
  const [newTermClosesAt, setNewTermClosesAt] = React.useState<string>(
    `${new Date().getFullYear() + 1}-12-31T23:59`,
  );

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  React.useEffect(() => {
    setTerms(initialTerms);
  }, [initialTerms]);

  React.useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  const activeTerm =
    terms.length > 0 ? terms.find((t) => t.year === new Date().getFullYear()) || terms[0] : null;

  const handleOpenEditTerm = (term: AdminTermRecord) => {
    setEditingTerm(term);
    setEditAmountDollars((term.duesCents / 100).toFixed(2));
    setEditOpensAt(formatDetroitDateTimeLocal(term.opensAt));
    setEditClosesAt(formatDetroitDateTimeLocal(term.closesAt));
  };

  const handleExtendClosesAt = (days: number) => {
    if (!editClosesAt) return;
    try {
      const currentIso = parseDetroitDateTimeLocal(editClosesAt);
      const newTime = new Date(new Date(currentIso).getTime() + days * 86400000);
      setEditClosesAt(formatDetroitDateTimeLocal(newTime.toISOString()));
    } catch {
      // Fallback
    }
  };

  const handleSetYearEndDeadline = () => {
    if (!editingTerm) return;
    setEditClosesAt(`${editingTerm.year}-12-31T23:59`);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const duesCents = Math.round(parseFloat(editAmountDollars) * 100);
      const opensAtIso = parseDetroitDateTimeLocal(editOpensAt);
      const closesAtIso = parseDetroitDateTimeLocal(editClosesAt);

      const res = await updateMembershipTermAction({
        termId: editingTerm.id,
        duesCents,
        opensAt: opensAtIso,
        closesAt: closesAtIso,
      });

      if (res.success) {
        setTerms((prev) =>
          prev.map((t) =>
            t.id === editingTerm.id
              ? { ...t, duesCents, opensAt: opensAtIso, closesAt: closesAtIso }
              : t,
          ),
        );
        setNotice(`Term for year ${editingTerm.year} updated successfully.`);
        setEditingTerm(null);
      } else {
        setIsError(true);
        setNotice(`Could not update term: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsError(false);
    try {
      const duesCents = Math.round(parseFloat(newTermDollars) * 100);
      const opensAtIso = parseDetroitDateTimeLocal(newTermOpensAt);
      const closesAtIso = parseDetroitDateTimeLocal(newTermClosesAt);

      const res = await createMembershipTermAction({
        year: newTermYear,
        duesCents,
        opensAt: opensAtIso,
        closesAt: closesAtIso,
      });

      if (res.success) {
        const createdId = (res.data as { id?: string })?.id || `term-${newTermYear}`;
        setTerms((prev) => [
          {
            id: createdId,
            year: newTermYear,
            duesCents,
            currency: "USD",
            opensAt: opensAtIso,
            closesAt: closesAtIso,
          },
          ...prev,
        ]);
        setNotice(`New annual membership term for ${newTermYear} has been initialized.`);
        setIsCreatingTerm(false);
      } else {
        setIsError(true);
        setNotice(`Could not create new term: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async (id: string, member: string) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await reconcilePaymentAction({
        paymentId: id,
        notes: reconcileNotes.trim() || undefined,
      });

      if (res.success) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "confirmed",
                  reconciledAt: new Date().toISOString(),
                  notes: reconcileNotes || r.notes,
                }
              : r,
          ),
        );
        setNotice(`Check payment for ${member} has been reconciled and marked CONFIRMED.`);
        setReconcilingId(null);
        setReconcileNotes("");
      } else {
        setIsError(true);
        setNotice(`Could not reconcile payment: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return records.filter((r) => {
      if (statusFilter === "pending" && r.status !== "pending") return false;
      if (statusFilter === "confirmed" && r.status !== "confirmed") return false;
      if (statusFilter === "closed" && r.status !== "failed" && r.status !== "refunded")
        return false;

      if (q) {
        const matchName = r.memberName?.toLowerCase().includes(q);
        const matchUser = r.memberUsername?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        const matchMethod = r.paymentMethod?.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchNotes && !matchMethod) return false;
      }

      return true;
    });
  }, [records, statusFilter, searchQuery]);

  const paginatedDues = React.useMemo(() => {
    const start = (duesPage - 1) * duesPageSize;
    return filteredRecords.slice(start, start + duesPageSize);
  }, [filteredRecords, duesPage, duesPageSize]);

  // Derived Financial Calculations if summary is not loaded
  const calcGrossRevenue =
    summary?.totalGrossRevenueCents ??
    records.filter((r) => r.status === "confirmed").reduce((acc, r) => acc + r.amountCents, 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Dues Reconciliation & Financials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full club treasury books: track revenues across membership dues and Garden Walk
            admissions, reconcile paper checks, and configure membership terms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsCreatingTerm(true)}
            className="rounded-xl shadow-2xs"
          >
            + New Term Year
          </Button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-lg p-3 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
          role="status"
        >
          {notice}
        </div>
      )}

      {/* Active Term Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-foreground font-medium">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-semibold text-xs">
            Active Term
          </Badge>
          <span>Calendar Year 2026 • $50.00 USD</span>
        </div>
        <span className="text-muted-foreground text-[11px]">
          Annual rate applies to all membership renewals and approved applications
        </span>
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-2 sm:gap-6">
        {[
          { id: "overview", label: "Accounting Overview & Summary" },
          { id: "dues", label: `Dues Payment Journal (${records.length})` },
          { id: "terms", label: `Annual Terms (${terms.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ACCOUNTING OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Total Gross Revenue
              </span>
              <p className="text-3xl font-bold font-serif text-foreground">
                ${(calcGrossRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/40 space-y-0.5">
                <p>
                  • Member Dues:{" "}
                  <span className="font-semibold text-foreground">
                    ${((summary?.totalDuesRevenueCents ?? 0) / 100).toFixed(2)}
                  </span>{" "}
                  ({summary?.duesPaymentCount ?? 0} payments)
                </p>
                <p>
                  • Ticket Admissions:{" "}
                  <span className="font-semibold text-foreground">
                    ${((summary?.totalTicketRevenueCents ?? 0) / 100).toFixed(2)}
                  </span>{" "}
                  ({summary?.totalTicketsSold ?? 0} tickets)
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Membership Dues Revenue
              </span>
              <p className="text-3xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                $
                {((summary?.totalDuesRevenueCents ?? 0) / 100).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                <p>
                  • Payments recorded:{" "}
                  <span className="font-semibold text-foreground">
                    {summary?.duesPaymentCount ?? records.length}
                  </span>{" "}
                  transactions
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Annual membership fees for SDGC active members
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Garden Walk Admissions
              </span>
              <p className="text-3xl font-bold font-serif text-primary">
                $
                {((summary?.totalTicketRevenueCents ?? 0) / 100).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                <p>
                  • Admissions issued:{" "}
                  <span className="font-semibold text-foreground">
                    {summary?.totalTicketsSold ?? 0}
                  </span>{" "}
                  tickets
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Public tour admissions and digital garden passes
                </p>
              </div>
            </div>
          </div>

          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Check Reconciliation Status
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("pending");
                    setActiveTab("dues");
                  }}
                  className="text-xs"
                >
                  Review Pending &rarr;
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Awaiting Clearance (Mail-in Checks)
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Offline check payments submitted by members pending treasurer clearance
                    </span>
                  </div>
                  <Badge
                    variant={
                      records.filter(
                        (r) =>
                          r.status === "pending" &&
                          (r.paymentMethod === "check" || r.paymentMethod === "cash"),
                      ).length > 0
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {
                      records.filter(
                        (r) =>
                          r.status === "pending" &&
                          (r.paymentMethod === "check" || r.paymentMethod === "cash"),
                      ).length
                    }{" "}
                    pending
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Confirmed &amp; Cleared Payments
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Stripe card payments and cleared check records in current term
                    </span>
                  </div>
                  <Badge variant="success">
                    {records.filter((r) => r.status === "confirmed").length} confirmed
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Active Dues Term &amp; Rate
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("terms")}
                  className="text-xs"
                >
                  Manage Terms &rarr;
                </Button>
              </div>

              {activeTerm ? (
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Calendar Term {activeTerm.year}
                    </span>
                    <Badge variant="success">Current Term</Badge>
                  </div>
                  <div className="text-2xl font-bold font-serif text-foreground">
                    ${(activeTerm.duesCents / 100).toFixed(2)} USD
                  </div>
                  <p className="text-muted-foreground">
                    Term active: {formatInclusiveTermDates(activeTerm.opensAt, activeTerm.closesAt)}
                  </p>
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Unreconciled Pending Checks:{" "}
                      {records.filter((r) => r.status === "pending").length}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setStatusFilter("pending");
                        setActiveTab("dues");
                      }}
                      className="text-xs h-7 px-2.5"
                    >
                      Review Checks
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No active terms configured.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DUES PAYMENT JOURNAL */}
      {activeTab === "dues" && (
        <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-sm">
                Dues Payment Journal ({filteredRecords.length} records)
              </span>
              <span className="text-xs text-muted-foreground">
                (Pending: {records.filter((r) => r.status === "pending").length})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                type="text"
                placeholder="Search member, username, check #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-9 w-full sm:w-56 rounded-xl border-border/60 bg-card"
              />

              <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 text-xs overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: "all", label: "All" },
                  { id: "pending", label: "Pending" },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "closed", label: "Closed" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(f.id);
                      setDuesPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      statusFilter === f.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-left text-sm min-w-[750px]">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Member</th>
                  <th className="p-4">Date &amp; Time</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Reconciliation &amp; Check Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedDues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                      No payment records match the current filter.
                    </td>
                  </tr>
                ) : (
                  paginatedDues.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-foreground block">{r.memberName}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          @{r.memberUsername}
                        </span>
                        {r.notes && (
                          <span className="block text-[11px] text-muted-foreground/80 italic mt-0.5">
                            Note: {r.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Detroit",
                        })}
                      </td>
                      <td className="p-4 text-muted-foreground">{r.year}</td>
                      <td className="p-4 font-semibold text-foreground">
                        ${(r.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className="capitalize">{r.paymentMethod.replace("_", " ")}</span>
                      </td>
                      <td className="p-4">
                        {r.status === "confirmed" ? (
                          <Badge variant="success">Confirmed</Badge>
                        ) : r.status === "failed" ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : r.status === "refunded" ? (
                          <Badge variant="outline">Refunded</Badge>
                        ) : r.paymentMethod === "check" || r.paymentMethod === "cash" ? (
                          <Badge variant="warning">Awaiting Clearance</Badge>
                        ) : (
                          <Badge variant="warning">Checkout In Progress</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {r.status === "confirmed" ? (
                          <span className="text-xs text-muted-foreground">
                            {r.reconciledAt
                              ? `Cleared: ${new Date(r.reconciledAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  timeZone: "America/Detroit",
                                })}`
                              : "Confirmed electronically"}
                          </span>
                        ) : r.paymentMethod === "credit_card" ? (
                          <span className="text-xs text-muted-foreground italic">
                            Awaiting Stripe completion
                          </span>
                        ) : (
                          <div>
                            {reconcilingId === r.id ? (
                              <div className="flex flex-col items-end gap-2">
                                <Input
                                  type="text"
                                  placeholder="Check # or ledger note..."
                                  value={reconcileNotes}
                                  onChange={(e) => setReconcileNotes(e.target.value)}
                                  className="text-xs h-8 max-w-[200px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReconcilingId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={isSubmitting}
                                    onClick={() => handleReconcile(r.id, r.memberName)}
                                  >
                                    Confirm Cleared
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReconcilingId(r.id);
                                  setReconcileNotes("");
                                }}
                              >
                                Reconcile Check
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={duesPage}
            totalItems={filteredRecords.length}
            pageSize={duesPageSize}
            onPageChange={setDuesPage}
            onPageSizeChange={setDuesPageSize}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="payment records"
          />
        </div>
      )}

      {/* TAB 3: ANNUAL TERMS CONFIG */}
      {activeTab === "terms" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Active Annual Dues Term
              </span>
              <p className="text-lg font-bold text-foreground">
                {activeTerm
                  ? `Calendar Year ${activeTerm.year} • $${(activeTerm.duesCents / 100).toFixed(2)} USD`
                  : "No active terms configured"}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeTerm
                  ? `Term active: ${formatInclusiveTermDates(activeTerm.opensAt, activeTerm.closesAt)}`
                  : "Configure an annual membership term below."}
              </p>
            </div>
            {activeTerm && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleOpenEditTerm(activeTerm)}
              >
                Edit Term &amp; Extend Deadline
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              All Membership Terms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {terms.map((t) => (
                <div
                  key={t.id || t.year}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background text-xs"
                >
                  <div>
                    <span className="font-semibold text-sm text-foreground">Year {t.year}</span>
                    <p className="text-xs text-muted-foreground">
                      ${(t.duesCents / 100).toFixed(2)} USD • Closes: {t.closesAt.slice(0, 10)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs rounded-lg"
                    onClick={() => handleOpenEditTerm(t)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Term Modal */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Configure Membership Term Year {editingTerm.year}
            </h2>
            <p className="text-xs text-muted-foreground">
              Adjust annual dues amount, registration window, and extend member payment deadlines.
            </p>

            <form onSubmit={handleSaveTerm} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-amount"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Annual Dues Rate ($ USD) *
                </label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={editAmountDollars}
                  onChange={(e) => setEditAmountDollars(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-opens-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Opens At (Detroit) *
                  </label>
                  <Input
                    id="edit-opens-at"
                    type="datetime-local"
                    required
                    value={editOpensAt}
                    onChange={(e) => setEditOpensAt(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-closes-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Closes At / Deadline (Detroit) *
                  </label>
                  <Input
                    id="edit-closes-at"
                    type="datetime-local"
                    required
                    value={editClosesAt}
                    onChange={(e) => setEditClosesAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Quick Deadline Extension
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendClosesAt(30)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors font-medium text-foreground cursor-pointer"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendClosesAt(60)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors font-medium text-foreground cursor-pointer"
                  >
                    +60 Days
                  </button>
                  <button
                    type="button"
                    onClick={handleSetYearEndDeadline}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors font-medium text-foreground cursor-pointer"
                  >
                    End of Year (Dec 31)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditingTerm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Term Configuration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Term Modal */}
      {isCreatingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Create New Membership Term
            </h2>
            <p className="text-xs text-muted-foreground">
              Schedule upcoming annual dues cycles and define opening and reconciliation deadlines.
            </p>

            <form onSubmit={handleCreateNewTerm} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-term-year"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Term Year *
                  </label>
                  <Input
                    id="new-term-year"
                    type="number"
                    min="2020"
                    max="2040"
                    required
                    value={newTermYear}
                    onChange={(e) => setNewTermYear(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-term-amount"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Annual Dues Amount ($ USD) *
                  </label>
                  <Input
                    id="new-term-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newTermDollars}
                    onChange={(e) => setNewTermDollars(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-opens-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Opens At (Detroit) *
                  </label>
                  <Input
                    id="new-opens-at"
                    type="datetime-local"
                    required
                    value={newTermOpensAt}
                    onChange={(e) => setNewTermOpensAt(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-closes-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Closes At / Deadline (Detroit) *
                  </label>
                  <Input
                    id="new-closes-at"
                    type="datetime-local"
                    required
                    value={newTermClosesAt}
                    onChange={(e) => setNewTermClosesAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsCreatingTerm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Term"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
