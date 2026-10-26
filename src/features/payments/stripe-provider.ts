import "server-only";

import crypto from "node:crypto";
import type { CreateCheckoutInput, CheckoutResult } from "./types";

export interface CreateTicketCheckoutInput {
  ticketOrderId: string;
  orderReference: string;
  eventTitle: string;
  quantity: number;
  unitPriceCents: number;
  currency?: string;
  returnPath: string;
  purchaserEmail: string;
  purchaserName: string;
  eventId?: string;
}

export interface StripeConfigStatus {
  isConfigured: boolean;
  isTestMode: boolean;
  publishableKeyAvailable: boolean;
  secretKeyAvailable: boolean;
  webhookSecretAvailable: boolean;
}

export class StripePaymentProvider {
  getConfigStatus(): StripeConfigStatus {
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    const isTestMode =
      secretKey.startsWith("sk_test_") ||
      secretKey.startsWith("rkcs_test_") ||
      secretKey.startsWith("rk_test_") ||
      publishableKey.startsWith("pk_test_");
    const isConfigured = Boolean(secretKey && publishableKey);

    return {
      isConfigured,
      isTestMode,
      publishableKeyAvailable: Boolean(publishableKey),
      secretKeyAvailable: Boolean(secretKey),
      webhookSecretAvailable: Boolean(webhookSecret),
    };
  }

  /**
   * Creates a sandbox/production Stripe Checkout session.
   * STRICT SECURITY CONSTRAINTS:
   * - Authoritative pricing: Amount is passed from server-verified database terms, never from client requests.
   * - Test mode only: Fails closed if live keys are detected during local development or testing.
   * - Return URLs never confirm payment or approve membership. Confirmation requires signed webhook verification.
   */
  async createCheckoutSession(
    input: CreateCheckoutInput & {
      termYear: number;
      userId: string;
      customerEmail?: string;
    },
  ): Promise<CheckoutResult> {
    const status = this.getConfigStatus();

    // Guard: Prevent live charges during testing
    if (process.env.NODE_ENV !== "production" && !status.isTestMode && status.isConfigured) {
      throw new Error(
        "CRITICAL SECURITY REJECTION: Live Stripe keys detected in development/test environment. Only sandbox/test keys (sk_test_*, rkcs_test_*) are permitted.",
      );
    }

    if (!status.isConfigured) {
      // Return structured fallback contract when unconfigured
      const sessionRef = `cs_test_${crypto.randomBytes(12).toString("hex")}`;
      return {
        checkoutUrl: `${input.returnPath}?session_id=${sessionRef}&provider=stripe_sandbox_unconfigured`,
        providerReference: sessionRef,
      };
    }

    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("client_reference_id", input.paymentId);
    if (input.customerEmail) {
      params.append("customer_email", input.customerEmail);
    }
    params.append("metadata[paymentId]", input.paymentId);
    if (input.membershipId) {
      params.append("metadata[membershipId]", input.membershipId);
    }
    params.append("metadata[userId]", input.userId);
    params.append("metadata[termYear]", String(input.termYear));

    params.append("line_items[0][price_data][currency]", input.currency.toLowerCase());
    params.append("line_items[0][price_data][unit_amount]", String(input.amountCents));
    params.append(
      "line_items[0][price_data][product_data][name]",
      `Saugatuck Douglas Garden Club — ${input.termYear} Annual Membership Dues`,
    );
    params.append(
      "line_items[0][price_data][product_data][description]",
      `Annual membership dues for the ${input.termYear} calendar season (Jan 1 – Dec 31). Non-recurring.`,
    );
    params.append("line_items[0][quantity]", "1");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
    const returnUrl =
      input.returnPath.startsWith("http://") || input.returnPath.startsWith("https://")
        ? input.returnPath
        : `${siteUrl}${input.returnPath.startsWith("/") ? "" : "/"}${input.returnPath}`;
    const successSeparator = returnUrl.includes("?") ? "&" : "?";
    const cancelSeparator = returnUrl.includes("?") ? "&" : "?";

    params.append(
      "success_url",
      `${returnUrl}${successSeparator}session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
    );
    params.append("cancel_url", `${returnUrl}${cancelSeparator}payment_status=cancelled`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const message =
        errorData?.error?.message || `Stripe API error: ${response.status} ${response.statusText}`;
      throw new Error(`Stripe Checkout creation failed: ${message}`);
    }

    const sessionData = (await response.json()) as { id: string; url: string };
    return {
      checkoutUrl: sessionData.url,
      providerReference: sessionData.id,
    };
  }

  /**
   * Creates a Stripe Checkout session for event ticket orders (e.g. Annual Garden Walk).
   * Strict constraints:
   * - Unit price from server-verified event record.
   * - Metadata includes type: ticket_order and orderReference.
   * - Never creates or updates memberships (strict bylaw separation).
   */
  async createTicketCheckoutSession(input: CreateTicketCheckoutInput): Promise<CheckoutResult> {
    const status = this.getConfigStatus();

    // Guard: Prevent live charges during testing
    if (process.env.NODE_ENV !== "production" && !status.isTestMode && status.isConfigured) {
      throw new Error(
        "CRITICAL SECURITY REJECTION: Live Stripe keys detected in development/test environment. Only sandbox/test keys (sk_test_*, rkcs_test_*) are permitted.",
      );
    }

    if (!status.isConfigured) {
      const fallbackRef = `cs_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      return {
        checkoutUrl: `${input.returnPath}?session_id=${fallbackRef}&order_ref=${input.orderReference}&simulated=true`,
        providerReference: fallbackRef,
      };
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const currency = (input.currency || "USD").toLowerCase();

    const params = new URLSearchParams();
    params.append("mode", "payment");
    if (input.purchaserEmail) {
      params.append("customer_email", input.purchaserEmail);
    }

    params.append("metadata[type]", "ticket_order");
    params.append("metadata[ticketOrderId]", input.ticketOrderId);
    params.append("metadata[orderReference]", input.orderReference);
    params.append("metadata[purchaserEmail]", input.purchaserEmail);
    params.append("metadata[purchaserName]", input.purchaserName);
    params.append("metadata[quantity]", String(input.quantity));
    if (input.eventId) {
      params.append("metadata[eventId]", input.eventId);
    }

    params.append("line_items[0][price_data][currency]", currency);
    params.append("line_items[0][price_data][unit_amount]", String(input.unitPriceCents));
    params.append(
      "line_items[0][price_data][product_data][name]",
      `${input.eventTitle} — Advance Admission Ticket`,
    );
    params.append(
      "line_items[0][price_data][product_data][description]",
      `Advance admission pass for ${input.quantity} person(s). Non-refundable event admission.`,
    );
    params.append("line_items[0][quantity]", String(input.quantity));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
    const returnUrl =
      input.returnPath.startsWith("http://") || input.returnPath.startsWith("https://")
        ? input.returnPath
        : `${siteUrl}${input.returnPath.startsWith("/") ? "" : "/"}${input.returnPath}`;
    const separator = returnUrl.includes("?") ? "&" : "?";

    params.append(
      "success_url",
      `${returnUrl}${separator}session_id={CHECKOUT_SESSION_ID}&order_ref=${input.orderReference}&payment_status=success`,
    );
    params.append(
      "cancel_url",
      `${returnUrl}${separator}order_ref=${input.orderReference}&payment_status=cancelled`,
    );

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const message =
        errorData?.error?.message || `Stripe API error: ${response.status} ${response.statusText}`;
      throw new Error(`Stripe Ticket Checkout creation failed: ${message}`);
    }

    const sessionData = (await response.json()) as { id: string; url: string };
    return {
      checkoutUrl: sessionData.url,
      providerReference: sessionData.id,
    };
  }

