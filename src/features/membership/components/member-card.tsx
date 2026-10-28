"use client";

import Image from "next/image";
import type { MemberProfile } from "../types";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { printElement } from "@/lib/print";
import { QRCodeDisplay } from "@/components/ui/qr-code";

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

      {/* Printable Botanical Member Card (CR80 Standard Size: 3.375" × 2.125" / 85.6 × 54 mm) */}
      <div className="flex justify-center overflow-x-auto py-2">
        <div
          id="sdgc-printable-member-card"
          className="w-[3.375in] h-[2.125in] min-w-[3.375in] min-h-[2.125in] max-w-[3.375in] max-h-[2.125in] rounded-xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-2.5 shadow-md relative overflow-hidden text-foreground flex flex-col justify-between box-border select-none"
          style={{ width: "3.375in", height: "2.125in" }}
        >
          {/* Subtle botanical watermarked logo */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none select-none">
            <Image
              src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
              alt=""
              width={120}
              height={120}
              className="rounded-full"
            />
          </div>

          {/* Card Header (Centered) */}
          <div className="flex items-center justify-center gap-2 border-b border-border/70 pb-1.5 text-center relative z-10">
            <Image
              src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
              alt="SDGC Seal"
              width={26}
              height={26}
              className="rounded-full border border-border/80 object-cover shrink-0"
            />
            <div className="text-center">
              <h3 className="font-serif text-[11px] font-bold text-foreground leading-none">
                Saugatuck Douglas Garden Club
              </h3>
              <span className="text-[7.5px] uppercase font-bold tracking-wider text-muted-foreground block mt-0.5">
                Established 1928 &bull; 501(c)(3)
              </span>
            </div>
          </div>

          {/* Member Identity */}
          <div className="space-y-0.5 relative z-10">
            <div className="text-[15px] font-serif font-bold text-foreground leading-tight truncate">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="flex items-center gap-1.5 text-[8.5px] text-muted-foreground leading-none">
              <span className="font-mono">@{profile.username}</span>
              {profile.city && (
                <span>
                  &bull; {profile.city}, {profile.state || "MI"}
                </span>
              )}
            </div>
          </div>

          {/* Credential Info & Verification QR */}
          <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/60 relative z-10">
            <div className="space-y-1 flex-1 min-w-0">
              <div>
                <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                  Valid Term
                </span>
                <span className="font-semibold text-foreground text-[9px] block leading-tight">
                  {membershipTerm}
                </span>
              </div>
              <div>
                <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                  Member ID
                </span>
                <span className="font-mono font-bold text-foreground text-[8.5px] block leading-tight">
                  {memberCode}
                </span>
              </div>
              {profile.masterGardener && (
                <div>
                  <span className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[7.5px] font-bold text-primary leading-none">
                    🌱 Master Gardener
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 text-center">
              <QRCodeDisplay
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/verify/member/${memberCode}`
                    : `https://saugatuckdouglasgardenclub.org/verify/member/${memberCode}`
                }
                size={44}
                className="!p-1 !rounded-lg border-border/60"
                label="Scan to Verify"
                labelClassName="mt-0.5 text-[6.5px] font-mono font-medium tracking-tight text-slate-600 block leading-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
