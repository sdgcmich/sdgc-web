import type { Route } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/register-form";

import { getCurrentTermInfo } from "@/features/payments/queries";
import { getMembershipYear } from "@/features/membership/rules";

export const metadata = {
  title: "Become A Member",
  description:
    "Join the Saugatuck Douglas Garden Club. Register your member profile, select volunteer project interests, and connect with fellow gardeners.",
};

export default async function JoinPage() {
  const term = await getCurrentTermInfo();
  const currentMichiganYear = getMembershipYear(new Date(), "America/Detroit");
  const year = term?.year ?? currentMichiganYear;
  const duesFormatted = term
    ? `$${(term.duesCents / 100).toFixed(2)} ${term.currency}`
    : "$50.00 USD";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Informational Header & Already a Member Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
            Join Our Growing Community
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Become A Member
          </h1>

          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground text-base">Membership Dues & Term:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                Currently accepting new membership requests for{" "}
                <span className="font-semibold text-foreground">calendar year {year}</span>.
              </li>
              <li>
                Membership dues are{" "}
                <span className="font-semibold text-foreground">{duesFormatted}</span> for January
                1st to December 31st.
              </li>
              <li>
                Membership renewals are annual in accordance with club bylaws (automatic recurring
                billing is not supported).
              </li>
            </ul>

            <p>
              Please use the registration form below to submit your profile and volunteer project
              preferences.
            </p>

            <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs space-y-1.5">
              <p className="font-semibold text-foreground">Paying by Personal Check?</p>
              <p>
                Members wishing to pay dues via personal check can register below, then mail check
                payable to:
              </p>
              <p className="font-medium text-foreground">
                Saugatuck Douglas Garden Club (SDGC)
                <br />
                P.O. Box 1011, Douglas, MI 49406
              </p>
            </div>

            <p className="text-xs">
              Questions regarding membership? Email us at{" "}
              <a
                href="mailto:info@saugatuckdouglasgardenclub.com"
                className="font-medium text-primary underline hover:text-primary/80"
              >
                info@saugatuckdouglasgardenclub.com
              </a>{" "}
              or send a message through our{" "}
              <Link
                href={"/contact" as Route}
                className="font-medium text-primary underline hover:text-primary/80"
              >
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Prominent "Already a member? LOGIN" Card from original site */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-xs space-y-4 text-center lg:sticky lg:top-28">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Already a member?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Sign in to your account to view directory details, renew dues, or update your
                profile.
              </p>
            </div>
            <Link
              href={"/login" as Route}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              Sign In to Member Area &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
        <RegisterForm />
      </div>
    </div>
  );
}
