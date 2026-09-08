import type { BriefIntent, DisplayCurrency } from "./types";

/** Per-trip ops cost lines (ask if not in the brief). Currency is usually INR/Nu for ops; guest PDF often USD. */
export type TripCostLines = {
  currency: DisplayCurrency | "INR" | "BTN" | "USD";
  /** Average room rate per night (ops currency) */
  room_avg_per_night?: number;
  /** Guide rate per day */
  guide_per_day?: number;
  /** Vehicle rate per day */
  car_per_day?: number;
  /** Pickup + drop for the gateway, per trip (not per day) */
  transfer_per_trip?: number;
  /** SDF daily per person (optional override); if omitted, catalog nationality rules apply when confirmed */
  sdf_per_person_per_day?: number;
  /** Include SDF in package (default true when nationality known) */
  include_sdf?: boolean;
  /** Locked guest sell total (guest currency) — if set, do not invent another hero total */
  sell_total_locked?: number;
  sell_currency?: DisplayCurrency;
  /** Confirmed by agent in chat */
  confirmed?: boolean;
};

/** Suggested defaults shown in clarifying questions — never applied silently. */
export const SUGGESTED_TRIP_COSTS = {
  currency: "INR" as const,
  room_avg_per_night: 4500,
  guide_per_day: 2500,
  car_per_day: 5000,
  transfer_per_trip: 5000,
};

const COST_HINT =
  /\b(room|hotel|guide|car|vehicle|pickup|pick\s*up|drop|transfer|sdf|nu\.?|inr|rs\.?|₹|4500|2500|5000)\b/i;

const NUMBER_NEAR =
  /(\d{3,6})\s*(?:\/?\s*(?:n(?:ight)?|d(?:ay)?|pp|per)?)/i;

export function parseTripCostsFromText(raw: string): Partial<TripCostLines> {
  const text = raw.trim();
  if (!text || !COST_HINT.test(text)) return {};

  const out: Partial<TripCostLines> = {};
  const room = text.match(
    /\b(?:room|hotel|avg)\s*(?:avg|average|rate)?[^0-9]{0,12}(\d{3,6})/i,
  );
  if (room) out.room_avg_per_night = parseInt(room[1]!, 10);

  const guide = text.match(/\bguide[^0-9]{0,12}(\d{3,6})/i);
  if (guide) out.guide_per_day = parseInt(guide[1]!, 10);

  const car = text.match(/\b(?:car|vehicle|suv|santa\s*fe)[^0-9]{0,12}(\d{3,6})/i);
  if (car) out.car_per_day = parseInt(car[1]!, 10);

  const transfer = text.match(
    /\b(?:pickup|pick[\s-]?up|drop|transfer|bagdogra|hasimara)[^0-9]{0,20}(\d{3,6})/i,
  );
  if (transfer) out.transfer_per_trip = parseInt(transfer[1]!, 10);

  const sdf = text.match(/\bsdf[^0-9]{0,12}(\d{2,5})/i);
  if (sdf) out.sdf_per_person_per_day = parseInt(sdf[1]!, 10);

  if (/inr|rs\.?|₹|nu\.?/i.test(text)) out.currency = "INR";
  if (/\busd\b|\$/i.test(text) && !out.currency) out.currency = "USD";

  return out;
}

export type CostGapField =
  | "room_avg"
  | "guide_day"
  | "car_day"
  | "transfer_trip"
  | "sdf"
  | "cost_confirm";

export function findCostGaps(
  rawBrief: string,
  intent: BriefIntent,
): CostGapField[] {
  const costs = intent.trip_costs;
  const parsed = parseTripCostsFromText(rawBrief);
  const gaps: CostGapField[] = [];

  const room = costs?.room_avg_per_night ?? parsed.room_avg_per_night;
  const guide = costs?.guide_per_day ?? parsed.guide_per_day;
  const car = costs?.car_per_day ?? parsed.car_per_day;
  const transfer = costs?.transfer_per_trip ?? parsed.transfer_per_trip;

  if (room == null) gaps.push("room_avg");
  if (guide == null) gaps.push("guide_day");
  if (car == null) gaps.push("car_day");
  if (transfer == null) gaps.push("transfer_trip");

  // SDF: ask unless nationality-driven default is fine and agent confirmed, or paste mentions SDF
  if (
    costs?.include_sdf === undefined &&
    costs?.sdf_per_person_per_day == null &&
    !/\bsdf\b/i.test(rawBrief)
  ) {
    gaps.push("sdf");
  }

  if (gaps.length === 0 && !costs?.confirmed && !costs?.sell_total_locked) {
    gaps.push("cost_confirm");
  }

  return gaps;
}

