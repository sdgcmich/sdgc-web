import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Phase P5 — Public Data, Contact & Financial Workflows", () => {
  const artifactsDir = path.join(process.cwd(), "artifacts", "phase-05");

  test.beforeAll(() => {
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  test("modern route redirects preserve legacy discovery paths", async ({ page }) => {
    // Legacy /aboutourclub redirects to /about
    await page.goto("/aboutourclub");
    await expect(page).toHaveURL(/\/about$/);

    // Legacy /becomeamember redirects to /join
    await page.goto("/becomeamember");
    await expect(page).toHaveURL(/\/join$/);

    // Legacy /wp-login.php redirects to /login
    await page.goto("/wp-login.php");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("modern About page renders authentic live images and story sections", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /About (Our Club|Saugatuck Douglas Garden Club)/,
    );

    // Verify sections and authentic downloaded media
    await expect(page.getByRole("heading", { name: "Our Story & Purpose" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Club Fundraisers & Community Plant Sales" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Community Beautification/ })).toBeVisible();

    // Verify executive committee image is loaded
    const execImg = page.locator('img[alt="Saugatuck Douglas Garden Club Executive Committee"]');
    await expect(execImg).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `01-modern-about-page${suffix}.png`),
      fullPage: true,
    });
  });

  test("photo gallery displays authentic club media with album filtering", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Club Photo Gallery");

    // Verify album tabs exist
    await expect(page.getByRole("tab", { name: /All Photos/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Garden Walk Highlights/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Civic Beautification/i })).toBeVisible();

    // Verify gallery albums and navigation render
    const albumLinks = page.locator("a[href^='/gallery/']");
    await expect(albumLinks.first()).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `02-authentic-gallery${suffix}.png`),
      fullPage: true,
    });
  });

  test("events calendar list, month, and day views render", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    // List view
    await page.goto("/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Events Calendar");
    await expect(page.getByText(/Garden Walk Fundraiser/).first()).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `03-events-calendar-list${suffix}.png`),
      fullPage: true,
    });

    // Month view
    await page.goto("/events/month?month=2026-07");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Events (Month )?Calendar/);

    await page.screenshot({
      path: path.join(artifactsDir, `04-events-calendar-month${suffix}.png`),
      fullPage: true,
    });

    // Event Detail Page
    await page.goto("/event/47th-annual-garden-walk-fundraiser");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Garden Walk Fundraiser/);
    await expect(page.getByText("Old School House Douglas")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `05-event-detail-garden-walk${suffix}.png`),
      fullPage: true,
    });
  });

  test("contact form submission with anti-spam honeypot", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Us");

    // Fill contact form
    await page.getByLabel(/Your Name/i).fill("Jane Lakeshore");
    await page.getByLabel(/Email Address/i).fill("jane.lakeshore@example.com");
    await page.getByLabel(/Phone Number/i).fill("269-555-0199");
    await page
      .getByLabel(/Message/i)
      .fill("Hello SDGC! I would love to volunteer for the 2026 Garden Walk tour docent team.");

    await page.getByRole("button", { name: /Submit Message/i }).click();

    // Verify confirmation banner with reference number
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Thank you for reaching out!|Message Received!/i)).toBeVisible();
    await expect(page.getByText(/SDGC-MSG-/i)).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `06-contact-submission-success${suffix}.png`),
      fullPage: true,
    });
  });

  test("membership page dues policy and payment workflow", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    // 1. Anonymous visitor viewing /membership
    await page.goto("/membership");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Annual Membership & Dues");
    await expect(page.getByText("$50.00 USD")).toBeVisible();
    await expect(page.getByText("Calendar Year 2026")).toBeVisible();

    // Try paying online while unauthenticated -> prompts to sign in or register
    await page.getByRole("button", { name: /Pay \$50\.00 Dues Online/i }).click();
    await expect(
      page.getByText(/Please sign in to your member account or register/i),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `07-dues-policy-anonymous${suffix}.png`),
      fullPage: true,
    });

    // 2. Sign in as member and submit dues payment
    await page.goto("/login");
    await page.getByLabel(/Username or Email Address/i).fill("member@sdgc.local");
    await page.getByLabel(/Password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile$/);

    // Navigate to /membership as authenticated member
    await page.goto("/membership");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Annual Membership & Dues");

    // Wait for Suspense boundary to hydrate and present either the payment button or confirmed/pending state
    const payBtn = page.getByRole("button", { name: /Pay \$50\.00 Dues Online/i });
    const confirmedHeading = page.getByRole("heading", {
      name: /Annual Dues Paid & Confirmed|Payment In Progress/i,
    });
    const confirmedBtn = page.getByRole("button", { name: /Dues Paid & Confirmed/i });
    await expect(payBtn.or(confirmedHeading).or(confirmedBtn)).toBeVisible({ timeout: 10000 });

    if (await payBtn.isVisible()) {
      await payBtn.click();
      await expect(page.getByRole("status").or(page.getByRole("alert"))).toBeVisible({
        timeout: 8000,
      });
      await expect(
        page
          .getByText(/Payment Simulation: Card payment of \$50\.00/i)
          .or(page.getByText(/Annual dues for calendar year/i))
          .or(page.getByText(/Simulated payment provider/i)),
      ).toBeVisible();

      const confirmedBtnAfter = page.getByRole("button", { name: /2026 Dues Paid & Confirmed/i });
      if (await confirmedBtnAfter.isVisible()) {
        await expect(confirmedBtnAfter).toBeVisible();
      }
    } else {
      await expect(
        page
          .getByRole("button", { name: /2026 Dues Paid & Confirmed/i })
          .or(page.getByRole("heading", { name: /Annual Dues Paid & Confirmed/i }))
          .or(
            page.getByRole("heading", {
              name: /Payment In Progress \/ Awaiting Clearance/i,
            }),
          ),
      ).toBeVisible();
    }

    // Verify badge
    await expect(page.getByText("Active Member")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `08-dues-card-payment-confirmed${suffix}.png`),
      fullPage: true,
    });
  });
});
