import "./setup";
import { describe, expect, it } from "vitest";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";

describe("Live Stripe Sandbox API Verification", () => {
  it("creates a real Stripe Checkout Session on Stripe's servers using sandbox keys", async () => {
    const config = stripePaymentProvider.getConfigStatus();
    expect(config.isConfigured).toBe(true);
    expect(config.isTestMode).toBe(true);
    expect(config.secretKeyAvailable).toBe(true);

    const testPaymentId = `live_test_pay_${crypto.randomUUID().slice(0, 8)}`;
    const testMembershipId = `live_test_mem_${crypto.randomUUID().slice(0, 8)}`;

    // Call real Stripe API
    const result = await stripePaymentProvider.createCheckoutSession({
      paymentId: testPaymentId,
      amountCents: 5000,
      currency: "USD",
      returnPath: "http://127.0.0.1:3000/membership",
      membershipId: testMembershipId,
      userId: "usr_sandbox_test",
      termYear: 2026,
      customerEmail: "sandbox.tester@example.com",
    });

    // Verify Stripe returned a real checkout session
    expect(result.providerReference).toBeDefined();
    expect(result.providerReference).toMatch(/^cs_test_/);
    expect(result.checkoutUrl).toBeDefined();
    expect(result.checkoutUrl).toContain("checkout.stripe.com");

    // Fetch the session directly from Stripe API to verify its server state
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const stripeGetRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${result.providerReference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    expect(stripeGetRes.status).toBe(200);
    const sessionData = await stripeGetRes.json();
    expect(sessionData.id).toBe(result.providerReference);
    expect(sessionData.amount_total).toBe(5000);
    expect(sessionData.currency).toBe("usd");
    expect(sessionData.status).toBe("open");
    expect(sessionData.metadata.paymentId).toBe(testPaymentId);
    expect(sessionData.metadata.membershipId).toBe(testMembershipId);
    expect(sessionData.metadata.termYear).toBe("2026");
  });
});
