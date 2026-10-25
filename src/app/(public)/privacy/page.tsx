import type { Metadata } from "next";
import { getPageBySlug } from "@/features/content/queries";
import { MarkdownContent } from "@/components/ui/markdown-content";

const DEFAULT_PRIVACY_MARKDOWN = `## 1. Our Commitment to Your Privacy
The Saugatuck Douglas Garden Club ("SDGC", "we", "our", or "us") respects your privacy and is dedicated to protecting the personal information of our members, Garden Walk attendees, scholarship applicants, and website visitors.

As a 501(c)(3) charitable organization, we exist to serve our community, not to monetize data. **We do not sell, rent, lease, or trade member, donor, or ticket buyer personal information to any commercial third parties.**

## 2. Information We Collect
Depending on how you interact with our website and club programs, we may collect:

- **Member Account Information:** Name, mailing address, telephone number, email address, optional spouse/partner name, birthday (month and day for club birthday greetings), Master Gardener credentials, and gardening/volunteer interests.
- **Event & Garden Walk Ticketing Data:** Buyer name, email address, quantity of tickets purchased, and transaction identifiers necessary to fulfill tour admissions.
- **Inquiries & Messages:** Name, email address, and message contents submitted through our online contact hub.
- **Technical Usage Data:** Essential session cookies required to maintain secure user authentication, theme preference (light/dark mode), and server-side rate limiting to prevent spam and denial-of-service attempts.

## 3. Member Directory Privacy & Opt-Out Controls
One of our club's most cherished traditions is fostering fellowship among local gardeners through our Member Directory. We uphold strict privacy boundaries around this directory:

- **Authenticated Access Only:** The directory is accessible exclusively to verified, active club members. It is strictly hidden from search engines (Google, Bing) and the general public.
- **Directory Opt-Out Option:** Any member can elect to hide their listing from the online directory at any time by toggling the "Opt out of Member Directory" switch in their profile settings.
- **Prohibition of Solicitation:** Members agree to use directory listings solely for personal club communications, carpooling to meetings, and committee coordination. Commercial solicitations are strictly prohibited.

## 4. Payment Processing & Financial Security
All online transactions—including annual dues payments and Garden Walk ticket purchases—are processed securely through trusted, PCI-DSS compliant third-party payment gateways (such as Stripe).

**SDGC never sees, collects, or stores full credit card numbers or card verification values (CVV) on our servers.** We receive only confirmation of successful payment, transaction reference numbers, and billing contact details to record membership standing.

## 5. Photography & Community Media
As a vibrant club celebrating gardening artistry, we occasionally photograph public planting workbees, educational meetings, and our Annual Garden Walk for our website gallery and community archive.

We respect personal and homeowner privacy. If a photograph of you or your garden appears on our site that you prefer not to have displayed, please contact us and we will promptly review and remove the image.

## 6. Your Data Rights & Retention
You maintain full control over your personal information:

- **Access & Correction:** You may review and update your profile information at any time by signing in to your [Member Profile](/profile).
- **Account Removal:** Former members may request archival or complete removal of their personal record by notifying club officers.

## 7. Privacy Questions & Inquiries
If you have questions, concerns, or requests regarding this Privacy Policy or how your information is managed, please contact our club officers:

**Saugatuck Douglas Garden Club**  
Attention: Club Officers & Privacy Team  
P.O. Box 754, Douglas, MI 49453  
Email: saugatuckdouglasgardenclub@gmail.com  
Inquiry Form: [Online Contact Hub](/contact)`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("privacy");
  return {
    title: `${page?.title || "Privacy Policy"} | Saugatuck Douglas Garden Club`,
    description:
      page?.metaDescription ||
      "Privacy Policy for the Saugatuck Douglas Garden Club: our commitments to member data protection, directory privacy controls, and secure payment processing.",
  };
}

export default async function PrivacyPolicyPage() {
  const page = await getPageBySlug("privacy");
  const title = page?.title || "Privacy Policy";
  const content = page?.content?.trim() || DEFAULT_PRIVACY_MARKDOWN;
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
          Member Data &amp; Trust
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
