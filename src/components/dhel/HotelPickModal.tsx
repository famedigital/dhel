"use client";

import { X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HotelCompareTable } from "@/components/dhel/HotelCompareTable";
import {
  RouteHotelPicker,
  type HotelSelection,
} from "@/components/dhel/RouteHotelPicker";
import { friendlyAiWarning } from "@/lib/ai/friendly-warning";
import type { BriefIntent, CityHotelChoices, PackageOption } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type CompareRow = {
  id: string;
  hotel: string;
  city: string;
  room: string;
  nights: number;
  total_pp: number;
  currency: string;
  recommended: boolean;
  source: string;
};

export function HotelPickModal({
  open,
  brief,
  usedDefaults,
  hotelChoices,
  options,
  compare,
  warning,
  selections,
  selectedId,
  canGenerate,
  generating,
  onSelectionsChange,
  onSelectPackage,
  onEditBrief,
  onGenerate,
  onClose,
}: {
  open: boolean;
  brief?: BriefIntent | null;
  usedDefaults?: boolean;
  hotelChoices?: CityHotelChoices[];
  options?: PackageOption[];
  compare?: CompareRow[];
  warning?: string;
  selections: HotelSelection[];
  selectedId: string | null;
  canGenerate: boolean;
  generating?: boolean;
  onSelectionsChange: (next: HotelSelection[]) => void;
  onSelectPackage: (id: string) => void;
  onEditBrief: () => void;
  onGenerate: () => void;
  onClose?: () => void;
}) {
  if (!open) return null;

  const hasRoute = Boolean(hotelChoices?.length);
  const hasPackages = Boolean(options?.length);
  const note = friendlyAiWarning(warning);

  const selectionRows = hasRoute
    ? (hotelChoices ?? []).map((block) => {
        const pick = selections.find((s) => s.city === block.city);
        const hotel = block.hotels.find((h) => h.id === pick?.hotelId);
        return {
          city: block.city,
          nights: block.nights,
          hotelName: hotel?.name ?? "—",
          meta: hotel
            ? `${hotel.star_rating}★ · ${hotel.room_type} · $${hotel.net_usd}/n`
            : "Not selected",
          done: Boolean(pick?.hotelId),
        };
      })
    : [];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-stretch justify-center bg-black/45 p-2 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose hotels"
    >
      <div
        className={cn(
          "flex h-[min(96dvh,920px)] w-full max-w-6xl flex-col overflow-hidden",
          "rounded-[var(--radius)] border border-border bg-card shadow-xl",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
              Choose hotels
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pick stays on the left — live sheet and compare table on the right.
            </p>
          </div>
          {onClose ? (
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose}>
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          ) : null}
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Left — inputs & actions */}
          <section className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
              {brief ? (
                <div className="flex flex-wrap gap-2">
                  {usedDefaults ? <Badge variant="outline">Used defaults</Badge> : null}
                  <Badge variant="outline">Local parse</Badge>
                  {brief.currency ? <Badge variant="outline">{brief.currency} quote</Badge> : null}
                  {brief.nationalities?.map((n) => (
                    <Badge key={n} variant="outline">
                      {n}
                    </Badge>
                  ))}
                  {brief.entry_point ? (
                    <Badge variant="outline">{brief.entry_point} entry</Badge>
                  ) : null}
                  <Badge variant="outline">
                    {brief.days} days · {brief.pax ?? 2} pax
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={onEditBrief}
                  >
                    Edit trip details
                  </Button>
                </div>
              ) : null}

              {hasRoute ? (
                <RouteHotelPicker
                  choices={hotelChoices!}
                  selections={selections}
                  onChange={onSelectionsChange}
                />
              ) : hasPackages ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pick a package — nothing is pre-selected.
                  </p>
                  <div className="grid gap-3">
                    {options!.map((opt) => (
                      <Card
                        key={opt.id}
                        className={cn(
                          "cursor-pointer transition-shadow",
                          selectedId === opt.id && "ring-2 ring-primary",
                        )}
                        onClick={() => onSelectPackage(opt.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{opt.label}</CardTitle>
                          <CardDescription>
                            {opt.hotel.hotel_name} · {opt.hotel.city}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-xl font-semibold">
                            {opt.currency} {opt.sell_per_person.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">
                              {" "}
                              / person
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {opt.hotel.room_type} · {opt.hotel.nights} nights
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button
                            className="w-full"
                            variant={selectedId === opt.id ? "default" : "secondary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPackage(opt.id);
                            }}
                          >
                            Use this
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>No hotel options in catalog for this route.</Alert>
              )}

              {note ? <p className="text-xs text-[#e8a838]">Note: {note}</p> : null}
            </div>

            <div className="shrink-0 space-y-2 border-t border-border bg-muted/30 px-4 py-3 sm:px-5">
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!canGenerate}
                onClick={onGenerate}
              >
                {generating ? "Generating draft…" : "Generate draft for review"}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Gemini fills the itinerary from your confirmed brief and hotels.
              </p>
            </div>
          </section>

          {/* Right — selection sheet + tables */}
          <section className="flex min-h-0 flex-col bg-muted/20">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
              {hasRoute ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold tracking-tight">Selection sheet</h3>
                    <p className="text-xs text-muted-foreground">
                      Live overnight plan for this quote
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 pl-4 text-xs">City</TableHead>
                        <TableHead className="h-9 text-xs">Nights</TableHead>
                        <TableHead className="h-9 text-xs">Hotel</TableHead>
                        <TableHead className="h-9 pr-4 text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectionRows.map((row) => (
                        <TableRow key={row.city}>
                          <TableCell className="py-2.5 pl-4 font-medium">{row.city}</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">{row.nights}N</TableCell>
                          <TableCell className="py-2.5">
                            <div className="text-sm">{row.hotelName}</div>
                            <div className="text-[11px] text-muted-foreground">{row.meta}</div>
                          </TableCell>
                          <TableCell className="py-2.5 pr-4">
                            <Badge variant={row.done ? "default" : "outline"} className="text-[10px]">
                              {row.done ? "Set" : "Open"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {compare?.length ? (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">Compare table</h3>
                    <p className="text-xs text-muted-foreground">Package totals per person</p>
                  </div>
                  <HotelCompareTable rows={compare} />
                </div>
              ) : hasRoute ? (
                <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Selection sheet updates as you pick hotels. Compare totals appear when package
                    pricing is available.
                  </p>
                </div>
              ) : null}

              {!hasRoute && !compare?.length ? (
                <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Choose a package on the left — compare rows show here when available.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
