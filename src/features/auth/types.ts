import type { MemberProfile } from "@/features/membership/types";

export type AppRole = "super_admin" | "admin" | "editor" | "treasurer";

export type Capability =
  | "content.manage"
  | "events.manage"
  | "media.manage"
  | "dues.reconcile"
  | "memberships.approve"
  | "members.manage"
  | "messages.manage"
  | "roles.manage"
  | "roles.admin"
  | "super_admin.manage"
  | "settings.manage"
  | "audit.view";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export interface AuthSessionUser {
  id: string;
  email: string;
  username: string;
  roles: AppRole[];
  capabilities: Capability[];
  profile?: MemberProfile;
  membershipStatus?: "approved" | "pending" | "none" | "expired" | "rejected" | "suspended";
}
