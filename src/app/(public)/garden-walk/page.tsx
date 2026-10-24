import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { formatEventDateTime } from "@/features/events/calendar";
import { getGardenWalkPageContent } from "@/features/content/queries";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { GardenWalkGallery } from "@/features/media/components/garden-walk-gallery";

export const metadata = {
  title: "Annual Garden Walk | Saugatuck Douglas Garden Club",
  description:
    "Explore the Saugatuck Douglas Garden Walk: tour exquisite private coastal gardens, vibrant cottage sanctuaries, and support civic beautification and horticulture scholarships.",
};

const FEATURED_GARDEN_WALK_PHOTOS = [
  {
    id: "gw-1",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8017-scaled.jpeg"),
    alt: "Lush shade garden with mature hostas and Japanese maples",
    caption: "Verdant shade sanctuary featuring woodland perennials and Japanese maples.",
  },
  {
    id: "gw-2",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8020-scaled.jpeg"),
    alt: "Sunlit perennial borders in peak July bloom",
    caption: "Coneflowers, black-eyed Susans, and ornamental grasses in full sun.",
  },
  {
    id: "gw-3",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8022-scaled.jpeg"),
    alt: "Stone garden pathway and blooming cottage borders",
    caption: "Handcrafted stone walkway winding through colorful pollinator beds.",
  },
  {
    id: "gw-4",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8025-scaled.jpeg"),
    alt: "Architectural garden design with outdoor living spaces",
    caption: "Bespoke garden sitting area integrating native Michigan plantings.",
  },
  {
    id: "gw-5",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8032-scaled.jpeg"),
    alt: "Woodland garden path beneath mature oaks",
    caption: "Tranquil woodland stroll garden in Saugatuck.",
  },
  {
    id: "gw-6",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8037-scaled.jpeg"),
    alt: "Cottage perennial border bursting with vibrant color",
    caption: "Delphiniums, daylilies, and phlox in an English-style cottage garden.",
  },
  {
    id: "gw-7",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8041-scaled.jpeg"),
    alt: "Natural garden water feature and reflection pool",
    caption: "Custom water garden providing a haven for wildlife and pollinators.",
  },
  {
    id: "gw-8",
    src: resolveMediaUrl("/images/gallery/garden-walk/2O8A8043-scaled.jpeg"),
    alt: "Lakeshore hydrangea borders and sculptured shrubs",
    caption: "Magnificent Annabelle and panicle hydrangeas framing private grounds.",
  },
];

export default async function GardenWalkPage() {
  const walk = await getGardenWalkPageContent();
  if (!walk) {
    notFound();
  }

  const event = walk.event;
  const eventTitle = event?.title || "Annual Garden Walk Fundraiser Tour";
  const eventDateStr = event
    ? formatEventDateTime(event.startsAt)
    : "Saturday, July 10, 2027 • 10:00 AM – 4:00 PM";
  const eventSlug = event?.slug || "2027-47th-annual-garden-walk";
  const ticketUrl = (event?.ticketUrl || "/tickets-checkout") as Route;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-bold text-primary tracking-wide uppercase">
          Premier Lakeshore Horticultural Event
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
          {walk.title}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {walk.subtitle}
        </p>
      </div>

      {/* Feature Walk Card with Botanical Aesthetic */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-12 shadow-md space-y-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
          <div className="space-y-5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-primary/15 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary">
                {eventDateStr}
              </span>
              <span className="inline-block rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                Self-Guided Tour
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              {eventTitle}
            </h2>

            <div className="space-y-3.5 text-muted-foreground text-sm sm:text-base leading-relaxed">
              {event?.description ? (
                <p>{event.description}</p>
              ) : (
                <p>
                  Join garden lovers from throughout southwest Michigan and beyond for our signature
                  self-guided tour of exceptional private garden retreats in Saugatuck and Douglas.
                </p>
              )}
              <p>
                From blooming historic cottage perennials and native pollinator sanctuaries to
                peaceful woodland trails and creative waterscapes, our tour features inspiring
                horticultural variety and coastal charm.
              </p>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-foreground text-xs sm:text-sm font-medium">
                Advance tickets: $20 &bull; Day of tour: $25. All ticket proceeds directly fund club
                civic beautification planters, parks, and youth horticulture scholarships.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row lg:flex-col shrink-0 min-w-[240px]">
            <Link
              href={ticketUrl}
              className="rounded-2xl bg-primary px-8 py-4 text-center font-serif text-lg font-bold text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200"
            >
              Get Garden Walk Tickets &rarr;
            </Link>
            <Link
              href={`/event/${eventSlug}`}
              className="rounded-2xl border border-border bg-card px-8 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Tour Route &amp; Details
            </Link>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/60 pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">6 Premier Private Gardens</p>
              <p className="text-[11px] text-muted-foreground">
                Curated coastal and cottage retreats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Self-Paced Tour Schedule</p>
              <p className="text-[11px] text-muted-foreground">
                Explore at leisure between 10am - 4pm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">100% Civic Proceeds</p>
              <p className="text-[11px] text-muted-foreground">
                Town planters &amp; youth scholarships
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Gallery Preview with Lightbox Modal */}
      <GardenWalkGallery photos={FEATURED_GARDEN_WALK_PHOTOS} />

      {/* Visitor Guide & Tour Logistics */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Tour Logistics &amp; Etiquette
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Visitor Guide &amp; Tips
          </h2>
          <p className="text-sm text-muted-foreground">
            Helpful guidelines to ensure a delightful self-guided stroll through our coastal
            gardens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              🎟️
            </div>
            <h3 className="font-serif text-base font-bold text-foreground">Wristband Pickup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exchange your advance digital ticket confirmation for an official tour wristband and
              route program at our designated Saugatuck or Douglas welcome station.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              🌧️
            </div>
            <h3 className="font-serif text-base font-bold text-foreground">Rain or Shine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Garden Walk takes place rain or shine. In true Michigan gardening spirit, blooms
              glisten after a coastal shower! Bring an umbrella and comfortable walking shoes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              🚶
            </div>
            <h3 className="font-serif text-base font-bold text-foreground">Terrain &amp; Access</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Private coastal properties feature stone paths, gentle hills, and flagstone steps.
              Comfortable footwear is recommended; some garden areas may not accommodate strollers.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              📸
            </div>
            <h3 className="font-serif text-base font-bold text-foreground">Garden Etiquette</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Personal photography is encouraged. Please stay on marked paths, respect homeowner
              privacy, and kindly leave pets at home (registered service animals are welcome).
            </p>
          </div>
        </div>
      </section>

      {/* Host a Garden or Volunteer CTA Card */}
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Community Involvement
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Showcase Your Garden or Volunteer on the Walk
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Do you have a unique woodland retreat, cottage perennial haven, or native pollinator
              haven you&apos;d love to share on a future tour? Or would you enjoy greeting visitors
              as a friendly garden docent? We would love to hear from you!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href={"/contact" as Route}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              Get In Touch &rarr;
            </Link>
            <Link
              href={"/join" as Route}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Join the Club
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
