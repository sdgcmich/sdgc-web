import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { StripePaymentProvider } from "@/features/payments/stripe-provider";

describe("StripePaymentProvider Unit & Sandbox Contract Tests", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getConfigStatus & Key Detection", () => {
    it("reports unconfigured when keys are absent", () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const provider = new StripePaymentProvider();
      const status = provider.getConfigStatus();

      expect(status.isConfigured).toBe(false);
      expect(status.isTestMode).toBe(false);
      expect(status.publishableKeyAvailable).toBe(false);
      expect(status.secretKeyAvailable).toBe(false);
      expect(status.webhookSecretAvailable).toBe(false);
    });

    it("detects test mode with standard sk_test_ and pk_test_ keys", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_12345";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_12345";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_12345";

      const provider = new StripePaymentProvider();
      const status = provider.getConfigStatus();

      expect(status.isConfigured).toBe(true);
      expect(status.isTestMode).toBe(true);
      expect(status.secretKeyAvailable).toBe(true);
      expect(status.publishableKeyAvailable).toBe(true);
      expect(status.webhookSecretAvailable).toBe(true);
    });

    it("detects test mode with official Stripe sandbox restricted keys (rkcs_test_)", () => {
      process.env.STRIPE_SECRET_KEY = "rkcs_test_mockSandboxKey999";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_mockSandboxPubKey";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_mockSecret";

      const provider = new StripePaymentProvider();
      const status = provider.getConfigStatus();

      expect(status.isConfigured).toBe(true);
      expect(status.isTestMode).toBe(true);
    });

    it("detects live mode and prevents unconfigured status if publishable key is missing", () => {
      process.env.STRIPE_SECRET_KEY = "sk_live_productionSecret";
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      const provider = new StripePaymentProvider();
      const status = provider.getConfigStatus();

      expect(status.isConfigured).toBe(false);
      expect(status.isTestMode).toBe(false);
    });
  });

  describe("Security Guards: Live Key Rejection in Dev/Test", () => {
    it("fails closed with critical error if sk_live_ keys are passed in non-production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";
      process.env.STRIPE_SECRET_KEY = "sk_live_forbiddenInTest";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_forbiddenInTest";

      const provider = new StripePaymentProvider();
      await expect(
        provider.createCheckoutSession({
          paymentId: "pay_123",
          amountCents: 5000,
          currency: "USD",
          returnPath: "/membership",
          termYear: 2026,
          userId: "user_123",
        }),
      ).rejects.toThrow(/Live Stripe keys detected in development\/test environment/);
    });
  });

  describe("Checkout Session Creation", () => {
    it("returns structured fallback when Stripe is unconfigured", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      const provider = new StripePaymentProvider();
      const result = await provider.createCheckoutSession({
        paymentId: "pay_fallback_01",
        amountCents: 5000,
        currency: "USD",
        returnPath: "/membership",
        termYear: 2026,
        userId: "user_456",
      });

      expect(result.providerReference).toMatch(/^cs_test_/);
      expect(result.checkoutUrl).toContain("provider=stripe_sandbox_unconfigured");
    });

    it("calls Stripe API and returns hosted checkout URL when configured", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_validSecretKey";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_validPubKey";

      const mockResponse = {
        id: "cs_test_mockSessionId123",
        url: "https://checkout.stripe.com/c/pay/cs_test_mockSessionId123",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const provider = new StripePaymentProvider();
      const result = await provider.createCheckoutSession({
        paymentId: "pay_real_01",
        amountCents: 5000,
        currency: "USD",
        returnPath: "http://127.0.0.1:3000/membership",
        membershipId: "mem_real_01",
        termYear: 2026,
        userId: "user_789",
        customerEmail: "member@example.com",
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const call = fetchSpy.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call ?? [];
      expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
      expect(options?.method).toBe("POST");
      expect(options?.headers).toMatchObject({
        Authorization: "Bearer sk_test_validSecretKey",
      });

      const body = options?.body as string;
      expect(body).toContain("mode=payment");
      expect(body).toContain("client_reference_id=pay_real_01");
      expect(body).toContain("customer_email=member%40example.com");
      expect(body).toContain("line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=5000");
      expect(body).toContain("metadata%5BtermYear%5D=2026");

      expect(result.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_test_mockSessionId123");
      expect(result.providerReference).toBe("cs_test_mockSessionId123");
    });

    it("throws descriptive error when Stripe API returns an error response", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_invalidKey";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_invalidKey";

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({
          error: { message: "Invalid API Key provided" },
        }),
      } as Response);

      const provider = new StripePaymentProvider();
      await expect(
        provider.createCheckoutSession({
          paymentId: "pay_err",
          amountCents: 5000,
          currency: "USD",
          returnPath: "/membership",
          termYear: 2026,
          userId: "user_err",
        }),
      ).rejects.toThrow(/Stripe Checkout creation failed: Invalid API Key provided/);
    });
  });

  describe("Webhook Signature Verification & Replay Protection", () => {
    const testSecret = "whsec_test_secret_for_unit_tests_12345";
    const testPayload = JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_123", payment_status: "paid" } },
    });

    it("fails closed when STRIPE_WEBHOOK_SECRET is missing", () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const provider = new StripePaymentProvider();
      const validSig = provider.generateWebhookSignature(testPayload, testSecret);

      expect(provider.verifyWebhookSignature(testPayload, validSig)).toBe(false);
    });

    it("verifies a valid HMAC-SHA256 signature generated with the correct secret", () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
      const provider = new StripePaymentProvider();
      const validSig = provider.generateWebhookSignature(testPayload, testSecret);

      expect(provider.verifyWebhookSignature(testPayload, validSig)).toBe(true);
    });

    it("rejects an invalid signature generated with the wrong secret", () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
      const provider = new StripePaymentProvider();
      const invalidSig = provider.generateWebhookSignature(testPayload, "whsec_wrong_secret");

      expect(provider.verifyWebhookSignature(testPayload, invalidSig)).toBe(false);
    });

    it("rejects when the payload body has been tampered with", () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
      const provider = new StripePaymentProvider();
      const validSig = provider.generateWebhookSignature(testPayload, testSecret);
      const tamperedPayload = testPayload.replace("cs_123", "cs_tampered");

      expect(provider.verifyWebhookSignature(tamperedPayload, validSig)).toBe(false);
    });

    it("rejects missing or malformed signature headers", () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
      const provider = new StripePaymentProvider();

      expect(provider.verifyWebhookSignature(testPayload, null)).toBe(false);
      expect(provider.verifyWebhookSignature(testPayload, "")).toBe(false);
      expect(provider.verifyWebhookSignature(testPayload, "invalid_format")).toBe(false);
      expect(provider.verifyWebhookSignature(testPayload, "t=123")).toBe(false);
      expect(provider.verifyWebhookSignature(testPayload, "v1=abc")).toBe(false);
    });

    it("enforces timestamp tolerance to prevent replay attacks (older than 300s)", () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
      const provider = new StripePaymentProvider();
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const expiredSig = provider.generateWebhookSignature(
        testPayload,
        testSecret,
        expiredTimestamp,
      );

      // Default tolerance: 300 seconds
      expect(provider.verifyWebhookSignature(testPayload, expiredSig)).toBe(false);
      // Explicitly disabled tolerance: accepts
      expect(provider.verifyWebhookSignature(testPayload, expiredSig, 0)).toBe(true);
    });

    it("supports secret rotation with multiple v1 signatures in the header", () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
      const provider = new StripePaymentProvider();
      const now = Math.floor(Date.now() / 1000);

      const oldSig = provider.generateWebhookSignature(testPayload, "whsec_retired_old_key", now);
      const newSigPart = provider
        .generateWebhookSignature(testPayload, testSecret, now)
        .split(",")[1]; // v1=...

      const multiSigHeader = `${oldSig},${newSigPart}`;

      expect(provider.verifyWebhookSignature(testPayload, multiSigHeader)).toBe(true);
    });
  });

  describe("retrieveCheckoutSession", () => {
    it("fails if STRIPE_SECRET_KEY is missing", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const provider = new StripePaymentProvider();
      await expect(provider.retrieveCheckoutSession("cs_test_123")).rejects.toThrow(
        "Stripe secret key not configured.",
      );
    });

    it("retrieves and parses session successfully", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_mockKey";
      const provider = new StripePaymentProvider();

      const mockResponse = {
        id: "cs_test_123",
        status: "complete",
        payment_status: "paid",
        client_reference_id: "pay_123",
        payment_intent: "pi_123",
        amount_total: 5000,
        currency: "usd",
        metadata: {
          paymentId: "pay_123",
          userId: "usr_123",
          termYear: "2026",
        },
        customer_details: { email: "member@example.com" },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const session = await provider.retrieveCheckoutSession("cs_test_123");
      expect(session.id).toBe("cs_test_123");
      expect(session.status).toBe("complete");
      expect(session.paymentStatus).toBe("paid");
      expect(session.paymentIntentId).toBe("pi_123");
      expect(session.amountTotal).toBe(5000);
      expect(session.metadata.termYear).toBe("2026");
      expect(session.customerEmail).toBe("member@example.com");
    });

    it("throws on API error with status text", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_mockKey";
      const provider = new StripePaymentProvider();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: { message: "No such checkout session: cs_fake" } }),
      });

      await expect(provider.retrieveCheckoutSession("cs_fake")).rejects.toThrow(
        "No such checkout session: cs_fake",
      );
    });
  });
});
