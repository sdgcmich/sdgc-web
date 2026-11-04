import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const origin = "http://127.0.0.1:3000";
const routes = ["/", "/about", "/garden-walk", "/events", "/gallery", "/notices", "/membership", "/contact", "/join"];
const widths = [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920];
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");

// This contract checks layout and semantics, not real image fidelity or external services.
test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() === "image") {
      await route.fulfill({ status: 200, contentType: "image/png", body: pixel });
    } else if (url.origin === origin) {
      await route.continue();
    } else {
      await route.abort();
    }
  });
});

for (const path of routes) {
  test(`@quality-contract responsive and accessible ${path}`, async ({ page }) => {
    test.setTimeout(120_000);
    const response = await page.goto(`${origin}${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(async () => page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        inner: window.innerWidth,
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
      }))).toMatchObject({ inner: width });
      const size = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
      }));
      expect(size.client).toBeLessThanOrEqual(width);
      expect(size.client).toBeGreaterThanOrEqual(width - 20);
      expect(size.overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      for (const control of await page.locator("header a, header button").all()) {
        if (!(await control.isVisible())) continue;
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(-1);
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
  });

  test(`@quality-contract page-specific metadata ${path}`, async ({ page }) => {
    await page.goto(`${origin}${path}`);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    const value = await canonical.getAttribute("href");
    expect(value).toBeTruthy();
    const url = new URL(value ?? "", origin);
    expect(url.origin).toBe(origin);
    expect(url.pathname.replace(/\/$/, "") || "/").toBe(path);
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    const social = await page.locator('meta[property="og:url"]').getAttribute("content");
    const socialUrl = new URL(social ?? "", origin);
    expect(socialUrl.origin).toBe(url.origin);
    expect(socialUrl.pathname.replace(/\/$/, "") || "/").toBe(path);
    expect((await page.title()).trim().length).toBeGreaterThan(10);
    expect((await page.locator('meta[name="description"]').getAttribute("content"))?.trim().length ?? 0).toBeGreaterThan(30);
  });
}

test("@quality-contract sitemap has unique reachable public-route candidates", async ({ page, request }) => {
  const response = await request.get(`${origin}/sitemap.xml`, { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    return { invalid: doc.querySelector("parsererror") !== null, locations: Array.from(doc.querySelectorAll("url > loc"), (node) => node.textContent ?? "") };
  }, xml);
  expect(parsed.invalid).toBe(false);
  expect(parsed.locations.length).toBeGreaterThan(0);
  expect(parsed.locations.length).toBeLessThanOrEqual(500);
  expect(new Set(parsed.locations).size).toBe(parsed.locations.length);
  for (const location of parsed.locations) {
    const url = new URL(location);
    expect(url.origin).toBe(origin);
    expect(url.search).toBe("");
    expect(url.pathname).not.toMatch(/^\/(home|admin|profile|directory|login|mfa-verify|dues|verify|auth|api|tickets-checkout|gift)(\/|$)/);
    const target = await request.get(url.href, { maxRedirects: 0 });
    expect(target.status(), url.pathname).toBe(200);
  }
});

test("@quality-contract login has explicit noindex", async ({ page }) => {
  const response = await page.goto(`${origin}/login`);
  const directives = await page.locator('meta[name="robots"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content") ?? "").join(","));
  const header = response?.headers()["x-robots-tag"] ?? "";
  expect(`${directives},${header}`).toMatch(/\bnoindex\b/i);
});

test("@quality-contract mobile menu returns keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(origin);
  const trigger = page.locator("header").getByRole("button", { name: /menu|navigation/i }).first();
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});
