import {
  getCatalogHotels,
  getSdfDailyUsd,
  seed,
  type AgencyMarkupSettings,
  type BriefIntent,
  type CatalogHotel,
  type DisplayCurrency,
  type FestivalWarning,
  type HotelOption,
  type PackageOption,
  DEFAULT_MARKUP,
} from "./types";
import { getFestivals } from "./types";
import type { RateTier } from "./types";
import { cityMatches, formatStayRoute, extractMentionedRouteCities } from "./stay-plan";
import type { AgencyRateDefaults } from "@/lib/agency/rate-defaults";
import { resolveCarDayRateUsd, resolveGuideDayRateUsd } from "@/lib/agency/rate-defaults";

function convertFromUsd(amountUsd: number, currency: DisplayCurrency): number {
  if (currency === "INR") return Math.round(amountUsd * seed.fx_rates.USD_INR);
  if (currency === "BTN") return Math.round(amountUsd * seed.fx_rates.USD_BTN);
  return Math.round(amountUsd);
}

function resolveCurrency(brief: BriefIntent): DisplayCurrency {
  return brief.currency ?? (seed.currency_default as DisplayCurrency);
}

function getTransferCostUsd(entryPoint: string): number {
  const ep = entryPoint.toLowerCase();
  if (ep.includes("bagdogra")) return seed.pickup_bagdogra_usd + seed.drop_bagdogra_usd;
  if (ep.includes("hasimara")) return seed.pickup_hasimara_usd + seed.drop_hasimara_usd;
  return seed.pickup_paro_usd + seed.drop_paro_usd;
}

/** Convert ops amount (often INR) into package display currency. */
function opsAmountToDisplay(
  amount: number,
  opsCurrency: string,
  display: DisplayCurrency,
): number {
  const ops = opsCurrency.toUpperCase();
  if (ops === display) return Math.round(amount);
  // Treat BTN ≈ INR
  let usd = amount;
  if (ops === "INR" || ops === "BTN") {
    usd = amount / (seed.fx_rates.USD_INR || 83);
  } else if (ops === "USD") {
    usd = amount;
  }
  return convertFromUsd(usd, display);
}

type LandCostParts = {
  guideCost: number;
  carCost: number;
  transferCost: number;
  sdfCost: number;
  roomOverridePerNight?: number;
};

function resolveLandCostsFromBrief(
  brief: BriefIntent,
  currency: DisplayCurrency,
  rateDefaults?: AgencyRateDefaults,
): LandCostParts {
  const pax = Math.max(brief.pax, 1);
  const costs = brief.trip_costs;
  const opsCur = costs?.currency ?? "INR";

  let guideCost: number;
  let carCost: number;
  let transferCost: number;
  let sdfCost: number;

  if (costs?.guide_per_day != null) {
    guideCost = opsAmountToDisplay(costs.guide_per_day * brief.days, opsCur, currency);
  } else {
    const guideRateUsd = rateDefaults ? resolveGuideDayRateUsd(rateDefaults) : seed.guide_day_rate_usd;
    guideCost = convertFromUsd(guideRateUsd * brief.days, currency);
  }

  if (costs?.car_per_day != null) {
    carCost = opsAmountToDisplay(costs.car_per_day * brief.days, opsCur, currency);
  } else {
    const carRateUsd = rateDefaults ? resolveCarDayRateUsd(rateDefaults) : seed.car_day_rate_usd;
    carCost = convertFromUsd(carRateUsd * brief.days, currency);
  }

  if (costs?.transfer_per_trip != null) {
    transferCost = opsAmountToDisplay(costs.transfer_per_trip, opsCur, currency);
  } else {
    transferCost = convertFromUsd(getTransferCostUsd(brief.entry_point), currency);
  }

  if (costs?.include_sdf === false) {
    sdfCost = 0;
  } else if (costs?.sdf_per_person_per_day != null) {
    sdfCost = opsAmountToDisplay(
      costs.sdf_per_person_per_day * brief.days * pax,
      costs.sell_currency ?? "USD",
      currency,
    );
  } else {
    const sdfDaily = brief.nationalities.map(getSdfDailyUsd);
    const sdfRateUsd = Math.max(...sdfDaily, seed.sdf_rules.other.daily_usd);
    sdfCost = convertFromUsd(sdfRateUsd * brief.days * pax, currency);
  }

  const roomOverridePerNight =
    costs?.room_avg_per_night != null
      ? opsAmountToDisplay(costs.room_avg_per_night, opsCur, currency)
      : undefined;

  return { guideCost, carCost, transferCost, sdfCost, roomOverridePerNight };
}

