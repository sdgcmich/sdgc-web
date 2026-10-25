import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCurrentUser } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let isStaff = false;
  let roleName = "Member";
  if (user) {
    const supabase = await createClient();
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (userRoles || []).map((r) => r.role);
    isStaff = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
    if (roles.includes("admin")) {
      roleName = "Admin";
    } else if (roles.includes("treasurer")) {
      roleName = "Treasurer";
    } else if (roles.includes("editor")) {
      roleName = "Editor";
    } else {
      roleName = "Member";
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader initialUser={user ? { email: user.email, isStaff, roleName } : null} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
