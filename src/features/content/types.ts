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

export interface PageContent {
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  event?: EventSummary;
  story?: HomePageStory;
  sections: PageSection[];
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
