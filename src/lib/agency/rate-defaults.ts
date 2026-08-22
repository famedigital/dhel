import { seed, type DisplayCurrency } from "@/lib/catalog/types";

export interface VehicleRateCategory {
  category: string;
  day_rate_usd: number;
}

export interface RoomCategoryRate {
  label: string;
  star: number;
  meal: string;
  net_usd: number;
}

export interface AgencyRateDefaults {
  guide_day_rate_usd?: number;
  /** Default vehicle shown on client PDF cover */
  default_vehicle_type?: string;
  /** Primary car day rate (used in pricing) */
  car_day_rate_usd?: number;
  vehicle_rates?: VehicleRateCategory[];
  room_category_rates?: RoomCategoryRate[];
}

export const DEFAULT_RATE_DEFAULTS: AgencyRateDefaults = {
  guide_day_rate_usd: seed.guide_day_rate_usd,
  car_day_rate_usd: seed.car_day_rate_usd,
  default_vehicle_type: "Private SUV · Hyundai Santa Fe or similar",
  vehicle_rates: [
    { category: "SUV · Hyundai Santa Fe", day_rate_usd: 235 },
    { category: "SUV · Toyota Prado", day_rate_usd: 280 },
    { category: "Sedan · Toyota Corolla", day_rate_usd: 195 },
  ],
  room_category_rates: [
    { label: "3★ MAP Standard", star: 3, meal: "MAP", net_usd: 85 },
    { label: "3★ MAP Deluxe", star: 3, meal: "MAP", net_usd: 95 },
    { label: "4★ MAP", star: 4, meal: "MAP", net_usd: 110 },
    { label: "5★ Luxury", star: 5, meal: "MAP", net_usd: 165 },
  ],
};

export function mergeRateDefaults(raw: unknown): AgencyRateDefaults {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_RATE_DEFAULTS };
  const r = raw as AgencyRateDefaults;
  return {
    ...DEFAULT_RATE_DEFAULTS,
    ...r,
    vehicle_rates: r.vehicle_rates?.length ? r.vehicle_rates : DEFAULT_RATE_DEFAULTS.vehicle_rates,
    room_category_rates: r.room_category_rates?.length
      ? r.room_category_rates
      : DEFAULT_RATE_DEFAULTS.room_category_rates,
  };
}

export function resolveGuideDayRateUsd(defaults: AgencyRateDefaults): number {
  return defaults.guide_day_rate_usd ?? seed.guide_day_rate_usd;
}

export function resolveCarDayRateUsd(defaults: AgencyRateDefaults): number {
  return defaults.car_day_rate_usd ?? seed.car_day_rate_usd;
}

export function vehicleLabelForPdf(defaults: AgencyRateDefaults, language: "en" | "zh" = "en"): string {
  if (defaults.default_vehicle_type?.trim()) return defaults.default_vehicle_type.trim();
  return language === "zh" ? "运营团队安排" : "Assigned in Ops";
}

export function formatVehicleRatesList(defaults: AgencyRateDefaults, currency: DisplayCurrency): string[] {
  const fx = currency === "INR" ? seed.fx_rates.USD_INR : currency === "BTN" ? seed.fx_rates.USD_BTN : 1;
  const suffix = currency === "USD" ? "USD" : currency;
  return (defaults.vehicle_rates ?? []).map((v) => {
    const rate = currency === "USD" ? v.day_rate_usd : Math.round(v.day_rate_usd * fx);
    return `${v.category} — ${suffix} ${rate.toLocaleString()} / day`;
  });
}
