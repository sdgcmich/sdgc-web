import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/(public)/page";
import AboutPage from "@/app/(public)/about/page";
import GardenWalkPage from "@/app/(public)/garden-walk/page";
import JoinPage from "@/app/(public)/join/page";
import {
  DEFAULT_HOMEPAGE_HIGHLIGHTS,
  DEFAULT_HOMEPAGE_CONTACT_CTA,
  DEFAULT_ABOUT_SECTIONS,
  DEFAULT_GARDEN_WALK_HIGHLIGHTS,
  DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
  DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
  DEFAULT_JOIN_PAGE_DATA,
} from "@/features/content/types";

vi.mock("@/features/content/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/content/queries")>();
  return {
    ...actual,
    getHomePageContent: vi.fn().mockResolvedValue({
      slug: "home",
      title: "Saugatuck Douglas Garden Club",
      subtitle: "Welcome to Saugatuck",
      heroBadge: "Dedicated Since 1928",
      heroHighlights: actual.DEFAULT_HOMEPAGE_HIGHLIGHTS,
      story: actual.DEFAULT_HOMEPAGE_STORY,
      sections: actual.DEFAULT_HOMEPAGE_SECTIONS,
      contactCta: actual.DEFAULT_HOMEPAGE_CONTACT_CTA,
    }),
    getAboutPageContent: vi.fn().mockResolvedValue({
      slug: "about",
      title: "About Our Club",
      subtitle: "Civic beautification",
      heroBadge: "Dedicated Since 1928",
      sections: actual.DEFAULT_ABOUT_SECTIONS,
    }),
    getGardenWalkPageContent: vi.fn().mockResolvedValue({
      slug: "garden-walk",
      title: "Annual Garden Walk",
      subtitle: "Explore the annual Saugatuck Douglas Garden Walk",
      heroBadge: "Premier Lakeshore Horticultural Event",
      priceNote: "Advance tickets: $20",
      valueHighlights: actual.DEFAULT_GARDEN_WALK_HIGHLIGHTS,
      visitorGuide: actual.DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
      volunteerCta: actual.DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
      sections: [],
    }),
    getJoinPageContent: vi.fn().mockResolvedValue(actual.DEFAULT_JOIN_PAGE_DATA),
    getSiteContactSettings: vi.fn().mockResolvedValue(actual.DEFAULT_SITE_CONTACT),
  };
});

vi.mock("@/features/payments/queries", () => ({
  getCurrentTermInfo: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/features/events/queries", () => ({
  listUpcomingEvents: vi.fn().mockResolvedValue([]),
}));

describe("Dynamic CMS Content & Defaults", () => {
  it("exports valid default CMS content structures with all required fields", () => {
    expect(DEFAULT_HOMEPAGE_HIGHLIGHTS.length).toBeGreaterThanOrEqual(3);
    for (const h of DEFAULT_HOMEPAGE_HIGHLIGHTS) {
      expect(typeof h).toBe("string");
      expect(h.length).toBeGreaterThan(0);
    }

    expect(DEFAULT_HOMEPAGE_CONTACT_CTA.badge).toBeTruthy();
    expect(DEFAULT_HOMEPAGE_CONTACT_CTA.heading).toBeTruthy();
    expect(DEFAULT_HOMEPAGE_CONTACT_CTA.primaryHref).toBe("/contact");

    expect(DEFAULT_ABOUT_SECTIONS.length).toBeGreaterThanOrEqual(4);
    for (const s of DEFAULT_ABOUT_SECTIONS) {
      expect(s.id).toBeTruthy();
      expect(s.heading).toBeTruthy();
      expect(s.body.length).toBeGreaterThan(0);
    }

    expect(DEFAULT_GARDEN_WALK_HIGHLIGHTS.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_GARDEN_WALK_VISITOR_GUIDE.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_GARDEN_WALK_VOLUNTEER_CTA.heading).toBeTruthy();

    expect(DEFAULT_JOIN_PAGE_DATA.badge).toBeTruthy();
    expect(DEFAULT_JOIN_PAGE_DATA.title).toBeTruthy();
    expect(DEFAULT_JOIN_PAGE_DATA.introHeading).toBeTruthy();
    expect(DEFAULT_JOIN_PAGE_DATA.checkPayment.payableTo).toContain("SDGC");
    expect(DEFAULT_JOIN_PAGE_DATA.benefits.length).toBeGreaterThanOrEqual(5);
  });

  it("renders Public Home page with dynamic CMS hero badge, highlights, and contact CTA", async () => {
    const pageElement = await HomePage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("SDGC");
    expect(html).toContain("Welcome to Saugatuck");
    // Highlights
    expect(html).toContain("Annual Garden Walk");
    expect(html).toContain("85+ Active Gardeners");
    // Contact CTA
    expect(html).toContain("Have Questions or Inquiries?");
  });

  it("renders Public About page with dynamic CMS sections and botanical aesthetics", async () => {
    const pageElement = await AboutPage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("About Our Club");
    expect(html).toContain("Our Story &amp; Purpose");
    expect(html).toContain("Community Beautification &amp; Youth Outreach");
    expect(html).toContain("Local Garden Recognition Awards");
  });

  it("renders Public Garden Walk page with dynamic visitor guide and volunteer CTA", async () => {
    const pageElement = await GardenWalkPage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("Annual Garden Walk");
    expect(html).toContain("Tour Logistics &amp; Etiquette");
    expect(html).toContain("Wristband Pickup");
    expect(html).toContain("Rain or Shine");
    expect(html).toContain("Showcase Your Garden or Volunteer on the Walk");
  });

  it("renders Public Join page with dynamic badge, member benefits, and check mailing instructions", async () => {
    const pageElement = await JoinPage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("Become A Member");
    expect(html).toContain("Join Our Growing Community");
    expect(html).toContain("Membership Dues &amp; Term:");
    expect(html).toContain("Member Privileges &amp; Community Impact:");
    expect(html).toContain("Paying by Personal Check?");
    expect(html).toContain("P.O. Box 1011, Douglas, MI 49406");
  });
});
