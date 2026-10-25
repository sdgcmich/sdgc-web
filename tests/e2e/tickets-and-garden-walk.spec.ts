import { expect, test } from "@playwright/test";

test.describe("Phase 3: Garden Walk & Ticket Management Module E2E", () => {
  test.setTimeout(60_000);

  test("public visitor reviews Garden Walk and completes advance ticket reservation", async ({
    page,
  }) => {
    // 1. Visit /garden-walk
    await page.goto("/garden-walk");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Garden Walk/i);
    await expect(page.getByText(/Coastal Sanctuaries|Tour Information/i).first()).toBeVisible();

    // 2. Click Reserve Tickets CTA
    const ticketCta = page.getByRole("link", { name: /Tickets|Reserve|Buy/i }).first();
    await ticketCta.click();
    await expect(page).toHaveURL(/\/tickets-checkout/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Event Ticket Checkout/i);

    // 3. Fill out ticket checkout form
    await page.locator("#purchaser-name").fill("Sarah Jenkins");
    await page.locator("#purchaser-email").fill("sarah.jenkins@example.com");
    await page.locator("#purchaser-phone").fill("(269) 555-0188");
    await page.locator("#purchaser-notes").fill("Requested large-print garden map");

    // Submit order
    const submitBtn = page.getByRole("button", { name: /Confirm Advance Tour Order/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 4. Assert Confirmation Screen
    await expect(page.locator("#order-reference-code")).toBeVisible({ timeout: 15_000 });
    const orderRef = await page.locator("#order-reference-code").innerText();
    expect(orderRef).toMatch(/^SDGC-TKT-202[67]-[A-F0-9]{6}$/);

    await expect(page.getByText("Sarah Jenkins")).toBeVisible();
    await expect(page.getByText("sarah.jenkins@example.com")).toBeVisible();
    await expect(page.getByText(/Saugatuck City Hall/i)).toBeVisible();
  });

  test("admin accesses tickets management, filters orders, toggles check-in and exports roster", async ({
    page,
  }) => {
    // 1. Sign in as Admin
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/(admin|profile)/, { timeout: 15_000 });

    // 2. Navigate to /admin/tickets
    await page.goto("/admin/tickets");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Garden Walk & Ticket Management",
    );

    // 3. Verify Metric Cards
    await expect(page.getByText("Tickets Sold", { exact: true })).toBeVisible();
    await expect(page.getByText("Ticket Revenue", { exact: true })).toBeVisible();
    await expect(page.getByText("Checked In", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pending Arrival", { exact: true })).toBeVisible();

    // 4. Verify orders table is rendered
    await expect(page.getByRole("table")).toBeVisible();

    // 5. Search for the seeded Eleanor Vance order
    const searchInput = page.getByPlaceholder(
      "Search by Purchaser Name, Email, or Order Reference...",
    );
    await searchInput.fill("Eleanor Vance");
    await expect(page.getByText("eleanor.vance@example.com")).toBeVisible();

    // 6. Check In flow toggle
    const checkInBtn = page.getByRole("button", { name: "Check In" }).first();
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click();
      await expect(page.getByRole("button", { name: "Undo Check-In" }).first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText("Checked In").first()).toBeVisible();
    }

    // 7. Test CSV Export Button
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export Attendee Roster \(CSV\)/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/sdgc-ticket-roster.*\.csv/);
  });

  test("regular non-staff member is denied access to /admin/tickets", async ({ page }) => {
    // 1. Sign in as regular member
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("member@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Attempt direct navigation to /admin/tickets
    await page.goto("/admin/tickets");
    await expect(page).toHaveURL(/\/(login|profile)\?error=unauthorized/);
  });
});
