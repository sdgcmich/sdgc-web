"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import type { AdminMemberRecord } from "../types";
import {
  approveMembershipAction,
  setUserRolesAction,
  adminUpdateMemberProfileAction,
  adminCreateMemberAction,
  adminToggleMemberBanAction,
  adminRecoverMemberAccountAction,
} from "../actions";

interface AdminMembersProps {
  initialMembers: AdminMemberRecord[];
  initialStatusFilter?: string;
  isAdmin?: boolean;
}

export function AdminMembers({
  initialMembers,
  initialStatusFilter,
  isAdmin = false,
}: AdminMembersProps) {
  const [members, setMembers] = React.useState<AdminMemberRecord[]>(initialMembers);
  const [filter, setFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter || "all");
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Role Management State
  const [selectedUserForRoles, setSelectedUserForRoles] = React.useState<AdminMemberRecord | null>(
    null,
  );
  const [assignedRoles, setAssignedRoles] = React.useState<("admin" | "editor" | "treasurer")[]>(
    [],
  );

  // Profile Edit State
  const [editingMember, setEditingMember] = React.useState<AdminMemberRecord | null>(null);
  const [editFullName, setEditFullName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editAltPhone, setEditAltPhone] = React.useState("");
  const [editSpouseFirstName, setEditSpouseFirstName] = React.useState("");
  const [editAddressLine1, setEditAddressLine1] = React.useState("");
  const [editAddressLine2, setEditAddressLine2] = React.useState("");
  const [editCity, setEditCity] = React.useState("");
  const [editState, setEditState] = React.useState("");
  const [editPostalCode, setEditPostalCode] = React.useState("");
  const [editGardeningInterests, setEditGardeningInterests] = React.useState("");
  const [editVolunteerExperience, setEditVolunteerExperience] = React.useState("");
  const [editIsMasterGardener, setEditIsMasterGardener] = React.useState(false);
  const [editDirectoryOptOut, setEditDirectoryOptOut] = React.useState(false);
  const [editNotes, setEditNotes] = React.useState("");

  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [addFullName, setAddFullName] = React.useState("");
  const [addEmail, setAddEmail] = React.useState("");
  const [addUsername, setAddUsername] = React.useState("");
  const [addPhone, setAddPhone] = React.useState("");
  const [addRole, setAddRole] = React.useState<"member" | "editor" | "treasurer" | "admin">(
    "member",
  );
  const [addStatus, setAddStatus] = React.useState<"approved" | "pending">("approved");
  const [addWaiveDues, setAddWaiveDues] = React.useState(true);
  const [addSendRecovery, setAddSendRecovery] = React.useState(true);
  const [addPassword, setAddPassword] = React.useState("");
  const [createdRecoveryLink, setCreatedRecoveryLink] = React.useState<string | null>(null);

  // Ban / Suspend State
  const [suspendingMember, setSuspendingMember] = React.useState<AdminMemberRecord | null>(null);
  const [suspendReason, setSuspendReason] = React.useState("");

  // Reinstate State
  const [reinstatingMember, setReinstatingMember] = React.useState<AdminMemberRecord | null>(null);

  // Account Recovery State
  const [recoveringMember, setRecoveringMember] = React.useState<AdminMemberRecord | null>(null);
  const [recoveryResultLink, setRecoveryResultLink] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // Keyboard shortcut (Escape to close any open modal)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedUserForRoles) setSelectedUserForRoles(null);
        if (editingMember) setEditingMember(null);
        if (isAddMemberOpen) setIsAddMemberOpen(false);
        if (suspendingMember) setSuspendingMember(null);
        if (reinstatingMember) setReinstatingMember(null);
        if (recoveringMember) {
          setRecoveringMember(null);
          setRecoveryResultLink(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedUserForRoles,
    editingMember,
    isAddMemberOpen,
    suspendingMember,
    reinstatingMember,
    recoveringMember,
  ]);

  // Sync if initialMembers changes
  React.useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleOpenEditProfile = (member: AdminMemberRecord) => {
    setEditingMember(member);
    setEditFullName(member.name);
    setEditPhone(member.phone || "");
    setEditAltPhone(member.altPhone || "");
    setEditSpouseFirstName(member.spouseFirstName || "");
    setEditAddressLine1(member.addressLine1 || "");
    setEditAddressLine2(member.addressLine2 || "");
    setEditCity(member.city || "");
    setEditState(member.state || "");
    setEditPostalCode(member.postalCode || "");
    setEditGardeningInterests(member.gardeningInterests || "");
    setEditVolunteerExperience(member.volunteerExperience || member.workExperience || "");
    setEditIsMasterGardener(member.isMasterGardener);
    setEditDirectoryOptOut(Boolean(member.directoryOptOut));
    setEditNotes(member.adminNotes || "");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await adminUpdateMemberProfileAction({
        userId: editingMember.userId,
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
        altPhone: editAltPhone.trim() || undefined,
        spouseFirstName: editSpouseFirstName.trim() || undefined,
        addressLine1: editAddressLine1.trim() || undefined,
        addressLine2: editAddressLine2.trim() || undefined,
        city: editCity.trim() || undefined,
        state: editState.trim() || undefined,
        postalCode: editPostalCode.trim() || undefined,
        gardeningInterests: editGardeningInterests.trim() || undefined,
        volunteerExperience: editVolunteerExperience.trim() || undefined,
        isMasterGardener: editIsMasterGardener,
        directoryOptOut: editDirectoryOptOut,
        notes: editNotes.trim() || undefined,
      });

      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === editingMember.userId
              ? {
                  ...m,
                  name: editFullName.trim(),
                  phone: editPhone.trim() || undefined,
                  altPhone: editAltPhone.trim() || undefined,
                  spouseFirstName: editSpouseFirstName.trim() || undefined,
                  addressLine1: editAddressLine1.trim() || undefined,
                  addressLine2: editAddressLine2.trim() || undefined,
                  city: editCity.trim() || undefined,
                  state: editState.trim() || undefined,
                  postalCode: editPostalCode.trim() || undefined,
                  gardeningInterests: editGardeningInterests.trim() || undefined,
                  volunteerExperience: editVolunteerExperience.trim() || undefined,
                  workExperience: editVolunteerExperience.trim() || undefined,
                  isMasterGardener: editIsMasterGardener,
                  directoryOptOut: editDirectoryOptOut,
                  adminNotes: editNotes.trim() || undefined,
                }
              : m,
          ),
        );
        setActionNotice(`Member profile updated for ${editFullName.trim()}.`);
        setEditingMember(null);
      } else {
        setIsError(true);
        setActionNotice(`Failed to update profile: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string, name: string, version: number) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await approveMembershipAction({
        membershipId: id,
        expectedVersion: version,
      });

      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, isApproved: true, applicationStatus: "approved", version: version + 1 }
              : m,
          ),
        );
        setActionNotice(`Membership approved for ${name}. Audit record created.`);
      } else {
        setIsError(true);
        setActionNotice(`Could not approve ${name}: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRoleModal = (member: AdminMemberRecord) => {
    setSelectedUserForRoles(member);
    const privilegedRoles = member.roles.filter(
      (r): r is "admin" | "editor" | "treasurer" =>
        r === "admin" || r === "editor" || r === "treasurer",
    );
    setAssignedRoles(privilegedRoles);
  };

  const handleSaveRoles = async () => {
    if (!selectedUserForRoles) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await setUserRolesAction({
        userId: selectedUserForRoles.userId,
        roles: assignedRoles,
      });

      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === selectedUserForRoles.userId
              ? {
                  ...m,
                  roles: ["member", ...assignedRoles],
                }
              : m,
          ),
        );
        setActionNotice(`Updated roles for ${selectedUserForRoles.name}.`);
        setSelectedUserForRoles(null);
      } else {
        setIsError(true);
        setActionNotice(`Role update rejected: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Member Handler
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsError(false);
    setCreatedRecoveryLink(null);

    try {
      const res = await adminCreateMemberAction({
        fullName: addFullName.trim(),
        email: addEmail.trim(),
        username: addUsername.trim() || undefined,
        phone: addPhone.trim() || undefined,
        role: addRole,
        status: addStatus,
        waiveDues: addWaiveDues,
        sendRecoveryEmail: addSendRecovery,
        password: addPassword.trim() || undefined,
      });

      if (res.success) {
        const newRecord: AdminMemberRecord = {
          id: res.data?.userId ? `mem-${res.data.userId}` : `mem-${Date.now()}`,
          userId: res.data?.userId || `user-${Date.now()}`,
          username:
            addUsername.trim() ||
            (addEmail.split("@")[0] ?? "member").toLowerCase().replace(/[^a-z0-9_]/g, ""),
          name: addFullName.trim(),
          email: addEmail.trim(),
          year: new Date().getFullYear(),
          applicationStatus: addStatus,
          paymentStatus: addWaiveDues && addStatus === "approved" ? "confirmed" : "pending",
          isApproved: addStatus === "approved",
          isMasterGardener: false,
          version: 1,
          roles: addRole === "member" ? ["member"] : ["member", addRole],
          appliedAt: new Date().toISOString(),
          phone: addPhone.trim() || undefined,
        };

        setMembers((prev) => [newRecord, ...prev]);
        setActionNotice(res.message || "Member created successfully.");

        if (res.data?.recoveryLink) {
          setCreatedRecoveryLink(res.data.recoveryLink);
        } else {
          // Reset form and close modal if no link to display
          setIsAddMemberOpen(false);
          setAddFullName("");
          setAddEmail("");
          setAddUsername("");
          setAddPhone("");
          setAddRole("member");
          setAddStatus("approved");
          setAddWaiveDues(true);
          setAddSendRecovery(true);
          setAddPassword("");
        }
      } else {
        setIsError(true);
        setActionNotice(`Failed to create member: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suspend Member Handler
  const handleConfirmSuspend = async () => {
    if (!suspendingMember) return;
    setIsSubmitting(true);
    setIsError(false);

    try {
      const res = await adminToggleMemberBanAction({
        userId: suspendingMember.userId,
        membershipId: suspendingMember.id,
        suspend: true,
        reason: suspendReason.trim() || undefined,
      });

      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === suspendingMember.id
              ? { ...m, applicationStatus: "suspended", isApproved: false }
              : m,
          ),
        );
        setActionNotice(res.message || `Account for ${suspendingMember.name} has been suspended.`);
        setSuspendingMember(null);
        setSuspendReason("");
      } else {
        setIsError(true);
        setActionNotice(`Failed to suspend account: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reinstate Member Handler
  const handleConfirmReinstate = async () => {
    if (!reinstatingMember) return;
    setIsSubmitting(true);
    setIsError(false);

    try {
      const res = await adminToggleMemberBanAction({
        userId: reinstatingMember.userId,
        membershipId: reinstatingMember.id,
        suspend: false,
      });

      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === reinstatingMember.id
              ? { ...m, applicationStatus: "approved", isApproved: true }
              : m,
          ),
        );
        setActionNotice(
          res.message || `Account for ${reinstatingMember.name} has been reinstated.`,
        );
        setReinstatingMember(null);
      } else {
        setIsError(true);
        setActionNotice(`Failed to reinstate account: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recover Account Handler
  const handleOpenRecoverModal = (member: AdminMemberRecord) => {
    setRecoveringMember(member);
    setRecoveryResultLink(null);
    setIsCopied(false);
  };

  const handleGenerateRecoveryLink = async () => {
    if (!recoveringMember) return;
    setIsSubmitting(true);
    setIsError(false);

    try {
      const res = await adminRecoverMemberAccountAction({
        userId: recoveringMember.userId,
        email: recoveringMember.email,
      });

      if (res.success) {
        setRecoveryResultLink(res.data?.recoveryLink || null);
        setActionNotice(
          res.message || `Recovery link generated successfully for ${recoveringMember.email}.`,
        );
      } else {
        setIsError(true);
        setActionNotice(`Recovery request failed: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setActionNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(filter.toLowerCase()) ||
        m.username.toLowerCase().includes(filter.toLowerCase()) ||
        m.email.toLowerCase().includes(filter.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "pending") return m.applicationStatus === "pending";
      if (statusFilter === "approved") return m.applicationStatus === "approved";
      if (statusFilter === "suspended") return m.applicationStatus === "suspended";
      return true;
    });
  }, [members, filter, statusFilter]);

  const paginatedMembers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Member Management & Approvals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review member registrations, verify payment state, manage RBAC roles, and issue manual
            annual approvals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {isAdmin && (
            <Button
              type="button"
              onClick={() => {
                setCreatedRecoveryLink(null);
                setIsAddMemberOpen(true);
              }}
              className="rounded-xl shadow-xs cursor-pointer font-semibold"
            >
              + Add Member
            </Button>
          )}

          <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "suspended", label: "Suspended" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-56">
            <Input
              placeholder="Search members..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border-border/60 bg-card"
            />
          </div>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`rounded-xl p-3.5 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
          role="status"
        >
          {actionNotice}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full text-left text-sm min-w-[860px]">
            <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 min-w-[140px]">Member Name</th>
                <th className="p-4 min-w-[180px]">Username & Email</th>
                <th className="p-4 min-w-[100px]">Payment</th>
                <th className="p-4 min-w-[140px]">Approval Status</th>
                <th className="p-4 min-w-[120px]">Roles</th>
                <th className="p-4 text-right min-w-[240px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No members found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-foreground block">{member.name}</span>
                      {member.isMasterGardener && (
                        <span className="text-[11px] text-primary font-medium">
                          Master Gardener
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs block text-foreground">
                        @{member.username}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </td>
                    <td className="p-4">
                      {member.paymentStatus === "confirmed" ? (
                        <Badge variant="success">Paid ($50)</Badge>
                      ) : (
                        <Badge variant="outline">Unpaid</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {member.applicationStatus === "suspended" ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : member.isApproved ? (
                        <Badge variant="default">Active / Approved</Badge>
                      ) : (
                        <Badge variant="warning">Pending Approval</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap items-center">
                        {member.roles.map((r) => (
                          <span
                            key={r}
                            className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold ${
                              r === "admin"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                                : r === "editor"
                                  ? "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200"
                                  : r === "treasurer"
                                    ? "bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(member)}
                            className="text-[10px] text-primary hover:underline ml-1 cursor-pointer font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditProfile(member)}
                        >
                          Details
                        </Button>

                        {member.applicationStatus === "suspended" ? (
                          isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 dark:text-emerald-300 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              disabled={isSubmitting}
                              onClick={() => setReinstatingMember(member)}
                            >
                              Reinstate
                            </Button>
                          )
                        ) : !member.isApproved ? (
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => handleApprove(member.id, member.name, member.version)}
                          >
                            Approve
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium px-1">
                            Approved
                          </span>
                        )}

                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRoleModal(member)}
                            >
                              Roles
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRecoverModal(member)}
                            >
                              Recover
                            </Button>
                            {member.applicationStatus !== "suspended" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isSubmitting}
                                onClick={() => {
                                  setSuspendReason("");
                                  setSuspendingMember(member);
                                }}
                              >
                                Suspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50]}
          itemLabel="members"
        />
      </div>

      {/* Role Management / Promote & Demote Modal */}
      {selectedUserForRoles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-roles-modal-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
          >
            <h2
              id="manage-roles-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Manage Roles & Permissions
            </h2>
            <p className="text-xs text-muted-foreground">
              User:{" "}
              <span className="font-semibold text-foreground">{selectedUserForRoles.name}</span> (@
              {selectedUserForRoles.username}). Promote or demote staff roles. Standard member
              access is always included.
            </p>

            <div className="space-y-3 pt-2">
              {(["admin", "editor", "treasurer"] as const).map((role) => {
                const checked = assignedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-background hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedRoles([...assignedRoles, role]);
                        } else {
                          setAssignedRoles(assignedRoles.filter((r) => r !== role));
                        }
                      }}
                      className="rounded border-input text-primary h-4 w-4"
                    />
                    <div>
                      <span className="text-sm font-semibold text-foreground uppercase tracking-wider block">
                        {role === "admin"
                          ? "Administrator"
                          : role === "editor"
                            ? "Editor"
                            : "Treasurer"}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {role === "admin" &&
                          "Full administrative control, RBAC, member management, and site settings"}
                        {role === "editor" &&
                          "Publish and manage events, photo galleries, notices, and web pages"}
                        {role === "treasurer" &&
                          "Reconcile paper checks, verify dues payments, and approve memberships"}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground">
              * To demote to standard Member, uncheck all staff roles above.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserForRoles(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveRoles} disabled={isSubmitting}>
                Save Roles
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-modal-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2
              id="add-member-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Create New Member Account
            </h2>
            <p className="text-xs text-muted-foreground">
              Provision a verified member or staff user directly without manual database
              adjustments.
            </p>

            {createdRecoveryLink ? (
              <div className="space-y-4 py-3">
                <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <p className="font-semibold text-sm">Account Created Successfully!</p>
                  <p className="text-xs">
                    Password recovery / activation link generated. Share this link directly with the
                    user:
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      readOnly
                      value={createdRecoveryLink}
                      className="text-xs font-mono bg-background text-foreground"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(createdRecoveryLink);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                    >
                      {isCopied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      setIsAddMemberOpen(false);
                      setCreatedRecoveryLink(null);
                      setAddFullName("");
                      setAddEmail("");
                      setAddUsername("");
                      setAddPhone("");
                      setAddPassword("");
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateMember} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="add-fullname"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Full Name *
                    </label>
                    <Input
                      id="add-fullname"
                      required
                      placeholder="Jane Doe"
                      value={addFullName}
                      onChange={(e) => setAddFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="add-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Email Address *
                    </label>
                    <Input
                      id="add-email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="add-username"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Username (Optional)
                    </label>
                    <Input
                      id="add-username"
                      placeholder="Leave blank to auto-generate"
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="add-phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="add-phone"
                      type="tel"
                      placeholder="(269) 555-0100"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="add-role"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Initial Role
                    </label>
                    <select
                      id="add-role"
                      value={addRole}
                      onChange={(e) =>
                        setAddRole(e.target.value as "member" | "editor" | "treasurer" | "admin")
                      }
                      className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                    >
                      <option value="member">Regular Member</option>
                      <option value="editor">Editor (Content & Events)</option>
                      <option value="treasurer">Treasurer (Dues & Approvals)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="add-status"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                    >
                      Membership Status
                    </label>
                    <select
                      id="add-status"
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value as "approved" | "pending")}
                      className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                    >
                      <option value="approved">Approved / Active Member</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="add-waive-dues"
                      type="checkbox"
                      checked={addWaiveDues}
                      onChange={(e) => setAddWaiveDues(e.target.checked)}
                      className="rounded border border-input text-primary h-4 w-4"
                    />
                    <label htmlFor="add-waive-dues" className="text-xs text-foreground font-medium">
                      Mark Annual Dues as Reconciled / Waived ($50)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="add-recovery"
                      type="checkbox"
                      checked={addSendRecovery}
                      onChange={(e) => setAddSendRecovery(e.target.checked)}
                      className="rounded border border-input text-primary h-4 w-4"
                    />
                    <label htmlFor="add-recovery" className="text-xs text-foreground font-medium">
                      Generate Password Recovery / Activation link
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="add-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Custom Temporary Password (Optional)
                  </label>
                  <Input
                    id="add-password"
                    type="password"
                    placeholder="Leave empty for auto-generated password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    If omitted, a random secure password is created and an activation link will be
                    provided.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddMemberOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Suspend / Ban Confirmation Modal */}
      {suspendingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suspend-member-modal-title"
            className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-xl space-y-4"
          >
            <h2
              id="suspend-member-modal-title"
              className="font-serif text-xl font-bold text-destructive"
            >
              Suspend Member Account
            </h2>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to suspend{" "}
              <span className="font-semibold text-foreground">{suspendingMember.name}</span> (
              {suspendingMember.email})? This revokes active member privileges and prevents them
              from logging in.
            </p>

            <div>
              <label
                htmlFor="suspend-reason"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Reason for Suspension (Optional)
              </label>
              <Input
                id="suspend-reason"
                placeholder="Violation of club guidelines, non-payment, etc."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendingMember(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirmSuspend}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Suspending..." : "Suspend & Ban"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reinstate Confirmation Modal */}
      {reinstatingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reinstate-member-modal-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
          >
            <h2
              id="reinstate-member-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Reinstate Member Account
            </h2>
            <p className="text-xs text-muted-foreground">
              Reinstate{" "}
              <span className="font-semibold text-foreground">{reinstatingMember.name}</span> (
              {reinstatingMember.email}) back to Active / Approved status and restore their login
              access?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReinstatingMember(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReinstate}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? "Reinstating..." : "Reinstate Account"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recover Account Modal */}
      {recoveringMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recover-member-modal-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
          >
            <h2
              id="recover-member-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Account Password Recovery
            </h2>
            <p className="text-xs text-muted-foreground">
              Generate an account password reset link for{" "}
              <span className="font-semibold text-foreground">{recoveringMember.name}</span> (
              {recoveringMember.email}).
            </p>

            {recoveryResultLink ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  Recovery link generated. You can copy and send this directly to the member:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={recoveryResultLink}
                    className="text-xs font-mono bg-background text-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryResultLink);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click below to generate a secure, one-time password recovery link.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRecoveringMember(null);
                  setRecoveryResultLink(null);
                }}
                disabled={isSubmitting}
              >
                {recoveryResultLink ? "Close" : "Cancel"}
              </Button>
              {!recoveryResultLink && (
                <Button size="sm" onClick={handleGenerateRecoveryLink} disabled={isSubmitting}>
                  {isSubmitting ? "Generating..." : "Generate Recovery Link"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Details & Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-member-modal-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2
              id="edit-member-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Member Details: {editingMember.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Username: <span className="font-mono">@{editingMember.username}</span> &bull; Email:{" "}
              <span>{editingMember.email}</span> &bull; Status:{" "}
              <span className="capitalize font-semibold">{editingMember.applicationStatus}</span>
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-fullname"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Full Name *
                </label>
                <Input
                  id="edit-fullname"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Primary Phone
                  </label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder="(269) 555-0123"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-alt-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Alternate Phone
                  </label>
                  <Input
                    id="edit-alt-phone"
                    type="tel"
                    placeholder="(269) 555-0124"
                    value={editAltPhone}
                    onChange={(e) => setEditAltPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-spouse"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Spouse First Name
                </label>
                <Input
                  id="edit-spouse"
                  placeholder="Spouse first name (optional)"
                  value={editSpouseFirstName}
                  onChange={(e) => setEditSpouseFirstName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-addr1"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Address Line 1
                  </label>
                  <Input
                    id="edit-addr1"
                    placeholder="Street address"
                    value={editAddressLine1}
                    onChange={(e) => setEditAddressLine1(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-addr2"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Address Line 2
                  </label>
                  <Input
                    id="edit-addr2"
                    placeholder="Apt, Suite, Unit"
                    value={editAddressLine2}
                    onChange={(e) => setEditAddressLine2(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="edit-city"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    City
                  </label>
                  <Input
                    id="edit-city"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-state"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    State
                  </label>
                  <Input
                    id="edit-state"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-zip"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    ZIP Code
                  </label>
                  <Input
                    id="edit-zip"
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-interests"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Gardening Interests
                </label>
                <textarea
                  id="edit-interests"
                  rows={2}
                  value={editGardeningInterests}
                  onChange={(e) => setEditGardeningInterests(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-experience"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Work & Volunteer Experience
                </label>
                <textarea
                  id="edit-experience"
                  rows={2}
                  value={editVolunteerExperience}
                  onChange={(e) => setEditVolunteerExperience(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="edit-master-gardener"
                    type="checkbox"
                    checked={editIsMasterGardener}
                    onChange={(e) => setEditIsMasterGardener(e.target.checked)}
                    className="rounded border border-input"
                  />
                  <label
                    htmlFor="edit-master-gardener"
                    className="text-xs text-foreground font-medium"
                  >
                    Master Gardener Certified
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="edit-directory-opt-out"
                    type="checkbox"
                    checked={editDirectoryOptOut}
                    onChange={(e) => setEditDirectoryOptOut(e.target.checked)}
                    className="rounded border border-input"
                  />
                  <label
                    htmlFor="edit-directory-opt-out"
                    className="text-xs text-foreground font-medium"
                  >
                    Directory Privacy: Hide contact details from Member Directory (Opt-Out)
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-admin-notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Administrative Notes (Staff Only)
                </label>
                <textarea
                  id="edit-admin-notes"
                  rows={2}
                  placeholder="Internal notes, committee assignments..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMember(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
