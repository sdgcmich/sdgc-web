import { getCurrentUser } from "@/features/auth/authorization";
import { getOwnMembershipSummary } from "@/features/membership/queries";
import { getCurrentTermInfo } from "@/features/payments/queries";
import { getMembershipYear } from "@/features/membership/rules";
import { DuesCard } from "@/features/membership/components/dues-card";
import type { MembershipSummary } from "@/features/membership/types";

export async function generateMetadata() {
  const term = await getCurrentTermInfo();
  const year = term?.year ?? getMembershipYear(new Date(), "America/Detroit");
  const dues = term ? `$${(term.duesCents / 100).toFixed(2)}` : "$50.00";
  return {
    title: "Annual Membership & Dues",
    description: `Annual dues rate (${dues} for calendar year ${year}), non-recurring renewal policy, online card payment, and mail-in check instructions for Saugatuck Douglas Garden Club.`,
  };
}

export default async function MembershipPage() {
  const user = await getCurrentUser();
  const term = await getCurrentTermInfo();
  const michiganYear = getMembershipYear(new Date(), "America/Detroit");
  const targetYear = term?.year ?? michiganYear;
  const summary = user ? await getOwnMembershipSummary(targetYear) : null;

  const membershipData: MembershipSummary = summary ?? {
    id: "",
    userId: user?.id ?? "",
    year: targetYear,
    duesCents: term?.duesCents ?? 5000,
    currency: "USD",
    applicationStatus: "pending",
    paymentStatus: "unpaid",
    paymentMethod: undefined,
    isApproved: false,
    isSuspended: false,
    isActive: false,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wide">
          Member Governance &amp; Dues
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
          Annual Membership &amp; Dues
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
          SDGC membership runs on a calendar year basis (January 1 – December 31). In accordance
          with club bylaws, membership renewals are annual and non-recurring.
        </p>
      </div>

      <DuesCard membership={membershipData} isLoggedIn={Boolean(user)} />
    </div>
  );
}
