"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { formatDetroitDateTimeLocal, parseDetroitDateTimeLocal } from "@/features/events/calendar";
import type {
  AdminDuesRecord,
  AdminTermRecord,
  DisbursementRecord,
  FinancialLedgerSummary,
} from "../types";
import {
  createMembershipTermAction,
  reconcilePaymentAction,
  updateMembershipTermAction,
  createDisbursementAction,
  deleteDisbursementAction,
} from "../actions";

interface AdminDuesProps {
  initialRecords: AdminDuesRecord[];
  initialTerms?: AdminTermRecord[];
  initialDisbursements?: DisbursementRecord[];
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

const DISBURSEMENT_CATEGORIES = [
  "Garden Walk Supplies & Signage",
  "Downtown Civic Urns & Flowers",
  "Public Library & Hilltop Gardens",
  "Senior & Youth Workshops",
  "Guest Speaker Honorarium",
  "Administrative, PO Box & Postage",
  "Website & Online Services",
  "Insurance & Regulatory Filing",
  "Charitable Community Grants",
  "Miscellaneous Expense",
];

export function AdminDues({
  initialRecords,
  initialTerms = [],
  initialDisbursements = [],
  initialSummary,
  initialStatusFilter,
}: AdminDuesProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "dues" | "withdrawals" | "terms">(
    "overview",
  );
  const [records, setRecords] = React.useState<AdminDuesRecord[]>(initialRecords);
  const [terms, setTerms] = React.useState<AdminTermRecord[]>(initialTerms);
  const [disbursements, setDisbursements] =
    React.useState<DisbursementRecord[]>(initialDisbursements);
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

  // Pagination for Disbursements
  const [disbPage, setDisbPage] = React.useState(1);
  const [disbPageSize, setDisbPageSize] = React.useState(10);

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

  // Record Disbursement / Withdrawal Modal State
  const [isRecordingDisbursement, setIsRecordingDisbursement] = React.useState(false);
  const [disbAmountDollars, setDisbAmountDollars] = React.useState<string>("");
  const [disbCategory, setDisbCategory] = React.useState<string>(
    DISBURSEMENT_CATEGORIES[0] || "Garden Walk Supplies & Signage",
  );
  const [disbPayee, setDisbPayee] = React.useState<string>("");
  const [disbDescription, setDisbDescription] = React.useState<string>("");
  const [disbRef, setDisbRef] = React.useState<string>("");
  const [disbDate, setDisbDate] = React.useState<string>(new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  React.useEffect(() => {
    setTerms(initialTerms);
  }, [initialTerms]);

  React.useEffect(() => {
    setDisbursements(initialDisbursements);
  }, [initialDisbursements]);

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

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await createDisbursementAction({
        amountDollars: disbAmountDollars,
        category: disbCategory,
        payee: disbPayee,
        description: disbDescription,
        referenceNumber: disbRef,
        disbursedAt: disbDate ? `${disbDate}T12:00:00Z` : undefined,
      });

      if (res.success && res.data) {
        const amountCents = Math.round(parseFloat(disbAmountDollars) * 100);
        const newRecord: DisbursementRecord = {
          id: res.data.id,
          amountCents,
          category: disbCategory,
          payee: disbPayee,
          description: disbDescription,
          referenceNumber: disbRef || undefined,
          disbursedAt: disbDate ? `${disbDate}T12:00:00Z` : new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        setDisbursements((prev) => [newRecord, ...prev]);
        setSummary((prev) => {
          if (!prev) return prev;
          const nextDisbursed = prev.totalDisbursedCents + amountCents;
          return {
            ...prev,
            totalDisbursedCents: nextDisbursed,
            disbursementCount: prev.disbursementCount + 1,
            netAvailableBalanceCents: prev.totalGrossRevenueCents - nextDisbursed,
          };
        });

        setNotice(
          `Withdrawal of $${parseFloat(disbAmountDollars).toFixed(2)} to "${disbPayee}" recorded.`,
        );
        setIsRecordingDisbursement(false);
        setDisbAmountDollars("");
        setDisbPayee("");
        setDisbDescription("");
        setDisbRef("");
      } else {
        setIsError(true);
        setNotice(`Could not record withdrawal: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDisbursement = async (id: string, payee: string, amountCents: number) => {
    if (
      !confirm(
        `Are you sure you want to remove the withdrawal record for "${payee}" ($${(amountCents / 100).toFixed(2)})?`,
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteDisbursementAction(id);
      if (res.success) {
        setDisbursements((prev) => prev.filter((d) => d.id !== id));
        setSummary((prev) => {
          if (!prev) return prev;
          const nextDisbursed = Math.max(0, prev.totalDisbursedCents - amountCents);
          return {
            ...prev,
            totalDisbursedCents: nextDisbursed,
            disbursementCount: Math.max(0, prev.disbursementCount - 1),
            netAvailableBalanceCents: prev.totalGrossRevenueCents - nextDisbursed,
          };
        });
        setNotice("Withdrawal record removed from accounting books.");
      } else {
        setIsError(true);
        setNotice(`Could not delete record: ${res.error}`);
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

  const paginatedDisbursements = React.useMemo(() => {
    const start = (disbPage - 1) * disbPageSize;
    return disbursements.slice(start, start + disbPageSize);
  }, [disbursements, disbPage, disbPageSize]);

  // Derived Financial Calculations if summary is not loaded
  const calcGrossRevenue =
    summary?.totalGrossRevenueCents ??
    records.filter((r) => r.status === "confirmed").reduce((acc, r) => acc + r.amountCents, 0);
  const calcTotalDisbursed =
    summary?.totalDisbursedCents ?? disbursements.reduce((acc, d) => acc + d.amountCents, 0);
  const calcNetBalance = summary?.netAvailableBalanceCents ?? calcGrossRevenue - calcTotalDisbursed;

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Dues Reconciliation & Financials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full club treasury books: count revenues across membership dues and Garden Walk
            admissions, record asset withdrawals and disbursements, and reconcile paper checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsRecordingDisbursement(true)}
            className="rounded-xl shadow-2xs"
          >
            + Record Withdrawal
          </Button>
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
          { id: "overview", label: "Accounting Overview & Books" },
          { id: "dues", label: `Dues Payment Journal (${records.length})` },
          { id: "withdrawals", label: `Withdrawals & Expenses (${disbursements.length})` },
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
                Total Withdrawals &amp; Expenses
              </span>
              <p className="text-3xl font-bold font-serif text-amber-600 dark:text-amber-400">
                ${(calcTotalDisbursed / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                <p>
                  • Disbursements recorded:{" "}
                  <span className="font-semibold text-foreground">{disbursements.length}</span>{" "}
                  entries
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Supplies, beautification urns, workshops &amp; honoraria
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Net Available Treasury Balance
              </span>
              <p
                className={`text-3xl font-bold font-serif ${
                  calcNetBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                ${(calcNetBalance / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                <p>
                  • Status:{" "}
                  <span className="font-semibold text-foreground">
                    {calcNetBalance >= 0 ? "Solvent / Surplus" : "Deficit"}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Available for upcoming civic plantings &amp; projects
                </p>
              </div>
            </div>
          </div>

          {/* Quick Overview of Recent Withdrawals & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Recent Withdrawals from Assets
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("withdrawals")}
                  className="text-xs"
                >
                  View All &rarr;
                </Button>
              </div>

              {disbursements.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  <p className="font-semibold text-sm">No withdrawals recorded yet.</p>
                  <p className="mt-1">
                    Click "+ Record Withdrawal" to log supply purchases, equipment, or contractor
                    fees.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsRecordingDisbursement(true)}
                    className="mt-3 text-xs"
                  >
                    + Record First Withdrawal
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60 text-xs">
                  {disbursements.slice(0, 5).map((d) => (
                    <div key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {d.payee}
                        </span>
                        <span className="text-muted-foreground text-[11px] truncate block">
                          {d.category} • {d.description}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-foreground block">
                          ${(d.amountCents / 100).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(d.disbursedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Member</th>
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
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
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
                        ) : (
                          <Badge variant="warning">Awaiting Clearance</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {r.status === "confirmed" ? (
                          <span className="text-xs text-muted-foreground">
                            {r.reconciledAt
                              ? `Cleared: ${new Date(r.reconciledAt).toLocaleDateString()}`
                              : "Confirmed electronically"}
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

      {/* TAB 3: WITHDRAWALS & EXPENSES */}
      {activeTab === "withdrawals" && (
        <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden space-y-0">
          <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-sm text-foreground">
                Withdrawals &amp; Asset Disbursements Journal ({disbursements.length} entries)
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official treasurer log of funds withdrawn from dues, tickets, and website assets for
                club operations.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsRecordingDisbursement(true)}
              className="text-xs rounded-xl shadow-2xs shrink-0"
            >
              + Record Withdrawal
            </Button>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-left text-sm min-w-[750px]">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Disbursed Date</th>
                  <th className="p-4">Payee / Recipient</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description &amp; Reference</th>
                  <th className="p-4 text-right">Amount Withdrawn</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedDisbursements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                      No withdrawals recorded in the accounting books yet.
                    </td>
                  </tr>
                ) : (
                  paginatedDisbursements.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-xs font-mono text-foreground whitespace-nowrap">
                        {new Date(d.disbursedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4 font-semibold text-foreground">{d.payee}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {d.category}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-foreground">{d.description}</p>
                        {d.referenceNumber && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Ref / Check #: {d.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-amber-600 dark:text-amber-400 font-mono">
                        ${(d.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDisbursement(d.id, d.payee, d.amountCents)}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={disbPage}
            totalItems={disbursements.length}
            pageSize={disbPageSize}
            onPageChange={setDisbPage}
            onPageSizeChange={setDisbPageSize}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="withdrawals"
          />
        </div>
      )}

      {/* TAB 4: ANNUAL TERMS CONFIG */}
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

      {/* Record New Withdrawal Modal */}
      {isRecordingDisbursement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Record Asset Withdrawal / Disbursement
            </h2>
            <p className="text-xs text-muted-foreground">
              Note down funds withdrawn from club dues and ticket assets to maintain clear
              accounting books.
            </p>

            <form onSubmit={handleCreateDisbursement} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="disb-amount"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Withdrawal Amount ($ USD) *
                  </label>
                  <Input
                    id="disb-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={disbAmountDollars}
                    onChange={(e) => setDisbAmountDollars(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="disb-date"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Date of Withdrawal *
                  </label>
                  <Input
                    id="disb-date"
                    type="date"
                    required
                    value={disbDate}
                    onChange={(e) => setDisbDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="disb-payee"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Payee / Vendor / Recipient *
                </label>
                <Input
                  id="disb-payee"
                  type="text"
                  required
                  placeholder="e.g. Huntree Nursery, USPS Douglas, Contractor Name"
                  value={disbPayee}
                  onChange={(e) => setDisbPayee(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="disb-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Accounting Category *
                  </label>
                  <select
                    id="disb-category"
                    value={disbCategory}
                    onChange={(e) => setDisbCategory(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {DISBURSEMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="disb-ref"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Check # / Receipt Ref
                  </label>
                  <Input
                    id="disb-ref"
                    type="text"
                    placeholder="e.g. Check #1042 or Inv-2026"
                    value={disbRef}
                    onChange={(e) => setDisbRef(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="disb-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Purpose / Itemized Description *
                </label>
                <textarea
                  id="disb-description"
                  required
                  rows={2}
                  placeholder="e.g. Purchase of 45 flats of red geraniums and potting soil for downtown urns."
                  value={disbDescription}
                  onChange={(e) => setDisbDescription(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRecordingDisbursement(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Recording..." : "Save to Books"}
                </Button>
              </div>
            </form>
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
