import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/authorization";
import { getOwnProfile } from "@/features/membership/queries";
import { MemberCard } from "@/features/membership/components/member-card";
import { ProfileEditor } from "@/features/membership/components/profile-editor";
import { AccountSecurity } from "@/features/membership/components/account-security";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Member Profile",
  description:
    "View and edit your personal member profile details, password, and two-factor authentication credentials.",
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  const supabase = await createClient();
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = (userRoles || []).map((r) => r.role);
  const isStaff = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
  if (isStaff) {
    redirect("/admin/settings/profile");
  }

  const profile = await getOwnProfile();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="print:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Member Dashboard
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
          My Member Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your contact information, address, volunteer preferences, and account security up to
          date.
        </p>
      </div>

      {/* Member Verification Card */}
      {profile && <MemberCard profile={profile} />}

      {/* Profile Details Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-6 print:hidden">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Member Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal contact details and project volunteer preferences
          </p>
        </div>

        {profile ? (
          <ProfileEditor initialProfile={profile} />
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No profile record found. Please{" "}
            <Link href="/join" className="text-primary underline">
              complete membership registration
            </Link>{" "}
            to view your profile.
          </div>
        )}
      </div>

      {/* Account Security Card: Password Reset & MFA TOTP */}
      <div className="space-y-4 pt-2 print:hidden">
        <AccountSecurity userEmail={user?.email} />
      </div>
    </div>
  );
}
