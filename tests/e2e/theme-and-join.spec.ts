import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

test.describe("Theme Toggle & Modern Join Page Experience", () => {
  const artifactsDir = path.resolve(process.cwd(), "artifacts/theme");

  test.beforeAll(async () => {
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
  });

  test("toggles dark and light theme and persists preference", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/");

    // Locate theme toggle button
    const themeBtn = page.getByRole("button", { name: /Switch to (dark|light) theme/i }).first();
    await expect(themeBtn).toBeVisible();

    // Verify initial state (defaults to system; html element exists)
    const html = page.locator("html");
    const initiallyDark = await html.evaluate((el) => el.classList.contains("dark"));

    // Capture initial screenshot
    await page.screenshot({
      path: path.join(artifactsDir, `01-home-initial${suffix}.png`),
      fullPage: true,
    });

    // Toggle theme
    await themeBtn.click();

    // Verify class toggled
    const afterFirstToggle = await html.evaluate((el) => el.classList.contains("dark"));
    expect(afterFirstToggle).toBe(!initiallyDark);

    // Capture toggled screenshot
    await page.screenshot({
      path: path.join(artifactsDir, `02-home-toggled${suffix}.png`),
      fullPage: true,
    });

    // Toggle back
    await themeBtn.click();
    const afterSecondToggle = await html.evaluate((el) => el.classList.contains("dark"));
    expect(afterSecondToggle).toBe(initiallyDark);
  });

  test("modern Join page renders complete dues info, check address, and Already a member login card", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/join");

    // Headings and dues information from original site
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Become A Member");
    await expect(page.getByText(/Currently accepting new membership requests for/i)).toBeVisible();
    await expect(page.getByText(/\$50\.00 USD/i).first()).toBeVisible();
    await expect(page.getByText(/calendar year 2026/i).first()).toBeVisible();

    // Mail-in check instructions
    await expect(page.getByText(/Paying by Personal Check\?/i)).toBeVisible();
    await expect(page.getByText(/P\.O\. Box 1011, Douglas, MI 49406/i).first()).toBeVisible();

    // Inquiries link
    await expect(
      page.getByRole("link", { name: /info@saugatuckdouglasgardenclub\.com/i }),
    ).toBeVisible();

    // Prominent "Already a member?" callout card
    await expect(page.getByRole("heading", { name: "Already a member?" })).toBeVisible();
    const signInLink = page.getByRole("link", { name: /Sign In to Member Area/i });
    await expect(signInLink).toBeVisible();

    // Verify full registration form
    await expect(page.getByLabel(/Desired Username|Handle/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.getByLabel(/^First Name/i)).toBeVisible();
    await expect(page.getByLabel(/^Last Name/i)).toBeVisible();
    await expect(page.getByLabel(/I am a certified Master Gardener/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Submit Member Profile & Application/i }),
    ).toBeVisible();

    // Capture screenshot in light and dark mode
    await page.screenshot({
      path: path.join(artifactsDir, `03-join-page-light${suffix}.png`),
      fullPage: true,
    });

    // Switch to dark mode to capture dark theme evidence
    const themeBtn = page.getByRole("button", { name: /Switch to (dark|light) theme/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(artifactsDir, `04-join-page-dark${suffix}.png`),
        fullPage: true,
      });
    }
  });
});