function applyLockedSell(pkg: PackageOption, brief: BriefIntent): PackageOption {
  const locked = brief.trip_costs?.sell_total_locked;
  if (locked == null || locked <= 0) return pkg;
  const pax = Math.max(brief.pax, 1);
  const sellCurrency = brief.trip_costs?.sell_currency ?? pkg.currency;
  return {
    ...pkg,
    currency: sellCurrency,
    sell_total: Math.round(locked),
    sell_per_person: Math.round(locked / pax),
    margin_percent:
      pkg.cost_total > 0
        ? Math.round(((locked - pkg.cost_total) / pkg.cost_total) * 100)
        : pkg.margin_percent,
  };
}

function avgNightlyUsd(hotel: CatalogHotel, mealPlan?: BriefIntent["meal_plan"]): number {
  const rooms = mealPlan ? hotel.rooms.filter((r) => r.meal === mealPlan) : hotel.rooms;
  const list = rooms.length ? rooms : hotel.rooms;
  return list.reduce((s, r) => s + r.net_usd, 0) / list.length;
}

function filterHotelsForBrief(brief: BriefIntent, catalog: CatalogHotel[]): CatalogHotel[] {
  let hotels = catalog;

  if (brief.hotel_star_rating) {
    const maxStar = brief.hotel_star_rating;
    const matched = hotels.filter((h) => h.star_rating <= maxStar);
    if (matched.length) hotels = matched;
  } else if (brief.budget_tier === "luxury") {
    hotels = hotels.filter((h) => h.star_rating >= 4);
  } else if (brief.budget_tier === "economy") {
    hotels = hotels.filter((h) => h.star_rating <= 3);
  }

  if (brief.meal_plan) {
    const withMeal = hotels.filter((h) => h.rooms.some((r) => r.meal === brief.meal_plan));
    if (withMeal.length >= 3) {
      hotels = withMeal;
    } else if (withMeal.length > 0) {
      const ids = new Set(withMeal.map((h) => h.id));
      hotels = [...withMeal, ...hotels.filter((h) => !ids.has(h.id))];
    }
  }

  return hotels;
}

function pickHotelsForBrief(brief: BriefIntent, catalog: CatalogHotel[]): CatalogHotel[] {
  let hotels = filterHotelsForBrief(brief, catalog);

  // Never suggest hotels outside the route cities when we know the itinerary towns.
  const routeCities =
    brief.stay_plan?.map((s) => s.city) ??
    (brief.raw_brief ? extractMentionedRouteCities(brief.raw_brief) : []);
  if (routeCities.length) {
    const inRoute = hotels.filter((h) => routeCities.some((c) => cityMatches(h.city, c)));
    if (inRoute.length) hotels = inRoute;
  }

  const sorted = [...hotels].sort(
    (a, b) => avgNightlyUsd(a, brief.meal_plan) - avgNightlyUsd(b, brief.meal_plan),
  );
  if (!sorted.length) return [];
  if (sorted.length <= 3) return sorted;

  const last = sorted.length - 1;
  const mid = Math.floor(last / 2);
  const indices = [0, mid, last];
  return [...new Set(indices.map((i) => sorted[i]!.id))].map((id) => sorted.find((h) => h.id === id)!);
}

export type HotelChoiceRow = {
  id: string;
  name: string;
  city: string;
  star_rating: number;
  room_type: string;
  net_usd: number;
  meal: string;
  source: string;
};

