import { Suspense } from "react";
import type { Metadata } from "next";
import { GiftPassCard } from "@/features/tickets/components/gift-pass-card";

export const metadata: Metadata = {
  title: "Gift an Admission Pass or Credit | Saugatuck Douglas Garden Club",
  description:
    "Gift an advance Garden Walk tour admission or event credit ($10, $15, $20, $30, $50, custom) to friends, family, or neighbors.",
};

export default function GiftPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <Suspense
        fallback={
          <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
            Loading Gift Pass Form...
          </div>
        }
      >
        <GiftPassCard />
      </Suspense>
    </div>
  );
}
