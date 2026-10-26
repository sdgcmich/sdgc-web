"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { MemberVerificationResult } from "../types";
import { resolveMediaUrl } from "@/lib/storage/media-url";

interface VerifyMemberViewProps {
  result: MemberVerificationResult;
}

export function VerifyMemberView({ result }: VerifyMemberViewProps) {
  const isActive = result.status === "active";
  const isExpired = result.status === "expired";
  const isNotFound = result.status === "not_found";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Membership Credential
          </span>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Member Status Verification
          </h1>
        </div>
        <Link
          href={"/verify/member" as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
        >
          Check Another
        </Link>
      </div>

      {/* Main Status Badge */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-center border-2 shadow-sm space-y-4 transition-colors ${
          isActive
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 text-emerald-950 dark:text-emerald-100"
            : isExpired
              ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 text-amber-950 dark:text-amber-100"
              : "border-border bg-card text-foreground"
        }`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-xs border border-border overflow-hidden">
          {isActive ? (
            <Image
              src={resolveMediaUrl("/images/brand/sdgc-logo.jpg")}
              alt="SDGC Seal"
              width={54}
              height={54}
              className="rounded-full object-cover"
            />
          ) : (
            <svg
              aria-hidden="true"
              className="h-9 w-9 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          )}
        </div>

        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isActive
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : isExpired
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                  : "bg-rose-500/20 text-rose-800 dark:text-rose-300"
            }`}
          >
            {isActive
              ? "✓ Active Member in Good Standing"
              : isExpired
                ? "Membership Expired / Renewal Needed"
                : "Member Not Found"}
          </span>
          <h2 className="mt-2 font-serif text-3xl font-extrabold text-foreground">
            {result.name || "Unknown Member"}
          </h2>
          <p className="mt-1 font-mono text-sm font-semibold text-muted-foreground tracking-wider">
            {result.memberCode}
          </p>
        </div>
      </div>

      {/* Member Details */}
      {!isNotFound && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
          <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 text-sm space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valid Term</span>
              <span className="font-semibold text-foreground">{result.validTerm}</span>
            </div>
            {result.username && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Directory Handle</span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  @{result.username}
                </span>
              </div>
            )}
            {result.city && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Residence</span>
                <span className="font-semibold text-foreground">
                  {result.city}, {result.state || "MI"}
                </span>
              </div>
            )}
            {result.memberSince && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Club Member Since</span>
                <span className="font-semibold text-foreground">{result.memberSince}</span>
              </div>
            )}
            {result.isMasterGardener && (
              <div className="flex justify-between items-center border-t border-border/60 pt-2 text-primary font-bold">
                <span>Certified Master Gardener</span>
                <span>🌱 Yes</span>
              </div>
            )}
          </div>

          {/* Member Privileges Notice */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-bold text-foreground">Privileges & Partner Benefits:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Admitted to all regular club presentations, workshops, and plant swaps.</li>
              <li>10% discount at participating local Saugatuck & Douglas partner nurseries.</li>
              <li>Access to the club lending library and member directory.</li>
            </ul>
          </div>

          <Link
            href={"/verify/member" as Route}
            className="block w-full rounded-2xl border border-border bg-card px-4 py-3 text-center text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
          >
            Verify Another Member Credential
          </Link>
        </div>
      )}
    </div>
  );
}
