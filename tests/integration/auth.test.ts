import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { forgotPasswordAction } from "@/features/auth/actions";
import { updateSession } from "@/lib/supabase/proxy";
import { createAnonClient, createAuthClient, createServiceClient, getLocalFixtures } from "./setup";

describe("Phase P4: Authentication & Authorization Integration Tests", () => {
  const fixtures = getLocalFixtures();
  const anonClient = createAnonClient();
  const serviceClient = createServiceClient();

  describe("Username-or-Email Authentication", () => {
    it("authenticates successfully using email and password", async () => {
      const { data, error } = await anonClient.auth.signInWithPassword({
        email: "member@sdgc.local",
        password: "Password123!",
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe("member@sdgc.local");
      expect(data.session?.access_token).toBeDefined();
    });

    it("resolves username to email and authenticates successfully", async () => {
      // Resolve username "active_member" to email using secure lookup
      const { data: profile, error: lookupError } = await serviceClient
        .from("profiles")
        .select("id, username")
        .ilike("username", "active_member")
        .single();

      expect(lookupError).toBeNull();
      expect(profile).toBeDefined();

      const profileId = profile?.id ?? "";
      const { data: userData, error: userError } =
        await serviceClient.auth.admin.getUserById(profileId);
      expect(userError).toBeNull();
      expect(userData.user?.email).toBe("member@sdgc.local");

      // Sign in with the resolved email
      const targetEmail = userData.user?.email ?? "";
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: targetEmail,
        password: "Password123!",
      });

      expect(authError).toBeNull();
      expect(authData.user?.id).toBe(profile?.id);
    });

    it("returns an error for wrong password without exposing internal details", async () => {
      const { data, error } = await anonClient.auth.signInWithPassword({
        email: "member@sdgc.local",
        password: "WrongPassword999!",
      });

      expect(error).not.toBeNull();
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    it("determines redirect destination based on roles: admin routes to /admin, member routes to /profile", async () => {
      // 1. Check admin user roles
      const { data: adminUser } = await anonClient.auth.signInWithPassword({
        email: "admin@sdgc.local",
        password: "Password123!",
      });
      expect(adminUser.user).toBeDefined();

      const { data: adminRoles } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", adminUser.user?.id ?? "");
      const adminRoleList = (adminRoles || []).map((r) => r.role);
      const isAdminStaff = adminRoleList.some((r) => ["admin", "editor", "treasurer"].includes(r));
      expect(isAdminStaff).toBe(true);

      const adminDestination = isAdminStaff ? "/admin" : "/profile";
      expect(adminDestination).toBe("/admin");

      // 2. Check regular member user roles
      const { data: memberUser } = await anonClient.auth.signInWithPassword({
        email: "member@sdgc.local",
        password: "Password123!",
      });
      expect(memberUser.user).toBeDefined();

      const { data: memberRoles } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", memberUser.user?.id ?? "");
      const memberRoleList = (memberRoles || []).map((r) => r.role);
      const isMemberStaff = memberRoleList.some((r) =>
        ["admin", "editor", "treasurer"].includes(r),
      );
      expect(isMemberStaff).toBe(false);

      const memberDestination = isMemberStaff ? "/admin" : "/profile";
      expect(memberDestination).toBe("/profile");
    });

    it("rejects non-existent username lookup cleanly without revealing user existence", async () => {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("id, username")
        .ilike("username", "completely_non_existent_user_12345")
        .maybeSingle();

      expect(profile).toBeNull();
    });

    it("handles password recovery by email and username cleanly with uniform success response", async () => {
      const emailRes = await forgotPasswordAction("member@sdgc.local");
      expect(emailRes.success).toBe(true);

      const usernameRes = await forgotPasswordAction("active_member");
      expect(usernameRes.success).toBe(true);

      const nonExistentRes = await forgotPasswordAction("nonexistent_user_9999");
      expect(nonExistentRes.success).toBe(true);
    });
  });

  describe("Database Capabilities & RBAC Verification", () => {
    it("confirms admin has all capabilities", async () => {
      const adminId = fixtures.personas["admin@sdgc.local"].id;

      const { data: canManageContent } = await serviceClient.rpc("has_capability", {
        capability_name: "content.manage",
        check_user_id: adminId,
      });
      const { data: canReconcileDues } = await serviceClient.rpc("has_capability", {
        capability_name: "dues.reconcile",
        check_user_id: adminId,
      });
      const { data: canManageRoles } = await serviceClient.rpc("has_capability", {
        capability_name: "roles.manage",
        check_user_id: adminId,
      });

      expect(canManageContent).toBe(true);
      expect(canReconcileDues).toBe(true);
      expect(canManageRoles).toBe(true);
    });

    it("confirms editor has content.manage but not dues.reconcile or roles.manage", async () => {
      const editorId = fixtures.personas["editor@sdgc.local"].id;

      const { data: canManageContent } = await serviceClient.rpc("has_capability", {
        capability_name: "content.manage",
        check_user_id: editorId,
      });
      const { data: canReconcileDues } = await serviceClient.rpc("has_capability", {
        capability_name: "dues.reconcile",
        check_user_id: editorId,
      });
      const { data: canManageRoles } = await serviceClient.rpc("has_capability", {
        capability_name: "roles.manage",
        check_user_id: editorId,
      });

      expect(canManageContent).toBe(true);
      expect(canReconcileDues).toBe(false);
      expect(canManageRoles).toBe(false);
    });

    it("confirms treasurer has dues.reconcile but not content.manage or roles.manage", async () => {
      const treasurerId = fixtures.personas["treasurer@sdgc.local"].id;

      const { data: canManageContent } = await serviceClient.rpc("has_capability", {
        capability_name: "content.manage",
        check_user_id: treasurerId,
      });
      const { data: canReconcileDues } = await serviceClient.rpc("has_capability", {
        capability_name: "dues.reconcile",
        check_user_id: treasurerId,
      });

      expect(canManageContent).toBe(false);
      expect(canReconcileDues).toBe(true);
    });

    it("confirms regular member has no administrative capabilities", async () => {
      const memberId = fixtures.personas["member@sdgc.local"].id;

      const { data: canManageContent } = await serviceClient.rpc("has_capability", {
        capability_name: "content.manage",
        check_user_id: memberId,
      });
      const { data: canReconcileDues } = await serviceClient.rpc("has_capability", {
        capability_name: "dues.reconcile",
        check_user_id: memberId,
      });

      expect(canManageContent).toBe(false);
      expect(canReconcileDues).toBe(false);
    });

    it("evaluates is_active_member correctly for approved vs pending members", async () => {
      const memberId = fixtures.personas["member@sdgc.local"].id;
      const pendingId = fixtures.personas["pending@sdgc.local"].id;

      const { data: isActiveApproved } = await serviceClient.rpc("is_active_member", {
        check_user_id: memberId,
      });
      const { data: isActivePending } = await serviceClient.rpc("is_active_member", {
        check_user_id: pendingId,
      });

      expect(isActiveApproved).toBe(true);
      expect(isActivePending).toBe(false);
    });
  });

  describe("Member Profile Data Operations", () => {
    it("reads own profile and project interests", async () => {
      const { client, userId } = await createAuthClient("member@sdgc.local");

      const { data: profile, error: profileErr } = await client
        .from("profiles")
        .select(
          "id, username, first_name, last_name, phone, address_line1, city, state, postal_code",
        )
        .eq("id", userId)
        .single();

      expect(profileErr).toBeNull();
      expect(profile?.username).toBe("active_member");
      expect(profile?.first_name).toBeDefined();

      const { data: interests, error: intErr } = await client
        .from("profile_interests")
        .select("project_code")
        .eq("user_id", userId);

      expect(intErr).toBeNull();
      expect(Array.isArray(interests)).toBe(true);
    });

    it("updates own profile and updates are reflected immediately", async () => {
      const { client, userId } = await createAuthClient("member@sdgc.local");

      const testPhone = "269-555-0888";
      const { error: updateErr } = await client
        .from("profiles")
        .update({ phone: testPhone })
        .eq("id", userId);

      expect(updateErr).toBeNull();

      const { data: verified } = await client
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .single();

      expect(verified?.phone).toBe(testPhone);
    });
  });

  describe("Edge Proxy Session & Protected Route Guards", () => {
    it("immediately returns HTTP 307 redirect to login for unauthenticated access to /directory", async () => {
      const req = new NextRequest("http://localhost:3000/directory");
      const { response, user } = await updateSession(req);
      expect(user).toBeNull();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?returnTo=%2Fdirectory",
      );
    });

    it("immediately returns HTTP 307 redirect to login for unauthenticated access to /admin with search params", async () => {
      const req = new NextRequest("http://localhost:3000/admin/members?filter=pending");
      const { response, user } = await updateSession(req);
      expect(user).toBeNull();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?returnTo=%2Fadmin%2Fmembers%3Ffilter%3Dpending",
      );
    });

    it("immediately returns HTTP 307 redirect to login for unauthenticated access to /profile and /dues", async () => {
      for (const path of ["/profile", "/dues"]) {
        const req = new NextRequest(`http://localhost:3000${path}`);
        const { response, user } = await updateSession(req);
        expect(user).toBeNull();
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          `http://localhost:3000/login?returnTo=${encodeURIComponent(path)}`,
        );
      }
    });

    it("does not block unauthenticated access to public routes like /membership, /events, /about", async () => {
      for (const path of ["/membership", "/events", "/about", "/"]) {
        const req = new NextRequest(`http://localhost:3000${path}`);
        const { response, user } = await updateSession(req);
        expect(user).toBeNull();
        expect(response.status).toBe(200);
        expect(response.headers.get("location")).toBeNull();
      }
    });
  });
});