export type CityHotelChoices = {
  city: string;
  nights: number;
  hotels: HotelChoiceRow[];
};

/** Hotels the agent can pick for each overnight city (2nd form). */
export function listHotelChoicesForRoute(
  brief: BriefIntent,
  catalogHotels?: CatalogHotel[],
): CityHotelChoices[] {
  const catalog = catalogHotels?.length ? catalogHotels : getCatalogHotels();
  const plan = brief.stay_plan;
  if (!plan?.length) return [];

  return plan.map((seg) => {
    const inCity = filterHotelsForBrief(brief, catalog)
      .filter((h) => cityMatches(h.city, seg.city))
      .sort((a, b) => avgNightlyUsd(a, brief.meal_plan) - avgNightlyUsd(b, brief.meal_plan));

    const hotels: HotelChoiceRow[] = inCity.slice(0, 12).map((h) => {
      const room =
        (brief.meal_plan ? h.rooms.find((r) => r.meal === brief.meal_plan) : null) ?? h.rooms[0]!;
      return {
        id: h.id,
        name: h.name,
        city: h.city,
        star_rating: h.star_rating,
        room_type: room?.type ?? "Standard",
        net_usd: room?.net_usd ?? avgNightlyUsd(h),
        meal: room?.meal ?? "BB",
        source: h.source,
      };
    });

    return { city: seg.city, nights: seg.nights, hotels };
  });
}

/** Price a package from agent-selected hotels per overnight city. */
export function computePackageFromHotelSelections(
  brief: BriefIntent,
  selections: Array<{ city: string; hotelId: string; nights: number }>,
  markup: AgencyMarkupSettings = DEFAULT_MARKUP,
  rateTier: RateTier = "agent",
  catalogHotels?: CatalogHotel[],
  rateDefaults?: AgencyRateDefaults,
): PackageOption | null {
  const catalog = catalogHotels?.length ? catalogHotels : getCatalogHotels();
  const currency = resolveCurrency(brief);
  const pax = Math.max(brief.pax, 1);
  const land = resolveLandCostsFromBrief(brief, currency, rateDefaults);
  const { guideCost, carCost, transferCost, sdfCost, roomOverridePerNight } = land;
  const visaCost = convertFromUsd(seed.visa_fee_usd * pax, currency);
  const b2cMultiplier = rateTier === "b2c" ? 1.08 : 1;

  const stayOpts: HotelOption[] = [];
  for (const sel of selections) {
    const opt = computeHotelOption(
      sel.hotelId,
      sel.nights,
      catalog,
      markup,
      brief.meal_plan,
      undefined,
    );
    if (!opt) return null;
    const net =
      roomOverridePerNight != null ? roomOverridePerNight : convertFromUsd(opt.net_per_night, currency);
    stayOpts.push({
      ...opt,
      city: sel.city,
      nights: sel.nights,
      net_per_night: net,
    });
  }
  if (!stayOpts.length) return null;

  const combined = combineStayHotels(stayOpts);
  const hotelCost = stayOpts.reduce((sum, s) => sum + s.net_per_night * s.nights, 0);
  const isPelbu = stayOpts.some((s) => s.source === "pelbu");
  const landCost = hotelCost + guideCost + carCost + visaCost + transferCost + sdfCost;
  const { sell: landSell } = applyMarkup(landCost, markup, currency, isPelbu);
  const sellTotal = Math.round(landSell * b2cMultiplier);
  const costTotal = Math.round(landCost);
  const sellPerPerson = Math.round(sellTotal / pax);
  const marginPercent =
    costTotal > 0 ? Math.round(((sellTotal - costTotal) / costTotal) * 100) : 0;

  const warnings = checkFestivals(brief.travel_dates);
  if (brief.stay_plan?.length) {
    warnings.unshift({ festival: "Route", message: formatStayRoute(brief.stay_plan) });
  }

  const pkg: PackageOption = {
    id: `agent-${stayOpts.map((s) => s.hotel_id).join("-")}`,
    label: "Agent selection",
    recommended: true,
    hotel: { ...combined, net_per_night: combined.net_per_night },
    modules: [
      { key: "sdf", label: "SDF", cost: sdfCost, sell: sdfCost },
      { key: "guide", label: "Guide", cost: guideCost, sell: guideCost },
      { key: "car", label: "Vehicle", cost: carCost, sell: carCost },
      { key: "hotels", label: combined.hotel_name, cost: hotelCost, sell: hotelCost },
      { key: "visa", label: "Visa", cost: visaCost, sell: visaCost },
      { key: "transfers", label: "Transfers", cost: transferCost, sell: transferCost },
    ],
    cost_total: costTotal,
    sell_total: sellTotal,
    sell_per_person: sellPerPerson,
    currency,
    margin_percent: marginPercent,
    warnings,
  };
  return applyLockedSell(pkg, brief);
}

