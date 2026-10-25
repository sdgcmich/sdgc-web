import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { getSiteContactSettings } from "@/features/content/queries";
import { resolveMediaUrl } from "@/lib/storage/media-url";

export async function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const contact = await getSiteContactSettings();

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image
                src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
                alt="Saugatuck Douglas Garden Club logo"
                width={48}
                height={48}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-serif text-lg font-bold text-primary">
                {contact.name || siteConfig.name}
              </span>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Dedicated to civic beautification, horticultural education, youth outreach, and
              friendship across Saugatuck and Douglas, Michigan.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Official Mailing Address: {contact.address}, {contact.city}, {contact.state}{" "}
              {contact.postalCode}
              {contact.phone && ` • Tel: ${contact.phone}`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {contact.facebookUrl && (
                <a
                  href={contact.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-medium"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  <span>Follow on Facebook</span>
                </a>
              )}
              {contact.instagramUrl && (
                <a
                  href={contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-medium"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Instagram</span>
                </a>
              )}
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:col-span-2 lg:contents gap-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Explore
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About Our Club
                  </Link>
                </li>
                <li>
                  <Link href="/garden-walk" className="hover:text-foreground transition-colors">
                    Annual Garden Walk
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="hover:text-foreground transition-colors">
                    Club Events Calendar
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="hover:text-foreground transition-colors">
                    Photo Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/notices" className="hover:text-foreground transition-colors">
                    Club Notice Board
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Membership
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/join" className="hover:text-foreground transition-colors">
                    Become A Member
                  </Link>
                </li>
                <li>
                  <Link href="/membership" className="hover:text-foreground transition-colors">
                    Annual Dues ($50)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Member Login
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-foreground transition-colors">
                    Member Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Connect
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="hover:text-foreground transition-colors">
                    Meeting Schedule
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} Saugatuck Douglas Garden Club. All rights reserved. Registered
            501(c)(3) nonprofit organization.
          </p>
          <div className="flex items-center justify-center sm:justify-end gap-5 text-xs font-medium">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Use
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
