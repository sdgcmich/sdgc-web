import { expect, test } from "@playwright/test";

test.describe("Browser Hydration and Script Tag Verification", () => {
  test("homepage loads without script tag warnings or hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify no script tag warnings
    const scriptTagErrors = consoleErrors.filter((e) =>
      e.includes("Encountered a script tag while rendering React component"),
    );
    expect(scriptTagErrors).toHaveLength(0);

    // Verify no React hydration mismatch errors
    const hydrationErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => e.includes("Hydration failed") || e.includes("hydration-mismatch"),
    );
    expect(hydrationErrors).toHaveLength(0);

    // Verify contact CTA section is rendered
    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeVisible();

    const contactLink = contactSection.locator('a[href="/contact"]');
    await expect(contactLink).toBeVisible();
  });

  test("standalone contact page loads cleanly without console or hydration errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    const scriptTagErrors = consoleErrors.filter((e) =>
      e.includes("Encountered a script tag while rendering React component"),
    );
    expect(scriptTagErrors).toHaveLength(0);

    const hydrationErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => e.includes("Hydration failed") || e.includes("hydration-mismatch"),
    );
    expect(hydrationErrors).toHaveLength(0);

    const nameInput = page.locator("#contact-name");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Jane Tester");

    const emailInput = page.locator("#contact-email");
    await expect(emailInput).toBeVisible();
    await emailInput.fill("jane.tester@example.com");

    const messageInput = page.locator("#contact-message");
    await expect(messageInput).toBeVisible();
    await messageInput.fill("Checking browser hydration and form input fields.");

    expect(await nameInput.inputValue()).toBe("Jane Tester");
    expect(await emailInput.inputValue()).toBe("jane.tester@example.com");
  });

  test("login page loads cleanly without hydration errors even with returnTo param", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/login?returnTo=%2Fadmin");
    await page.waitForLoadState("networkidle");

    const hydrationErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => e.includes("Hydration failed") || e.includes("hydration-mismatch"),
    );
    expect(hydrationErrors).toHaveLength(0);

    const identifierInput = page.locator("#login-identifier");
    await expect(identifierInput).toBeVisible();
    await identifierInput.fill("admin_tester");

    const passwordInput = page.locator("#login-password");
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill("secretPassword123");

    expect(await identifierInput.inputValue()).toBe("admin_tester");
    expect(await passwordInput.inputValue()).toBe("secretPassword123");

    await page.screenshot({
      path: "C:/Users/redwan/.gemini/antigravity-ide/brain/7cc90902-d8da-485c-8644-5bf298b93507/phase-08-screenshots/login-page.png",
    });
  });

  test("join page and forgot-password page load cleanly without hydration errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    // Check /join
    await page.goto("/join");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.locator("#reg-username");
    await expect(usernameInput).toBeVisible();

    // Check /forgot-password
    await page.goto("/forgot-password");
    await page.waitForLoadState("networkidle");

    const forgotEmailInput = page.locator("#forgot-email");
    await expect(forgotEmailInput).toBeVisible();

    const hydrationErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => e.includes("Hydration failed") || e.includes("hydration-mismatch"),
    );
    expect(hydrationErrors).toHaveLength(0);
  });
});
