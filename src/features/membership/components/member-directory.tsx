"use client";

import * as React from "react";
import type { DirectoryMember } from "../types";
import { PROJECT_INTEREST_CHOICES } from "../types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MemberDirectoryProps {
  initialMembers: DirectoryMember[];
}

function MapPinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

const COMMITTEE_ALIASES: Record<string, string> = {
  beautification: "Community Beautification",
  community_beautification: "Community Beautification",
  workshop: "6th Grade Workshop",
  sixth_grade_workshop: "6th Grade Workshop",
  reception: "New Member Reception",
  new_member_reception: "New Member Reception",
  website: "Club Website",
  club_website: "Club Website",
  garden_awards: "Community Garden Recognition Awards",
  garden_recognition_awards: "Community Garden Recognition Awards",
  garden_walk: "Garden Walk Fund Raiser",
  garden_walk_fundraiser: "Garden Walk Fund Raiser",
  charitable: "Community Charitable Contributions",
  charitable_contributions: "Community Charitable Contributions",
  holiday: "Holiday Decoration Workshop",
  holiday_decoration_workshop: "Holiday Decoration Workshop",
};

export function getCommitteeLabel(code: string): string {
  if (COMMITTEE_ALIASES[code]) {
    return COMMITTEE_ALIASES[code];
  }
  const match = PROJECT_INTEREST_CHOICES.find((c) => c.code === code);
  return match?.label || code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MemberDirectory({ initialMembers }: MemberDirectoryProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedInterest, setSelectedInterest] = React.useState<string>("all");
  const [masterGardenerOnly, setMasterGardenerOnly] = React.useState(false);

  const filteredMembers = React.useMemo(() => {
    return initialMembers.filter((m) => {
      // Text search: matches full name, city, or bio
      const matchesSearch =
        searchTerm.trim() === "" ||
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Boolean(m.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        Boolean(m.interestsExperience?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Committee / project interest filter
      const matchesInterest =
        selectedInterest === "all" ||
        m.projectInterests.some((code) => {
          if (code === selectedInterest) return true;
          const mappedCode = COMMITTEE_ALIASES[code];
          const mappedFilter = COMMITTEE_ALIASES[selectedInterest];
          return Boolean(mappedCode && mappedFilter && mappedCode === mappedFilter);
        });

      // Master gardener filter
      const matchesMG = !masterGardenerOnly || m.isMasterGardener;

      return matchesSearch && matchesInterest && matchesMG;
    });
  }, [initialMembers, searchTerm, selectedInterest, masterGardenerOnly]);

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="directory-search"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Search Members
            </label>
            <Input
              id="directory-search"
              placeholder="Search by member name, city, or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-border/60 bg-card"
            />
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="committee-filter"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Filter by Committee
            </label>
            <select
              id="committee-filter"
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Committees & Projects</option>
              {PROJECT_INTEREST_CHOICES.map((choice) => (
                <option key={choice.code} value={choice.code}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={masterGardenerOnly}
              onChange={(e) => setMasterGardenerOnly(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <span>Master Gardeners Only</span>
          </label>

          <span className="text-muted-foreground font-medium">
            Showing {filteredMembers.length} of {initialMembers.length} active members
          </span>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center space-y-3">
          <div className="text-3xl">🌱</div>
          <h3 className="font-serif text-lg font-bold text-foreground">No members found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search terms or clearing the committee filters to see more members.
          </p>
          {(searchTerm || selectedInterest !== "all" || masterGardenerOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedInterest("all");
                setMasterGardenerOnly(false);
              }}
              className="text-xs font-semibold text-primary hover:underline pt-2 cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const initials =
              `${member.firstName[0] || ""}${member.lastName[0] || ""}`.toUpperCase();
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-serif text-base font-bold text-primary shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground leading-snug">
                          {member.fullName}
                        </h3>
                        <p className="text-xs text-muted-foreground">Club Member</p>
                      </div>
                    </div>

                    {member.isMasterGardener && (
                      <Badge variant="success" className="shrink-0 text-[10px]">
                        Master Gardener
                      </Badge>
                    )}
                  </div>

                  {/* Contact & Location */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {(member.city || member.state) && (
                      <p className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                        <span>
                          {[member.city, member.state].filter(Boolean).join(", ")}
                          {member.postalCode ? ` ${member.postalCode}` : ""}
                        </span>
                      </p>
                    )}
                    {member.phone && (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                          <a
                            href={`tel:${member.phone.replace(/[^0-9+]/g, "")}`}
                            className="hover:text-primary transition-colors font-medium text-foreground/90"
                          >
                            {member.phone}
                          </a>
                        </span>
                        <a
                          href={`tel:${member.phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                          aria-label={`Call ${member.fullName}`}
                        >
                          Call
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Experience Bio */}
                  {member.interestsExperience && (
                    <p className="text-xs text-muted-foreground/90 italic bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      &ldquo;{member.interestsExperience}&rdquo;
                    </p>
                  )}
                </div>

                {/* Project Interests */}
                {member.projectInterests.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                      Volunteer Committees
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.projectInterests.map((code) => (
                        <Badge
                          key={code}
                          variant="secondary"
                          className="text-[10px] py-0 px-2 font-normal"
                        >
                          {getCommitteeLabel(code)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
