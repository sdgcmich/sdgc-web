import sanitizeHtml from "sanitize-html";
import { createClient } from "@/lib/supabase/server";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { CLUB_TIMEZONE } from "@/features/events/calendar";
import type { EventSummary } from "@/features/events/types";
import {
  DEFAULT_ABOUT_SECTIONS,
  DEFAULT_GARDEN_WALK_HIGHLIGHTS,
  DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
  DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
  DEFAULT_HOMEPAGE_CONTACT_CTA,
  DEFAULT_HOMEPAGE_HIGHLIGHTS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_STORY,
  DEFAULT_JOIN_PAGE_DATA,
  DEFAULT_SITE_CONTACT,
  type ContactCtaSection,
  type GenericPageData,
  type HomePageStory,
  type JoinPageData,
  type PageContent,
  type PageSection,
  type SiteContactSettings,
  type ValueHighlight,
  type VisitorGuideCard,
  type VolunteerCtaSection,
} from "./types";

export {
  DEFAULT_ABOUT_SECTIONS,
  DEFAULT_GARDEN_WALK_HIGHLIGHTS,
  DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
  DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
  DEFAULT_HOMEPAGE_CONTACT_CTA,
  DEFAULT_HOMEPAGE_HIGHLIGHTS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_STORY,
  DEFAULT_JOIN_PAGE_DATA,
  DEFAULT_SITE_CONTACT,
  type ContactCtaSection,
  type GenericPageData,
  type HomePageStory,
  type JoinPageData,
  type PageContent,
  type PageSection,
  type SiteContactSettings,
  type ValueHighlight,
  type VisitorGuideCard,
  type VolunteerCtaSection,
};

export async function getHomePageContent(): Promise<PageContent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("slug, title, content, meta_description")
      .eq("slug", "home")
      .eq("status", "published")
      .maybeSingle();

    const pageRecord = error ? null : data;

    // Load motto and contact info from site_settings if available
    const { data: contactSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_contact")
      .maybeSingle();

    // Load custom homepage content (sections, story, hero highlights, contact CTA) if saved by admin
    const { data: homeSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_content")
      .maybeSingle();

    const customHome = homeSetting?.value as {
      heroBadge?: string;
      heroHighlights?: string[];
      story?: Partial<HomePageStory>;
      sections?: PageSection[];
      motto?: string;
      contactCta?: Partial<ContactCtaSection>;
    } | null;

    const motto =
      customHome?.motto ||
      (contactSetting?.value as { motto?: string } | null)?.motto ||
      pageRecord?.meta_description ||
      "We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas.";

    const story: HomePageStory = {
      ...DEFAULT_HOMEPAGE_STORY,
      ...(customHome?.story || {}),
      image: resolveMediaUrl(customHome?.story?.image || DEFAULT_HOMEPAGE_STORY.image),
    };

    const sections: PageSection[] = (
      customHome?.sections && Array.isArray(customHome.sections) && customHome.sections.length > 0
        ? customHome.sections
        : DEFAULT_HOMEPAGE_SECTIONS
    ).map((s) => ({
      ...s,
      image: resolveMediaUrl(s.image),
    }));

    const contactCta: ContactCtaSection = {
      ...DEFAULT_HOMEPAGE_CONTACT_CTA,
      ...(customHome?.contactCta || {}),
    };

    return {
      slug: "home",
      title: pageRecord?.title || "Saugatuck Douglas Garden Club",
      subtitle: motto,
      heroBadge: customHome?.heroBadge || "Cultivating Community Since 1928 • 501(c)(3) Nonprofit",
      heroHighlights:
        customHome?.heroHighlights && customHome.heroHighlights.length > 0
          ? customHome.heroHighlights
          : DEFAULT_HOMEPAGE_HIGHLIGHTS,
      heroImage: resolveMediaUrl("/images/wordpress/DSC_2808-scaled-1.jpg"),
      story,
      sections,
      contactCta,
    };
  } catch {
    return {
      slug: "home",
      title: "Saugatuck Douglas Garden Club",
      subtitle:
        "We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas.",
      heroBadge: "Cultivating Community Since 1928 • 501(c)(3) Nonprofit",
      heroHighlights: DEFAULT_HOMEPAGE_HIGHLIGHTS,
      heroImage: resolveMediaUrl("/images/wordpress/DSC_2808-scaled-1.jpg"),
      story: DEFAULT_HOMEPAGE_STORY,
      sections: DEFAULT_HOMEPAGE_SECTIONS,
      contactCta: DEFAULT_HOMEPAGE_CONTACT_CTA,
    };
  }
}

function cleanHtmlParagraphs(raw: string): string[] {
  return raw
    .split(/<\/p>\s*<p\b[^>]*>|<br\s*\/?>|\n\n+/)
    .map((p) => sanitizeHtml(p, { allowedTags: [], allowedAttributes: {} }).trim())
    .filter(Boolean);
}

