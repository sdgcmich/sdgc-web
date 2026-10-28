"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { printElement } from "@/lib/print";
import { purchaseGiftCouponAction } from "../actions";

export function GiftPassCard() {
  const searchParams = useSearchParams();
  const returnCode = searchParams.get("code");
  const paymentStatus = searchParams.get("payment_status");
  const isSuccessReturn = paymentStatus === "success" && Boolean(returnCode);

  const [presetAmount, setPresetAmount] = React.useState<number>(15);
  const [customAmount, setCustomAmount] = React.useState<string>("");
  const [isCustom, setIsCustom] = React.useState<boolean>(false);

  const [recipientName, setRecipientName] = React.useState<string>("");
  const [recipientEmail, setRecipientEmail] = React.useState<string>("");
  const [giftMessage, setGiftMessage] = React.useState<string>("");

  const [purchaserName, setPurchaserName] = React.useState<string>("");
  const [purchaserEmail, setPurchaserEmail] = React.useState<string>("");

  const [paymentMethod, setPaymentMethod] = React.useState<"stripe" | "check">("stripe");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [completedGift, setCompletedGift] = React.useState<{
    code: string;
    amountDollars: number;
    recipientName: string;
    recipientEmail: string;
    purchaserName: string;
    giftMessage?: string;
  } | null>(null);

  React.useEffect(() => {
    if (isSuccessReturn && returnCode && !completedGift) {
      setCompletedGift({
        code: returnCode.toUpperCase(),
        amountDollars: 15, // fallback display
        recipientName: "Gift Recipient",
        recipientEmail: "",
        purchaserName: "SDGC Friend",
      });
    }
  }, [isSuccessReturn, returnCode, completedGift]);

  const activeAmount = isCustom ? parseFloat(customAmount) || 0 : presetAmount;

  const handleSelectPreset = (amt: number) => {
    setIsCustom(false);
    setPresetAmount(amt);
    setCustomAmount("");
  };

  const handleCustomChange = (val: string) => {
    setIsCustom(true);
    setCustomAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeAmount < 5) {
      setErrorMessage("Please enter an amount of at least $5.00.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await purchaseGiftCouponAction({
        amountDollars: activeAmount,
        purchaserName: purchaserName.trim(),
        purchaserEmail: purchaserEmail.trim(),
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        giftMessage: giftMessage.trim() || undefined,
        paymentMethod,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to process gift pass order.");
        setIsSubmitting(false);
        return;
      }

      // If Stripe Checkout URL was generated, redirect
      if (res.data?.checkoutUrl && !res.data.isSimulation && paymentMethod === "stripe") {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      // Completed immediately via local sandbox or check
      setCompletedGift({
        code: res.data?.code || "GIFT-PASS",
        amountDollars: activeAmount,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        purchaserName: purchaserName.trim(),
        giftMessage: giftMessage.trim() || undefined,
      });
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  // Completed Gift Certificate View
  if (completedGift) {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4 space-y-6">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
          <Badge variant="success" className="px-3 py-1 text-xs">
            Gift Pass Confirmed
          </Badge>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Your Gift Pass Has Been Issued!
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            A confirmation has been recorded. Share this digital voucher code with{" "}
            <span className="font-bold text-foreground">{completedGift.recipientName}</span> to
            redeem for Garden Walk admissions.
          </p>
        </div>

        {/* Certificate Card Printable */}
        <div
          id="gift-certificate"
          className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-md space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-primary">
                Saugatuck Douglas Garden Club
              </span>
              <h3 className="font-serif text-2xl font-bold text-foreground">
                Garden Walk &amp; Event Admission Gift Voucher
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Pass Value</span>
              <span className="font-serif text-3xl font-bold text-primary">
                ${completedGift.amountDollars.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">
                  PRESENTED TO:
                </span>
                <span className="text-base font-bold text-foreground block">
                  {completedGift.recipientName}
                </span>
                {completedGift.recipientEmail && (
                  <span className="text-xs text-muted-foreground">
                    {completedGift.recipientEmail}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground block">
                  GIFTED BY:
                </span>
                <span className="text-base font-bold text-foreground block">
                  {completedGift.purchaserName}
                </span>
              </div>
            </div>

            {completedGift.giftMessage && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs italic text-foreground">
                "{completedGift.giftMessage}"
              </div>
            )}

            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-card p-5 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Redemption Coupon Code
              </span>
              <span className="font-mono text-3xl font-extrabold tracking-widest text-primary block select-all">
                {completedGift.code}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Apply this code in the "Coupon or Gift Pass" box at checkout to deduct $
                {completedGift.amountDollars.toFixed(2)} from your ticket admissions.
              </p>
            </div>
          </div>

          <div className="border-t border-border/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Valid for online advance tickets or admissions at the event welcome table.</span>
            <span>Non-refundable &bull; Single-use voucher</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
          <Button
            type="button"
            onClick={() => printElement("gift-certificate", "SDGC Gift Pass Certificate")}
            className="flex-1 rounded-2xl"
          >
            Print Gift Certificate
          </Button>
          <Link
            href={"/tickets-checkout" as Route}
            className="flex-1 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Redeem at Tickets Checkout &rarr;
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCompletedGift(null);
              setRecipientName("");
              setRecipientEmail("");
              setGiftMessage("");
            }}
            className="rounded-2xl"
          >
            Gift Another Pass
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
          Share the Garden Walk
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          Gift an Admission Pass or Credit
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Share the beauty of Saugatuck and Douglas gardens. Purchase advance gift passes ($10, $15,
          $20, $30, $50, custom) for friends, family, or neighbors. Each pass receives a unique
          digital code redeemable for garden walk tickets or club events.
        </p>
      </div>

      {errorMessage && (
        <div
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-800 dark:text-rose-200"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Pass Value */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Step 1 &bull; Choose Pass Value
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground">Select Gift Amount</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { amt: 15, label: "1 Tour Pass", desc: "Single admission" },
                { amt: 30, label: "2 Tour Passes", desc: "Pair admission" },
                { amt: 50, label: "Club Supporter", desc: "Passes + donation" },
                { amt: 10, label: "Youth / Student", desc: "Student pass" },
                { amt: 20, label: "Event Credit", desc: "Day-of admission" },
              ].map((item) => (
                <button
                  key={item.amt}
                  type="button"
                  onClick={() => handleSelectPreset(item.amt)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    !isCustom && presetAmount === item.amt
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground"
                      : "border-border/60 hover:border-primary/40 text-foreground"
                  }`}
                >
                  <span className="font-serif text-xl font-bold block">${item.amt}</span>
                  <span className="text-xs font-semibold block text-primary mt-0.5">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">{item.desc}</span>
                </button>
              ))}

              {/* Custom option */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isCustom
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border/60"
                }`}
              >
                <span className="text-xs font-semibold block text-muted-foreground mb-1">
                  Custom ($)
                </span>
                <Input
                  type="number"
                  min="5"
                  step="1"
                  placeholder="e.g. 25"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Recipient Details */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Step 2 &bull; Recipient Information
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground">Who is this gift for?</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="gift-recip-name"
                    className="text-xs font-semibold text-foreground block mb-1"
                  >
                    Recipient Full Name *
                  </label>
                  <Input
                    id="gift-recip-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gift-recip-email"
                    className="text-xs font-semibold text-foreground block mb-1"
                  >
                    Recipient Email *
                  </label>
                  <Input
                    id="gift-recip-email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="gift-personal-msg"
                  className="text-xs font-semibold text-foreground block mb-1"
                >
                  Personal Gift Message (Optional)
                </label>
                <textarea
                  id="gift-personal-msg"
                  rows={2}
                  placeholder="e.g. Wishing you a wonderful summer! Hope you enjoy this year's Garden Walk tour."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-card p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Purchaser Details */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Step 3 &bull; Your Information
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground">
              Sender &amp; Receipt Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="gift-purch-name"
                  className="text-xs font-semibold text-foreground block mb-1"
                >
                  Your Full Name *
                </label>
                <Input
                  id="gift-purch-name"
                  type="text"
                  required
                  placeholder="Bob Smith"
                  value={purchaserName}
                  onChange={(e) => setPurchaserName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="gift-purch-email"
                  className="text-xs font-semibold text-foreground block mb-1"
                >
                  Your Email (for receipt) *
                </label>
                <Input
                  id="gift-purch-email"
                  type="email"
                  required
                  placeholder="bob@example.com"
                  value={purchaserEmail}
                  onChange={(e) => setPurchaserEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Payment Provider Selection */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Step 4 &bull; Payment Method
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground">Select Payment System</h2>
            <p className="text-xs text-muted-foreground">
              Choose your preferred payment method. Transactions are secured by Stripe with
              industry-standard 256-bit encryption.
            </p>

            <div className="space-y-3">
              <label
                htmlFor="pay-stripe"
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === "stripe"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60 hover:bg-muted/30"
                }`}
              >
                <input
                  id="pay-stripe"
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      Stripe Secure Checkout
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                        Recommended
                      </Badge>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Cards &bull; Apple Pay &bull; Google Pay
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Instant digital voucher generation. Redirects to Stripe's secure checkout page
                    to complete payment.
                  </p>
                </div>
              </label>

              <label
                htmlFor="pay-check"
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === "check"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60 hover:bg-muted/30"
                }`}
              >
                <input
                  id="pay-check"
                  type="radio"
                  name="paymentMethod"
                  value="check"
                  checked={paymentMethod === "check"}
                  onChange={() => setPaymentMethod("check")}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-bold text-foreground block">
                    Mail-in Check (Offline Voucher)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Reserve voucher code now; mail check payable to Saugatuck Douglas Garden Club,
                    P.O. Box 754, Douglas, MI 49453.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-border/80 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Gift Order Summary
              </span>
              <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
                Pass Voucher Total
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Voucher Credit Value</span>
                <span className="font-semibold text-foreground">${activeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-semibold text-foreground">
                  {recipientName.trim() || "Unspecified"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Processing Fees</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  FREE (Covered by Club)
                </span>
              </div>

              <div className="flex justify-between items-baseline border-t border-border/80 pt-4 text-lg font-bold">
                <span className="font-serif text-foreground">Total Due</span>
                <span className="font-serif text-3xl text-primary font-bold">
                  ${activeAmount.toFixed(2)} USD
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting || !purchaserName.trim() || !recipientName.trim() || activeAmount < 5
              }
              className="w-full rounded-2xl py-4 font-serif text-base font-bold shadow-md cursor-pointer"
            >
              {isSubmitting
                ? "Processing..."
                : `Proceed to ${paymentMethod === "stripe" ? "Stripe Checkout" : "Confirm Pass"}`}
            </Button>

            <div className="text-[11px] text-muted-foreground text-center space-y-1">
              <p>100% of proceeds fund local civic plantings, public parks, and scholarships.</p>
              <p>Redeemable online at tickets checkout or at the tour gate.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
