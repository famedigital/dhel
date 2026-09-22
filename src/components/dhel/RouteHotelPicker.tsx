"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/reui-autocomplete";
import type { CityHotelChoices, HotelChoiceRow } from "@/lib/catalog";
import { hotelSupplyKind, supplyKindLabel } from "@/lib/inventory/supply-kind";

export type HotelSelection = { city: string; hotelId: string; nights: number };

export type LiveHotelHint = {
  hotelId?: string;
  propertyId: string;
  available: number;
  source: "live" | "mock";
  label: string;
};

function hotelMeta(h: HotelChoiceRow, live?: LiveHotelHint) {
  const base = `${h.star_rating}★ · ${h.room_type} · ${h.meal} · $${h.net_usd}/night net`;
  if (!live) return base;
  if (live.available <= 0) return `${base} · Sold out (${live.source})`;
  return `${base} · ${live.available} free (${live.source})`;
}

function CityHotelAutocomplete({
  city,
  nights,
  hotels,
  selectedId,
  liveByHotelId,
  onPick,
  onClear,
}: {
  city: string;
  nights: number;
  hotels: HotelChoiceRow[];
  selectedId?: string;
  liveByHotelId: Record<string, LiveHotelHint>;
  onPick: (hotelId: string) => void;
  onClear: () => void;
}) {
  const selected = hotels.find((h) => h.id === selectedId);
  const [query, setQuery] = useState(selected?.name ?? "");

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.name, selectedId]);

  const sorted = useMemo(() => {
    return [...hotels].sort((a, b) => {
      const ka = hotelSupplyKind(a) === "live" ? 0 : 1;
      const kb = hotelSupplyKind(b) === "live" ? 0 : 1;
      if (ka !== kb) return ka - kb;
      return a.name.localeCompare(b.name);
    });
  }, [hotels]);

  return (
    <div className="w-full space-y-2">
      <Autocomplete
        items={sorted}
        value={query}
        onValueChange={(next) => {
          setQuery(next);
          if (!next.trim()) onClear();
        }}
        itemToStringValue={(item) => (item as HotelChoiceRow).name}
        openOnInputClick
        autoHighlight
      >
        <AutocompleteInput
          placeholder={`Search hotels in ${city}…`}
          showTrigger
          showClear
          aria-label={`Hotel for ${city}`}
        />
        <AutocompleteContent>
          <AutocompleteEmpty>No hotels match “{query}”</AutocompleteEmpty>
          <AutocompleteList>
            {(hotel: HotelChoiceRow) => {
              const kind = hotelSupplyKind(hotel);
              const live = liveByHotelId[hotel.id];
              return (
                <AutocompleteItem
                  key={hotel.id}
                  value={hotel}
                  className="rounded-lg py-2"
                  onClick={() => onPick(hotel.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-medium">
                      <span className="truncate">{hotel.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          kind === "live"
                            ? "shrink-0 border-emerald-700/40 text-emerald-800"
                            : "shrink-0"
                        }
                      >
                        {supplyKindLabel(kind)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {hotelMeta(hotel, live)}
                    </div>
                  </div>
                </AutocompleteItem>
              );
            }}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
      {selected ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Selected: <span className="font-medium text-foreground">{selected.name}</span>
          {" · "}
          <Badge variant="outline" className="mx-1 align-middle">
            {supplyKindLabel(hotelSupplyKind(selected))}
          </Badge>
          {hotelMeta(selected, liveByHotelId[selected.id])} · {nights}N
        </p>
      ) : null}
    </div>
  );
}

export function RouteHotelPicker({
  choices,
  selections,
  onChange,
  liveByHotelId = {},
}: {
  choices: CityHotelChoices[];
  selections: HotelSelection[];
  onChange: (next: HotelSelection[]) => void;
  /** Live ARI keyed by catalog hotel id when Innora-linked */
  liveByHotelId?: Record<string, LiveHotelHint>;
}) {
  function pick(city: string, nights: number, hotelId: string) {
    const without = selections.filter((s) => s.city !== city);
    onChange([...without, { city, hotelId, nights }]);
  }

  function clearCity(city: string) {
    onChange(selections.filter((s) => s.city !== city));
  }

  const allPicked =
    choices.length > 0 &&
    choices.every((c) => selections.some((s) => s.city === c.city && s.hotelId));

  const liveCount = choices.reduce(
    (n, c) => n + c.hotels.filter((h) => hotelSupplyKind(h) === "live").length,
    0,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--muted-foreground)]">
        <span className="font-medium text-foreground">Live inventory</span> = linked to Innora
        (rooms left shown).{" "}
        <span className="font-medium text-foreground">Catalog</span> = pick from the list (confirm
        with the hotel later). {liveCount ? `${liveCount} live-linked in this route.` : null}
      </p>
      {choices.map((cityBlock) => {
        const selectedId = selections.find((s) => s.city === cityBlock.city)?.hotelId;
        return (
          <div key={cityBlock.city} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
                {cityBlock.city}
              </h3>
              <Badge variant="outline">{cityBlock.nights}N</Badge>
              {!selectedId ? (
                <Badge variant="outline" className="border-amber-600/40 text-amber-800">
                  Pick one
                </Badge>
              ) : null}
            </div>
            {cityBlock.hotels.length ? (
              <CityHotelAutocomplete
                city={cityBlock.city}
                nights={cityBlock.nights}
                hotels={cityBlock.hotels}
                selectedId={selectedId}
                liveByHotelId={liveByHotelId}
                onPick={(hotelId) => pick(cityBlock.city, cityBlock.nights, hotelId)}
                onClear={() => clearCity(cityBlock.city)}
              />
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                No catalog hotels for this city.
              </p>
            )}
          </div>
        );
      })}
      {allPicked ? (
        <p className="text-xs text-[var(--muted-foreground)]">All towns selected.</p>
      ) : (
        <p className="text-xs text-amber-800">Select a hotel in every town to continue.</p>
      )}
    </div>
  );
}

export function routeHotelsComplete(
  choices: CityHotelChoices[],
  selections: HotelSelection[],
): boolean {
  return (
    choices.length > 0 &&
    choices.every((c) => selections.some((s) => s.city === c.city && s.hotelId))
  );
}
