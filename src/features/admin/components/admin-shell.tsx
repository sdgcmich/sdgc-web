"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { resolveMediaUrl } from "@/lib/storage/media-url";

interface AdminShellProps {
  children: React.ReactNode;
  activeRole?: string;
  roles?: string[];
  userEmail?: string;
}

interface NavItem {
  href: Route | string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  allowedRoles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function NoticeIcon({ className = "h-4 w-4" }: { className?: string }) {
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
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

function DashboardIcon({ className = "h-4 w-4" }: { className?: string }) {
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

function UsersIcon({ className = "h-4 w-4" }: { className?: string }) {
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

function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function MediaIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
    </svg>
  );
}

function TicketIcon({ className = "h-4 w-4" }: { className?: string }) {
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
        d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
      />
    </svg>
  );
}

function DocumentIcon({ className = "h-4 w-4" }: { className?: string }) {
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
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function InboxIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      />
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

function SettingsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  );
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
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
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
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: DashboardIcon,
        allowedRoles: ["admin", "editor", "treasurer"],
      },
    ],
  },
  {
    title: "MEMBERSHIP",
    items: [
      {
        href: "/admin/members",
        label: "Members & Approvals",
        icon: UsersIcon,
        allowedRoles: ["admin", "treasurer"],
      },
      {
        href: "/admin/dues",
        label: "Dues & Reconciliation",
        icon: CreditCardIcon,
        allowedRoles: ["admin", "treasurer"],
      },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        href: "/admin/events",
        label: "Events & Scheduling",
        icon: CalendarIcon,
        allowedRoles: ["admin", "editor"],
      },
      {
        href: "/admin/media",
        label: "Media & Albums",
        icon: MediaIcon,
        allowedRoles: ["admin", "editor"],
      },
      {
        href: "/admin/content",
        label: "Pages & Copy",
        icon: DocumentIcon,
        allowedRoles: ["admin", "editor"],
      },
      {
        href: "/admin/notices",
        label: "Notice Board",
        icon: NoticeIcon,
        allowedRoles: ["admin", "editor"],
      },
      {
        href: "/admin/tickets",
        label: "Tickets & Garden Walk",
        icon: TicketIcon,
        allowedRoles: ["admin", "editor", "treasurer"],
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        href: "/admin/messages",
        label: "Contact Inbox",
        icon: InboxIcon,
        allowedRoles: ["admin"],
      },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      {
        href: "/admin/settings/profile",
        label: "Admin Profile",
        icon: UserIcon,
        allowedRoles: ["admin", "editor", "treasurer"],
      },
      {
        href: "/admin/settings/security",
        label: "Security & MFA",
        icon: ShieldIcon,
        allowedRoles: ["admin", "editor", "treasurer"],
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        href: "/admin/settings",
        label: "Site Settings",
        icon: SettingsIcon,
        allowedRoles: ["admin"],
      },
    ],
  },
];

function SidebarNavigation({
  visibleGroups,
  pathname,
  activeRole,
  onNavigate,
}: {
  visibleGroups: NavGroup[];
  pathname: string;
  activeRole: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-card">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5">
        <Link href="/admin" onClick={onNavigate} className="flex items-center space-x-3">
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
              Operator Workspace
            </span>
          </div>
        </Link>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          {activeRole}
        </span>
      </div>

      {/* Navigation Categories */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {visibleGroups.map((group) => (
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

export function AdminShell({
  children,
  activeRole = "Administrator",
  roles,
  userEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const userRoles = roles && roles.length > 0 ? roles : ["admin"];
  const visibleGroups = React.useMemo(() => {
    return ADMIN_GROUPS.map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.some((role) => userRoles.includes(role));
      });
      return {
        ...group,
        items: filteredItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [userRoles]);

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

  // Lock body scroll when mobile/tablet drawer is open
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

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      {/* Desktop Sticky Sidebar (Visible only on lg: 1024px+) */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 border-r border-border/60 bg-card flex-col sticky top-0 h-screen">
        <SidebarNavigation
          visibleGroups={visibleGroups}
          pathname={pathname}
          activeRole={activeRole}
        />
      </aside>

      {/* Mobile & Tablet Slide-over Drawer (Visible on < lg when open) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
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
            <SidebarNavigation
              visibleGroups={visibleGroups}
              pathname={pathname}
              activeRole={activeRole}
              onNavigate={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Container Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Workspace Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/95 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center p-2 rounded-xl border border-border/60 text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
              aria-label="Open administration navigation"
              aria-expanded={isSidebarOpen}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                SDGC &bull; Operator Workspace
              </span>
              <span className="text-xs text-muted-foreground">
                Staff administration &bull; Real RBAC audit enabled
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {userEmail && (
              <Link
                href="/admin/settings/profile"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/60 px-2.5 py-1.5 rounded-xl font-mono transition-colors"
                title="Manage Admin Profile"
              >
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span>{userEmail}</span>
              </Link>
            )}
            <Link
              href="/admin/settings/profile"
              className="sm:hidden flex items-center justify-center p-2 rounded-xl border border-border/60 text-foreground hover:bg-muted transition-colors"
              title="Admin Profile"
            >
              <UserIcon className="h-4 w-4 text-primary" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
              >
                <LogoutIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
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