export async function getAboutPageContent(): Promise<PageContent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("slug, title, content, meta_description")
      .in("slug", ["about", "aboutourclub"])
      .eq("status", "published")
      .maybeSingle();

    const pageRecord = error ? null : data;

    // Load custom structured about content if saved by admin
    const { data: aboutSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "about_content")
      .maybeSingle();

    const customAbout = aboutSetting?.value as {
      heroBadge?: string;
      title?: string;
      subtitle?: string;
      sections?: PageSection[];
    } | null;

    let sections: PageSection[];
    if (
      customAbout?.sections &&
      Array.isArray(customAbout.sections) &&
      customAbout.sections.length > 0
    ) {
      sections = customAbout.sections.map((s) => ({
        ...s,
        image: resolveMediaUrl(s.image),
      }));
    } else {
      // If standard page content was edited in pages table, use it for section 1 (our-story)
      const parsedStoryBody = pageRecord?.content ? cleanHtmlParagraphs(pageRecord.content) : [];
      sections = DEFAULT_ABOUT_SECTIONS.map((sec) => {
        if (sec.id === "our-story" && parsedStoryBody.length > 0) {
          return {
            ...sec,
            body: parsedStoryBody,
          };
        }
        return sec;
      });
    }

    return {
      slug: "about",
      title: customAbout?.title || pageRecord?.title || "About Our Club",
      subtitle:
        customAbout?.subtitle ||
        pageRecord?.meta_description ||
        "Civic beautification, education, scholarships, and friendship since 1928 across Saugatuck and Douglas, Michigan.",
      heroBadge: customAbout?.heroBadge || "Dedicated Since 1928",
      sections,
    };
  } catch {
    return {
      slug: "about",
      title: "About Our Club",
      subtitle:
        "Civic beautification, education, scholarships, and friendship since 1928 across Saugatuck and Douglas, Michigan.",
      heroBadge: "Dedicated Since 1928",
      sections: DEFAULT_ABOUT_SECTIONS,
    };
  }
}

