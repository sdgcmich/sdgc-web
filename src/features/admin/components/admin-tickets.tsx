"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  checkInTicketOrderAction,
  cancelTicketOrderAction,
  createCouponAction,
  toggleCouponActiveAction,
  deleteCouponAction,
  listAdminCouponsAction,
} from "@/features/tickets/actions";
import type {
  TicketEvent,
  TicketOrderListItem,
  TicketStats,
  TicketCoupon,
} from "@/features/tickets/types";

interface AdminTicketsProps {
  initialOrders: TicketOrderListItem[];
  initialStats: TicketStats;
  initialEvents: TicketEvent[];
  initialCoupons?: TicketCoupon[];
}

export function AdminTickets({
  initialOrders,
  initialStats,
  initialEvents,
  initialCoupons = [],
}: AdminTicketsProps) {
  const [orders, setOrders] = React.useState<TicketOrderListItem[]>(initialOrders);
  const [stats, setStats] = React.useState<TicketStats>(initialStats);
  const [events] = React.useState<TicketEvent[]>(initialEvents);
  const [coupons, setCoupons] = React.useState<TicketCoupon[]>(initialCoupons);

  const [activeTab, setActiveTab] = React.useState<"orders" | "coupons">("orders");

  // Create Coupon Modal State
  const [isCreateCouponOpen, setIsCreateCouponOpen] = React.useState(false);
  const [newCouponCode, setNewCouponCode] = React.useState("");
  const [newCouponDescription, setNewCouponDescription] = React.useState("");
  const [newCouponType, setNewCouponType] = React.useState<"percentage" | "fixed_amount">(
    "percentage",
  );
  const [newCouponValue, setNewCouponValue] = React.useState("20");
  const [newCouponEventId, setNewCouponEventId] = React.useState("all");
  const [newCouponValidFrom, setNewCouponValidFrom] = React.useState("");
  const [newCouponValidUntil, setNewCouponValidUntil] = React.useState("");
  const [newCouponMaxUses, setNewCouponMaxUses] = React.useState("");
  const [isSubmittingCoupon, setIsSubmittingCoupon] = React.useState(false);

  const [selectedEventId, setSelectedEventId] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isPending, startTransition] = React.useTransition();
  const [actionMessage, setActionMessage] = React.useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  // Selected order for Detail Modal
  const [selectedOrder, setSelectedOrder] = React.useState<TicketOrderListItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);

  // Filter orders in memory for instantaneous search and filtering
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      if (selectedEventId !== "all" && o.eventId !== selectedEventId) {
        return false;
      }
      if (selectedStatus !== "all" && o.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = o.purchaserName.toLowerCase().includes(q);
        const matchesEmail = o.purchaserEmail.toLowerCase().includes(q);
        const matchesRef = o.orderReference.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRef) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedEventId, selectedStatus, searchQuery]);

  // Reset pagination when filter criteria change
  React.useEffect(() => {
    if (selectedEventId || selectedStatus || searchQuery !== undefined) {
      setCurrentPage(1);
    }
  }, [selectedEventId, selectedStatus, searchQuery]);

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Handle Check-in Toggle
  const handleToggleCheckIn = async (order: TicketOrderListItem) => {
    const isCurrentlyCheckedIn = order.status === "checked_in";
    const nextStatus = isCurrentlyCheckedIn ? "confirmed" : "checked_in";

    startTransition(async () => {
      setActionMessage(null);
      const res = await checkInTicketOrderAction(order.id, isCurrentlyCheckedIn);
      if (res.success) {
        setActionMessage({
          text: isCurrentlyCheckedIn
            ? `Check-in reverted for ${order.purchaserName} (${order.orderReference}).`
            : `Successfully checked in ${order.purchaserName} (${order.ticketQuantity} ticket${order.ticketQuantity > 1 ? "s" : ""})!`,
        });
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: nextStatus,
                  checkedInAt: res.data?.checkedInAt ?? null,
                }
              : o,
          ),
        );
        setStats((prev) => {
          const deltaCheckedIn = isCurrentlyCheckedIn
            ? -order.ticketQuantity
            : order.ticketQuantity;
          const deltaPending = isCurrentlyCheckedIn ? order.ticketQuantity : -order.ticketQuantity;
          return {
            ...prev,
            checkedInCount: Math.max(0, prev.checkedInCount + deltaCheckedIn),
            pendingCount: Math.max(0, prev.pendingCount + deltaPending),
          };
        });
      } else {
        setActionMessage({ text: res.error || "Failed to update check-in status.", isError: true });
      }
    });
  };

  // Handle Cancel Order
  const handleCancelOrder = async (order: TicketOrderListItem) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel order ${order.orderReference} for ${order.purchaserName}?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      setActionMessage(null);
      const res = await cancelTicketOrderAction(order.id, "Cancelled from admin roster");
      if (res.success) {
        setActionMessage({ text: `Order ${order.orderReference} has been cancelled.` });
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(null);
        }
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: "cancelled",
                }
              : o,
          ),
        );
        setStats((prev) => ({
          ...prev,
          totalTicketsSold: Math.max(0, prev.totalTicketsSold - order.ticketQuantity),
          totalRevenueCents: Math.max(0, prev.totalRevenueCents - order.totalAmountCents),
          pendingCount:
            order.status === "confirmed"
              ? Math.max(0, prev.pendingCount - order.ticketQuantity)
              : prev.pendingCount,
          checkedInCount:
            order.status === "checked_in"
              ? Math.max(0, prev.checkedInCount - order.ticketQuantity)
              : prev.checkedInCount,
        }));
      } else {
        setActionMessage({ text: res.error || "Failed to cancel ticket order.", isError: true });
      }
    });
  };

  // Export CSV Roster
  const handleExportCsv = () => {
    const headers = [
      "Order Reference",
      "Event Title",
      "Purchaser Name",
      "Purchaser Email",
      "Purchaser Phone",
      "Ticket Quantity",
      "Unit Price ($)",
      "Total Amount ($)",
      "Status",
      "Checked In At",
      "Checked In By",
      "Order Date",
      "Notes",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderReference}"`,
      `"${o.eventTitle.replace(/"/g, '""')}"`,
      `"${o.purchaserName.replace(/"/g, '""')}"`,
      `"${o.purchaserEmail.replace(/"/g, '""')}"`,
      `"${o.purchaserPhone || ""}"`,
      o.ticketQuantity,
      (o.unitPriceCents / 100).toFixed(2),
      (o.totalAmountCents / 100).toFixed(2),
      `"${o.status}"`,
      `"${o.checkedInAt ? new Date(o.checkedInAt).toLocaleString("en-US", { timeZone: "America/Detroit" }) : ""}"`,
      `"${o.checkedInByName || ""}"`,
      `"${new Date(o.createdAt).toLocaleString("en-US", { timeZone: "America/Detroit" })}"`,
      `"${(o.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `sdgc-ticket-roster-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const parsedVal = parseFloat(newCouponValue);
    if (Number.isNaN(parsedVal) || parsedVal <= 0) {
      setActionMessage({ text: "Please enter a valid positive discount amount.", isError: true });
      return;
    }

    const discountValue =
      newCouponType === "percentage" ? Math.round(parsedVal) : Math.round(parsedVal * 100);

    setIsSubmittingCoupon(true);
    setActionMessage(null);
    try {
      const res = await createCouponAction({
        code: newCouponCode.trim(),
        description: newCouponDescription.trim() || undefined,
        discountType: newCouponType,
        discountValue,
        eventId: newCouponEventId !== "all" ? newCouponEventId : undefined,
        validFrom: newCouponValidFrom || undefined,
        validUntil: newCouponValidUntil || undefined,
        maxUses: newCouponMaxUses ? parseInt(newCouponMaxUses, 10) : undefined,
      });

      if (res.success) {
        setActionMessage({ text: `Coupon code "${newCouponCode.trim().toUpperCase()}" created!` });
        setIsCreateCouponOpen(false);
        setNewCouponCode("");
        setNewCouponDescription("");
        setNewCouponType("percentage");
        setNewCouponValue("20");
        setNewCouponEventId("all");
        setNewCouponValidFrom("");
        setNewCouponValidUntil("");
        setNewCouponMaxUses("");

        const refetched = await listAdminCouponsAction();
        if (refetched.success && refetched.data) {
          setCoupons(refetched.data);
        }
      } else {
        setActionMessage({ text: res.error || "Failed to create coupon.", isError: true });
      }
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Error creating coupon.",
        isError: true,
      });
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const handleToggleCoupon = async (c: TicketCoupon) => {
    startTransition(async () => {
      setActionMessage(null);
      const res = await toggleCouponActiveAction(c.id, !c.isActive);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, isActive: !item.isActive } : item)),
        );
        setActionMessage({
          text: `Coupon "${c.code}" ${!c.isActive ? "activated" : "deactivated"}.`,
        });
      } else {
        setActionMessage({ text: res.error || "Failed to update coupon.", isError: true });
      }
    });
  };

  const handleDeleteCoupon = async (c: TicketCoupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${c.code}"?`)) return;
    startTransition(async () => {
      setActionMessage(null);
      const res = await deleteCouponAction(c.id);
      if (res.success) {
        setCoupons((prev) => prev.filter((item) => item.id !== c.id));
        setActionMessage({ text: `Coupon "${c.code}" deleted.` });
      } else {
        setActionMessage({ text: res.error || "Failed to delete coupon.", isError: true });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wide mb-2">
            Admin Event Operations
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Garden Walk &amp; Ticket Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage advance admissions, check in tour guests, track ticket revenues, and export
            volunteer check-in rosters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="gap-2 text-xs font-semibold"
          >
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export Attendee Roster (CSV)
          </Button>

          <Link
            href={"/tickets-checkout" as Route}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <span>Public Checkout</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === "orders"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          🎟️ Admissions &amp; Check-In ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coupons")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === "coupons"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          🏷️ Event Coupons &amp; Discounts ({coupons.length})
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-medium ${
            actionMessage.isError
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold uppercase hover:underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === "orders" ? (
        <>
          {/* 4 Overview Stat Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Tickets Sold */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Tickets Sold</span>
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  🎟️
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-foreground">
                {stats.totalTicketsSold}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Across {stats.totalOrders} advance reservation{stats.totalOrders === 1 ? "" : "s"}
              </p>
            </div>

            {/* Card 2: Gross Ticket Revenue */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Ticket Revenue
                </span>
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  💵
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-foreground">
                ${(stats.totalRevenueCents / 100).toFixed(2)}
              </div>
              <p className="text-[11px] text-muted-foreground">Nonprofit fundraiser proceeds</p>
            </div>

            {/* Card 3: Checked In Attendees */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Checked In</span>
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  ✓
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-foreground">
                {stats.checkedInCount}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {stats.totalTicketsSold > 0
                  ? `${Math.round((stats.checkedInCount / stats.totalTicketsSold) * 100)}% check-in rate`
                  : "No checked-in guests yet"}
              </p>
            </div>

            {/* Card 4: Pending Arrival */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Pending Arrival
                </span>
                <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  ⏳
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-foreground">
                {stats.pendingCount}
              </div>
              <p className="text-[11px] text-muted-foreground">Awaiting tour table welcome</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Search Box */}
              <div className="sm:col-span-6 relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Purchaser Name, Email, or Order Reference..."
                  className="text-xs pl-9"
                />
                <svg
                  className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </div>

              {/* Event Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  <option value="all">All Events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed (Pending)</option>
                  <option value="checked_in">Checked In</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3.5">Order Ref</th>
                    <th className="px-5 py-3.5">Purchaser</th>
                    <th className="px-5 py-3.5">Event</th>
                    <th className="px-5 py-3.5">Tickets</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <p className="font-semibold text-sm">No ticket orders found.</p>
                        <p className="mt-1 text-xs">
                          {searchQuery
                            ? "Try clearing your search query or adjusting the filters."
                            : "Orders placed on the public checkout page will appear here automatically."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const isCheckedIn = order.status === "checked_in";
                      const isCancelled = order.status === "cancelled";

                      return (
                        <tr key={order.id} className="hover:bg-muted/20 transition-colors group">
                          {/* Order Reference */}
                          <td className="px-5 py-4 font-mono font-bold text-foreground whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                            >
                              {order.orderReference}
                            </button>
                          </td>

                          {/* Purchaser Details */}
                          <td className="px-5 py-4 space-y-0.5">
                            <div className="font-semibold text-foreground">
                              {order.purchaserName}
                            </div>
                            <div className="text-muted-foreground">{order.purchaserEmail}</div>
                            {order.purchaserPhone && (
                              <div className="text-[11px] text-muted-foreground/80">
                                {order.purchaserPhone}
                              </div>
                            )}
                          </td>

                          {/* Event */}
                          <td
                            className="px-5 py-4 text-foreground max-w-[200px] truncate"
                            title={order.eventTitle}
                          >
                            {order.eventTitle}
                          </td>

                          {/* Ticket Count */}
                          <td className="px-5 py-4 font-medium text-foreground whitespace-nowrap">
                            <span className="inline-block bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                              {order.ticketQuantity} pass{order.ticketQuantity > 1 ? "es" : ""}
                            </span>
                          </td>

                          {/* Total Amount */}
                          <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">
                            ${(order.totalAmountCents / 100).toFixed(2)}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 font-bold text-[11px]">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2.5"
                                  stroke="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m4.5 12.75 6 6 9-13.5"
                                  />
                                </svg>
                                Checked In
                              </span>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 font-bold text-[11px]">
                                Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 font-bold text-[11px]">
                                Confirmed
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                            {!isCancelled && (
                              <Button
                                type="button"
                                size="sm"
                                variant={isCheckedIn ? "outline" : "primary"}
                                disabled={isPending}
                                onClick={() => handleToggleCheckIn(order)}
                                className="text-xs h-7 px-3"
                              >
                                {isCheckedIn ? "Undo Check-In" : "Check In"}
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs h-7 px-2"
                            >
                              Details
                            </Button>

                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order)}
                                className="text-muted-foreground hover:text-destructive text-xs transition-colors p-1"
                                title="Cancel Order"
                                aria-label={`Cancel order ${order.orderReference}`}
                              >
                                &times;
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredOrders.length > 0 && (
              <PaginationBar
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            )}
          </div>
        </>
      ) : (
        /* Coupons & Discounts View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Event Coupon Codes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create and manage promotional discount codes for specific events or across all
                ticket checkout.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsCreateCouponOpen(true)}
              className="gap-2 text-xs font-semibold rounded-xl"
            >
              + Create Coupon Code
            </Button>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs overflow-hidden">
            {/* Mobile Coupons View */}
            <div className="md:hidden divide-y divide-border">
              {coupons.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No promotional coupons created yet.
                </div>
              ) : (
                coupons.map((c) => (
                  <div key={c.id} className="py-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-sm text-primary tracking-wider">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                        )}
                      </div>
                      <Badge variant={c.isActive ? "success" : "outline"} className="text-[10px]">
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                          Discount
                        </span>
                        <span className="font-semibold text-foreground">
                          {c.discountType === "percentage"
                            ? `${c.discountValue}% Off`
                            : `$${(c.discountValue / 100).toFixed(2)} Off`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                          Applies To
                        </span>
                        <span className="font-medium text-foreground truncate block">
                          {c.eventTitle || "All Events"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                          Redemptions
                        </span>
                        <span className="text-foreground">
                          {c.timesUsed} / {c.maxUses ?? "Unlimited"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                          Validity
                        </span>
                        <span className="text-foreground">
                          {c.validUntil
                            ? `Through ${new Date(c.validUntil).toLocaleDateString("en-US", { timeZone: "America/Detroit" })}`
                            : "No Expiration"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-3"
                        disabled={isPending}
                        onClick={() => handleToggleCoupon(c)}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7 px-2.5"
                        disabled={isPending}
                        onClick={() => handleDeleteCoupon(c)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Coupons Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">Applicable Event</th>
                    <th className="p-3.5">Valid Window</th>
                    <th className="p-3.5">Uses</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No promotional coupons created yet. Click &quot;+ Create Coupon Code&quot;
                        to add your first promotion.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-sm text-primary tracking-wider">
                          <div>{c.code}</div>
                          {c.description && (
                            <div className="font-sans font-normal text-[11px] text-muted-foreground truncate max-w-xs">
                              {c.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-semibold text-foreground">
                          {c.discountType === "percentage"
                            ? `${c.discountValue}% Off`
                            : `$${(c.discountValue / 100).toFixed(2)} Off`}
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {c.eventTitle || (
                            <span className="font-semibold text-foreground">All Events</span>
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {c.validFrom || c.validUntil ? (
                            <span>
                              {c.validFrom
                                ? new Date(c.validFrom).toLocaleDateString("en-US", {
                                    timeZone: "America/Detroit",
                                  })
                                : "Now"}{" "}
                              &ndash;{" "}
                              {c.validUntil
                                ? new Date(c.validUntil).toLocaleDateString("en-US", {
                                    timeZone: "America/Detroit",
                                  })
                                : "Ongoing"}
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Always Valid
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono">
                            {c.timesUsed} / {c.maxUses ?? "∞"}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={c.isActive ? "success" : "outline"}
                            className="text-[10px]"
                          >
                            {c.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-3"
                            disabled={isPending}
                            onClick={() => handleToggleCoupon(c)}
                          >
                            {c.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7 px-2.5"
                            disabled={isPending}
                            onClick={() => handleDeleteCoupon(c)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Order Details
                </span>
                <h3 className="font-serif text-2xl font-bold text-foreground">
                  {selectedOrder.orderReference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block">Event</span>
                  <span className="font-semibold text-foreground text-sm">
                    {selectedOrder.eventTitle}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <Badge variant={selectedOrder.status === "checked_in" ? "default" : "secondary"}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block">Purchaser Name</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.purchaserName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Email</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.purchaserEmail}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block">Ticket Quantity</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.ticketQuantity} Pass
                    {selectedOrder.ticketQuantity > 1 ? "es" : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Amount</span>
                  <span className="font-semibold text-foreground text-sm">
                    ${(selectedOrder.totalAmountCents / 100).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {selectedOrder.checkedInAt && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <span className="text-muted-foreground block">Check-in Timestamp</span>
                  <span className="font-semibold text-foreground">
                    {new Date(selectedOrder.checkedInAt).toLocaleString("en-US", {
                      timeZone: "America/Detroit",
                    })}
                    {selectedOrder.checkedInByName ? ` by ${selectedOrder.checkedInByName}` : ""}
                  </span>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <span className="text-muted-foreground block">Notes</span>
                  <span className="text-foreground">{selectedOrder.notes}</span>
                </div>
              )}

              <div className="text-muted-foreground text-[11px]">
                Order Created:{" "}
                {new Date(selectedOrder.createdAt).toLocaleString("en-US", {
                  timeZone: "America/Detroit",
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
              {selectedOrder.status !== "cancelled" && (
                <Button
                  type="button"
                  variant={selectedOrder.status === "checked_in" ? "outline" : "primary"}
                  onClick={() => {
                    handleToggleCheckIn(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="text-xs"
                >
                  {selectedOrder.status === "checked_in" ? "Undo Check-In" : "Check In"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCreateCouponOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-coupon-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <h3
                  id="create-coupon-modal-title"
                  className="font-serif text-xl font-bold text-foreground"
                >
                  Create Promotional Coupon Code
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attendees can enter this code during online checkout to receive their discount.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCouponOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label
                  htmlFor="new-coupon-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Coupon Code * (e.g. GARDEN20)
                </label>
                <Input
                  id="new-coupon-code"
                  required
                  placeholder="GARDEN20"
                  value={newCouponCode}
                  onChange={(e) =>
                    setNewCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                  }
                  className="font-mono text-sm tracking-wider uppercase"
                />
              </div>

              <div>
                <label
                  htmlFor="new-coupon-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Description (Optional)
                </label>
                <Input
                  id="new-coupon-description"
                  placeholder="e.g. 20% off Summer Tour Tickets"
                  value={newCouponDescription}
                  onChange={(e) => setNewCouponDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-coupon-type"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Discount Type
                  </label>
                  <select
                    id="new-coupon-type"
                    value={newCouponType}
                    onChange={(e) =>
                      setNewCouponType(e.target.value as "percentage" | "fixed_amount")
                    }
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground cursor-pointer"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed_amount">Fixed Dollar Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="new-coupon-value"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    {newCouponType === "percentage"
                      ? "Discount Percent (%)"
                      : "Discount Amount ($)"}{" "}
                    *
                  </label>
                  <Input
                    id="new-coupon-value"
                    type="number"
                    step={newCouponType === "percentage" ? "1" : "0.01"}
                    min="0.01"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-coupon-event"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Applicable Event
                </label>
                <select
                  id="new-coupon-event"
                  value={newCouponEventId}
                  onChange={(e) => setNewCouponEventId(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground cursor-pointer"
                >
                  <option value="all">All Events (Universal)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-coupon-from"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Valid From (Optional)
                  </label>
                  <Input
                    id="new-coupon-from"
                    type="datetime-local"
                    value={newCouponValidFrom}
                    onChange={(e) => setNewCouponValidFrom(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-coupon-until"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Valid Until (Optional)
                  </label>
                  <Input
                    id="new-coupon-until"
                    type="datetime-local"
                    value={newCouponValidUntil}
                    onChange={(e) => setNewCouponValidUntil(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-coupon-max-uses"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Maximum Redemptions (Optional)
                </label>
                <Input
                  id="new-coupon-max-uses"
                  type="number"
                  min="1"
                  placeholder="Unlimited if left empty"
                  value={newCouponMaxUses}
                  onChange={(e) => setNewCouponMaxUses(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateCouponOpen(false)}
                  disabled={isSubmittingCoupon}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingCoupon} className="text-xs">
                  {isSubmittingCoupon ? "Saving..." : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
