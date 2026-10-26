import Link from "next/link";
import { requireUser, checkIsActiveMember, hasCapability } from "@/features/auth/authorization";
import { getMembershipYear } from "@/features/membership/rules";
import { getMemberDirectory } from "@/features/membership/queries";
import { MemberDirectory } from "@/features/membership/components/member-directory";

export const metadata = {
  title: "Member Directory",
  description: "Private member directory for active Saugatuck Douglas Garden Club members.",
};

export default async function DirectoryPage() {
  const user = await requireUser("/directory");

  const [isActive, isAdmin] = await Promise.all([
    checkIsActiveMember(user.id),
    hasCapability("members.manage", user.id),
  ]);

  if (!isActive && !isAdmin) {
    const termYear = getMembershipYear();
    return (
      <div className="mx-auto max-w-2xl text-center py-16 px-4 space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-2xl font-bold">
          🔒
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Member Directory Access Pending
        </h1>
        <p className="text-muted-foreground leading-relaxed text-sm">
          The SDGC Member Directory is a private community benefit reserved for active members in
          good standing. Your application or dues payment is currently awaiting confirmation for the{" "}
          {termYear} calendar year.
        </p>

        <div className="rounded-xl border border-border bg-card p-6 text-left space-y-3">
          <h2 className="font-semibold text-sm text-foreground">Next Steps to Activate Access:</h2>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
            <li>
              If you paid by check, our club Treasurer will mark your payment confirmed once
              received at P.O. Box 1011.
            </li>
            <li>
              If you recently submitted your registration, your membership will be approved at the
              next executive committee review.
            </li>
          </ul>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/profile"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Check My Profile & Dues
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Contact Secretary
          </Link>
        </div>
      </div>
    );
  }

  const members = await getMemberDirectory();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary font-bold">
          Members-Only Area
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-1">
          Private Member Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect with fellow club members, find project committee partners, and discover Master
          Gardeners in our community.
        </p>
      </div>

      <MemberDirectory initialMembers={members} />
    </div>
  );
}
