import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getHomePageContent, getSiteContactSettings } from "@/features/content/queries";
import { listUpcomingEvents } from "@/features/events/queries";
import { formatEventDateTime } from "@/features/events/calendar";
import { generateOrganizationSchema, serializeJsonLd } from "@/lib/jsonld";
import { resolveMediaUrl } from "@/lib/storage/media-url";

export const metadata = {
  title: {
    absolute: siteConfig.name,
  },
  description: siteConfig.description,
};

export default async function HomePage() {
  const [homeData, contact] = await Promise.all([getHomePageContent(), getSiteContactSettings()]);

  if (!homeData) {
    notFound();
  }

  const upcomingEvents = await listUpcomingEvents(3);
  const orgSchema = generateOrganizationSchema({
    ...contact,
    motto: homeData.subtitle,
  });

  return (
    <div className="space-y-16 py-6 sm:py-10">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safely serialized
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgSchema) }}
      />
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-10 lg:p-14 shadow-sm">
          {/* Subtle Background Accent */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Text Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <span>Cultivating Community Since 1928</span>
                <span>•</span>
                <span>501(c)(3) Nonprofit</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground tracking-tight">
                {homeData.title || siteConfig.name}
              </h1>

              <p className="font-serif text-lg sm:text-xl lg:text-2xl text-primary font-medium italic leading-relaxed">
                &ldquo;{homeData.subtitle}&rdquo;
              </p>

              {/* Highlights badge strip */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-1 text-xs text-muted-foreground font-medium">
                <span className="rounded-full bg-muted px-3 py-1 border border-border/60">
                  🌸 47th Annual Garden Walk
                </span>
                <span className="rounded-full bg-muted px-3 py-1 border border-border/60">
                  🌱 85+ Active Gardeners
                </span>
                <span className="rounded-full bg-muted px-3 py-1 border border-border/60">
                  🏛️ 42 Civic Floral Planters
                </span>
              </div>

              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  href="/join"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md inline-flex items-center gap-1.5"
                >
                  <span>Become A Member</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/garden-walk"
                  className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                >
                  47th Annual Garden Walk
                </Link>
                <Link
                  href="/events"
                  className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                >
                  Events Calendar
                </Link>
              </div>
            </div>

            {/* Hero Image Showcase Column */}
            <div className="lg:col-span-5 w-full">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main photograph */}
                <div className="relative aspect-4/3 sm:aspect-16/10 lg:aspect-4/3 w-full overflow-hidden rounded-2xl border border-border shadow-md bg-muted">
                  <Image
                    src={resolveMediaUrl(
                      homeData.heroImage || "/images/wordpress/DSC_2808-scaled-1.jpg",
                    )}
                    alt="Saugatuck Douglas Garden Club blooming perennial garden"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Subtle gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Caption badge overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
                    <p className="font-serif font-bold text-sm text-white drop-shadow-sm">
                      Coastal Michigan Gardens & Civic Beautification
                    </p>
                    <p className="text-white/80 text-[11px] drop-shadow-xs">
                      Saugatuck & Douglas, Michigan
                    </p>
                  </div>
                </div>

                {/* Overlaid circular club emblem badge */}
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 rounded-full border-2 border-background bg-card/95 p-2 shadow-lg backdrop-blur-xs">
                  <Image
                    src={resolveMediaUrl("/images/wordpress/SDGC-Logov3-transparent-modified.png")}
                    alt="SDGC emblem"
                    width={56}
                    height={56}
                    priority
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Events Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-3 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Mark Your Calendar
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Upcoming Club Events
            </h2>
          </div>
          <Link
            href="/events"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>View Full Calendar (List / Month / Day)</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            No upcoming events currently scheduled. Check back soon for seasonal workshop
            announcements.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <article
                key={event.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/50 transition-all hover:shadow-sm"
              >
                {event.featuredImage && (
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    <Image
                      src={event.featuredImage}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {event.category && (
                      <span className="absolute top-3 left-3 rounded-md bg-background/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-2xs">
                        {event.category}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <time
                      dateTime={event.startsAt}
                      className="text-xs font-semibold text-primary block"
                    >
                      {formatEventDateTime(event.startsAt)}
                    </time>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground line-clamp-2">
                      <Link
                        href={`/event/${encodeURIComponent(event.slug)}`}
                        className="hover:underline"
                      >
                        {event.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[170px]">
                      📍 {event.venueName}
                    </span>
                    <Link
                      href={`/event/${encodeURIComponent(event.slug)}`}
                      className="font-semibold text-primary hover:underline shrink-0"
                    >
                      Details &rarr;
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* The Four Core Pillars (Activities) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Our Purpose & Passion
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            What We Do & Support
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our volunteer members dedicate their hands, hearts, and horticultural knowledge to
            enrich our shared lakeshore community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {homeData.sections.map((section) => (
            <div
              key={section.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-colors"
            >
              {section.image && (
                <div className="relative h-64 w-full bg-muted">
                  <Image
                    src={section.image}
                    alt={section.imageAlt || section.heading}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    {section.heading}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                    {section.body.map((para, idx) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed content paragraph
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                </div>

                {section.callToAction && (
                  <div className="pt-4 border-t border-border">
                    <Link
                      href={section.callToAction.href as Route}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      <span>{section.callToAction.label}</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Welcoming Community & Membership Story */}
      {homeData.story && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-muted/30 p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden shadow-sm border border-border">
                <Image
                  src={homeData.story.image}
                  alt={homeData.story.heading}
                  fill
                  sizes="(max-width: 1024px) 100vw, 550px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Warm Lakeshore Community
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                    {homeData.story.heading}
                  </h2>
                </div>

                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {homeData.story.body}
                </p>

                {/* 4 Key Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                    <span className="block font-serif text-xl sm:text-2xl font-bold text-primary">
                      {homeData.story.statYear}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Founded
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                    <span className="block font-serif text-xl sm:text-2xl font-bold text-primary">
                      {homeData.story.statMembers}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Members
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                    <span className="block font-serif text-xl sm:text-2xl font-bold text-primary">
                      {homeData.story.statPots}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Civic Pots
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                    <span className="block font-serif text-xl sm:text-2xl font-bold text-primary">
                      {homeData.story.statGrants}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Annual Grants
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/join"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <span>Become A Member Today</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact & Inquiries CTA Section */}
      <section id="contact" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
                We&apos;d Love to Hear From You
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                Have Questions or Inquiries?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Whether you&apos;re curious about joining our club, attending the upcoming Garden
                Walk, volunteering for civic planter workbees, or applying for our youth
                horticulture scholarship, our club officers are here to help.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md text-center"
              >
                <span>Contact Club Officers</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center"
              >
                View Meeting Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
