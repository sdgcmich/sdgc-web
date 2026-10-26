import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCurrentUser } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export default async function NotFound() {
  const user = await getCurrentUser();
  let isStaff = false;
  let roleName = "Member";
  if (user) {
    const supabase = await createClient();
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (userRoles || []).map((r) => r.role);
    isStaff = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
    if (roles.includes("admin")) {
      roleName = "Admin";
    } else if (roles.includes("treasurer")) {
      roleName = "Treasurer";
    } else if (roles.includes("editor")) {
      roleName = "Editor";
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader initialUser={user ? { email: user.email, isStaff, roleName } : null} />

      <main
        id="main-content"
        className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6"
      >
        <div className="mx-auto max-w-2xl text-center">
          {/* Botanical Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2Z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span>Notice • Missing Garden Path</span>
          </div>

          <h1 className="mt-6 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>

          <p className="mt-2 text-xl font-serif text-primary">
            You&apos;ve Wandered Off The Garden Path
          </p>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The page, article, or resource you are looking for may have been pruned, relocated, or
            doesn&apos;t exist. Let&apos;s guide you back to familiar soil.
          </p>

          {/* Primary Quick Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Return home
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Upcoming Events
            </Link>
            <Link
              href="/garden-walk"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Garden Walk
            </Link>
          </div>

          {/* Direct Navigation Links Card */}
          <div className="mt-12 rounded-2xl border border-border bg-card/60 p-6 text-left shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Explore Popular Destinations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/events"
                className="group flex flex-col p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center justify-between text-sm">
                  Calendar & Workshops
                  <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Monthly meetings, guest speakers & civic plantings
                </span>
              </Link>

              <Link
                href="/gallery"
                className="group flex flex-col p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center justify-between text-sm">
                  Photo Gallery Archive
                  <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Photos of past garden walks and beautification projects
                </span>
              </Link>

              <Link
                href="/about"
                className="group flex flex-col p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center justify-between text-sm">
                  About Our Club
                  <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Our mission, history, awards, and scholarships
                </span>
              </Link>

              <Link
                href="/contact"
                className="group flex flex-col p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center justify-between text-sm">
                  Contact SDGC
                  <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Direct message form for leadership and board members
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
