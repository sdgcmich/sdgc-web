import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Saugatuck Douglas Garden Club",
  description:
    "Privacy Policy for the Saugatuck Douglas Garden Club: our commitments to member data protection, directory privacy controls, and secure payment processing.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left border-b border-border/60 pb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Member Data &amp; Trust
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last revised: {lastUpdated} &bull; Saugatuck Douglas Garden Club (501(c)(3) Nonprofit)
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            1. Our Commitment to Your Privacy
          </h2>
          <p className="text-muted-foreground">
            The Saugatuck Douglas Garden Club (&ldquo;SDGC&rdquo;, &ldquo;we&rdquo;,
            &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your privacy and is dedicated to
            protecting the personal information of our members, Garden Walk attendees, scholarship
            applicants, and website visitors.
          </p>
          <p className="text-muted-foreground">
            As a 501(c)(3) charitable organization, we exist to serve our community, not to monetize
            data.{" "}
            <strong className="text-foreground">
              We do not sell, rent, lease, or trade member, donor, or ticket buyer personal
              information to any commercial third parties.
            </strong>
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            2. Information We Collect
          </h2>
          <p className="text-muted-foreground">
            Depending on how you interact with our website and club programs, we may collect:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Member Account Information:</strong> Name, mailing
              address, telephone number, email address, optional spouse/partner name, birthday
              (month and day for club birthday greetings), Master Gardener credentials, and
              gardening/volunteer interests.
            </li>
            <li>
              <strong className="text-foreground">Event &amp; Garden Walk Ticketing Data:</strong>{" "}
              Buyer name, email address, quantity of tickets purchased, and transaction identifiers
              necessary to fulfill tour admissions.
            </li>
            <li>
              <strong className="text-foreground">Inquiries &amp; Messages:</strong> Name, email
              address, and message contents submitted through our online contact hub.
            </li>
            <li>
              <strong className="text-foreground">Technical Usage Data:</strong> Essential session
              cookies required to maintain secure user authentication, theme preference (light/dark
              mode), and server-side rate limiting to prevent spam and denial-of-service attempts.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            3. Member Directory Privacy &amp; Opt-Out Controls
          </h2>
          <p className="text-muted-foreground">
            One of our club&rsquo;s most cherished traditions is fostering fellowship among local
            gardeners through our Member Directory. We uphold strict privacy boundaries around this
            directory:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Authenticated Access Only:</strong> The directory
              is accessible exclusively to verified, active club members. It is strictly hidden from
              search engines (Google, Bing) and the general public.
            </li>
            <li>
              <strong className="text-foreground">Directory Opt-Out Option:</strong> Any member can
              elect to hide their listing from the online directory at any time by toggling the
              &ldquo;Opt out of Member Directory&rdquo; switch in their profile settings.
            </li>
            <li>
              <strong className="text-foreground">Prohibition of Solicitation:</strong> Members
              agree to use directory listings solely for personal club communications, carpooling to
              meetings, and committee coordination. Commercial solicitations are strictly
              prohibited.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            4. Payment Processing &amp; Financial Security
          </h2>
          <p className="text-muted-foreground">
            All online transactions—including annual dues payments and Garden Walk ticket
            purchases—are processed securely through trusted, PCI-DSS compliant third-party payment
            gateways (such as Stripe).
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">
              SDGC never sees, collects, or stores full credit card numbers or card verification
              values (CVV) on our servers.
            </strong>{" "}
            We receive only confirmation of successful payment, transaction reference numbers, and
            billing contact details to record membership standing.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            5. Photography &amp; Community Media
          </h2>
          <p className="text-muted-foreground">
            As a vibrant club celebrating gardening artistry, we occasionally photograph public
            planting workbees, educational meetings, and our Annual Garden Walk for our website
            gallery and community archive.
          </p>
          <p className="text-muted-foreground">
            We respect personal and homeowner privacy. If a photograph of you or your garden appears
            on our site that you prefer not to have displayed, please contact us and we will
            promptly review and remove the image.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            6. Your Data Rights &amp; Retention
          </h2>
          <p className="text-muted-foreground">
            You maintain full control over your personal information:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Access &amp; Correction:</strong> You may review
              and update your profile information at any time by signing in to your{" "}
              <Link
                href={"/profile" as Route}
                className="text-primary font-semibold hover:underline"
              >
                Member Profile
              </Link>
              .
            </li>
            <li>
              <strong className="text-foreground">Account Removal:</strong> Former members may
              request archival or complete removal of their personal record by notifying club
              officers.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 border-t border-border/60 pt-6">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            7. Privacy Questions &amp; Inquiries
          </h2>
          <p className="text-muted-foreground">
            If you have questions, concerns, or requests regarding this Privacy Policy or how your
            information is managed, please contact our club officers:
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
