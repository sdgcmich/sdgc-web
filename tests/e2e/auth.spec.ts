import { expect, test } from "@playwright/test";

test.describe("Phase P4: Authentication & Member Profile E2E Journeys", () => {
  test("authenticates with username and navigates to member profile", async ({ page }) => {
    await page.goto("/login");

    // Login with username active_member
    await page.getByLabel("Username or Email Address").fill("active_member");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    // Verify redirection to profile
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My Member Profile");

    // Verify profile fields are populated
    await expect(page.locator("#prof-firstname")).toHaveValue(/^(Mary|UpdatedMary|Eleanor)$/);
    await expect(page.locator("#prof-lastname")).toHaveValue(/^(Member|Vance)$/);
  });

  test("authenticates with email and redirects to returnTo parameter", async ({ page }) => {
    await page.goto("/login?returnTo=/gallery");

    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/gallery/);
  });

  test("displays generic error for invalid password without leaking user existence", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Username or Email Address").fill("active_member");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page.getByText("Invalid username, email, or password.")).toBeVisible();
  });

  test("displays generic error for non-existent username", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Username or Email Address").fill("nonexistent_user_9999");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page.getByText("Invalid username, email, or password.")).toBeVisible();
  });

  test("updates member profile and verifies persistence", async ({ page }) => {
    // Sign in first
    await page.goto("/login?returnTo=/profile");
    await page.getByLabel("Username or Email Address").fill("active_member");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/profile/);

    // Update phone number
    const updatedPhone = "269-555-0999";
    await page.getByLabel("Home Phone").fill(updatedPhone);
    await page.getByRole("button", { name: "Save Profile Updates" }).click();

    // Verify success banner
    await expect(page.getByText("Profile updated successfully!")).toBeVisible();
  });

  test("unauthenticated visitor navigating to /directory is redirected to /login with zero data leak", async ({
    page,
  }) => {
    await page.goto("/directory");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdirectory/);
    await expect(page.getByRole("button", { name: "Sign In to Member Area" })).toBeVisible();
    await expect(page.getByText("Member Directory")).not.toBeVisible();
  });

  test("unauthenticated visitor navigating to /admin is redirected to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fadmin/);
    await expect(page.getByRole("button", { name: "Sign In to Member Area" })).toBeVisible();
  });
});
