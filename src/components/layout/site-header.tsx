"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/features/auth/actions";
import { resolveMediaUrl } from "@/lib/storage/media-url";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/garden-walk", label: "Garden Walk" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/notices", label: "Notices" },
  { href: "/contact", label: "Contact" },
];

export interface SiteHeaderProps {
  initialUser?: {
    email: string;
    isStaff: boolean;
    roleName?: string;
  } | null;
}

export function SiteHeader({ initialUser }: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{
    email: string;
    isStaff: boolean;
    roleName?: string;
  } | null>(initialUser ?? null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();

    // Check client session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const roles = (userRoles || []).map((r) => r.role);
        const isStaff = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
        let roleName = "Member";
        if (roles.includes("admin")) {
          roleName = "Admin";
        } else if (roles.includes("treasurer")) {
          roleName = "Treasurer";
        } else if (roles.includes("editor")) {
          roleName = "Editor";
        }
        setCurrentUser({
          email: user.email || "",
          isStaff,
          roleName,
        });
      } else {
        setCurrentUser(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const authLinks = currentUser
    ? currentUser.isStaff
      ? [
          { href: "/admin", label: "Admin Dashboard" },
          { href: "/admin/settings/profile", label: "Admin Profile" },
          { href: "/admin/settings/security", label: "Security & MFA" },
        ]
      : [
          { href: "/profile", label: "My Profile" },
          { href: "/directory", label: "Directory" },
          { href: "/membership", label: "Annual Dues" },
        ]
    : [
        { href: "/login", label: "Member Login" },
        { href: "/join", label: "Become A Member" },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3.5 rounded-lg py-1 px-1 -ml-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <div className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/20 bg-white p-0.5 shadow-xs transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105">
            <Image
              src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
              alt="Saugatuck Douglas Garden Club logo"
              width={52}
              height={52}
              priority
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-serif text-lg sm:text-xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              Saugatuck Douglas
            </span>
            <span className="mt-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-primary/90 dark:text-primary leading-none">
              Garden Club
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0"
          aria-label="Main Site Navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const isHome = link.href === "/";
            return (
              <Link
                key={link.href}
                href={link.href as Route}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isHome ? "hidden xl:inline-flex" : ""
                } ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Member / Admin quick actions */}
        <div className="hidden lg:flex items-center gap-2 border-l border-border pl-3 xl:pl-4 shrink-0">
          <ThemeToggle />
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href={currentUser.isStaff ? "/admin" : "/profile"}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 whitespace-nowrap"
              >
                {currentUser.roleName || (currentUser.isStaff ? "Admin" : "Member")}
              </Link>
              <form action={logoutAction} className="inline-flex">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border/80 bg-card px-3.5 text-sm font-medium text-foreground shadow-2xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                href="/join"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap"
              >
                Join
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button and theme toggle */}
        <div className="flex lg:hidden items-center space-x-2">
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            data-hydrated={isMounted ? "true" : "false"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close main navigation menu" : "Open main navigation menu"}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={NAV_LINKS}
        authLinks={authLinks}
        currentUser={currentUser}
        toggleRef={toggleRef}
      />
    </header>
  );
}
