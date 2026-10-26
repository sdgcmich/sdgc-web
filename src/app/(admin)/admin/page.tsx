import { AdminOverview } from "@/features/admin/components/admin-overview";
import { getAdminOverviewStats } from "@/features/admin/queries";
import { requireUser } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard Overview",
};

export default async function AdminPage() {
  const user = await requireUser("/admin");
  const supabase = await createClient();

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (userRoles || []).map((r) => r.role);
  const stats = await getAdminOverviewStats();

  return <AdminOverview metrics={stats} userRoles={roles} />;
}
