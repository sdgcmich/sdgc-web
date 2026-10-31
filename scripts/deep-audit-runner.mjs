import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://sdgc.redwan.work";
const ARTIFACTS_DIR =
  "C:/Users/redwan/.gemini/antigravity-ide/brain/3d20eb24-92d0-4593-a479-a672e12c5a9e/screenshots";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false },
  { name: "tablet", width: 768, height: 1024, isMobile: true },
  { name: "mobile", width: 375, height: 812, isMobile: true },
];

const PUBLIC_PAGES = [
  { slug: "home", path: "/" },
  { slug: "about", path: "/about" },
  { slug: "garden-walk", path: "/garden-walk" },
  { slug: "tickets-checkout", path: "/tickets-checkout" },
  { slug: "events", path: "/events" },
  { slug: "events-month", path: "/events/month" },
  { slug: "events-day", path: "/events/day" },
  { slug: "event-detail", path: "/event/monthly-board-meeting-nov-2026" },
  { slug: "gallery", path: "/gallery" },
  { slug: "contact", path: "/contact" },
  { slug: "join", path: "/join" },
  { slug: "login", path: "/login" },
  { slug: "forgot-password", path: "/forgot-password" },
  { slug: "terms", path: "/terms" },
  { slug: "privacy", path: "/privacy" },
  { slug: "notices", path: "/notices" },
];

const MEMBER_PAGES = [
  { slug: "member-profile", path: "/profile" },
  { slug: "member-dues", path: "/dues" },
  { slug: "member-directory", path: "/directory" },
  { slug: "member-landing", path: "/membership" },
];

const ADMIN_PAGES = [
  { slug: "admin-overview", path: "/admin" },
  { slug: "admin-members", path: "/admin/members" },
  { slug: "admin-dues", path: "/admin/dues" },
  { slug: "admin-events", path: "/admin/events" },
  { slug: "admin-media", path: "/admin/media" },
  { slug: "admin-messages", path: "/admin/messages" },
  { slug: "admin-content", path: "/admin/content" },
  { slug: "admin-tickets", path: "/admin/tickets" },
  { slug: "admin-notices", path: "/admin/notices" },
  { slug: "admin-settings", path: "/admin/settings" },
  { slug: "admin-settings-profile", path: "/admin/settings/profile" },
  { slug: "admin-settings-security", path: "/admin/settings/security" },
];

async function evaluatePage(page, vp, pathStr, slug, category, auditReport) {
  try {
    await page.goto(`${BASE_URL}${pathStr}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
      const hasOverflow = scrollWidth > clientWidth + 1;
      const offenders = [];
      if (hasOverflow) {
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const r = el.getBoundingClientRect();
          if (r.right > clientWidth + 2) {
            offenders.push({
              tagName: el.tagName,
              id: el.id || "",
              className: (el.className || "").toString().slice(0, 100),
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
          }
        }
      }
      return {
        hasOverflow,
        clientWidth,
        scrollWidth,
        offendersCount: offenders.length,
        offenders: offenders.slice(0, 5),
      };
    });

    if (overflow.hasOverflow) {
      auditReport.overflows.push({
        viewport: vp.name,
        category,
        page: pathStr,
        slug,
        ...overflow,
      });
      console.warn(
        `[OVERFLOW] ${vp.name} on ${pathStr}: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`,
      );
    }

    // Collect SEO info (desktop only to avoid duplication)
    if (vp.name === "desktop" && category === "public") {
      const seo = await page.evaluate(() => {
        const h1s = Array.from(document.querySelectorAll("h1")).map(
          (h) => h.textContent?.trim() || "",
        );
        const metaDesc =
          document.querySelector('meta[name="description"]')?.getAttribute("content") || null;
        const ogTitle =
          document.querySelector('meta[property="og:title"]')?.getAttribute("content") || null;
        const ogDesc =
          document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
          null;
        const ogImage =
          document.querySelector('meta[property="og:image"]')?.getAttribute("content") || null;
        const canonical =
          document.querySelector('link[rel="canonical"]')?.getAttribute("href") || null;
        const jsonLdCount = document.querySelectorAll('script[type="application/ld+json"]').length;
        const imagesWithoutAlt = Array.from(document.querySelectorAll("img")).filter(
          (img) => !img.hasAttribute("alt") || img.getAttribute("alt") === "",
        ).length;
        const title = document.title;
        return {
          title,
          metaDesc,
          ogTitle,
          ogDesc,
          ogImage,
          canonical,
          h1Count: h1s.length,
          h1s,
          jsonLdCount,
          imagesWithoutAlt,
        };
      });
      auditReport.seoResults.push({ path: pathStr, slug, ...seo });
    }

    const screenshotPath = path.join(ARTIFACTS_DIR, vp.name, `${slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ [${vp.name}] (${category}) ${pathStr} -> ${slug}.png`);
  } catch (err) {
    console.error(`✗ Error on [${vp.name}] ${pathStr}:`, err.message);
    auditReport.navigationErrors.push({
      viewport: vp.name,
      page: pathStr,
      slug,
      error: err.message,
    });
  }
}

async function runAudit() {
  console.log("=== Launching Deep Responsive, Feature & SEO Audit ===");
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  for (const vp of VIEWPORTS) {
    fs.mkdirSync(path.join(ARTIFACTS_DIR, vp.name), { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const auditReport = {
    timestamp: new Date().toISOString(),
    viewports: VIEWPORTS,
    overflows: [],
    seoResults: [],
    consoleErrors: [],
    navigationErrors: [],
  };

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`--- Auditing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ---`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        auditReport.consoleErrors.push({
          viewport: vp.name,
          url: page.url(),
          text: msg.text(),
        });
      }
    });

    // 1. Public Pages
    console.log(`\n[${vp.name}] Auditing Public Pages...`);
    for (const p of PUBLIC_PAGES) {
      await evaluatePage(page, vp, p.path, p.slug, "public", auditReport);
    }

    // 2. Member Pages
    console.log(`\n[${vp.name}] Logging in as Member...`);
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await page.getByLabel("Username or Email Address").fill("member@sdgc.local");
      await page.getByLabel("Password").fill("Password123!");
      await page.getByRole("button", { name: "Sign In to Member Area" }).click();
      await page.waitForURL(/\/(profile|membership)/, { timeout: 10000 });
      console.log(`Member login successful on ${vp.name}`);

      for (const p of MEMBER_PAGES) {
        await evaluatePage(page, vp, p.path, p.slug, "member", auditReport);
      }
    } catch (err) {
      console.error(`Member flow failed on ${vp.name}:`, err.message);
    }

    // 3. Admin Pages
    console.log(`\n[${vp.name}] Logging in as Admin...`);
    try {
      await page.goto(`${BASE_URL}/logout`, { waitUntil: "domcontentloaded" });
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
      await page.getByLabel("Password").fill("Password123!");
      await page.getByRole("button", { name: "Sign In to Member Area" }).click();
      await page.waitForURL(/\/(admin|profile)/, { timeout: 10000 });
      console.log(`Admin login successful on ${vp.name}`);

      for (const p of ADMIN_PAGES) {
        await evaluatePage(page, vp, p.path, p.slug, "admin", auditReport);
      }
    } catch (err) {
      console.error(`Admin flow failed on ${vp.name}:`, err.message);
    }

    await context.close();
  }

  await browser.close();

  const reportPath = path.join(ARTIFACTS_DIR, "audit-results.json");
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), "utf-8");
  console.log(`\n=== Audit Finished! Results written to ${reportPath} ===`);
}

runAudit().catch(console.error);
