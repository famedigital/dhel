"use client";

import { useEffect, useState } from "react";
import { SyncStatusBadge } from "@/components/dhel/SyncStatusBadge";
import { listStashedTrips, type StashedTrip } from "@/lib/offline/stash";

type DaySlice = {
  day?: number;
  title?: string;
  route?: string;
  activities?: string[];
  overnight?: string;
};

export default function PortalTodayPage() {
  const [trip, setTrip] = useState<StashedTrip | null>(null);

  useEffect(() => {
    void listStashedTrips().then((rows) => setTrip(rows[0] ?? null));
  }, []);

  const days = (trip?.content?.days as DaySlice[] | undefined) ?? [];
  const today = days[0];

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">Today</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {trip ? trip.title : "No stashed trip yet — works offline once you save one."}
          </p>
        </div>
        <SyncStatusBadge lastSyncedAt={trip?.syncedAt ?? trip?.updatedAt} />
      </div>

      {today ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            Day {today.day ?? 1}
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-xl">{today.route || today.title}</h2>
          {today.overnight ? (
            <p className="text-sm text-[var(--muted-foreground)]">Overnight: {today.overnight}</p>
          ) : null}
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(today.activities ?? []).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
          Save a proposal from the desk to stash day plans here for offline field use.
        </div>
      )}

      {days.length > 1 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            Full route
          </p>
          {days.map((d) => (
            <div
              key={d.day}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)]/70 px-3 py-2 text-sm"
            >
              Day {d.day}: {d.route || d.title}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