export async function getGardenWalkPageContent(): Promise<PageContent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("slug, title, content, meta_description")
      .eq("slug", "garden-walk")
      .eq("status", "published")
      .maybeSingle();

    const pageRecord = error ? null : data;

    // Load custom structured garden walk content if saved by admin
    const { data: gwSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "garden_walk_content")
      .maybeSingle();

    const customGw = gwSetting?.value as {
      heroBadge?: string;
      title?: string;
      subtitle?: string;
      priceNote?: string;
      highlights?: ValueHighlight[];
      visitorGuide?: VisitorGuideCard[];
      volunteerCta?: Partial<VolunteerCtaSection>;
    } | null;

    // Look for the active / upcoming Garden Walk event
    const nowIso = new Date().toISOString();
    let { data: eventData } = await supabase
      .from("events")
      .select(
        `
      id,
      slug,
      title,
      description,
      starts_at,
      ends_at,
      timezone,
      all_day,
      status,
      category,
      ticket_url,
      venues (
        name,
        address,
        city,
        state,
        postal_code
      )
    `,
      )
      .or("category.eq.Garden Walk,slug.ilike.%garden-walk%")
      .eq("status", "published")
      .gte("ends_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!eventData) {
      const { data: recentEvent } = await supabase
        .from("events")
        .select(
          `
        id,
        slug,
        title,
        description,
        starts_at,
        ends_at,
        timezone,
        all_day,
        status,
        category,
        ticket_url,
        venues (
          name,
          address,
          city,
          state,
          postal_code
        )
      `,
        )
        .or("category.eq.Garden Walk,slug.ilike.%garden-walk%")
        .eq("status", "published")
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      eventData = recentEvent;
    }

    let eventSummary: EventSummary | undefined;
    if (eventData) {
      const venue = eventData.venues as {
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
      } | null;
      const fullAddress = venue
        ? [venue.address, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ")
        : undefined;

      const startsDate = new Date(eventData.starts_at);
      const endsDate = eventData.ends_at ? new Date(eventData.ends_at) : startsDate;
      const now = new Date();

      eventSummary = {
        id: eventData.id,
        slug: eventData.slug,
        title: eventData.title,
        description: eventData.description || "",
        startsAt: eventData.starts_at,
        endsAt: eventData.ends_at,
        timezone: eventData.timezone || CLUB_TIMEZONE,
        allDay: Boolean(eventData.all_day),
        category: eventData.category || "Garden Walk",
        venueName: venue?.name || "Old School House Douglas",
        venueAddress: fullAddress,
        ticketUrl: eventData.ticket_url || undefined,
        isPast: endsDate < now,
      };
    }

    const volunteerCta: VolunteerCtaSection = {
      ...DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
      ...(customGw?.volunteerCta || {}),
    };

    return {
      slug: "garden-walk",
      title: customGw?.title || pageRecord?.title || "Annual Garden Walk",
      subtitle:
        customGw?.subtitle ||
        pageRecord?.meta_description ||
        "Explore the annual Saugatuck Douglas Garden Walk: tour exquisite private gardens and support local community beautification and scholarships.",
      heroBadge: customGw?.heroBadge || "Premier Lakeshore Horticultural Event",
      priceNote:
        customGw?.priceNote ||
        "Advance tickets: $15 • Day of tour: $20. All ticket proceeds directly fund club civic beautification planters, parks, and youth horticulture scholarships.",
      valueHighlights:
        customGw?.highlights && customGw.highlights.length > 0
          ? customGw.highlights
          : DEFAULT_GARDEN_WALK_HIGHLIGHTS,
      visitorGuide:
        customGw?.visitorGuide && customGw.visitorGuide.length > 0
          ? customGw.visitorGuide
          : DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
      volunteerCta,
      event: eventSummary,
      sections: [
        {
          id: "tour-details",
          heading: "Tour Details & Garden Highlights",
          body: [
            pageRecord?.content ||
              "The Garden Walk is the club's premier annual fundraising event. For over four decades, local gardeners open their private landscapes to the public, sharing ideas and inspiration.",
            "Self-guided walking and driving routes begin at the Old School House in Douglas, featuring diverse shade sanctuaries, native pollinator habitats, and historic cottage borders.",
          ],
          callToAction: {
            label: "View Events & Dates",
            href: "/events",
          },
        },
      ],
    };
  } catch {
    return {
      slug: "garden-walk",
      title: "Annual Garden Walk",
      subtitle:
        "Explore the annual Saugatuck Douglas Garden Walk: tour exquisite private gardens and support local community beautification and scholarships.",
      heroBadge: "Premier Lakeshore Horticultural Event",
      priceNote:
        "Advance tickets: $15 • Day of tour: $20. All ticket proceeds directly fund club civic beautification planters, parks, and youth horticulture scholarships.",
      valueHighlights: DEFAULT_GARDEN_WALK_HIGHLIGHTS,
      visitorGuide: DEFAULT_GARDEN_WALK_VISITOR_GUIDE,
      volunteerCta: DEFAULT_GARDEN_WALK_VOLUNTEER_CTA,
      sections: [
        {
          id: "tour-details",
          heading: "Tour Details & Garden Highlights",
          body: [
            "The Garden Walk is the club's premier annual fundraising event. For over four decades, local gardeners open their private landscapes to the public, sharing ideas and inspiration.",
            "Self-guided walking and driving routes begin at the Old School House in Douglas, featuring diverse shade sanctuaries, native pollinator habitats, and historic cottage borders.",
          ],
          callToAction: {
            label: "View Events & Dates",
            href: "/events",
          },
        },
      ],
    };
  }
}

export async function getJoinPageContent(): Promise<JoinPageData> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "join_content")
      .maybeSingle();

    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      const customJoin = data.value as Partial<JoinPageData>;
      return {
        badge: customJoin.badge || DEFAULT_JOIN_PAGE_DATA.badge,
        title: customJoin.title || DEFAULT_JOIN_PAGE_DATA.title,
        introHeading: customJoin.introHeading || DEFAULT_JOIN_PAGE_DATA.introHeading,
        checkPayment: {
          ...DEFAULT_JOIN_PAGE_DATA.checkPayment,
          ...(customJoin.checkPayment || {}),
        },
        benefits:
          customJoin.benefits && customJoin.benefits.length > 0
            ? customJoin.benefits
            : DEFAULT_JOIN_PAGE_DATA.benefits,
      };
    }

    return DEFAULT_JOIN_PAGE_DATA;
  } catch {
    return DEFAULT_JOIN_PAGE_DATA;
  }
}

export async function getSiteContactSettings(): Promise<SiteContactSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_contact")
      .maybeSingle();

    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      return {
        ...DEFAULT_SITE_CONTACT,
        ...(data.value as Partial<SiteContactSettings>),
      };
    }

    return DEFAULT_SITE_CONTACT;
  } catch {
    return DEFAULT_SITE_CONTACT;
  }
}

export async function getPageBySlug(slug: string): Promise<GenericPageData | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("slug, title, content, meta_description, status, published_at, updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      slug: data.slug,
      title: data.title,
      content: data.content || "",
      metaDescription: data.meta_description || undefined,
      status: data.status as "published" | "draft",
      publishedAt: data.published_at || undefined,
      updatedAt: data.updated_at || undefined,
    };
  } catch {
    return null;
  }
}
