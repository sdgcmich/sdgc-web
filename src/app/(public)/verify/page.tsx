import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Credential & Gate Verification | Saugatuck Douglas Garden Club",
  description:
    "Official verification portal for Saugatuck Douglas Garden Club event ticket passes and membership identification credentials.",
};

export default function VerificationHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Official Verification Portal
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
          Club Credential &amp; Gate Verification
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Scan QR codes or enter reference numbers to verify advance tour passes, workshop
          registrations, and active club member privileges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket Verification Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 group hover:border-primary/40 transition-colors">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Event Ticket &amp; Pass Verification
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                For gate attendants, volunteers, and tour attendees. Scan pass QR codes with mobile
                camera to check admission validity and admit attendees.
              </p>
            </div>
          </div>

          <Link
            href={"/verify/ticket" as Route}
            className="rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            Open Ticket Gate Scanner &rarr;
          </Link>
        </div>

        {/* Member ID Verification Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 group hover:border-primary/40 transition-colors">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Membership ID Credential
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Verify active membership standing, term season, Master Gardener certification, and
                privileges at participating local community nursery partners.
              </p>
            </div>
          </div>

          <Link
            href={"/verify/member" as Route}
            className="rounded-2xl border border-border bg-muted/40 px-5 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Verify Member ID &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