/** Value / mid / premium slot within one city. */
function pickHotelInCity(
  city: string,
  catalog: CatalogHotel[],
  brief: BriefIntent,
  tierIndex: number,
): CatalogHotel | null {
  const inCity = filterHotelsForBrief(brief, catalog).filter((h) => cityMatches(h.city, city));
  if (!inCity.length) return null;

  const sorted = [...inCity].sort(
    (a, b) => avgNightlyUsd(a, brief.meal_plan) - avgNightlyUsd(b, brief.meal_plan),
  );
  if (sorted.length === 1) return sorted[0]!;

  const last = sorted.length - 1;
  const mid = Math.floor(last / 2);
  const pick = tierIndex === 0 ? 0 : tierIndex === 1 ? mid : last;
  return sorted[pick] ?? sorted[0]!;
}

function combineStayHotels(stays: HotelOption[]): HotelOption {
  const totalNights = stays.reduce((n, s) => n + s.nights, 0);
  const weightedNet =
    totalNights > 0
      ? stays.reduce((sum, s) => sum + s.net_per_night * s.nights, 0) / totalNights
      : stays[0]?.net_per_night ?? 0;

  return {
    hotel_id: stays.map((s) => s.hotel_id).join("+"),
    hotel_name: stays.map((s) => s.hotel_name).join(" · "),
    city: stays.map((s) => `${s.city} (${s.nights}N)`).join(" · "),
    room_type: stays[0]?.room_type ?? "Standard",
    nights: totalNights,
    net_per_night: Math.round(weightedNet),
    source: stays[0]?.source ?? "catalog",
    stays,
  };
}

