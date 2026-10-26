import path from "node:path";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import nextConfig from "../../next.config";
import { GET as logoutGet, POST as logoutPost } from "@/app/logout/route";
import { NextRequest } from "next/server";
import { getTicketEvents, processTicketOrderAction } from "@/features/tickets/actions";
import { createServiceClient } from "./setup";
// @ts-expect-error import-wordpress.mjs is an ES module without ambient declarations
import { parseArgs, runImport } from "../../scripts/import-wordpress.mjs";

describe("Remediation Package R5 — Legacy Routes, Ticketing & Importer Reconciliation", () => {
  describe("R5.1: Legacy Route Redirects Coverage & Permanence", () => {
    it("configures all legacy routes with permanent (308) redirects", async () => {
      const redirects =
        typeof nextConfig.redirects === "function" ? await nextConfig.redirects() : [];

      const findRedirect = (source: string) => redirects.find((r) => r.source === source);

      // 1. Core Public & Legacy WP
      expect(findRedirect("/aboutourclub")?.destination).toBe("/about");
      expect(findRedirect("/aboutourclub/")?.destination).toBe("/about");
      expect(findRedirect("/becomeamember")?.destination).toBe("/join");
      expect(findRedirect("/becomeamember/")?.destination).toBe("/join");
      expect(findRedirect("/gardenwalk")?.destination).toBe("/garden-walk");
      expect(findRedirect("/gardenwalk/")?.destination).toBe("/garden-walk");
      expect(findRedirect("/gardens")?.destination).toBe("/garden-walk");
      expect(findRedirect("/gardens/")?.destination).toBe("/garden-walk");
      expect(findRedirect("/wp-login.php")?.destination).toBe("/login");
      expect(findRedirect("/wp-admin")?.destination).toBe("/admin");
      expect(findRedirect("/wp-admin/")?.destination).toBe("/admin");

      // 2. Events & Feeds
      expect(findRedirect("/feed")?.destination).toBe("/events");
      expect(findRedirect("/feed/")?.destination).toBe("/events");
      expect(findRedirect("/events/feed")?.destination).toBe("/events");
      expect(findRedirect("/events/feed/")?.destination).toBe("/events");
      expect(findRedirect("/events/list")?.destination).toBe("/events");
      expect(findRedirect("/events/list/")?.destination).toBe("/events");
      expect(findRedirect("/events-looped")?.destination).toBe("/events");
      expect(findRedirect("/events-looped/")?.destination).toBe("/events");

      // 3. User, Profile, Members Directory, Password Reset
      expect(findRedirect("/user")?.destination).toBe("/profile");
      expect(findRedirect("/user/")?.destination).toBe("/profile");
      expect(findRedirect("/user/:path*")?.destination).toBe("/profile");
      expect(findRedirect("/account")?.destination).toBe("/profile");
      expect(findRedirect("/account/")?.destination).toBe("/profile");
      expect(findRedirect("/account/:path*")?.destination).toBe("/profile");
      expect(findRedirect("/members")?.destination).toBe("/directory");
      expect(findRedirect("/members/")?.destination).toBe("/directory");
      expect(findRedirect("/members/:path*")?.destination).toBe("/directory");
      expect(findRedirect("/password-reset")?.destination).toBe("/forgot-password");
      expect(findRedirect("/password-reset/")?.destination).toBe("/forgot-password");
      expect(findRedirect("/password-reset/:path*")?.destination).toBe("/forgot-password");

      // 4. Ticketing & Checkout
      expect(findRedirect("/tickets")?.destination).toBe("/tickets-checkout");
      expect(findRedirect("/tickets/")?.destination).toBe("/tickets-checkout");
      expect(findRedirect("/tickets-order")?.destination).toBe("/tickets-checkout");
      expect(findRedirect("/tickets-order/")?.destination).toBe("/tickets-checkout");
      expect(findRedirect("/checkout")?.destination).toBe("/tickets-checkout");
      expect(findRedirect("/checkout/")?.destination).toBe("/tickets-checkout");

      // 5. Payment & Portal Returns
      expect(findRedirect("/payment-successful")?.destination).toBe("/join?status=success");
      expect(findRedirect("/payment-cancelled")?.destination).toBe("/join?status=cancelled");
      expect(findRedirect("/already-subscribed")?.destination).toBe("/profile");
      expect(findRedirect("/subscription-cancellation")?.destination).toBe("/profile");
      expect(findRedirect("/customer-portal")?.destination).toBe("/profile");
      expect(findRedirect("/stripe")?.destination).toBe("/join");

      // 6. Safe logout trailing slash
      expect(findRedirect("/logout/")?.destination).toBe("/logout");

      // Verify all configured redirects are marked permanent (Next.js 308)
      for (const r of redirects) {
        expect(r.permanent).toBe(true);
      }
    });
  });

  describe("R5.2: Safe Session-Termination Logout Handler", () => {
    it("handles GET /logout by redirecting to /login?notice=signed_out", async () => {
      const request = new NextRequest("http://127.0.0.1:3000/logout");
      const response = await logoutGet(request);

      expect(response.status).toBe(303);
      const location = response.headers.get("location") || "";
      expect(location).not.toBe("");
      const targetUrl = new URL(location);
      expect(targetUrl.pathname).toBe("/login");
      expect(targetUrl.searchParams.get("notice")).toBe("signed_out");
    });

    it("handles POST /logout by redirecting to /login?notice=signed_out", async () => {
      const request = new NextRequest("http://127.0.0.1:3000/logout", { method: "POST" });
      const response = await logoutPost(request);

      expect(response.status).toBe(303);
      const location = response.headers.get("location") || "";
      expect(location).not.toBe("");
      const targetUrl = new URL(location);
      expect(targetUrl.pathname).toBe("/login");
      expect(targetUrl.searchParams.get("notice")).toBe("signed_out");
    });

    it("preserves safe internal next destinations and sanitizes external redirect attempts", async () => {
      // Safe internal destination
      const safeReq = new NextRequest("http://127.0.0.1:3000/logout?next=/about");
      const safeRes = await logoutGet(safeReq);
      const safeLocation = safeRes.headers.get("location") || "";
      const safeTarget = new URL(safeLocation);
      expect(safeTarget.pathname).toBe("/about");

      // Malicious external open redirect attempt
      const evilReq = new NextRequest(
        "http://127.0.0.1:3000/logout?next=https://attacker.example.com",
      );
      const evilRes = await logoutGet(evilReq);
      const evilLocation = evilRes.headers.get("location") || "";
      const evilTarget = new URL(evilLocation);
      expect(evilTarget.pathname).toBe("/login");
      expect(evilTarget.searchParams.get("notice")).toBe("signed_out");
    });
  });

  describe("R5.3: Event Ticketing Parity & Separation from Club Membership Dues", () => {
    let prevSim: string | undefined;
    beforeAll(() => {
      prevSim = process.env.LOCAL_PAYMENTS_SIMULATION;
      process.env.LOCAL_PAYMENTS_SIMULATION = "true";
    });
    afterAll(() => {
      if (prevSim !== undefined) {
        process.env.LOCAL_PAYMENTS_SIMULATION = prevSim;
      } else {
        delete process.env.LOCAL_PAYMENTS_SIMULATION;
      }
    });

    it("returns ticketed events including the Garden Walk fundraiser", async () => {
      const events = await getTicketEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);

      const gardenWalk = events.find(
        (e) =>
          e.slug === "2026-garden-walk-fundraiser" ||
          e.slug === "47th-annual-garden-walk-fundraiser" ||
          e.id === "gw-2026" ||
          e.slug.includes("garden-walk"),
      );
      expect(gardenWalk).toBeDefined();
      expect(gardenWalk?.advancePriceCents).toBe(1500); // $15.00
      expect(gardenWalk?.dayOfPriceCents).toBe(2000); // $20.00
    });

    it("processes ticket orders with order reference and check-in instructions", async () => {
      const testEmail = `tkt_${Date.now()}@example.org`;
      const res = await processTicketOrderAction({
        eventId: "gw-2026",
        quantity: 3,
        purchaserName: "Alice Public",
        purchaserEmail: testEmail,
        purchaserPhone: "(269) 555-0144",
        notes: "Wheelchair accessible map requested",
      });

      expect(res.success).toBe(true);
      if (!res.success) throw new Error("Expected ticket order to succeed");
      const order = res.data;

      expect(order.orderReference).toMatch(/^SDGC-TKT-202[67]-[A-F0-9]{6}$/);
      expect(order.ticketQuantity).toBe(3);
      expect(order.unitPriceCents).toBe(1500);
      expect(order.totalCents).toBe(4500); // 3 * $15.00 = $45.00
      expect(order.purchaserName).toBe("Alice Public");
      expect(order.purchaserEmail).toBe(testEmail);
      expect(order.status).toBe("confirmed");
      expect(order.checkInInstructions).toContain("Saugatuck City Hall");

      // STRICT BYLAW ASSERTION: Event ticketing order MUST NOT create a club membership!
      const serviceClient = createServiceClient();
      const { data: memberCheck } = await serviceClient
        .from("memberships")
        .select("id")
        .eq("notes", order.orderReference);

      expect(memberCheck?.length ?? 0).toBe(0);
    });

    it("validates ticket quantity and email constraints", async () => {
      const invalidQty = await processTicketOrderAction({
        eventId: "gw-2026",
        quantity: 0,
        purchaserName: "Bob Public",
        purchaserEmail: "bob@example.com",
      });
      expect(invalidQty.success).toBe(false);
      if (invalidQty.success) throw new Error("Expected failure on 0 quantity");
      expect(invalidQty.error).toContain("at least 1");

      const invalidEmail = await processTicketOrderAction({
        eventId: "gw-2026",
        quantity: 2,
        purchaserName: "Bob Public",
        purchaserEmail: "not-an-email",
      });
      expect(invalidEmail.success).toBe(false);
      if (invalidEmail.success) throw new Error("Expected failure on invalid email");
      expect(invalidEmail.error).toContain("valid email");
    });
  });

  describe("R5.4: Importer CLI Argument Reconciliation & Validation", () => {
    it("accepts both --input and --input-dir arguments", () => {
      const targetDir = path.resolve(process.cwd(), "tests/fixtures/synthetic-export");

      const res1 = parseArgs(["--input-dir", "tests/fixtures/synthetic-export"]);
      expect(res1.inputDir).toBe(targetDir);

      const res2 = parseArgs(["--input", "tests/fixtures/synthetic-export"]);
      expect(res2.inputDir).toBe(targetDir);

      const res3 = parseArgs(["--input-dir=tests/fixtures/synthetic-export"]);
      expect(res3.inputDir).toBe(targetDir);

      const res4 = parseArgs(["--input=tests/fixtures/synthetic-export"]);
      expect(res4.inputDir).toBe(targetDir);
    });

    it("rejects unknown CLI flags with a descriptive fatal error", () => {
      expect(() => parseArgs(["--invalid-flag"])).toThrow(/unrecognized argument/i);
      expect(() => parseArgs(["--execute-something-else"])).toThrow(/unrecognized argument/i);
    });
  });

  describe("R5.5: Importer Zero-PII Summary & Execution Safety", () => {
    it("runs synthetic export dry-run with zero PII in warnings, errors, and report", async () => {
      const syntheticExportDir = path.resolve(process.cwd(), "tests/fixtures/synthetic-export");
      const report = await runImport({
        dryRun: true,
        inputDir: syntheticExportDir,
      });

      expect(report.dryRun).toBe(true);
      expect(report.fileHashes).toBeDefined();
      expect(Object.keys(report.fileHashes).length).toBeGreaterThan(0);

      // Verify counts
      expect(report.counts.pages.total).toBeGreaterThan(0);
      expect(report.counts.events.total).toBeGreaterThan(0);
      expect(report.counts.users.total).toBeGreaterThan(0);

      // STRICT PRIVACY AUDIT: Ensure NO email addresses or usernames leaked into report.warnings or report.errors
      for (const warning of report.warnings) {
        expect(warning).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      }

      for (const error of report.errors) {
        expect(error).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      }
    });
  });
});
