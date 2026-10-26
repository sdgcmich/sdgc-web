import { expect, test } from "@playwright/test";

test.describe("Live Stripe Sandbox Browser Checkout Suite", () => {
  test.setTimeout(90_000);

  test.beforeEach(() => {
    test.skip(
      !process.env.STRIPE_SECRET_KEY || process.env.LOCAL_PAYMENTS_SIMULATION === "true",
      "Live Stripe test requires real STRIPE_SECRET_KEY and LOCAL_PAYMENTS_SIMULATION=false",
    );
  });

  test("live browser checkout for event tickets redirects to Stripe Checkout Sandbox", async ({
    page,
  }) => {
    // 1. Visit /tickets-checkout
    await page.goto("/tickets-checkout");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Event Ticket Checkout/i);

    // 2. Fill in customer details
    await page.locator("#purchaser-name").fill("Jane Sandbox Visitor");
    await page.locator("#purchaser-email").fill("jane.sandbox@sdgc.local");
    await page.locator("#purchaser-phone").fill("(269) 555-0199");

    // 3. Submit checkout form
    const submitBtn = page.getByRole("button", { name: /Confirm Advance Tour Order/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 4. Assert real navigation to Stripe Checkout hosted page
    await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: 30_000 });
    expect(page.url()).toContain("checkout.stripe.com");

    // 5. Verify Stripe Checkout UI elements loaded
    await page.waitForSelector("text=Annual Garden Walk Fundraiser", { timeout: 20_000 });
    await expect(page.getByText("Annual Garden Walk Fundraiser", { exact: false })).toBeVisible();

    // 6. Capture screenshot of live Stripe Sandbox Checkout
    await page.screenshot({
      path: "test-results/stripe-tickets-checkout-live.png",
      fullPage: true,
    });
  });

  test("live browser checkout for membership dues redirects to Stripe Checkout Sandbox", async ({
    page,
  }) => {
    // 0. Ensure user has unpaid dues status for clean checkout flow
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    );
    const { data: users } = await supabase.auth.admin.listUsers();
    const pendingUser = users?.users.find((u) => u.email === "pending@sdgc.local");
    if (pendingUser) {
      await supabase.from("payments").delete().eq("user_id", pendingUser.id);
      await supabase.from("memberships").delete().eq("user_id", pendingUser.id);
    }

    // 1. Log in as pending member
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("pending@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/(membership|dues|profile)/, { timeout: 20_000 });

    // 2. Navigate to /dues
    await page.goto("/dues");
    await expect(page.getByRole("heading", { name: /Calendar Year/i })).toBeVisible();

    // 3. Click Pay Annual Dues Online
    const payBtn = page.getByRole("button", { name: /Pay.*Dues Online/i });
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // 4. Assert real navigation to Stripe Checkout hosted page
    await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: 30_000 });
    expect(page.url()).toContain("checkout.stripe.com");

    // 5. Verify Stripe Checkout UI elements loaded
    await page.waitForSelector("text=Annual Membership Dues", { timeout: 20_000 });
    await expect(
      page.getByText("Saugatuck Douglas Garden Club — 2026 Annual Membership Dues"),
    ).toBeVisible();

    // 6. Capture screenshot of live Stripe Sandbox Checkout
    await page.screenshot({ path: "test-results/stripe-dues-checkout-live.png", fullPage: true });
  });
});