  /**
   * Validates Stripe webhook signatures.
   * Verifies HMAC-SHA256 signature using STRIPE_WEBHOOK_SECRET.
   * Enforces timestamp tolerance (default: 300 seconds) against replay attacks.
   * Supports multiple v1 signatures during secret rotation.
   * Strictly fails closed if STRIPE_WEBHOOK_SECRET is not configured or signature is invalid.
   */
  verifyWebhookSignature(
    payload: string,
    signatureHeader: string | null,
    toleranceSeconds: number = 300,
  ): boolean {
    if (!signatureHeader?.includes("t=") || !signatureHeader.includes("v1=")) {
      return false;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Strictly fail closed if STRIPE_WEBHOOK_SECRET is not configured
      return false;
    }

    try {
      const parts = signatureHeader.split(",");
      const timestampPart = parts.find((p) => p.startsWith("t="));
      const sigParts = parts.filter((p) => p.startsWith("v1="));

      if (!timestampPart || sigParts.length === 0) return false;

      const timestamp = timestampPart.slice(2);
      const timestampNum = parseInt(timestamp, 10);
      if (Number.isNaN(timestampNum)) return false;

      // Timestamp tolerance check against replay attacks (skip if toleranceSeconds <= 0)
      if (toleranceSeconds > 0) {
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestampNum) > toleranceSeconds) {
          return false;
        }
      }

      const signedPayload = `${timestamp}.${payload}`;
      const computedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload, "utf8")
        .digest("hex");

      const computedBuffer = Buffer.from(computedSig, "hex");

      return sigParts.some((sigPart) => {
        const expectedSig = sigPart.slice(3);
        try {
          const expectedBuffer = Buffer.from(expectedSig, "hex");
          if (computedBuffer.length !== expectedBuffer.length) return false;
          return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }

  /**
   * Helper utility to generate valid Stripe webhook signatures for testing and simulation.
   */
  generateWebhookSignature(payload: string, secret: string, timestamp?: number): string {
    const ts = timestamp ?? Math.floor(Date.now() / 1000);
    const signedPayload = `${ts}.${payload}`;
    const sig = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
    return `t=${ts},v1=${sig}`;
  }
}

export const stripePaymentProvider = new StripePaymentProvider();
