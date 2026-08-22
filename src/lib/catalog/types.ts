import seed from "./seed.json";
import festivals from "./festivals.json";

export type RateTier = "agent" | "b2c";
export type DisplayCurrency = "USD" | "INR" | "BTN";

export interface CatalogRoom {
  type: string;
  net_usd: number;
  meal?: string;
}

export interface CatalogHotel {
  id: string;
  name: string;
  city: string;
  star_rating: number;
  pelbu_property_id?: string;
  source: "pelbu" | "catalog" | "agency";
  rooms: CatalogRoom[];
}

export interface AgencyMarkupSettings {
  default_markup_percent: number;
  markup_mode: "percent_on_cost" | "flat_per_person";
  flat_per_person_usd?: number;
  hotel_markup_percent?: number;
  pelbu_own_hotel_markup_percent: number;
  min_margin_percent: number;
}

export const DEFAULT_MARKUP: AgencyMarkupSettings = {
  default_markup_percent: 10,
  markup_mode: "percent_on_cost",
  pelbu_own_hotel_markup_percent: 0,
  min_margin_percent: 5,
};

export interface BriefIntent {
  pax: number;
  adults: number;
  children: number;
  days: number;
  nationalities: string[];
  entry_point: string;
  budget_tier: "economy" | "mid" | "comfort" | "luxury" | "unknown";
  language: "en" | "zh";
  currency: DisplayCurrency;
  meal_plan?: "MAP" | "BB" | "CP" | "EP";
  hotel_star_rating?: number;
  travel_dates?: string;
  client_name?: string;
  /** Parsed from brief e.g. 2n Phuentsholing, 2n Thimphu, 2n Paro */
  stay_plan?: Array<{ city: string; nights: number }>;
  raw_brief: string;
}

export interface PackageModule {
  key: string;
  label: string;
  cost: number;
  sell: number;
}

export interface HotelOption {
  hotel_id: string;
  hotel_name: string;
  city: string;
  room_type: string;
  nights: number;
  net_per_night: number;
  source: string;
  /** Multi-city FIT — one hotel per stopover. */
  stays?: HotelOption[];
}

export interface PackageOption {
  id: string;
  label: string;
  recommended: boolean;
  hotel: HotelOption;
  modules: PackageModule[];
  cost_total: number;
  sell_total: number;
  sell_per_person: number;
  currency: string;
  margin_percent: number;
  warnings: FestivalWarning[];
}

export interface FestivalWarning {
  festival: string;
  message: string;
}

export function getCatalogHotels(): CatalogHotel[] {
  return seed.hotels as CatalogHotel[];
}

export function getFestivals() {
  return festivals;
}

export function getSdfDailyUsd(nationality: string): number {
  const n = nationality.toLowerCase();
  if (n.includes("india") || n.includes("indian")) return seed.sdf_rules.indian.daily_usd;
  if (["nepal", "bangladesh", "maldives"].some((c) => n.includes(c))) return seed.sdf_rules.saarc.daily_usd;
  return seed.sdf_rules.other.daily_usd;
}

export { seed };