export function mergeTripCostsFromBrief(intent: BriefIntent): BriefIntent {
  const parsed = parseTripCostsFromText(intent.raw_brief || "");
  if (!Object.keys(parsed).length && !intent.trip_costs) return intent;
  return {
    ...intent,
    trip_costs: {
      currency: intent.trip_costs?.currency ?? parsed.currency ?? "INR",
      ...parsed,
      ...intent.trip_costs,
    },
  };
}

export function formatCostSummary(costs: TripCostLines, days: number, nights: number): string {
  const cur = costs.currency || "INR";
  const bits: string[] = [];
  if (costs.room_avg_per_night != null) {
    bits.push(`Rooms ~${cur} ${costs.room_avg_per_night}/n × ${nights}N`);
  }
  if (costs.guide_per_day != null) {
    bits.push(`Guide ${cur} ${costs.guide_per_day}/d × ${days}D`);
  }
  if (costs.car_per_day != null) {
    bits.push(`Car ${cur} ${costs.car_per_day}/d × ${days}D`);
  }
  if (costs.transfer_per_trip != null) {
    bits.push(`Pickup+drop ${cur} ${costs.transfer_per_trip}/trip`);
  }
  if (costs.include_sdf !== false) {
    bits.push(
      costs.sdf_per_person_per_day != null
        ? `SDF ${cur} ${costs.sdf_per_person_per_day}/pp/day`
        : "SDF per nationality rules",
    );
  }
  if (costs.sell_total_locked != null) {
    bits.push(
      `Locked sell ${costs.sell_currency ?? "USD"} ${costs.sell_total_locked}`,
    );
  }
  return bits.join(" · ");
}

/** Detect free-text cost answers from chat chips / typed replies. */
export function applyCostAnswerToIntent(
  intent: BriefIntent,
  questionId: string,
  answer: string,
): BriefIntent {
  const costs: TripCostLines = {
    currency: intent.trip_costs?.currency ?? "INR",
    ...intent.trip_costs,
  };
  const num = parseInt(answer.replace(/[^\d]/g, ""), 10);
  const lower = answer.toLowerCase();

  if (questionId === "room_avg" || /room|4500/i.test(questionId + answer)) {
    if (!Number.isNaN(num)) costs.room_avg_per_night = num;
    else if (/use\s*4500|suggested|yes/i.test(lower)) costs.room_avg_per_night = SUGGESTED_TRIP_COSTS.room_avg_per_night;
  }
  if (questionId === "guide_day" || /guide|2500/i.test(questionId + answer)) {
    if (!Number.isNaN(num) && /guide|2500|day/i.test(lower + questionId)) {
      costs.guide_per_day = num;
    } else if (/use\s*2500|suggested|yes/i.test(lower) && questionId === "guide_day") {
      costs.guide_per_day = SUGGESTED_TRIP_COSTS.guide_per_day;
    } else if (questionId === "guide_day" && !Number.isNaN(num)) {
      costs.guide_per_day = num;
    }
  }
  if (questionId === "car_day") {
    if (!Number.isNaN(num)) costs.car_per_day = num;
    else if (/use\s*5000|suggested|yes/i.test(lower)) costs.car_per_day = SUGGESTED_TRIP_COSTS.car_per_day;
  }
  if (questionId === "transfer_trip") {
    if (!Number.isNaN(num)) costs.transfer_per_trip = num;
    else if (/use\s*5000|suggested|yes/i.test(lower)) {
      costs.transfer_per_trip = SUGGESTED_TRIP_COSTS.transfer_per_trip;
    }
  }
  if (questionId === "sdf") {
    if (/no\s*sdf|exclude|without/i.test(lower)) costs.include_sdf = false;
    else {
      costs.include_sdf = true;
      if (!Number.isNaN(num) && num > 0 && num < 1000) costs.sdf_per_person_per_day = num;
    }
  }
  if (questionId === "cost_confirm") {
    costs.confirmed = true;
    const sell = answer.match(/(?:usd|sell|total)\s*[\$:]?\s*([\d,]+)/i);
    if (sell) {
      costs.sell_total_locked = parseInt(sell[1]!.replace(/,/g, ""), 10);
      costs.sell_currency = "USD";
    }
    if (/catalog|markup|compute|use\s*(these|rates)/i.test(lower)) {
      costs.confirmed = true;
    }
  }

  return { ...intent, trip_costs: costs };
}
