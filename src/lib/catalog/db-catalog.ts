import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogHotel, CatalogRoom } from "./types";
import { getCatalogHotels } from "./types";

type DbHotelRow = {
  id: string;
  name: string;
  city: string | null;
  source: string;
  active: boolean;
  pelbu_property_id: string | null;
  metadata: Record<string, unknown> | null;
};

type DbRoomRow = {
  catalog_hotel_id: string;
  room_type: string;
  net_usd: number;
  net_inr: number | null;
  meal: string | null;
  currency: string;
};

function starFromMetadata(metadata: Record<string, unknown> | null): number {
  const raw = metadata?.star_rating;
  if (typeof raw === "number" && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 3;
}

function mapHotel(row: DbHotelRow, rooms: CatalogRoom[]): CatalogHotel | null {
  if (!row.active || !rooms.length) return null;
  const source = row.source === "pelbu" ? "pelbu" : row.source === "agency" ? "agency" : "catalog";
  return {
    id: row.id,
    name: row.name,
    city: row.city ?? (typeof row.metadata?.location === "string" ? row.metadata.location : "Bhutan"),
    star_rating: starFromMetadata(row.metadata),
    pelbu_property_id: row.pelbu_property_id ?? undefined,
    source,
    rooms,
  };
}

/** Load master catalog from Supabase; returns empty array if tables missing or empty. */
export async function loadCatalogHotelsFromDb(
  supabase: SupabaseClient,
): Promise<CatalogHotel[]> {
  const { data: hotelRows, error: hotelError } = await supabase
    .from("catalog_hotels")
    .select("id, name, city, source, active, pelbu_property_id, metadata")
    .eq("active", true)
    .order("name");

  if (hotelError || !hotelRows?.length) return [];

  const ids = hotelRows.map((h) => h.id);
  const { data: rateRows, error: rateError } = await supabase
    .from("catalog_room_rates")
    .select("catalog_hotel_id, room_type, net_usd, net_inr, meal, currency")
    .in("catalog_hotel_id", ids);

  if (rateError) return [];

  const ratesByHotel = new Map<string, CatalogRoom[]>();
  for (const rate of (rateRows ?? []) as DbRoomRow[]) {
    const netUsd = Number(rate.net_usd) || (rate.net_inr ? Number(rate.net_inr) / 84 : 0);
    if (netUsd <= 0) continue;
    const list = ratesByHotel.get(rate.catalog_hotel_id) ?? [];
    list.push({
      type: rate.room_type || "Standard",
      net_usd: netUsd,
      meal: rate.meal ?? undefined,
    });
    ratesByHotel.set(rate.catalog_hotel_id, list);
  }

  return (hotelRows as DbHotelRow[])
    .map((row) => mapHotel(row, ratesByHotel.get(row.id) ?? []))
    .filter((h): h is CatalogHotel => h !== null);
}

/** Supabase catalog when populated; otherwise seed.json pilot set. */
export async function resolveCatalogHotels(supabase: SupabaseClient | null): Promise<CatalogHotel[]> {
  if (!supabase) return getCatalogHotels();
  try {
    const fromDb = await loadCatalogHotelsFromDb(supabase);
    return fromDb.length ? fromDb : getCatalogHotels();
  } catch {
    return getCatalogHotels();
  }
}