function buildRoutePackages(
  brief: BriefIntent,
  catalog: CatalogHotel[],
  markup: AgencyMarkupSettings,
  currency: DisplayCurrency,
  rateTier: RateTier,
  agencyOverrides: Record<string, number> | undefined,
  pax: number,
  guideCost: number,
  carCost: number,
  visaCost: number,
  transferCost: number,
  sdfCost: number,
): PackageOption[] {
  const plan = brief.stay_plan!;
  const b2cMultiplier = rateTier === "b2c" ? 1.08 : 1;
  const options: PackageOption[] = [];
  const tierLabels = ["Value", "Recommended", "Premium"] as const;

  for (let tierIndex = 0; tierIndex < 3; tierIndex++) {
    const stayOpts: HotelOption[] = [];

    for (const seg of plan) {
      const hotel = pickHotelInCity(seg.city, catalog, brief, tierIndex);
      if (!hotel) {
        continue;
      }
      const opt = computeHotelOption(
        hotel.id,
        seg.nights,
        catalog,
        markup,
        brief.meal_plan,
        agencyOverrides,
      );
      if (opt) stayOpts.push(opt);
    }

    if (stayOpts.length !== plan.length) {
      continue;
    }

    const combined = combineStayHotels(stayOpts);
    const hotelCost = stayOpts.reduce(
      (sum, s) => sum + convertFromUsd(s.net_per_night * s.nights, currency),
      0,
    );
    const isPelbu = stayOpts.some((s) => s.source === "pelbu");
    const landCost = hotelCost + guideCost + carCost + visaCost + transferCost + sdfCost;
    const { sell: landSell } = applyMarkup(landCost, markup, currency, isPelbu);
    const sellTotal = Math.round(landSell * b2cMultiplier);
    const costTotal = Math.round(landCost);
    const sellPerPerson = Math.round(sellTotal / pax);
    const marginPercent =
      costTotal > 0 ? Math.round(((sellTotal - costTotal) / costTotal) * 100) : 0;

    const warnings = checkFestivals(brief.travel_dates);
    warnings.unshift({
      festival: "Route",
      message: formatStayRoute(plan),
    });
    if (marginPercent < markup.min_margin_percent) {
      warnings.push({
        festival: "Margin",
        message: `Margin ${marginPercent}% is below your ${markup.min_margin_percent}% floor.`,
      });
    }

    options.push({
      id: `route-${tierIndex}-${stayOpts.map((s) => s.hotel_id).join("-")}`,
      label: tierLabels[tierIndex]!,
      recommended: tierIndex === 1,
      hotel: { ...combined, net_per_night: convertFromUsd(combined.net_per_night, currency) },
      modules: [
        { key: "sdf", label: "SDF", cost: sdfCost, sell: sdfCost },
        { key: "guide", label: "Guide", cost: guideCost, sell: guideCost },
        { key: "car", label: "Vehicle", cost: carCost, sell: carCost },
        {
          key: "hotels",
          label: combined.hotel_name,
          cost: hotelCost,
          sell: hotelCost,
        },
        { key: "visa", label: "Visa", cost: visaCost, sell: visaCost },
        { key: "transfers", label: "Transfers", cost: transferCost, sell: transferCost },
      ],
      cost_total: costTotal,
      sell_total: sellTotal,
      sell_per_person: sellPerPerson,
      currency,
      margin_percent: marginPercent,
      warnings,
    });
  }

  return options;
}

function applyMarkup(
  cost: number,
  markup: AgencyMarkupSettings,
  currency: DisplayCurrency,
  isPelbuOwn = false,
): { sell: number; margin: number } {
  if (isPelbuOwn && markup.pelbu_own_hotel_markup_percent === 0) {
    return { sell: cost, margin: 0 };
  }
  if (markup.markup_mode === "flat_per_person") {
    const flatUsd = markup.flat_per_person_usd ?? 0;
    const flat = convertFromUsd(flatUsd, currency);
    return { sell: cost + flat, margin: flat };
  }
  const pct = (markup.hotel_markup_percent ?? markup.default_markup_percent) / 100;
  const sell = cost * (1 + pct);
  return { sell, margin: sell - cost };
}

function computeHotelOption(
  hotelId: string,
  nights: number,
  catalog: CatalogHotel[],
  markup: AgencyMarkupSettings,
  mealPlan?: BriefIntent["meal_plan"],
  agencyOverrides?: Record<string, number>,
): HotelOption | null {
  const hotel = catalog.find((h) => h.id === hotelId);
  if (!hotel || !hotel.rooms[0]) return null;
  const room =
    (mealPlan ? hotel.rooms.find((r) => r.meal === mealPlan) : undefined) ?? hotel.rooms[0];
  const override = agencyOverrides?.[hotelId];
  const net = override ?? room.net_usd;
  return {
    hotel_id: hotel.id,
    hotel_name: hotel.name,
    city: hotel.city,
    room_type: room.type,
    nights,
    net_per_night: net,
    source: hotel.source,
  };
}

export function checkFestivals(travelDates?: string): FestivalWarning[] {
  if (!travelDates) return [];
  const warnings: FestivalWarning[] = [];
  for (const f of getFestivals()) {
    if (travelDates.toLowerCase().includes(f.name.toLowerCase().split(" ")[0]!)) {
      warnings.push({ festival: f.name, message: `${f.name} (${f.location}) — confirm hotel availability early.` });
    }
  }
  return warnings;
}

