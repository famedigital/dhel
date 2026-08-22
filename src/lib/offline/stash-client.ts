"use client";

import { useEffect } from "react";
import { upsertStashedTrip } from "@/lib/offline/stash";

/** After save-proposal succeeds, stash itinerary locally for offline portal. */
export function stashItineraryClient(opts: {
  id: string;
  title: string;
  clientName?: string;
  days: number;
  language: string;
  content: Record<string, unknown>;
  brief?: string;
}) {
  if (typeof window === "undefined") return;
  void upsertStashedTrip({
    id: opts.id,
    title: opts.title,
    clientName: opts.clientName,
    days: opts.days,
    language: opts.language,
    content: opts.content,
    brief: opts.brief,
  }).catch((err) => {
    console.warn("[stash] offline write skipped", err);
  });
}

export function useStashAfterSave(
  saved: { id: string; title?: string; content?: Record<string, unknown> } | null,
) {
  useEffect(() => {
    if (!saved?.id || !saved.content) return;
    stashItineraryClient({
      id: saved.id,
      title: saved.title || "Bhutan trip",
      days: Array.isArray(saved.content.days) ? saved.content.days.length : 7,
      language: "en",
      content: saved.content,
    });
  }, [saved]);
}
