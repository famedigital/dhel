import type { BriefIntent, DisplayCurrency } from "./types";
import { parseStayPlan } from "./stay-plan";

/** Deterministic overrides from raw paste — wins over AI when client is explicit. */
export function enrichBriefIntent(
  raw: string,
  parsed: Partial<Omit<BriefIntent, "raw_brief">> & {
    pax: number;
    adults: number;
    children: number;
    days: number;
    nationalities: string[];
    entry_point: string;
    budget_tier: BriefIntent["budget_tier"];
    language: BriefIntent["language"];
  },
): BriefIntent {
  const text = raw.toLowerCase();

  let currency: DisplayCurrency = parsed.currency ?? "USD";
  if (/\b(inr|₹|rupees?|indian rupee)\b/i.test(raw)) {
    currency = "INR";
  } else if (/\b(usd|\$|dollars?)\b/i.test(raw)) {
    currency = "USD";
  } else if (/\b(btn|nu\.?|ngultrum)\b/i.test(raw)) {
    currency = "BTN";
  }

  const mentionsIndian =
    /\b(indian\s*(guests?|nationals?|passport|travell?ers?|pax|clients?)|india\s*nationals?|indian\s*market)\b/i.test(
      raw,
    ) || parsed.nationalities.some((n) => n.toLowerCase().includes("india"));

  let nationalities = [...parsed.nationalities];
  if (mentionsIndian) {
    nationalities = ["Indian"];
  }

  // Indian FIT market defaults to INR unless client explicitly asked for USD
  if (mentionsIndian && !/\b(usd|\$|dollars?)\b/i.test(raw)) {
    currency = "INR";
  }

  let entry_point = parsed.entry_point;
  if (/\b(bagdogra|ixb)\b/i.test(raw)) entry_point = "Bagdogra";
  else if (/\b(hasimara|hmi)\b/i.test(raw)) entry_point = "Hasimara";
  else if (/\b(phuentsholing|pling|p\/l)\b/i.test(raw)) entry_point = "Phuentsholing";

  // Prefer explicit trip length ("7 days" / "6 nights").
  // Do NOT match date years: "14/09/26 – Day 7" was wrongly read as 26 days
  // (year 26 + the word Day).
  let days = parsed.days;
  const lengthMatches = [
    ...raw.matchAll(/(?<![\/\d])(\d{1,2})\s*[-–]?\s*(days?|nights?)\b(?!\s*\d)/gi),
  ];
  if (lengthMatches.length) {
    const last = lengthMatches[lengthMatches.length - 1]!;
    const n = parseInt(last[1]!, 10);
    if (!Number.isNaN(n) && n > 0 && n <= 21) {
      const unit = last[2]!.toLowerCase();
      days = unit.startsWith("night") ? n + 1 : n;
    }
  } else {
    const dayLabels = [...raw.matchAll(/\bday\s*(\d+)\b/gi)]
      .map((m) => parseInt(m[1]!, 10))
      .filter((n) => !Number.isNaN(n) && n > 0 && n <= 30);
    if (dayLabels.length >= 2) {
      days = Math.max(...dayLabels) - Math.min(...dayLabels) + 1;
    }
  }

  // Year-like AI defaults (e.g. 26 from "14/09/26") — drop when clearly not trip length
  if (days > 21 && !lengthMatches.length) {
    days = 7;
  }

  let budget_tier = parsed.budget_tier;
  let hotel_star_rating = parsed.hotel_star_rating;
  if (/\b3\s*[-]?\s*star\b/i.test(raw)) {
    hotel_star_rating = 3;
    budget_tier = "mid";
  } else if (/\b(4\s*[-]?\s*star|four\s*star)\b/i.test(raw)) {
    hotel_star_rating = 4;
    budget_tier = "comfort";
  } else if (/\b(5\s*[-]?\s*star|luxury|aman)\b/i.test(text)) {
    hotel_star_rating = 5;
    budget_tier = "luxury";
  } else if (/\b(budget|economy|2\s*[-]?\s*star)\b/i.test(text)) {
    hotel_star_rating = 2;
    budget_tier = "economy";
  }

  let meal_plan = parsed.meal_plan;
  if (/\bmap\b/i.test(raw) || /\bmodified american plan\b/i.test(raw)) meal_plan = "MAP";
  else if (/\bep\b/i.test(raw) || /\beuropean plan\b/i.test(raw)) meal_plan = "EP";
  else if (/\bcp\b/i.test(raw) || /\bcontinental plan\b/i.test(raw)) meal_plan = "CP";
  else if (/\bbb\b/i.test(raw) || /\bed\s*&?\s*breakfast\b/i.test(raw)) meal_plan = "BB";

  const stay_plan = parseStayPlan(raw);
  const routeNights = stay_plan?.reduce((sum, s) => sum + s.nights, 0);
  // Explicit nights-per-town always defines land length (nights + 1).
  if (routeNights && routeNights > 0) {
    days = routeNights + 1;
  }

  const paxMatch = raw.match(/\b(\d+)\s*pax\b/i);
  let pax = parsed.pax;
  let adults = parsed.adults;
  if (paxMatch) {
    pax = parseInt(paxMatch[1]!, 10);
    adults = pax;
  }

  return {
    pax,
    adults,
    children: parsed.children,
    days,
    nationalities,
    entry_point,
    budget_tier,
    language: parsed.language,
    travel_dates: parsed.travel_dates,
    client_name: parsed.client_name,
    currency,
    meal_plan,
    hotel_star_rating,
    stay_plan,
    raw_brief: raw,
  };
}
