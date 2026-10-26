"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDetroitDateTimeLocal, parseDetroitDateTimeLocal } from "@/features/events/calendar";
import type { AdminDuesRecord, AdminTermRecord } from "../types";
import {
  createMembershipTermAction,
  reconcilePaymentAction,
  updateMembershipTermAction,
} from "../actions";

interface AdminDuesProps {
  initialRecords: AdminDuesRecord[];
  initialTerms?: AdminTermRecord[];
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
  initialStatusFilter,
}: AdminDuesProps) {
  const [records, setRecords] = React.useState<AdminDuesRecord[]>(initialRecords);
  const [terms, setTerms] = React.useState<AdminTermRecord[]>(initialTerms);
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter || "all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);
  const [reconcileNotes, setReconcileNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Term editing & deadline extension modal state
  const [editingTerm, setEditingTerm] = React.useState<AdminTermRecord | null>(null);
  const [editAmountDollars, setEditAmountDollars] = React.useState<string>("");
  const [editOpensAt, setEditOpensAt] = React.useState<string>("");
  const [editClosesAt, setEditClosesAt] = React.useState<string>("");

  // New Term Modal State
  const [isCreatingTerm, setIsCreatingTerm] = React.useState(false);
  const [newTermYear, setNewTermYear] = React.useState<number>(new Date().getFullYear() + 1);
  const [newTermDollars, setNewTermDollars] = React.useState<string>("25.00");
  const [newTermOpensAt, setNewTermOpensAt] = React.useState<string>(
    `${new Date().getFullYear() + 1}-01-01T00:00`,
  );
  const [newTermClosesAt, setNewTermClosesAt] = React.useState<string>(
    `${new Date().getFullYear() + 1}-10-31T23:59`,
  );

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  React.useEffect(() => {
    setTerms(initialTerms);
  }, [initialTerms]);

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
    const parsedDollars = Number.parseFloat(editAmountDollars);
    if (Number.isNaN(parsedDollars) || parsedDollars <= 0) {
      setIsError(true);
      setNotice("Please enter a valid dues amount.");
      return;
    }
    const cents = Math.round(parsedDollars * 100);

    setIsSubmitting(true);
    setIsError(false);
    try {
      const opensAtIso = parseDetroitDateTimeLocal(editOpensAt);
      const closesAtIso = parseDetroitDateTimeLocal(editClosesAt);

      const res = await updateMembershipTermAction({
        termId: editingTerm.id,
        duesCents: cents,
        opensAt: opensAtIso,
        closesAt: closesAtIso,
      });

      if (res.success) {
        setTerms((prev) =>
          prev.map((t) =>
            t.id === editingTerm.id
              ? {
                  ...t,
                  duesCents: cents,
                  opensAt: opensAtIso,
                  closesAt: closesAtIso,
                }
              : t,
          ),
        );
        setNotice(
          `Updated membership term for ${editingTerm.year}: $${parsedDollars.toFixed(2)}, deadline extended to ${closesAtIso.slice(0, 10)}.`,
        );
        setEditingTerm(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update term: ${res.error}`);
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
    const parsedDollars = Number.parseFloat(newTermDollars);
    if (Number.isNaN(parsedDollars) || parsedDollars <= 0) {
      setIsError(true);
      setNotice("Please enter a valid dues amount.");
      return;
    }
    const cents = Math.round(parsedDollars * 100);

    setIsSubmitting(true);
    setIsError(false);
    try {
      const opensAtIso = parseDetroitDateTimeLocal(newTermOpensAt);
      const closesAtIso = parseDetroitDateTimeLocal(newTermClosesAt);

      const res = await createMembershipTermAction({
        year: Number(newTermYear),
        duesCents: cents,
        opensAt: opensAtIso,
        closesAt: closesAtIso,
      });

      if (res.success && res.data) {
        const created = (res.data as Array<AdminTermRecord>)[0] || {
          id: String(Date.now()),
          year: Number(newTermYear),
          duesCents: cents,
          currency: "USD",
          opensAt: opensAtIso,
          closesAt: closesAtIso,
        };
        setTerms((prev) => [created, ...prev]);
        setNotice(
          `Created new membership term for ${newTermYear} at $${parsedDollars.toFixed(2)}.`,
        );
        setIsCreatingTerm(false);
      } else {
        setIsError(true);
        setNotice(`Failed to create term: ${res.error}`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Dues Reconciliation & Financials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reconcile incoming paper checks, audit electronic card payments, manage membership
            terms, and extend payment deadlines.
          </p>
        </div>

        <Button onClick={() => setIsCreatingTerm(true)}>+ New Term Year</Button>
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

      {/* Current Term Configuration Banner */}
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
            Edit Term & Extend Deadline
          </Button>
        )}
      </div>

      {terms.length > 1 && (
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
      )}

      {/* Transactions Table & Filters */}
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
            {/* Search Input for check # and member name */}
            <Input
              type="text"
              placeholder="Search member, username, check #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-9 w-full sm:w-56 rounded-xl border-border/60 bg-card"
            />

            {/* Status Tabs */}
            <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "confirmed", label: "Confirmed" },
                { id: "closed", label: "Closed" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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

        {/* Mobile View: Dues Record Cards (< md) */}
        <div className="md:hidden divide-y divide-border">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No payment records match the current filter.
            </div>
          ) : (
            filteredRecords.map((r) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">
                      {r.memberName}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground block">
                      @{r.memberUsername}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-bold text-foreground text-sm">
                      ${(r.amountCents / 100).toFixed(2)}
                    </span>
                    {r.status === "confirmed" ? (
                      <Badge variant="success" className="text-[10px]">
                        Confirmed
                      </Badge>
                    ) : r.status === "failed" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Failed
                      </Badge>
                    ) : r.status === "refunded" ? (
                      <Badge variant="outline" className="text-[10px]">
                        Refunded
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        Awaiting Clearance
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Year: {r.year}</span>
                  <span className="capitalize">Method: {r.paymentMethod.replace("_", " ")}</span>
                </div>

                {r.notes && (
                  <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded-lg">
                    Note: {r.notes}
                  </p>
                )}

                <div className="pt-2 border-t border-border/40 flex items-center justify-end">
                  {r.status === "pending" ? (
                    r.paymentMethod === "check" ? (
                      reconcilingId === r.id ? (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Check # or note..."
                            value={reconcileNotes}
                            onChange={(e) => setReconcileNotes(e.target.value)}
                            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground w-full sm:w-44"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs h-7 px-3"
                              disabled={isSubmitting}
                              onClick={() => handleReconcile(r.id, r.memberName)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2.5"
                              onClick={() => {
                                setReconcilingId(null);
                                setReconcileNotes("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-7 px-3"
                          onClick={() => setReconcilingId(r.id)}
                        >
                          Reconcile Check
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Online Processing
                      </span>
                    )
                  ) : r.status === "confirmed" ? (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Reconciled {r.notes ? `(${r.notes})` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
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
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No payment records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
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
                      {r.status === "pending" ? (
                        r.paymentMethod === "check" ? (
                          reconcilingId === r.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                placeholder="Check # or note..."
                                value={reconcileNotes}
                                onChange={(e) => setReconcileNotes(e.target.value)}
                                className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground w-40"
                              />
                              <Button
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => handleReconcile(r.id, r.memberName)}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReconcilingId(null);
                                  setReconcileNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setReconcilingId(r.id)}
                            >
                              Reconcile Check
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Online Processing
                          </span>
                        )
                      ) : r.status === "confirmed" ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          Reconciled {r.notes ? `(${r.notes})` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Term & Extend Deadline Modal */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Configure Term &bull; Year {editingTerm.year}
            </h2>
            <p className="text-xs text-muted-foreground">
              Update dues amounts or extend reconciliation deadlines (`closes_at`). The active term
              dictates eligibility and dues invoices.
            </p>

            <form onSubmit={handleSaveTerm} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-dues-amount"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Annual Dues Amount ($ USD) *
                </label>
                <input
                  id="edit-dues-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={editAmountDollars}
                  onChange={(e) => setEditAmountDollars(e.target.value)}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
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

              {/* Deadline Extension Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Quick Deadline Extension
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendClosesAt(30)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors font-medium text-foreground"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendClosesAt(60)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors font-medium text-foreground"
                  >
                    +60 Days
                  </button>
                  <button
                    type="button"
                    onClick={handleSetYearEndDeadline}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors font-medium text-foreground"
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
