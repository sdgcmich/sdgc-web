"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminMemberRecord } from "../types";
import {
  approveMembershipAction,
  setUserRolesAction,
  adminUpdateMemberProfileAction,
} from "../actions";

interface AdminMembersProps {
  initialMembers: AdminMemberRecord[];
  initialStatusFilter?: string;
}

export function AdminMembers({ initialMembers, initialStatusFilter }: AdminMembersProps) {
  const [members, setMembers] = React.useState<AdminMemberRecord[]>(initialMembers);
  const [filter, setFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter || "all");
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState<boolean>(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = React.useState<AdminMemberRecord | null>(
    null,
  );
  const [assignedRoles, setAssignedRoles] = React.useState<("admin" | "editor" | "treasurer")[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedUserForRoles) setSelectedUserForRoles(null);
        if (editingMember) setEditingMember(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUserForRoles, editingMember]);

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

  // Sync if initialMembers changes
  React.useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

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

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.username.toLowerCase().includes(filter.toLowerCase()) ||
      m.email.toLowerCase().includes(filter.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "pending") return m.applicationStatus === "pending";
    if (statusFilter === "approved") return m.applicationStatus === "approved";
    return true;
  });

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
          <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
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
        {/* Mobile View: Member Cards (< md) */}
        <div className="md:hidden divide-y divide-border">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No members found matching your search.
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div key={member.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">
                      {member.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground block">
                      @{member.username}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {member.isApproved ? (
                      <Badge variant="default" className="text-[10px]">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        Pending
                      </Badge>
                    )}
                    {member.paymentStatus === "confirmed" ? (
                      <Badge variant="success" className="text-[10px]">
                        Paid ($50)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Unpaid
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate max-w-[200px]">{member.email}</span>
                  {member.isMasterGardener && (
                    <span className="text-[11px] text-primary font-medium shrink-0">
                      Master Gardener
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                  <div className="flex gap-1 flex-wrap items-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                      Roles:
                    </span>
                    {member.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase font-semibold text-muted-foreground"
                      >
                        {r}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleOpenRoleModal(member)}
                      className="text-[10px] text-primary hover:underline ml-1 cursor-pointer font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2.5"
                    onClick={() => handleOpenEditProfile(member)}
                  >
                    Details / Edit
                  </Button>
                  {!member.isApproved ? (
                    <Button
                      size="sm"
                      className="text-xs h-7 px-3"
                      disabled={isSubmitting}
                      onClick={() => handleApprove(member.id, member.name, member.version)}
                    >
                      Approve
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium px-2">Approved</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[820px]">
            <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 min-w-[140px]">Member Name</th>
                <th className="p-4 min-w-[180px]">Username & Email</th>
                <th className="p-4 min-w-[100px]">Payment</th>
                <th className="p-4 min-w-[140px]">Approval Status</th>
                <th className="p-4 min-w-[120px]">Roles</th>
                <th className="p-4 text-right min-w-[210px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-foreground block">{member.name}</span>
                    {member.isMasterGardener && (
                      <span className="text-[11px] text-primary font-medium">Master Gardener</span>
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
                    {member.isApproved ? (
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
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground"
                        >
                          {r}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleOpenRoleModal(member)}
                        className="text-[10px] text-primary hover:underline ml-1 cursor-pointer font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditProfile(member)}
                      >
                        Details / Edit
                      </Button>
                      {!member.isApproved ? (
                        <Button
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => handleApprove(member.id, member.name, member.version)}
                        >
                          Approve Membership
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium px-2">
                          Approved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Management Modal */}
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
              Manage Roles: {selectedUserForRoles.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Assign administrative capabilities. Base member access is automatically granted.
            </p>

            <div className="space-y-3 pt-2">
              {(["admin", "editor", "treasurer"] as const).map((role) => {
                const checked = assignedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30"
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
                        {role}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {role === "admin" && "Full administrative capabilities across all systems"}
                        {role === "editor" && "Manage site content, events, and photo galleries"}
                        {role === "treasurer" &&
                          "Reconcile paper checks and view financial records"}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

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
