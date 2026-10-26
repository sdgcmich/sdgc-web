"use client";

import Image from "next/image";
import type { MemberProfile } from "../types";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { printElement } from "@/lib/print";

interface MemberCardProps {
  profile: MemberProfile;
}

export function MemberCard({ profile }: MemberCardProps) {
  const currentYear = new Date().getFullYear();
  const membershipTerm = `${currentYear}–${currentYear + 1} Season`;
  const memberCode = `SDGC-MBR-${profile.userId.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    printElement("sdgc-printable-member-card", "SDGC Member Card");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 print:hidden">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Membership Credential
          </span>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Digital Membership Card &amp; Proof of Active Status
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Present for member admission at workshops, community nursery partner discounts, and club
            library privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.656h10.5Z"
            />
          </svg>
          <span>Print / Save Card</span>
        </button>
      </div>

      {/* Printable Botanical Member Card */}
      <div className="flex justify-center">
        <div
          id="sdgc-printable-member-card"
          className="w-full max-w-md rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-md relative overflow-hidden text-foreground"
        >
          {/* Subtle botanical watermarked logo */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none select-none">
            <Image
              src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
              alt=""
              width={180}
              height={180}
              className="rounded-full"
            />
          </div>

          <div className="relative space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <Image
                  src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
                  alt="SDGC Seal"
                  width={40}
                  height={40}
                  className="rounded-full border border-border/80 object-cover"
                />
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground leading-tight">
                    Saugatuck Douglas Garden Club
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Established 1928 &bull; 501(c)(3)
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Active Member
              </span>
            </div>

            {/* Member Identity */}
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">@{profile.username}</span>
                {profile.city && (
                  <span>
                    &bull; {profile.city}, {profile.state || "MI"}
                  </span>
                )}
              </div>
            </div>

            {/* Badges & Credential Info */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-border/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Valid Term
                </span>
                <span className="font-semibold text-foreground">{membershipTerm}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Member ID
                </span>
                <span className="font-mono font-bold text-foreground text-[11px]">
                  {memberCode}
                </span>
              </div>
            </div>

            {profile.masterGardener && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                  🌱 Certified Master Gardener
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
