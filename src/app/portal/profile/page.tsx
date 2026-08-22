"use client";

import { SyncStatusBadge } from "@/components/dhel/SyncStatusBadge";

export default function PortalProfilePage() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">Profile</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Field identity stays on-device; sync when online.
          </p>
        </div>
        <SyncStatusBadge />
      </div>
      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-5">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Display name</span>
          <input className="input" disabled placeholder="Kinley Dorji" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Phone</span>
          <input className="input" disabled placeholder="+975 …" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Bank QR</span>
          <input className="input" disabled placeholder="Upload SCAN & PAY poster" />
        </label>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Profile editing will connect to guide/driver records in Supabase.
      </p>
    </div>
  );
}
