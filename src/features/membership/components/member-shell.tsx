"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { resolveMediaUrl } from "@/lib/storage/media-url";

interface MemberShellProps {
  children: React.ReactNode;
  userEmail?: string;
  isStaff?: boolean;
}

interface NavItem {
  href: Route | string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
      />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CreditCardIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function DirectoryIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AdminIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function LogoutIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function MenuIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <line x1="3" x2="21" y1="6" y2="6" />
      <line x1="3" x2="21" y1="12" y2="12" />
      <line x1="3" x2="21" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

function MemberSidebarContent({
  memberGroups,
  pathname,
  isStaff,
  onNavigate,
}: {
  memberGroups: NavGroup[];
  pathname: string;
  isStaff: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-card">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5">
        <Link href="/profile" onClick={onNavigate} className="flex items-center space-x-3">
          <Image
            src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
            alt="SDGC Logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover border border-border/60"
          />
          <div className="flex flex-col">
            <span className="font-serif text-base font-bold leading-tight text-foreground">
              SDGC
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Member Portal
            </span>
          </div>
        </Link>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          {isStaff ? "STAFF" : "MEMBER"}
        </span>
      </div>

      {/* Navigation Categories */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {memberGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground/80 hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="shrink-0 border-t border-border/60 p-4 space-y-2 text-xs">
        {isStaff && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>Admin Workspace</span>
            <span className="text-xs">&rarr;</span>
          </Link>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-xl px-3 py-2 text-primary font-medium hover:bg-primary/10 transition-colors"
        >
          <span>View public site</span>
          <span className="text-xs">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export function MemberShell({ children, userEmail, isStaff = false }: MemberShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Close sidebar on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: Close sidebar whenever route changes
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const memberGroups: NavGroup[] = [
    {
      title: "MY ACCOUNT",
      items: isStaff
        ? [
            { href: "/admin/settings/profile", label: "Admin Profile", icon: UserIcon },
            { href: "/admin/settings/security", label: "Security & MFA", icon: UserIcon },
          ]
        : [
            { href: "/profile", label: "My Profile", icon: UserIcon },
            { href: "/dues", label: "Annual Dues", icon: CreditCardIcon },
          ],
    },
    {
      title: "COMMUNITY",
      items: [{ href: "/directory", label: "Member Directory", icon: DirectoryIcon }],
    },
    ...(isStaff
      ? [
          {
            title: "STAFF WORKSPACE",
            items: [{ href: "/admin", label: "Admin Workspace", icon: AdminIcon }],
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      {/* Desktop Sticky Sidebar (Visible only on md: 768px+) */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 border-r border-border/60 bg-card flex-col sticky top-0 h-screen print:hidden">
        <MemberSidebarContent memberGroups={memberGroups} pathname={pathname} isStaff={isStaff} />
      </aside>

      {/* Mobile Slide-over Drawer (Visible on < md when open) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border/60 bg-card shadow-2xl flex flex-col z-10">
            <div className="absolute top-4 right-3 z-20">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <MemberSidebarContent
              memberGroups={memberGroups}
              pathname={pathname}
              isStaff={isStaff}
              onNavigate={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Container Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Workspace Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/95 px-4 sm:px-6 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden flex items-center justify-center p-2 rounded-xl border border-border/60 text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Open member navigation"
              aria-expanded={isSidebarOpen}
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                SDGC <span className="hidden sm:inline">&bull; Member Portal</span>
              </span>
              <span className="hidden sm:inline text-xs text-muted-foreground truncate">
                Member Area &bull; Directory & Dues
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {userEmail && (
              <span className="hidden lg:inline-flex items-center text-xs text-muted-foreground bg-muted/50 border border-border/60 px-2.5 py-1 rounded-lg font-mono">
                {userEmail}
              </span>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
              >
                <LogoutIcon className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Logout</span>
              </button>
            </form>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Body */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
