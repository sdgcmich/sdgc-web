import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AdminMetrics } from "../types";

interface AdminOverviewProps {
  metrics?: AdminMetrics;
}

export function AdminOverview({ metrics }: AdminOverviewProps) {
  const stats = [
    {
      label: "Active Members",
      sublabel: "Current Term",
      value: metrics ? String(metrics.totalMembers) : "—",
      href: "/admin/members?status=approved",
      icon: (
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
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
          />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Pending Approvals",
      value: metrics ? String(metrics.pendingApprovals) : "—",
      alert: Boolean(metrics && metrics.pendingApprovals > 0),
      href: "/admin/members?status=pending",
      icon: (
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
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      ),
    },
    {
      label: "Unreconciled Dues",
      value: metrics ? String(metrics.unreconciledPayments) : "—",
      alert: Boolean(metrics && metrics.unreconciledPayments > 0),
      href: "/admin/dues?status=pending",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      label: "Upcoming Events",
      value: metrics ? String(metrics.upcomingEvents) : "—",
      href: "/admin/events",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      label: "Garden Walk Tickets",
      value: metrics?.totalTickets !== undefined ? String(metrics.totalTickets) : "—",
      href: "/admin/tickets",
      icon: (
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
            d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
          />
        </svg>
      ),
    },
    {
      label: "Unread Messages",
      value: metrics ? String(metrics.unreadMessages) : "—",
      alert: Boolean(metrics && metrics.unreadMessages > 0),
      href: "/admin/messages?status=unread",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase mb-3">
          Operator Workspace
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Administrative Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Club governance, member approvals, dues reconciliation, and dynamic content management.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href as Route}
            className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-1.5 min-h-[24px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {stat.icon}
              </div>
              {stat.alert && (
                <Badge variant="warning" className="shrink-0 text-[10px] px-1.5 py-0.5">
                  Action
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-bold text-foreground block tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1 block">
                {stat.label}
                {stat.sublabel && (
                  <span className="font-normal text-muted-foreground/70"> ({stat.sublabel})</span>
                )}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
              👥
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Membership & Dues</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review pending member applications. Confirm payment status and issue manual membership
              approval as required by SDGC annual dues policies.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Link
              href="/admin/members"
              className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              Pending Members &rarr;
            </Link>
            <Link
              href="/admin/dues"
              className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Reconcile Dues
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
              🎟️
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Events & Garden Walk</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Schedule upcoming educational lectures, oversee ticket order rosters for the Garden
              Walk, check in tour guests, and curate photo albums.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Link
              href="/admin/tickets"
              className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              Tour Admissions &rarr;
            </Link>
            <Link
              href="/admin/events"
              className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Manage Events
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
              📝
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">
              Public Site & Legal CMS
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Update marketing copy across Home, About Us, Garden Walk, and Join pages, or edit
              Terms and Privacy legal disclosures with the rich markdown editor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Link
              href="/admin/content"
              className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              Edit Public Copy &rarr;
            </Link>
            <Link
              href="/admin/notices"
              className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Notice Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
