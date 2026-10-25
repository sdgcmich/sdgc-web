import { expect, test } from "@playwright/test";

test.describe("Public Site Navigation & Experiences", () => {
  test("navigates top-level pages correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Saugatuck Douglas Garden Club",
    );

    const isMobile = (page.viewportSize()?.width ?? 1024) < 1024;

    const navigateTo = async (label: string | RegExp) => {
      if (isMobile) {
        await page.waitForSelector("header button[data-hydrated='true']");
        const toggle = page.getByLabel("Open main navigation menu");
        if (await toggle.isVisible()) {
          await toggle.click();
        }
        await page.locator("#mobile-navigation").getByRole("link", { name: label }).click();
      } else {
        await page.getByRole("banner").getByRole("link", { name: label }).click();
      }
    };

    // About
    await navigateTo(/^About/i);
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /About (Our Club|Saugatuck Douglas Garden Club)/,
    );

    // Annual Garden Walk
    await navigateTo("Garden Walk");
    await expect(page).toHaveURL("/garden-walk");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Annual Garden Walk");

    // Gallery
    await navigateTo("Gallery");
    await expect(page).toHaveURL("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Club Photo Gallery");

    // Events
    await navigateTo("Events");
    await expect(page).toHaveURL("/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Events Calendar");

    // Contact
    await navigateTo(/^Contact/i);
    await expect(page).toHaveURL("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Us");
  });

  test("event views: list, month calendar, day schedule, and detail", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Events Calendar");

    // Search filter
    const searchInput = page.getByPlaceholder("Search events by keyword or venue...");
    await searchInput.fill("Garden Walk");
    await expect(page.getByText(/Garden Walk Fundraiser/).first()).toBeVisible();
    await searchInput.fill("");

    // Switch to month view
    await page.getByRole("link", { name: "Month Calendar" }).click();
    await expect(page).toHaveURL(/\/events\/month/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Events (Month )?Calendar/);

    // Switch to day view
    await page.getByRole("link", { name: "Day Schedule" }).click();
    await expect(page).toHaveURL(/\/events\/day/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Event Daily Schedule|Events Calendar/,
    );

    // Open an event detail
    await page.goto("/event/47th-annual-garden-walk-fundraiser");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Garden Walk Fundraiser/);
    await expect(page.getByText("Old School House Douglas")).toBeVisible();
  });

  test("gallery view opens and navigates keyboard lightbox", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Club Photo Gallery");

    // Explore first album to view its photograph collection
    const firstAlbum = page.locator("a[href^='/gallery/']").first();
    await firstAlbum.click();
    await expect(page).toHaveURL(/\/gallery\/[\w-]+/);

    // Click first photo to open lightbox
    const firstPhoto = page.locator("button[aria-haspopup='dialog']").first();
    await firstPhoto.click();

    // Verify modal dialog is visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("contact form submits message with confirmation", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Us");

    await page.getByLabel("Your Name").fill("Jane Doe");
    await page.getByLabel("Email Address").fill("jane.doe@example.org");
    await page
      .getByLabel("Message")
      .fill("Hello SDGC team! Could you let me know if volunteer signups are open?");

    await page.getByRole("button", { name: "Submit Message" }).click();

    // Confirmation alert
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Thank you for reaching out!")).toBeVisible();
  });

  test("garden walk page previews featured photos in high-res lightbox with keyboard navigation", async ({
    page,
  }) => {
    await page.goto("/garden-walk");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Annual Garden Walk");

    // Click first photo thumbnail to open lightbox
    const firstThumbnail = page.locator("button[aria-haspopup='dialog']").first();
    await expect(firstThumbnail).toBeVisible();
    await firstThumbnail.click();

    // Verify lightbox modal dialog is visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Verify counter is visible (e.g. "1 of 8")
    await expect(dialog.getByText(/1 of/)).toBeVisible();

    // Navigate to next photo with ArrowRight
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText(/2 of/)).toBeVisible();

    // Navigate back with ArrowLeft
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText(/1 of/)).toBeVisible();

    // Close lightbox with Escape key
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("club notice board displays active notices, filters by search, and navigates to detail", async ({
    page,
  }) => {
    await page.goto("/notices");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Club Notice Board");

    // Category pills and search input should be present
    const searchInput = page.getByPlaceholder("Search announcements, meetings, frost guides...");
    await expect(searchInput).toBeVisible();

    // Search for frost notice
    await searchInput.fill("Frost");
    await expect(page.getByText(/Frost Warning/i).first()).toBeVisible();

    // Clear search
    await searchInput.fill("");

    // Click on the first notice card to view detail
    const firstNoticeLink = page.locator("a[href^='/notices/']").first();
    await expect(firstNoticeLink).toBeVisible();
    await firstNoticeLink.click();
    await expect(page).toHaveURL(/\/notices\/.+/);
    await expect(page.getByRole("link", { name: /Back to Notice Board/i })).toBeVisible();

    // Return to notice board
    await page.getByRole("link", { name: /Back to Notice Board/i }).click();
    await expect(page).toHaveURL("/notices");
  });

  test("tickets checkout renders botanical layout, quantity stepper, and updates order summary", async ({
    page,
  }) => {
    await page.goto("/tickets-checkout");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Event Ticket Checkout");

    // Check preview simulation indicator
    await expect(page.getByText(/Local Simulation Preview/i)).toBeVisible();

    // Check ticket quantity increment button
    const incrementBtn = page.getByRole("button", { name: "Increase tickets" });
    await expect(incrementBtn).toBeVisible();
    await incrementBtn.click(); // from 2 to 3

    // Verify summary updates (3 tickets @ $20 = $60.00)
    await expect(page.getByText("$60.00 USD")).toBeVisible();
  });

  test("renders dynamic legal pages (/terms and /privacy) with botanical policy content", async ({
    page,
  }) => {
    // Terms of Use
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Use");
    await expect(page.getByText("Organization & Acceptance of Terms")).toBeVisible();
    await expect(page.getByText(/Annual, Non-Recurring Dues/i)).toBeVisible();

    // Privacy Policy
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
    await expect(page.getByText("Our Commitment to Your Privacy")).toBeVisible();
    await expect(page.getByText(/Member Directory Privacy/i)).toBeVisible();
  });
});
