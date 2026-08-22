"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DhelWordmark } from "@/components/dhel/DhelLogo";
import { ProposalComposer } from "@/components/dhel/ProposalComposer";

export default function BuildPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const festival = params.get("festival");

  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/80 px-6 py-3 backdrop-blur">
        <Link href="/">
          <DhelWordmark className="text-lg text-[var(--foreground)]" tile markClassName="h-6 w-6" />
        </Link>
        <span className="text-sm text-[var(--muted-foreground)]">Your Bhutan journey</span>
      </header>
      {festival ? (
        <p className="shrink-0 bg-[#e8a838]/20 py-2 text-center text-sm">
          Festival trip: {festival.replace(/-/g, " ")} — book early for hotels
        </p>
      ) : null}
      <ProposalComposer
        rateTier="b2c"
        onItineraryCreated={(id, mode) => {
          router.push(mode === "preview" ? `/preview/${id}` : `/itineraries/${id}?tab=narrative`);
        }}
      />
    </div>
  );
}
