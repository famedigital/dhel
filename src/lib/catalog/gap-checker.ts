import type { BriefIntent } from "./types";
import { findCostGaps, type CostGapField } from "./trip-costs";

export type GapField =
  | "pax"
  | "days"
  | "stay_plan"
  | "nationalities"
  | "entry_point"
  | "travel_dates"
  | "budget_tier"
  | "client_name"
  | "language"
  | "room_avg"
  | "guide_day"
  | "car_day"
  | "transfer_trip"
  | "sdf"
  | "cost_confirm";

const MONTH_OR_DATE =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[\/\-]\d{1,2}|\d{4}|spring|summer|autumn|fall|winter|flexible)\b/i;

const PAX_HINT =
  /\b(\d+\s*(adults?|pax|people|travell?ers?|guests?|kids?|children)|couple|family|solo|group\s*\d+|just\s*me)\b/i;

const DAYS_HINT =
  /\b(\d+\s*[-]?\s*days?|\d+\s*n(ights?)?|day\s*\d+|week)\b/i;

const STAY_PLAN_HINT = /\b\d+\s*n\s+\w+/i;

const NATIONALITY_HINT =
  /\b(indian|australia|australian|chinese|china|american|usa|uk|british|belgian|belgium|european|japanese|korean|singapore|malaysian|thai|nepali|international)\b/i;

const ENTRY_HINT =
  /\b(paro|hasimara|bagdogra|ixb|phuentsholing|pling|land\s*border|fly\s*in|flight)\b/i;

const BUDGET_HINT =
  /\b(\d\s*[-]?\s*star|economy|mid|comfort|luxury|budget|premium|standard|no\s*limit)\b/i;

const CLIENT_HINT =
  /\b(for\s+[A-Z][a-z]+|client[:\s]+[A-Za-z]|mr\.?\s+[A-Z]|mrs\.?\s+[A-Z]|ms\.?\s+[A-Z])/;

const LANG_HINT = /\b(chinese|中文|mandarin|english\s+only|in\s+chinese)\b/i;

function mapCostGaps(costGaps: CostGapField[]): GapField[] {
  return costGaps as GapField[];
}

/** Gaps from structured form / confirmed intent (no raw-text heuristics). */
export function findFormGaps(intent: BriefIntent): GapField[] {
  const gaps: GapField[] = [];

  if (!intent.pax || intent.pax < 1 || !intent.adults || intent.adults < 1) {
    gaps.push("pax");
  }
  if (!intent.days || intent.days < 3) {
    gaps.push("days");
  }
  if (
    !intent.nationalities.length ||
    intent.nationalities.every((n) => /international|unknown/i.test(n))
  ) {
    gaps.push("nationalities");
  }
  if (!intent.entry_point?.trim()) {
    gaps.push("entry_point");
  }
  if (!intent.travel_dates?.trim()) {
    gaps.push("travel_dates");
  }
  if (intent.budget_tier === "unknown") {
    gaps.push("budget_tier");
  }
  // Always need nights-per-city for reference-shaped packs
  if (!intent.stay_plan?.length) {
    gaps.push("stay_plan");
  }

  gaps.push(...mapCostGaps(findCostGaps(intent.raw_brief || "", intent)));

  return gaps;
}

export function isFormReady(intent: BriefIntent): boolean {
  return findFormGaps(intent).length === 0;
}

/** Trip gaps only (before cost) — used for early clarify turns. */
export function findTripGaps(rawBrief: string, intent: BriefIntent): GapField[] {
  const text = rawBrief.trim();
  const gaps: GapField[] = [];

  if (!PAX_HINT.test(text) && intent.pax <= 2 && intent.adults <= 2 && intent.children === 0) {
    gaps.push("pax");
  }

  const hasRoute = Boolean(intent.stay_plan?.length) || STAY_PLAN_HINT.test(text);
  if (!DAYS_HINT.test(text) && !hasRoute && intent.days === 7) {
    gaps.push("days");
  }
  if (!hasRoute && !STAY_PLAN_HINT.test(text) && !intent.stay_plan?.length) {
    gaps.push("stay_plan");
  }

  if (
    !NATIONALITY_HINT.test(text) &&
    (intent.nationalities.length === 0 ||
      intent.nationalities.every((n) => /international|unknown/i.test(n)))
  ) {
    gaps.push("nationalities");
  }

  if (!ENTRY_HINT.test(text) && /^(paro)$/i.test(intent.entry_point.trim())) {
    gaps.push("entry_point");
  }

  if (!intent.travel_dates?.trim() && !MONTH_OR_DATE.test(text)) {
    gaps.push("travel_dates");
  }

  if (
    !BUDGET_HINT.test(text) &&
    (intent.budget_tier === "unknown" || (!intent.hotel_star_rating && intent.budget_tier === "mid"))
  ) {
    gaps.push("budget_tier");
  }

  if (!intent.client_name?.trim() && !CLIENT_HINT.test(text)) {
    gaps.push("client_name");
  }

  if (LANG_HINT.test(text) && intent.language === "en" && /chinese|中文/i.test(text)) {
    // language detectable — no gap
  }

  return gaps;
}

/** Deterministic gap detection from raw paste + intent (trip + cost). */
export function findBriefGaps(rawBrief: string, intent: BriefIntent): GapField[] {
  return [...findTripGaps(rawBrief, intent), ...mapCostGaps(findCostGaps(rawBrief, intent))];
}

export function isBriefReady(rawBrief: string, intent: BriefIntent): boolean {
  return findBriefGaps(rawBrief, intent).length === 0;
}

/** Gaps that block hotel step (trip facts only). Cost can come after hotels. */
export function findPreHotelGaps(rawBrief: string, intent: BriefIntent): GapField[] {
  return findTripGaps(rawBrief, intent).filter((g) => g !== "client_name");
}
