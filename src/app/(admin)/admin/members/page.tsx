import { AdminMembers } from "@/features/admin/components/admin-members";
import { getAdminMembers } from "@/features/admin/queries";
import { requireCapability, hasCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Member Roster & Approvals",
};

interface AdminMembersPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const user = await requireCapability(["members.manage", "memberships.approve"], "/admin/members");
  const isAdmin = await hasCapability("roles.manage", user.id);
  const isSuperAdmin = await hasCapability("roles.admin", user.id);
  const params = await searchParams;
  const members = await getAdminMembers();
  return (
    <AdminMembers
      initialMembers={members}
      initialStatusFilter={params?.status}
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
