import type { EventSummary } from "@/features/events/types";
import { resolveMediaUrl } from "@/lib/storage/media-url";

export interface HomePageStory {
  heading: string;
  body: string;
  image: string;
  statYear: string;
  statMembers: string;
  statPots: string;
  statGrants: string;
}

export interface PageSection {
  id: string;
  heading: string;
  body: string[];
  callToAction?: {
    label: string;
    href: string;
  };
  image?: string;
  imageAlt?: string;
}

export interface ContactCtaSection {
  badge: string;
  heading: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface VisitorGuideCard {
  emoji: string;
  title: string;
  description: string;
}

export interface ValueHighlight {
  title: string;
  description: string;
  icon: "gardens" | "clock" | "gift";
}

export interface VolunteerCtaSection {
  badge: string;
  heading: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface JoinPageData {
  badge: string;
  title: string;
  introHeading: string;
  checkPayment: {
    heading: string;
    instructions: string;
    payableTo: string;
    address: string;
  };
  benefits: string[];
}

export interface PageContent {
  slug: string;
  title: string;
  subtitle?: string;
  heroBadge?: string;
  heroHighlights?: string[];
  heroImage?: string;
  event?: EventSummary;
  story?: HomePageStory;
  sections: PageSection[];
  contactCta?: ContactCtaSection;
  // Garden Walk specific extensions:
  priceNote?: string;
  visitorGuide?: VisitorGuideCard[];
  valueHighlights?: ValueHighlight[];
  volunteerCta?: VolunteerCtaSection;
}

export interface GenericPageData {
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  status: "published" | "draft";
  publishedAt?: string;
  updatedAt?: string;
}

export interface SiteContactSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  meetingLocation: string;
  facebookUrl: string;
  instagramUrl: string;
  taxExemptNotice: string;
  motto: string;
}

export const DEFAULT_SITE_CONTACT: SiteContactSettings = {
  name: "Saugatuck Douglas Garden Club",
  phone: "269-857-4148",
  email: "info@saugatuckdouglasgardenclub.com",
  address: "P.O. Box 1011",
  city: "Douglas",
  state: "MI",
  postalCode: "49406",
  meetingLocation: "Old School House, 130 Center St, Douglas, MI",
  facebookUrl: "https://www.facebook.com/profile.php?id=100064728277239",
  instagramUrl: "",
  taxExemptNotice: "501(c)(3) Nonprofit Organization",
  motto:
    "We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas.",
};

export const DEFAULT_HOMEPAGE_SECTIONS: PageSection[] = [
  {
    id: "scholarships-fundraisers",
    heading: "Scholarship Activities & Fundraisers",
    body: [
      "We award two scholarships annually to graduating seniors from Saugatuck and Fennville High Schools pursuing higher education.",
      "Our key fundraisers include the signature Annual Garden Walk, our beloved member-divided perennial plant sale, and our annual spring greenhouse flower sale.",
    ],
    image: resolveMediaUrl("/images/wordpress/2O8A6013-653x653-1.jpg"),
    imageAlt: "Garden Club members hosting the scholarship plant sale at the Old School House",
    callToAction: {
      label: "Explore Scholarships & Plant Sales",
      href: "/about#fundraisers",
    },
  },
  {
    id: "public-spaces-beautification",
    heading: "Public Spaces & Community Beautification",
    body: [
      "Volunteers plant and maintain vibrant civic sidewalk pots throughout downtown Saugatuck and adopted corner gardens in Douglas.",
      "In partnership with local 6th grade students and municipal leaders, we bring colorful seasonal flora and civic pride to streetscapes across both lakeshore towns.",
    ],
    image: resolveMediaUrl("/images/wordpress/DSC_7044-651x651-1.jpg"),
    imageAlt: "Colorful municipal sidewalk floral planters maintained by club volunteers",
    callToAction: {
      label: "Explore Civic Beautification",
      href: "/about#community-beautification",
    },
  },
  {
    id: "garden-recognition-awards",
    heading: "Flower Power & Local Garden Awards",
    body: [
      "Each summer in June, July, and August, the club honors outstanding residential, commercial, and window box landscaping visible to the public.",
      "Winners receive a commemorative lawn sign for the month and a gift certificate to Huntree Nursery to celebrate their dedication to community beautification.",
    ],
    image: resolveMediaUrl("/images/wordpress/DSC_0553-1349x1349-1.jpg"),
    imageAlt: "Flower Power garden award lawn sign in a blooming residential garden",
    callToAction: {
      label: "Discover Garden Recognition Awards",
      href: "/about#garden-awards",
    },
  },
  {
    id: "monthly-programs-outreach",
    heading: "Monthly Programs, Workshops & Outreach",
    body: [
      "From hands-on Arbor Day seedling distribution and holiday swag workshops for senior residents to expert guest presentations on native plants and bee keeping.",
      "We offer educational lectures, garden craft demonstrations, and welcoming social gatherings throughout the active gardening year.",
    ],
    image: resolveMediaUrl("/images/wordpress/2O8A6596-1000x1000-1.jpg"),
    imageAlt: "Garden Club members attending an educational demonstration and meeting",
    callToAction: {
      label: "See Annual Programs",
      href: "/about#annual-programs",
    },
  },
];

export const DEFAULT_HOMEPAGE_STORY: HomePageStory = {
  heading: "A Welcoming Community for Every Gardener",
  body: "With over 85 active members, we welcome gardeners of all experience levels — from seasoned Master Gardeners to enthusiastic novices. Enjoy monthly meetings on the third Monday, private garden walkabouts, social potlucks, and our caring “buddy” mentorship system designed to make every newcomer feel right at home.",
  image: resolveMediaUrl("/images/wordpress/2O8A5979-scaled-e1746814119349.jpeg"),
  statYear: "1928",
  statMembers: "85+",
  statPots: "42",
  statGrants: "$6,000",
};

export const DEFAULT_HOMEPAGE_HIGHLIGHTS: string[] = [
  "🌸 47th Annual Garden Walk",
  "🌱 85+ Active Gardeners",
  "🏛️ 42 Civic Floral Planters",
];

export const DEFAULT_HOMEPAGE_CONTACT_CTA: ContactCtaSection = {
  badge: "We'd Love to Hear From You",
  heading: "Have Questions or Inquiries?",
  body: "Whether you're curious about joining our club, attending the upcoming Garden Walk, volunteering for civic planter workbees, or applying for our youth horticulture scholarship, our club officers are here to help.",
  primaryLabel: "Contact Club Officers",
  primaryHref: "/contact",
  secondaryLabel: "View Meeting Schedule",
  secondaryHref: "/events",
};

export const DEFAULT_ABOUT_SECTIONS: PageSection[] = [
  {
    id: "our-story",
    heading: "Our Story & Purpose",
    body: [
      "For nearly a century, since 1928, the Saugatuck Douglas Garden Club has united plant lovers, Master Gardeners, and community volunteers dedicated to enhancing our shared public spaces.",
      "We operate as an active 501(c)(3) nonprofit organization welcoming gardeners of all experience levels to foster horticultural education and civic pride.",
    ],
    image: resolveMediaUrl("/images/content/executive-committee.jpeg"),
    imageAlt: "Saugatuck Douglas Garden Club Executive Committee",
  },
  {
    id: "fundraisers",
    heading: "Club Fundraisers & Community Plant Sales",
    body: [
      "Garden Walk: Our signature annual event is our primary fundraiser to fund educational scholarships. The public tours six extraordinary local gardens in Saugatuck and Douglas, beginning at the Old School House.",
      "Membership Perennial Plant & Treasure Sale: Club members divide their own hardy perennials, potting and offering them at the Old School House during the Garden Walk for only $5 each or 6 for $25. Members also donate garden treasures, driftwood, and trellises.",
      "Awesome Annuals Sale: Members order premium annuals from Van Til's local greenhouse each February for mid-May pickup, raising over $1,500 each year directly for local youth scholarships.",
    ],
    image: resolveMediaUrl("/images/content/plant-sale-old-schoolhouse.jpeg"),
    imageAlt: "Membership Plant Sale at the Old School House in Douglas",
  },
  {
    id: "community-beautification",
    heading: "Community Beautification & Youth Outreach",
    body: [
      "Saugatuck 6th Grade Planting: Each spring, local 6th graders join our club members to plant 42 civic sidewalk pots throughout downtown Saugatuck. The day begins at the SCA with demonstrations on flower varieties and planting techniques, followed by Mayor remarks and celebration.",
      "Douglas Downtown Bump-Outs: The club adopted three prominent corner garden plots in Douglas — in front of City Hall, across Center Street, and at the police station — planting and weeding them all season long.",
      "Saugatuck-Douglas Library Flowers: Beginning every June, club volunteers deliver fresh floral arrangements and potted plants bi-weekly to brighten the library circulation desk.",
    ],
    image: resolveMediaUrl("/images/wordpress/DSC_7044-651x651-1.jpg"),
    imageAlt: "Community beautification planters in downtown Saugatuck",
  },
  {
    id: "garden-awards",
    heading: "Local Garden Recognition Awards",
    body: [
      "Each summer in June, July, and August, the Garden Club presents honors for outstanding landscaping across three categories: Residential, Window Box, and Commercial properties open to public view.",
      "Winners receive a commemorative lawn sign for the month and a $25 gift certificate to Huntree Nursery to encourage ongoing horticultural excellence.",
      "Annual Member Garden Award: Each year our Club President recognizes one outstanding club member's garden sanctuary with a special achievement award.",
    ],
    image: resolveMediaUrl("/images/wordpress/DSC_0553-1349x1349-1.jpg"),
    imageAlt: "Garden Recognition Award winners plaque and residential garden",
  },
  {
    id: "annual-programs",
    heading: "Annual Programs & Scholarships",
    body: [
      "High School Scholarships: Our highest fundraising priority. Since 2023, the club awards two $3,000 annual scholarships to local graduating high school seniors pursuing higher education at accredited colleges or universities.",
      "6th Grade Holiday Workshop: In winter, students create fresh evergreen centerpieces — taking one home and delivering the second to residents at Grace of Douglas and Golden Orchards nursing facilities.",
      "Charitable Outreach: Our annual Christmas drive provides holiday gifts for families through Christian Neighbors, returning 98% of funding back into Allegan County.",
      "Welcome Back Tea & Spring Programs: Monthly educational lectures, guest speakers, demonstrations, and Arbor Day swags keep our community engaged throughout the gardening year.",
    ],
    image: resolveMediaUrl("/images/wordpress/2O8A6596-1000x1000-1.jpg"),
    imageAlt: "Garden Club new member gathering and social program",
    callToAction: {
      label: "Become A Member Today",
      href: "/join",
    },
  },
];

export const DEFAULT_GARDEN_WALK_HIGHLIGHTS: ValueHighlight[] = [
  {
    title: "6 Premier Private Gardens",
    description: "Curated coastal and cottage retreats",
    icon: "gardens",
  },
  {
    title: "Self-Paced Tour Schedule",
    description: "Explore at leisure between 10am - 4pm",
    icon: "clock",
  },
  {
    title: "100% Civic Proceeds",
    description: "Town planters & youth scholarships",
    icon: "gift",
  },
];

export const DEFAULT_GARDEN_WALK_VISITOR_GUIDE: VisitorGuideCard[] = [
  {
    emoji: "🎟️",
    title: "Wristband Pickup",
    description:
      "Exchange your advance digital ticket confirmation for an official tour wristband and route program at our designated Saugatuck or Douglas welcome station.",
  },
  {
    emoji: "🌧️",
    title: "Rain or Shine",
    description:
      "The Garden Walk takes place rain or shine. In true Michigan gardening spirit, blooms glisten after a coastal shower! Bring an umbrella and comfortable walking shoes.",
  },
  {
    emoji: "🚶",
    title: "Terrain & Access",
    description:
      "Private coastal properties feature stone paths, gentle hills, and flagstone steps. Comfortable footwear is recommended; some garden areas may not accommodate strollers.",
  },
  {
    emoji: "📸",
    title: "Garden Etiquette",
    description:
      "Personal photography is encouraged. Please stay on marked paths, respect homeowner privacy, and kindly leave pets at home (registered service animals are welcome).",
  },
];

export const DEFAULT_GARDEN_WALK_VOLUNTEER_CTA: VolunteerCtaSection = {
  badge: "Community Involvement",
  heading: "Showcase Your Garden or Volunteer on the Walk",
  body: "Do you have a unique woodland retreat, cottage perennial haven, or native pollinator haven you'd love to share on a future tour? Or would you enjoy greeting visitors as a friendly garden docent? We would love to hear from you!",
  primaryLabel: "Get In Touch",
  primaryHref: "/contact",
  secondaryLabel: "Join the Club",
  secondaryHref: "/join",
};

export const DEFAULT_JOIN_PAGE_DATA: JoinPageData = {
  badge: "Join Our Growing Community",
  title: "Become A Member",
  introHeading: "Membership Dues & Term:",
  checkPayment: {
    heading: "Paying by Personal Check?",
    instructions:
      "Members wishing to pay dues via personal check can register below, then mail check payable to:",
    payableTo: "Saugatuck Douglas Garden Club (SDGC)",
    address: "P.O. Box 1011, Douglas, MI 49406",
  },
  benefits: [
    "Monthly educational presentations and guest speakers on horticulture, native plants, and design",
    "Exclusive members-only summer garden walkabouts and tours of private local landscapes",
    "Hands-on civic workbees planting downtown sidewalk floral pots and civic corner gardens",
    "Support two annual $3,000 college scholarships for graduating seniors pursuing higher education",
    "Member plant sales, perennial plant exchanges, and holiday swag workshops",
    "Welcoming buddy mentorship system connecting new members with experienced gardeners",
  ],
};
