import type { BriefIntent, DisplayCurrency } from "./types";
import { enrichBriefIntent } from "./brief-enrichment";

const MONTH_OR_DATE =
  /\b((jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?(?:,?\s*\d{2,4})?|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|(?:spring|summer|autumn|fall|winter)\s+\d{4}|flexible)\b/i;

const NATIONALITY_MAP: Array<{ re: RegExp; label: string }> = [
  { re: /\b(indian|india)\b/i, label: "Indian" },
  { re: /\b(australian|australia)\b/i, label: "Australian" },
  { re: /\b(chinese|china|prc)\b/i, label: "Chinese" },
  { re: /\b(american|usa|u\.s\.a\.|united states)\b/i, label: "American" },
  { re: /\b(british|uk|u\.k\.|england)\b/i, label: "British" },
  { re: /\b(belgian|belgium)\b/i, label: "Belgian" },
  { re: /\b(japanese|japan)\b/i, label: "Japanese" },
  { re: /\b(korean|korea)\b/i, label: "Korean" },
  { re: /\b(singaporean|singapore)\b/i, label: "Singaporean" },
  { re: /\b(malaysian|malaysia)\b/i, label: "Malaysian" },
  { re: /\b(thai|thailand)\b/i, label: "Thai" },
  { re: /\b(nepali|nepal)\b/i, label: "Nepali" },
];

function extractPax(raw: string): { pax: number; adults: number; children: number } {
  const couple = /\b(couple|just\s*us\s*two|2\s*adults?)\b/i.test(raw);
  const solo = /\b(solo|just\s*me|1\s*adult|single\s*travell?er)\b/i.test(raw);
  const family = /\bfamily\b/i.test(raw);

  const adultsMatch = raw.match(/\b(\d+)\s*adults?\b/i);
  const childrenMatch = raw.match(/\b(\d+)\s*(kids?|children|child)\b/i);
  const paxMatch = raw.match(/\b(\d+)\s*(pax|people|travell?ers?|guests?)\b/i);
  const groupMatch = raw.match(/\bgroup\s*(?:of\s*)?(\d+)\b/i);

  let adults = 2;
  let children = 0;
  let pax = 2;

  if (adultsMatch) adults = parseInt(adultsMatch[1]!, 10);
  if (childrenMatch) children = parseInt(childrenMatch[1]!, 10);
  if (paxMatch) {
    pax = parseInt(paxMatch[1]!, 10);
    if (!adultsMatch) adults = Math.max(1, pax - children);
  } else if (groupMatch) {
    pax = parseInt(groupMatch[1]!, 10);
    adults = pax;
  } else if (solo) {
    adults = 1;
    pax = 1;
  } else if (couple) {
    adults = 2;
    pax = 2;
  } else if (family) {
    adults = 2;
    children = Math.max(children, 1);
    pax = adults + children;
  } else {
    pax = adults + children;
  }

  return { pax: Math.max(1, pax), adults: Math.max(1, adults), children: Math.max(0, children) };
}

function extractNationalities(raw: string): string[] {
  const found: string[] = [];
  for (const { re, label } of NATIONALITY_MAP) {
    if (re.test(raw) && !found.includes(label)) found.push(label);
  }
  return found.length ? found : ["International"];
}

function extractEntryPoint(raw: string): string {
  if (/\b(bagdogra|ixb)\b/i.test(raw)) return "Bagdogra";
  if (/\b(hasimara|hmi)\b/i.test(raw)) return "Hasimara";
  if (/\b(phuentsholing|pling|p\/l|land\s*border)\b/i.test(raw)) return "Phuentsholing";
  if (/\b(paro|fly\s*in|flight\s*in|pbh)\b/i.test(raw)) return "Paro";
  return "Paro";
}

function extractBudget(raw: string): BriefIntent["budget_tier"] {
  if (/\b(5\s*[-]?\s*star|luxury|aman|no\s*limit|premium)\b/i.test(raw)) return "luxury";
  if (/\b(4\s*[-]?\s*star|comfort|boutique)\b/i.test(raw)) return "comfort";
  if (/\b(mid(?:[- ]?range)?|3\s*[-]?\s*star|standard)\b/i.test(raw)) return "mid";
  if (/\b(budget|economy|2\s*[-]?\s*star)\b/i.test(raw)) return "economy";
  return "unknown";
}

function extractLanguage(raw: string): BriefIntent["language"] {
  if (/[\u4e00-\u9fff]/.test(raw) || /\b(chinese|中文|普通话)\b/i.test(raw)) return "zh";
  return "en";
}

function extractTravelDates(raw: string): string | undefined {
  const m = raw.match(MONTH_OR_DATE);
  return m?.[0]?.trim() || undefined;
}

function extractClientName(raw: string): string | undefined {
  const patterns = [
    /(?:prepared\s+for|client|guest|travell?er|mr\.?|mrs\.?|ms\.?)\s*[:\-]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})/,
    /(?:dear|hi|hello)\s+([A-Z][a-zA-Z]+)/i,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m?.[1] && m[1].length > 1 && m[1].length < 40) return m[1].trim();
  }
  return undefined;
}

function extractCurrency(raw: string): DisplayCurrency {
  if (/\b(inr|₹|rupees?)\b/i.test(raw)) return "INR";
  if (/\b(btn|nu\.?|ngultrum)\b/i.test(raw)) return "BTN";
  if (/\b(usd|\$|dollars?)\b/i.test(raw)) return "USD";
  if (/\b(indian)\b/i.test(raw)) return "INR";
  return "USD";
}

function extractDaysSeed(raw: string): number {
  const lengthMatches = [
    ...raw.matchAll(/(?<![\/\d])(\d{1,2})\s*[-–]?\s*(days?|nights?)\b(?!\s*\d)/gi),
  ];
  if (lengthMatches.length) {
    const last = lengthMatches[lengthMatches.length - 1]!;
    const n = parseInt(last[1]!, 10);
    if (!Number.isNaN(n) && n > 0 && n <= 21) {
      return last[2]!.toLowerCase().startsWith("night") ? n + 1 : n;
    }
  }
  return 7;
}

/**
 * Deterministic brief parse — no Gemini/Cursor.
 * Uses regex extraction then enrichBriefIntent for stay plan / currency / stars.
 */
export function parseBriefLocal(rawBrief: string): BriefIntent {
  const raw = rawBrief.trim();
  const { pax, adults, children } = extractPax(raw);
  const nationalities = extractNationalities(raw);
  const entry_point = extractEntryPoint(raw);
  const budget_tier = extractBudget(raw);
  const language = extractLanguage(raw);
  const travel_dates = extractTravelDates(raw);
  const client_name = extractClientName(raw);
  const currency = extractCurrency(raw);
  const days = extractDaysSeed(raw);

  return enrichBriefIntent(raw, {
    pax,
    adults,
    children,
    days,
    nationalities,
    entry_point,
    budget_tier,
    language,
    currency,
    travel_dates,
    client_name,
  });
}
