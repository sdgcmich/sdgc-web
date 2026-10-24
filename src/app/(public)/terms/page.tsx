import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Saugatuck Douglas Garden Club",
  description:
    "Terms of Use for the Saugatuck Douglas Garden Club website, annual membership, Garden Walk tour ticketing, and community programs.",
};

export default function TermsOfUsePage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left border-b border-border/60 pb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Legal &amp; Club Policies
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">Terms of Use</h1>
        <p className="text-sm text-muted-foreground">
          Last revised: {lastUpdated} &bull; Saugatuck Douglas Garden Club (501(c)(3) Nonprofit)
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            1. Organization &amp; Acceptance of Terms
          </h2>
          <p className="text-muted-foreground">
            Welcome to the official website of the Saugatuck Douglas Garden Club
            (&ldquo;SDGC&rdquo;, &ldquo;the Club&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
            &ldquo;us&rdquo;). We are a registered 501(c)(3) charitable nonprofit organization
            dedicated to horticultural education, civic beautification, and environmental
            stewardship throughout Saugatuck and Douglas, Michigan.
          </p>
          <p className="text-muted-foreground">
            By accessing or using our website (including purchasing Garden Walk tickets, applying
            for or renewing membership, accessing the member directory, or submitting contact
            inquiries), you acknowledge that you have read, understood, and agree to be bound by
            these Terms of Use and our{" "}
            <Link href={"/privacy" as Route} className="text-primary font-semibold hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree to these terms, please do not use our site.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            2. Club Membership &amp; Annual Dues
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Annual, Non-Recurring Dues:</strong> Club
              membership dues are assessed annually per term year. Membership dues are
              non-recurring; we do not store recurring credit card subscriptions or automatically
              charge members.
            </li>
            <li>
              <strong className="text-foreground">Review &amp; Approval Process:</strong> Membership
              applications undergo review by our club officers. Payment confirmation and officer
              approval are distinct operational steps to ensure alignment with our bylaws and
              volunteer community standards.
            </li>
            <li>
              <strong className="text-foreground">Member Directory Etiquette:</strong> The online
              member directory is a private club resource provided exclusively for personal club
              communications and volunteer coordination. Harvesting, scraping, or utilizing member
              contact details for commercial solicitation, mass marketing, or unauthorized
              third-party distribution is strictly prohibited.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            3. Annual Garden Walk &amp; Event Ticketing
          </h2>
          <p className="text-muted-foreground">
            Our signature Annual Garden Walk is a self-guided tour of exquisite private and public
            coastal gardens. When attending our Garden Walk or ticketed club events:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Rain or Shine Policy:</strong> The Garden Walk
              takes place rain or shine. Because all ticket proceeds directly fund community civic
              beautification urns, public parks, and local youth horticulture scholarships, ticket
              sales are non-refundable.
            </li>
            <li>
              <strong className="text-foreground">Respect for Private Property:</strong> Host
              gardens are generously opened by private homeowners for this charitable event.
              Visitors must stay on designated pathways, refrain from picking flowers or taking
              plant cuttings, keep pets at home (service animals excepted), and respect all property
              barriers.
            </li>
            <li>
              <strong className="text-foreground">Accessibility &amp; Terrain:</strong> Due to the
              historic and natural terrain of private coastal properties, paths may include
              flagstones, gravel, steps, or uneven lawn surfaces. Attendees tour at their own risk.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            4. Website Content &amp; Intellectual Property
          </h2>
          <p className="text-muted-foreground">
            All text, photographs, garden guides, announcements, logos, and digital assets on this
            website are the property of the Saugatuck Douglas Garden Club or our contributing
            members and photographers, protected by United States and international copyright laws.
          </p>
          <p className="text-muted-foreground">
            You may view, print, and download notices and garden event programs for personal,
            non-commercial use only. Commercial reproduction, redistribution, or modification of any
            content without prior written consent from the Club is prohibited.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            5. Horticultural Advice Disclaimer
          </h2>
          <p className="text-muted-foreground">
            Informational articles, plant recommendations, pruning schedules, and gardening tips
            published on this website are shared in good faith by experienced gardeners and Master
            Gardeners for educational enrichment. Local microclimates, soil conditions, and pest
            pressures vary; SDGC does not guarantee specific gardening outcomes or assume liability
            for plant losses or pest management decisions.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            6. Limitation of Liability
          </h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by Michigan law and federal 501(c)(3) provisions, the
            Saugatuck Douglas Garden Club, its board members, officers, and volunteers shall not be
            liable for any indirect, incidental, or consequential damages arising out of your use of
            this website or attendance at club events.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 border-t border-border/60 pt-6">
          <h2 className="font-serif text-2xl font-bold text-foreground">7. Contact Information</h2>
          <p className="text-muted-foreground">
            If you have questions regarding these Terms of Use, please contact us:
          </p>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-1 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Saugatuck Douglas Garden Club</p>
            <p>P.O. Box 754, Douglas, MI 49453</p>
            <p>Email: saugatuckdouglasgardenclub@gmail.com</p>
            <p>
              Inquiry Form:{" "}
              <Link
                href={"/contact" as Route}
                className="text-primary font-semibold hover:underline"
              >
                Online Contact Hub
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
