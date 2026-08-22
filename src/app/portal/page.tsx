"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SyncStatusBadge } from "@/components/dhel/SyncStatusBadge";
import { listStashedTrips, syncTripsFromServer, type StashedTrip } from "@/lib/offline/stash";

export default function PortalHomePage() {
  const [trips, setTrips] = useState<StashedTrip[]>([]);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const local = await listStashedTrips();
      setTrips(local);
      const latest = local.reduce((max, t) => Math.max(max, t.updatedAt ?? 0), 0);
      setLastSynced(latest || null);

      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const res = await fetch("/api/portal/trips");
          if (res.ok) {
            const data = (await res.json()) as {
              trips: Array<{
                id: string;
                title: string;
                client_name?: string | null;
                content?: Record<string, unknown> | null;
                brief?: string | null;
                language?: string | null;
                updated_at?: string | null;
              }>;
            };
            await syncTripsFromServer(data.trips ?? []);
            const refreshed = await listStashedTrips();
            setTrips(refreshed);
            setLastSynced(Date.now());
          }
        } catch {
          /* keep local stash */
        }
      }
    }
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">Your stash</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Trips stay on this device — sync when you are back online.
          </p>
        </div>
        <SyncStatusBadge lastSyncedAt={lastSynced} />
      </div>

      {trips.length ? (
        <ul className="space-y-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href="/portal/today"
                className="block rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 transition-shadow hover:shadow-md"
              >
                <p className="font-medium">{t.title}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {t.days} days · {t.clientName || "Guest"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 p-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No stashed trips yet. Open a saved itinerary from the desk or build flow — it will appear
            here offline.
          </p>
          <Link href="/portal/today" className="mt-4 inline-block text-sm text-[var(--primary)]">
            Go to Today →
          </Link>
        </div>
      )}
    </div>
  );
}
