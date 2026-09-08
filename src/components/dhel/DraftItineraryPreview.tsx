"use client";

import { useMemo } from "react";
import { ItineraryRenderer } from "@/components/templates/ItineraryRenderer";
import type { Brand, Itinerary, ItineraryContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Live Classic Luxury preview from unsaved draft content. */
export function DraftItineraryPreview({
  content,
  language = "en",
  clientName,
  saving,
  onSavePreview,
  onSaveEditor,
  onBack,
  className,
}: {
  content: ItineraryContent;
  language?: "en" | "zh";
  clientName?: string;
  saving?: boolean;
  onSavePreview?: () => void;
  onSaveEditor?: () => void;
  onBack?: () => void;
  className?: string;
}) {
  const itinerary = useMemo((): Itinerary => {
    const now = new Date().toISOString();
    return {
      id: "draft",
      agency_id: "draft",
      title: content.trip_title || "Draft itinerary",
      client_name: clientName ?? content.prepared_for ?? null,
      status: "draft",
      template_id: "classic-luxury",
      language,
      brief: null,
      content,
      brand_snapshot: null,
      generation_meta: null,
      created_by: null,
      created_at: now,
      updated_at: now,
    };
  }, [content, language, clientName]);

  const brand: Partial<Brand> = {
    display_name: "Silverpine Tours",
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#c8c4bc]", className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/90 px-3 py-2 backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Live guest PDF
        </p>
        <div className="flex flex-wrap gap-2">
          {onBack ? (
            <Button type="button" variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          ) : null}
          {onSaveEditor ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={onSaveEditor}
            >
              Save &amp; edit fields
            </Button>
          ) : null}
          {onSavePreview ? (
            <Button type="button" size="sm" disabled={saving} onClick={onSavePreview}>
              {saving ? "Saving…" : "Save & print"}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <div className="mx-auto origin-top scale-[0.42] sm:scale-[0.55] lg:scale-[0.62] xl:scale-[0.72]">
          <div className="w-[210mm]">
            <ItineraryRenderer itinerary={itinerary} brand={brand} pack="guest" />
          </div>
        </div>
      </div>
    </div>
  );
}
