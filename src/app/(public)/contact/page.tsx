import Link from "next/link";
import { ContactForm } from "@/features/contact/components/contact-form";
import { getSiteContactSettings } from "@/features/content/queries";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Saugatuck Douglas Garden Club leadership regarding membership, Garden Walk tickets, community workbees, or historical archives.",
};

export default async function ContactPage() {
  const contact = await getSiteContactSettings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wide">
          Get In Touch
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Contact Us
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          We&apos;d love to hear from you. Send us a message using the form or reach us directly
          using the contact details below. Our volunteer leadership team is always glad to assist.
        </p>
      </div>

      {/* Main Two-Column Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Form Card */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <ContactForm />
        </div>

        {/* Right: Organization & Direct Details Card */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
          {/* Org Header */}
          <div className="border-b border-border/60 pb-4">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {contact.name || "Saugatuck Douglas Garden Club"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              501(c)(3) Non-Profit Horticultural Organization
            </p>
          </div>

          {/* Contact Details with Badges */}
          <div className="space-y-4">
            {/* Email Addresses */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Email
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    Primary
                  </Badge>
                </div>
                <p>
                  <a
                    href={`mailto:${contact.email || "info@sdgcmich.org"}`}
                    className="text-primary hover:underline font-medium text-xs"
                  >
                    {contact.email || "info@sdgcmich.org"}
                  </a>
                </p>
              </div>
            </div>

            {/* Phone */}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z"
                    />
                  </svg>
                </div>
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
                    Phone
                  </span>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z"
                  />
                </svg>
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
                  Mailing Address
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {contact.address || "P.O. Box 754"}
                  <br />
                  {contact.city || "Saugatuck"}, {contact.state || "MI"}{" "}
                  {contact.postalCode || "49453"}
                </p>
              </div>
            </div>

            {/* Founded */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
                  Founded
                </span>
                <p className="text-muted-foreground">May 1928 (98 Years of Heritage)</p>
              </div>
            </div>
          </div>

          {/* Follow Us / Socials & Google Listing */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
              Follow Us
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {contact.facebookUrl && (
                <a
                  href={contact.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
                >
                  <span>Facebook</span>
                  <span className="text-muted-foreground text-[10px]">&rarr;</span>
                </a>
              )}
              {contact.instagramUrl && (
                <a
                  href={contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
                >
                  <span>Instagram</span>
                  <span className="text-muted-foreground text-[10px]">&rarr;</span>
                </a>
              )}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Saugatuck+Douglas+Garden+Club+MI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-2xs"
              >
                <svg
                  className="h-3.5 w-3.5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
                <span>Google Business Listing</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="pt-2 border-t border-border/60 space-y-2.5">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
              Quick Links
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/join"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span>&rarr;</span>
                <span>Join SDGC</span>
              </Link>
              <Link
                href="/garden-walk"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span>&rarr;</span>
                <span>Garden Walk 2026</span>
              </Link>
              <Link
                href="/events"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span>&rarr;</span>
                <span>Upcoming Events</span>
              </Link>
              <Link
                href="/gallery"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span>&rarr;</span>
                <span>Photo Gallery</span>
              </Link>
            </div>
          </div>

          {/* Meeting Location & Schedule Notice */}
          <div className="pt-3 border-t border-border/60">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Regular Club Meetings</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {contact.meetingLocation ||
                  "3rd Monday of the month at 1:00 PM (April – October) at Saugatuck-Douglas District Library."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Regional Area Map Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">
              Saugatuck & Douglas, Michigan
            </h3>
            <p className="text-xs text-muted-foreground">
              Serving the historic coastal communities along Kalamazoo Lake and Lake Michigan
            </p>
          </div>
          <a
            href="https://www.google.com/maps/place/Saugatuck,+MI+49453"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 shadow-2xs"
          >
            <span>Open in Google Maps</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>
        <div className="relative h-64 sm:h-80 w-full bg-muted/40">
          <iframe
            title="Saugatuck Douglas Garden Club Location Area"
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d47155.15858051786!2d-86.2359489!3d42.6558832!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8819ef3eec1b4b27%3A0x6b7dd2c9f99de725!2sSaugatuck%2C%20MI%2049453!5e0!3m2!1sen!2sus!4v1714000000000!5m2!1sen!2sus"
          />
        </div>
      </div>
    </div>
  );
}
