import type { BriefIntent } from "@/lib/catalog/types";
import { parseStayPlan } from "@/lib/catalog/stay-plan";
import { ensureStayPlan } from "@/lib/catalog/default-stay-plan";
import {
  SUGGESTED_TRIP_COSTS,
  type TripCostLines,
} from "@/lib/catalog/trip-costs";

export type WizardBasics = {
  client_name: string;
  travel_dates: string;
  pax_label: string;
  nationality: string;
  entry_point: string;
  language: "en" | "zh";
};

export type WizardStaff = {
  guide_label: string;
  vehicle_label: string;
};

function paxFromLabel(label: string): { pax: number; adults: number; children: number } {
  if (/solo|just me|1 adult/i.test(label)) return { pax: 1, adults: 1, children: 0 };
  if (/family/i.test(label)) return { pax: 4, adults: 2, children: 2 };
  if (/group\s*5|5\+/i.test(label)) return { pax: 6, adults: 6, children: 0 };
  return { pax: 2, adults: 2, children: 0 };
}

function budgetFromLabel(label: string): BriefIntent["budget_tier"] {
  if (/5-star|luxury/i.test(label)) return "luxury";
  if (/4-star|comfort/i.test(label)) return "comfort";
  if (/3-star|economy/i.test(label)) return "economy";
  return "mid";
}

function entryFromLabel(label: string): string {
  if (/bagdogra/i.test(label)) return "Bagdogra";
  if (/hasimara/i.test(label)) return "Hasimara";
  if (/phuentsholing|pling/i.test(label)) return "Phuentsholing";
  if (/paro|fly/i.test(label)) return "Paro";
  return "Paro";
}

function daysFromStayPlan(plan: string): number {
  const segs = parseStayPlan(plan);
  if (!segs?.length) return 7;
  return segs.reduce((n, s) => n + s.nights, 0) + 1;
}

/** Build a confirmed BriefIntent from wizard selects (no chat string required). */
export function briefIntentFromWizard(opts: {
  basics: WizardBasics;
  stayPlanLabel: string;
  budgetLabel: string;
  tripCosts?: Partial<TripCostLines>;
  costsConfirmed?: boolean;
}): BriefIntent {
  const { pax, adults, children } = paxFromLabel(opts.basics.pax_label);
  const stay_plan = parseStayPlan(opts.stayPlanLabel);
  const days = stay_plan?.length
    ? daysFromStayPlan(opts.stayPlanLabel)
    : 7;
  const entry_point = entryFromLabel(opts.basics.entry_point);
  const nationalities = [opts.basics.nationality || "International"];
  const budget_tier = budgetFromLabel(opts.budgetLabel);

  const raw_brief = [
    opts.basics.client_name ? `Client: ${opts.basics.client_name}` : null,
    `${pax} travellers (${nationalities.join(", ")})`,
    `${days} days`,
    opts.basics.travel_dates ? `Dates: ${opts.basics.travel_dates}` : null,
    `Entry: ${entry_point}`,
    opts.stayPlanLabel ? `Route: ${opts.stayPlanLabel}` : null,
    `Budget: ${opts.budgetLabel}`,
  ]
    .filter(Boolean)
    .join(". ");

  let intent: BriefIntent = {
    pax,
    adults,
    children,
    days,
    nationalities,
    entry_point,
    budget_tier,
    language: opts.basics.language,
    currency: /indian/i.test(nationalities[0]!) ? "INR" : "USD",
    travel_dates: opts.basics.travel_dates || undefined,
    client_name: opts.basics.client_name || undefined,
    stay_plan: stay_plan ?? undefined,
    raw_brief,
    trip_costs: {
      currency: SUGGESTED_TRIP_COSTS.currency,
      room_avg_per_night: opts.tripCosts?.room_avg_per_night ?? SUGGESTED_TRIP_COSTS.room_avg_per_night,
      guide_per_day: opts.tripCosts?.guide_per_day ?? SUGGESTED_TRIP_COSTS.guide_per_day,
      car_per_day: opts.tripCosts?.car_per_day ?? SUGGESTED_TRIP_COSTS.car_per_day,
      transfer_per_trip: opts.tripCosts?.transfer_per_trip ?? SUGGESTED_TRIP_COSTS.transfer_per_trip,
      include_sdf: opts.tripCosts?.include_sdf ?? true,
      confirmed: opts.costsConfirmed ?? false,
      ...opts.tripCosts,
    },
  };

  intent = ensureStayPlan(intent);
  return intent;
}

export function parseCostOptionNumber(option: string, fallback: number): number {
  const m = option.replace(/,/g, "").match(/(\d{3,6})/);
  return m ? parseInt(m[1]!, 10) : fallback;
}