export function computePackages(
  brief: BriefIntent,
  markup: AgencyMarkupSettings = DEFAULT_MARKUP,
  rateTier: RateTier = "agent",
  agencyOverrides?: Record<string, number>,
  catalogHotels?: CatalogHotel[],
  rateDefaults?: AgencyRateDefaults,
): PackageOption[] {
  const catalog = catalogHotels?.length ? catalogHotels : getCatalogHotels();
  const currency = resolveCurrency(brief);
  const routeNights = brief.stay_plan?.reduce((sum, s) => sum + s.nights, 0);
  const nights = routeNights ?? Math.max(brief.days - 1, 1);
  const pax = Math.max(brief.pax, 1);
  const land = resolveLandCostsFromBrief(brief, currency, rateDefaults);
  const { guideCost, carCost, transferCost, sdfCost } = land;
  const visaCost = convertFromUsd(seed.visa_fee_usd * pax, currency);

  const b2cMultiplier = rateTier === "b2c" ? 1.08 : 1;

  if (brief.stay_plan?.length) {
    const routeOptions = buildRoutePackages(
      brief,
      catalog,
      markup,
      currency,
      rateTier,
      agencyOverrides,
      pax,
      guideCost,
      carCost,
      visaCost,
      transferCost,
      sdfCost,
    );
    if (routeOptions.length) return routeOptions.slice(0, 3);
  }

  const hotelIds = pickHotelsForBrief(brief, catalog);
  const options: PackageOption[] = [];

  hotelIds.forEach((hotel, i) => {
    const hotelOpt = computeHotelOption(hotel.id, nights, catalog, markup, brief.meal_plan, agencyOverrides);
    if (!hotelOpt) return;

    const hotelCost = convertFromUsd(hotelOpt.net_per_night * hotelOpt.nights, currency);
    const isPelbu = hotel.source === "pelbu";
    const landCost = hotelCost + guideCost + carCost + visaCost + transferCost + sdfCost;
    const { sell: landSell } = applyMarkup(landCost, markup, currency, isPelbu);
    const sellTotal = Math.round(landSell * b2cMultiplier);
    const costTotal = Math.round(landCost);
    const sellPerPerson = Math.round(sellTotal / pax);
    const marginPercent = costTotal > 0 ? Math.round(((sellTotal - costTotal) / costTotal) * 100) : 0;

    const warnings = checkFestivals(brief.travel_dates);
    if (marginPercent < markup.min_margin_percent) {
      warnings.push({
        festival: "Margin",
        message: `Margin ${marginPercent}% is below your ${markup.min_margin_percent}% floor.`,
      });
    }

    options.push({
      id: `opt-${hotel.id}`,
      label: i === 1 ? "Recommended" : i === 0 ? "Value" : "Premium",
      recommended: i === 1,
      hotel: { ...hotelOpt, net_per_night: convertFromUsd(hotelOpt.net_per_night, currency) },
      modules: [
        { key: "sdf", label: "SDF", cost: sdfCost, sell: sdfCost },
        { key: "guide", label: "Guide", cost: guideCost, sell: guideCost },
        { key: "car", label: "Vehicle", cost: carCost, sell: carCost },
        { key: "hotels", label: hotelOpt.hotel_name, cost: hotelCost, sell: hotelCost },
        { key: "visa", label: "Visa", cost: visaCost, sell: visaCost },
        { key: "transfers", label: "Transfers", cost: transferCost, sell: transferCost },
      ],
      cost_total: costTotal,
      sell_total: sellTotal,
      sell_per_person: sellPerPerson,
      currency,
      margin_percent: marginPercent,
      warnings,
    });
  });

  return options.slice(0, 3);
}

export function buildCompareTable(options: PackageOption[]) {
  return options.map((o) => ({
    id: o.id,
    hotel: o.hotel.hotel_name,
    city: o.hotel.city,
    room: o.hotel.room_type,
    nights: o.hotel.nights,
    total_pp: o.sell_per_person,
    currency: o.currency,
    recommended: o.recommended,
    source: o.hotel.source,
  }));
}
