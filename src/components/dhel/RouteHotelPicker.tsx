"use client";

import { useEffect, useState } from "react";
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

export type HotelSelection = { city: string; hotelId: string; nights: number };

function hotelMeta(h: HotelChoiceRow) {
  return `${h.star_rating}★ · ${h.room_type} · ${h.meal} · $${h.net_usd}/night net`;
}

function CityHotelAutocomplete({
  city,
  nights,
  hotels,
  selectedId,
  onPick,
  onClear,
}: {
  city: string;
  nights: number;
  hotels: HotelChoiceRow[];
  selectedId?: string;
  onPick: (hotelId: string) => void;
  onClear: () => void;
}) {
  const selected = hotels.find((h) => h.id === selectedId);
  const [query, setQuery] = useState(selected?.name ?? "");

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.name, selectedId]);

  return (
    <div className="max-w-md space-y-2">
      <Autocomplete
        items={hotels}
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
            {(hotel: HotelChoiceRow) => (
              <AutocompleteItem
                key={hotel.id}
                value={hotel}
                className="rounded-lg py-2"
                onClick={() => onPick(hotel.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{hotel.name}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {hotelMeta(hotel)}
                  </div>
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
      {selected ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Selected: <span className="font-medium text-foreground">{selected.name}</span>
          {" · "}
          {hotelMeta(selected)} · {nights}N
        </p>
      ) : null}
    </div>
  );
}

export function RouteHotelPicker({
  choices,
  selections,
  onChange,
}: {
  choices: CityHotelChoices[];
  selections: HotelSelection[];
  onChange: (next: HotelSelection[]) => void;
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

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Type to find a hotel for each overnight — nothing is pre-selected.
      </p>
      {choices.map((cityBlock) => {
        const selectedId = selections.find((s) => s.city === cityBlock.city)?.hotelId;
        return (
          <div key={cityBlock.city} className="space-y-3">
            <div className="flex items-center gap-2">
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
        <p className="text-center text-xs text-[var(--muted-foreground)]">All towns selected.</p>
      ) : (
        <p className="text-center text-xs text-amber-800">
          Select a hotel in every town to continue.
        </p>
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
