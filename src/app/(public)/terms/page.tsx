import type { Metadata } from "next";
import { getPageBySlug } from "@/features/content/queries";
import { MarkdownContent } from "@/components/ui/markdown-content";

const DEFAULT_TERMS_MARKDOWN = `## 1. Organization & Acceptance of Terms
Welcome to the official website of the Saugatuck Douglas Garden Club ("SDGC", "the Club", "we", "our", or "us"). We are a registered 501(c)(3) charitable nonprofit organization dedicated to horticultural education, civic beautification, and environmental stewardship throughout Saugatuck and Douglas, Michigan.

By accessing or using our website (including purchasing Garden Walk tickets, applying for or renewing membership, accessing the member directory, or submitting contact inquiries), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our [Privacy Policy](/privacy). If you do not agree to these terms, please do not use our site.

## 2. Club Membership & Annual Dues
- **Annual, Non-Recurring Dues:** Club membership dues are assessed annually per term year. Membership dues are non-recurring; we do not store recurring credit card subscriptions or automatically charge members.
- **Review & Approval Process:** Membership applications undergo review by our club officers. Payment confirmation and officer approval are distinct operational steps to ensure alignment with our bylaws and volunteer community standards.
- **Member Directory Etiquette:** The online member directory is a private club resource provided exclusively for personal club communications and volunteer coordination. Harvesting, scraping, or utilizing member contact details for commercial solicitation, mass marketing, or unauthorized third-party distribution is strictly prohibited.

## 3. Annual Garden Walk & Event Ticketing
Our signature Annual Garden Walk is a self-guided tour of exquisite private and public coastal gardens. When attending our Garden Walk or ticketed club events:

- **Rain or Shine Policy:** The Garden Walk takes place rain or shine. Because all ticket proceeds directly fund community civic beautification urns, public parks, and local youth horticulture scholarships, ticket sales are non-refundable.
- **Respect for Private Property:** Host gardens are generously opened by private homeowners for this charitable event. Visitors must stay on designated pathways, refrain from picking flowers or taking plant cuttings, keep pets at home (service animals excepted), and respect all property barriers.
- **Accessibility & Terrain:** Due to the historic and natural terrain of private coastal properties, paths may include flagstones, gravel, steps, or uneven lawn surfaces. Attendees tour at their own risk.

## 4. Website Content & Intellectual Property
All text, photographs, garden guides, announcements, logos, and digital assets on this website are the property of the Saugatuck Douglas Garden Club or our contributing members and photographers, protected by United States and international copyright laws.

You may view, print, and download notices and garden event programs for personal, non-commercial use only. Commercial reproduction, redistribution, or modification of any content without prior written consent from the Club is prohibited.

## 5. Horticultural Advice Disclaimer
Informational articles, plant recommendations, pruning schedules, and gardening tips published on this website are shared in good faith by experienced gardeners and Master Gardeners for educational enrichment. Local microclimates, soil conditions, and pest pressures vary; SDGC does not guarantee specific gardening outcomes or assume liability for plant losses or pest management decisions.

## 6. Limitation of Liability
To the maximum extent permitted by Michigan law and federal 501(c)(3) provisions, the Saugatuck Douglas Garden Club, its board members, officers, and volunteers shall not be liable for any indirect, incidental, or consequential damages arising out of your use of this website or attendance at club events.

## 7. Contact Information
If you have questions regarding these Terms of Use, please contact us:

**Saugatuck Douglas Garden Club**  
P.O. Box 1011, Douglas, MI 49406  
Email: info@saugatuckdouglasgardenclub.com  
Inquiry Form: [Online Contact Hub](/contact)`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("terms");
  return {
    title: `${page?.title || "Terms of Use"} | Saugatuck Douglas Garden Club`,
    description:
      page?.metaDescription ||
      "Terms of Use for the Saugatuck Douglas Garden Club website, annual membership, Garden Walk tour ticketing, and community programs.",
  };
}

export default async function TermsOfUsePage() {
  const page = await getPageBySlug("terms");
  const title = page?.title || "Terms of Use";
  const content = page?.content?.trim() || DEFAULT_TERMS_MARKDOWN;
  const lastUpdated = page?.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "October 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left border-b border-border/60 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
          Legal &amp; Club Policies
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Last revised: {lastUpdated} &bull; Saugatuck Douglas Garden Club (501(c)(3) Nonprofit)
        </p>
      </div>

      {/* Main Dynamic Content Rendered via MarkdownContent */}
      <div className="text-foreground leading-relaxed">
        <MarkdownContent content={content} className="space-y-6" />
      </div>
    </div>
  );
}
