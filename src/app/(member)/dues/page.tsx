import { Suspense } from "react";
import { requireUser } from "@/features/auth/authorization";
import { getOwnMembershipSummary } from "@/features/membership/queries";
import { getCurrentTermInfo, getRecentPaymentsForUser } from "@/features/payments/queries";
import { getMembershipYear } from "@/features/membership/rules";
import { DuesCard } from "@/features/membership/components/dues-card";
import type { MembershipSummary } from "@/features/membership/types";

export const metadata = {
  title: "Annual Dues & Reconciliation",
};

export default async function MemberDuesPage() {
  const user = await requireUser("/dues");
  const term = await getCurrentTermInfo();
  const michiganYear = getMembershipYear(new Date(), "America/Detroit");
  const targetYear = term?.year ?? michiganYear;
  const summary = await getOwnMembershipSummary(targetYear);
  const paymentHistory = await getRecentPaymentsForUser();

  const membershipData: MembershipSummary = summary ?? {
    id: "",
    userId: user.id,
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
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Annual Membership Dues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your current membership standing, submit annual dues, or inspect past transaction
          receipts.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading dues status...
          </div>
        }
      >
        <DuesCard membership={membershipData} isLoggedIn={true} paymentHistory={paymentHistory} />
      </Suspense>
    </div>
  );
}
