"use client";

import { useRouter } from "next/navigation";
import { ProposalComposer } from "@/components/dhel/ProposalComposer";
import { AppShell } from "@/components/AppShell";

export function DeskHome({
  agencyName,
  email,
  role,
}: {
  agencyName: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  return (
    <AppShell agencyName={agencyName} email={email} role={role} chatLayout>
      <ProposalComposer
        rateTier="agent"
        onItineraryCreated={(id, mode) => {
          if (mode === "preview") {
            router.push(`/preview/${id}?pack=guest`);
          } else {
            router.push(`/itineraries/${id}?tab=narrative&saved=1`);
          }
        }}
      />
    </AppShell>
  );
}
