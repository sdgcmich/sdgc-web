"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import type { TicketCoupon, TicketEvent } from "@/features/tickets/types";
import {
  createCouponAction,
  deleteCouponAction,
  toggleCouponActiveAction,
} from "@/features/tickets/actions";

interface AdminCouponsProps {
  initialCoupons: TicketCoupon[];
  events: TicketEvent[];
}

export function AdminCoupons({ initialCoupons, events }: AdminCouponsProps) {
  const [coupons, setCoupons] = React.useState<TicketCoupon[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "promo" | "gift" | "active">("all");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [couponMode, setCouponMode] = React.useState<"gift" | "promo">("gift");

  // Form Fields
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"percentage" | "fixed_amount">(
    "fixed_amount",
  );
  const [discountValue, setDiscountValue] = React.useState<number>(20);
  const [selectedEventId, setSelectedEventId] = React.useState<string>("all");
  const [maxUses, setMaxUses] = React.useState<string>("1");
  const [validUntil, setValidUntil] = React.useState<string>("");
  const [recipientName, setRecipientName] = React.useState<string>("");
  const [recipientEmail, setRecipientEmail] = React.useState<string>("");
  const [giftMessage, setGiftMessage] = React.useState<string>("");

  React.useEffect(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  // Generate random coupon code helper
  const generateGiftCode = (amount: number) => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GIFT-${amount}-${randomHex}`;
  };

  const handleOpenModal = (mode: "gift" | "promo") => {
    setCouponMode(mode);
    if (mode === "gift") {
      setDiscountType("fixed_amount");
      setDiscountValue(20);
      setCode(generateGiftCode(20));
      setMaxUses("1");
      setDescription("Advance Gift Pass for Garden Walk & Event Admissions");
    } else {
      setDiscountType("percentage");
      setDiscountValue(15);
      setCode("");
      setMaxUses("");
      setDescription("");
    }
    setRecipientName("");
    setRecipientEmail("");
    setGiftMessage("");
    setValidUntil("");
    setSelectedEventId("all");
    setIsModalOpen(true);
  };

  const handleSelectGiftAmount = (dollars: number) => {
    setDiscountValue(dollars);
    setCode(generateGiftCode(dollars));
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsError(false);

    try {
      const discountValueInUnits =
        discountType === "fixed_amount"
          ? Math.round(discountValue * 100)
          : Math.round(discountValue);

      const parsedMaxUses = maxUses.trim() ? parseInt(maxUses.trim(), 10) : undefined;

      const res = await createCouponAction({
        code,
        description: description.trim() || undefined,
        discountType,
        discountValue: discountValueInUnits,
        eventId: selectedEventId !== "all" ? selectedEventId : undefined,
        validUntil: validUntil || undefined,
        maxUses: parsedMaxUses,
        isGift: couponMode === "gift",
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        giftMessage: giftMessage.trim() || undefined,
      });

      if (res.success) {
        setNotice(res.message || `Code ${code.toUpperCase()} successfully created.`);
        setIsModalOpen(false);
        // Refresh local state optimistically
        const newCoupon: TicketCoupon = {
          id: `coupon-${Date.now()}`,
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
          discountType,
          discountValue: discountValueInUnits,
          eventId: selectedEventId !== "all" ? selectedEventId : null,
          eventTitle: events.find((ev) => ev.id === selectedEventId)?.title || null,
          validUntil: validUntil || null,
          maxUses: parsedMaxUses || null,
          timesUsed: 0,
          isActive: true,
          isGift: couponMode === "gift",
          recipientName: recipientName.trim() || null,
          recipientEmail: recipientEmail.trim() || null,
          giftMessage: giftMessage.trim() || null,
          createdAt: new Date().toISOString(),
        };
        setCoupons((prev) => [newCoupon, ...prev]);
      } else {
        setIsError(true);
        setNotice(res.error || "Failed to create coupon code.");
      }
    } catch (err) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: TicketCoupon) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const nextState = !coupon.isActive;
      const res = await toggleCouponActiveAction(coupon.id, nextState);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextState } : c)),
        );
        setNotice(`Code ${coupon.code} is now ${nextState ? "ACTIVE" : "DISABLED"}.`);
      } else {
        setIsError(true);
        setNotice(res.error || "Failed to toggle status.");
      }
    } catch (err) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error updating coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (coupon: TicketCoupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteCouponAction(coupon.id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        setNotice(`Coupon code "${coupon.code}" has been removed.`);
      } else {
        setIsError(true);
        setNotice(res.error || "Failed to delete coupon.");
      }
    } catch (err) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "Error deleting coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredCoupons = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return coupons.filter((c) => {
      if (filterType === "promo" && c.isGift) return false;
      if (filterType === "gift" && !c.isGift) return false;
      if (filterType === "active" && !c.isActive) return false;

      if (q) {
        const matchCode = c.code.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        const matchRecip =
          c.recipientName?.toLowerCase().includes(q) || c.recipientEmail?.toLowerCase().includes(q);
        const matchPurch =
          c.purchaserName?.toLowerCase().includes(q) || c.purchaserEmail?.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchRecip && !matchPurch) return false;
      }

      return true;
    });
  }, [coupons, filterType, searchQuery]);

  const paginatedCoupons = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCoupons.slice(start, start + pageSize);
  }, [filteredCoupons, currentPage, pageSize]);

  // Metrics
  const activeCount = coupons.filter((c) => c.isActive).length;
  const giftPassCount = coupons.filter((c) => c.isGift).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Coupon &amp; Gift Pass Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure promotional discount codes, generate advance gift vouchers ($10, $20, $50,
            custom), and monitor redemption rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenModal("promo")}
            className="rounded-xl shadow-2xs text-xs"
          >
            + Promo Code
          </Button>
          <Button
            type="button"
            onClick={() => handleOpenModal("gift")}
            className="rounded-xl shadow-2xs text-xs bg-primary text-primary-foreground font-semibold"
          >
            + Buy / Gift Pass ($10, $20, $50)
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

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Total Codes
          </span>
          <p className="text-2xl font-bold font-serif text-foreground">{coupons.length}</p>
          <span className="text-[11px] text-muted-foreground">
            Promotional &amp; gifted vouchers
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Active Codes
          </span>
          <p className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </p>
          <span className="text-[11px] text-muted-foreground">Ready for checkout redemption</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Gift Passes Issued
          </span>
          <p className="text-2xl font-bold font-serif text-primary">{giftPassCount}</p>
          <span className="text-[11px] text-muted-foreground">
            Pre-paid passes gifted to recipients
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Total Redemptions
          </span>
          <p className="text-2xl font-bold font-serif text-foreground">{totalRedemptions}</p>
          <span className="text-[11px] text-muted-foreground">
            Admissions discounted or redeemed
          </span>
        </div>
      </div>

      {/* Table & Filtering */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-semibold text-sm">
              All Coupons &amp; Passes ({filteredCoupons.length})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              type="text"
              placeholder="Search code, recipient, purchaser..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs h-9 w-full sm:w-64 rounded-xl border-border/60 bg-card"
            />

            <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 text-xs overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: "All" },
                { id: "gift", label: "Gift Passes" },
                { id: "promo", label: "Promo Codes" },
                { id: "active", label: "Active" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilterType(f.id as typeof filterType);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filterType === f.id
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
                <th className="p-4">Code / Reference</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4">Redemptions</th>
                <th className="p-4">Recipient / Gift Info</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No coupons or gift passes match your query.
                  </td>
                </tr>
              ) : (
                paginatedCoupons.map((c) => {
                  const isExpired = c.validUntil && new Date(c.validUntil) < new Date();
                  const isMaxed =
                    c.maxUses !== null && c.maxUses !== undefined && c.timesUsed >= c.maxUses;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground text-sm tracking-wide">
                            {c.code}
                          </span>
                          {c.isGift ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-primary/10 text-primary border-primary/20"
                            >
                              Gift Pass
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Promo
                            </Badge>
                          )}
                        </div>
                        {c.description && (
                          <span className="text-[11px] text-muted-foreground block truncate max-w-xs mt-0.5">
                            {c.description}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-foreground font-mono">
                          {c.discountType === "percentage"
                            ? `${c.discountValue}% OFF`
                            : `$${(c.discountValue / 100).toFixed(2)} OFF`}
                        </span>
                        {c.eventTitle && (
                          <span className="block text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {c.eventTitle}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="text-xs font-medium text-foreground">
                          {c.timesUsed} / {c.maxUses !== null ? c.maxUses : "∞"}
                        </span>
                        {isMaxed && (
                          <span className="block text-[10px] text-rose-500 font-semibold">
                            Limit reached
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs">
                        {c.isGift ? (
                          <div className="space-y-0.5">
                            {c.recipientName ? (
                              <p className="font-semibold text-foreground">
                                To: {c.recipientName}{" "}
                                {c.recipientEmail && (
                                  <span className="text-muted-foreground font-normal">
                                    ({c.recipientEmail})
                                  </span>
                                )}
                              </p>
                            ) : (
                              <p className="text-muted-foreground italic">Unassigned recipient</p>
                            )}
                            {c.purchaserName && (
                              <p className="text-[11px] text-muted-foreground">
                                From: {c.purchaserName}
                              </p>
                            )}
                            {c.giftMessage && (
                              <p className="text-[10px] text-muted-foreground/80 italic line-clamp-1">
                                "{c.giftMessage}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Public promotional coupon
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {isExpired ? (
                          <Badge variant="outline" className="text-muted-foreground border-border">
                            Expired
                          </Badge>
                        ) : isMaxed ? (
                          <Badge variant="destructive">Redeemed</Badge>
                        ) : c.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(c)}
                            disabled={isSubmitting}
                            className="text-xs h-7 px-2.5"
                          >
                            {c.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(c)}
                            disabled={isSubmitting}
                            className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalItems={filteredCoupons.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50]}
          itemLabel="coupons & passes"
        />
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">
                {couponMode === "gift" ? "Issue Advance Gift Pass" : "Create Promotional Coupon"}
              </h2>
              <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenModal("gift")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    couponMode === "gift"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Gift Pass
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal("promo")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    couponMode === "promo"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Promo Code
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {couponMode === "gift"
                ? "Generate pre-paid passes ($10, $20, $50, custom) that members or guests can gift to friends and family for club event admissions."
                : "Create promotional discount codes for specific events or across all ticketed club admissions."}
            </p>

            <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
              {couponMode === "gift" && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Preset Value
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 30, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectGiftAmount(amt)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          discountValue === amt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        ${amt}.00
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="coupon-code"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Coupon / Pass Code *
                  </label>
                  <Input
                    id="coupon-code"
                    type="text"
                    required
                    placeholder="e.g. GIFT-20-ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon-discount-val"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    {discountType === "percentage"
                      ? "Discount Percentage (%) *"
                      : "Discount Amount ($ USD) *"}
                  </label>
                  <Input
                    id="coupon-discount-val"
                    type="number"
                    min="1"
                    max={discountType === "percentage" ? "100" : undefined}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>
              </div>

              {couponMode === "promo" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="discount-type"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Discount Type *
                    </label>
                    <select
                      id="discount-type"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                      className="w-full rounded-xl border border-border/60 bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed_amount">Fixed Amount ($ USD)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="max-uses"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Max Uses (Leave blank for unlimited)
                    </label>
                    <Input
                      id="max-uses"
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {couponMode === "gift" && (
                <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                  <span className="text-xs font-bold text-foreground block">
                    Gift Recipient Information (Optional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="recip-name"
                        className="block text-[11px] font-medium text-muted-foreground mb-1"
                      >
                        Recipient Full Name
                      </label>
                      <Input
                        id="recip-name"
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="recip-email"
                        className="block text-[11px] font-medium text-muted-foreground mb-1"
                      >
                        Recipient Email
                      </label>
                      <Input
                        id="recip-email"
                        type="email"
                        placeholder="e.g. jane@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="gift-msg"
                      className="block text-[11px] font-medium text-muted-foreground mb-1"
                    >
                      Personal Gift Message
                    </label>
                    <textarea
                      id="gift-msg"
                      rows={2}
                      placeholder="e.g. Happy Birthday! Enjoy the 2027 Garden Walk on us."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="event-restriction"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Event Applicability
                </label>
                <select
                  id="event-restriction"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Ticketed Events &amp; Garden Walk</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="coupon-desc"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Internal Notes / Description
                </label>
                <Input
                  id="coupon-desc"
                  type="text"
                  placeholder="e.g. Early subscriber benefit or Gift voucher purchased by member"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Creating..."
                    : couponMode === "gift"
                      ? "Issue Gift Pass"
                      : "Create Promo Code"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
