"use client";

import { useEffect, useState } from "react";

export function SyncStatusBadge({ lastSyncedAt }: { lastSyncedAt?: number | null }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const syncedLabel =
    lastSyncedAt && Number.isFinite(lastSyncedAt)
      ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : online
        ? "Online"
        : "Offline stash";

  return (
    <span className="sync-badge" data-online={online ? "true" : "false"} title={syncedLabel}>
      <span className="sync-badge-dot" aria-hidden />
      {online ? "Live" : "Offline"}
    </span>
  );
}
