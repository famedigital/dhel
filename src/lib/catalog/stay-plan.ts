/** Canonical Bhutan stopovers for FIT routing. */
const CITY_ALIASES: Record<string, string> = {
  pling: "Phuentsholing",
  phuentsholing: "Phuentsholing",
  "p/l": "Phuentsholing",
  pl: "Phuentsholing",
  tphu: "Thimphu",
  thimphu: "Thimphu",
  paro: "Paro",
  punakha: "Punakha",
  wangdue: "Wangdue Phodrang",
  "wangdue phodrang": "Wangdue Phodrang",
  gangtey: "Wangdue Phodrang",
  phobjikha: "Wangdue Phodrang",
  "phobjikha valley": "Wangdue Phodrang",
  bumthang: "Bumthang",
  trg: "Trongsa",
  trongsa: "Trongsa",
  pemagatshel: "Pemagatshel",
};

const ROUTE_CITIES = [
  "Phuentsholing",
  "Thimphu",
  "Punakha",
  "Paro",
  "Wangdue Phodrang",
  "Bumthang",
  "Trongsa",
  "Pemagatshel",
] as const;

export interface StaySegment {
  city: string;
  nights: number;
}

export function resolveCityName(raw: string): string | null {
  const key = raw.toLowerCase().trim().replace(/\s+/g, " ");
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (key === alias || key.startsWith(alias + " ")) return city;
  }
  const titled = key.replace(/\b\w/g, (c) => c.toUpperCase());
  if (Object.values(CITY_ALIASES).some((c) => c.toLowerCase() === key)) {
    return Object.values(CITY_ALIASES).find((c) => c.toLowerCase() === key)!;
  }
  return titled.length >= 3 ? titled : null;
}

/** Match catalog hotel city to a canonical stay city (handles spelling variants). */
export function cityMatches(hotelCity: string, stayCity: string): boolean {
  const h = hotelCity.toLowerCase().trim();
  const s = stayCity.toLowerCase().trim();
  if (h === s || h.includes(s) || s.includes(h)) return true;
  if (s.startsWith("wangdu") && (h.includes("wangdue") || h.includes("gangtey") || h.includes("phobjikha"))) {
    return true;
  }
  if ((s.includes("gangtey") || s.includes("phobjikha")) && (h.includes("wangdue") || h.includes("gangtey"))) {
    return true;
  }
  if (s.includes("trongsa") && h.includes("trongsa")) return true;
  return false;
}

function findRouteCityInText(text: string): string | null {
  const lower = text.toLowerCase();
  // Prefer the last "to <city>" destination on transfer days.
  const toMatches = [...lower.matchAll(/\bto\s+([a-z][a-z\s]{2,24})/gi)];
  for (let i = toMatches.length - 1; i >= 0; i--) {
    const raw = toMatches[i]![1]!.trim().replace(/[,.;].*$/, "");
    // Skip non-cities like "Kathmandu" for overnight Bhutan stays
    if (/kathmandu|airport|market|pass|dzong|monastery|nest/i.test(raw)) continue;
    const city = resolveCityName(raw);
    if (city && ROUTE_CITIES.some((c) => c.toLowerCase() === city.toLowerCase())) {
      return city;
    }
  }
  for (const city of ROUTE_CITIES) {
    if (new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "i").test(text)) {
      return city;
    }
  }
  return null;
}

function isDepartureDay(text: string): boolean {
  return /\b(morning\s+flight|flight\s+to\s+kathmandu|depart|departure|drop\s+to\s+airport|fly\s+out)\b/i.test(
    text,
  );
}

/**
 * Infer overnight cities from day-by-day paste:
 * "Day 7: … Paro to Thimphu" → night in Thimphu, etc.
 * Days without a new town (e.g. Tiger's Nest) keep the previous overnight city.
 */
export function inferStayPlanFromDayItinerary(raw: string): StaySegment[] | undefined {
  const blocks = raw
    .split(
      /(?=\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s*[–—-]\s*(?:Day\s*\d+\b)?|\bDay\s*\d+\s*[:.–—-])/i,
    )
    .map((b) => b.trim())
    .filter((b) => b.length > 8);

  const dayBlocks = blocks.filter(
    (b) => /\bday\s*\d+\b/i.test(b) || isDepartureDay(b) || /^\d{1,2}\/\d{1,2}/.test(b),
  );

  if (dayBlocks.length < 2) return undefined;

  const nights: string[] = [];
  let lastCity: string | null = null;
  for (let i = 0; i < dayBlocks.length; i++) {
    const block = dayBlocks[i]!;
    if (isDepartureDay(block)) continue;
    const resolved: string | null = findRouteCityInText(block) ?? lastCity;
    if (!resolved) continue;
    lastCity = resolved;
    nights.push(resolved);
  }

  if (nights.length < 1) return undefined;

  const segments: StaySegment[] = [];
  for (const city of nights) {
    const last = segments[segments.length - 1];
    if (last && last.city === city) last.nights += 1;
    else segments.push({ city, nights: 1 });
  }

  return segments.length ? segments : undefined;
}

/** Parse "2n pling, 2n tphu, 2n paro" and similar from raw brief text. */
export function parseStayPlan(raw: string): StaySegment[] | undefined {
  const segments: StaySegment[] = [];
  const re = /(\d+)\s*n(?:ights?)?\s*([a-z/]+(?:\s+[a-z]+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const nights = parseInt(match[1]!, 10);
    const cityRaw = match[2]!.replace(/[,;]+$/g, "").trim();
    const city = resolveCityName(cityRaw);
    if (city && nights > 0) {
      segments.push({ city, nights });
    }
  }
  if (segments.length) return segments;
  return inferStayPlanFromDayItinerary(raw);
}

export function formatStayRoute(segments: StaySegment[]): string {
  return segments.map((s) => `${s.city} (${s.nights}N)`).join(" → ");
}

export function extractMentionedRouteCities(raw: string): string[] {
  const found: string[] = [];
  for (const city of ROUTE_CITIES) {
    if (new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "i").test(raw)) {
      found.push(city);
    }
  }
  return found;
}

export type OvernightStaySlot = StaySegment & {
  /** First narrative day that overnights here */
  dayFrom: number;
  /** Last narrative day that overnights here */
  dayTo: number;
};

/**
 * Build stay slots from narrative days (overnight / route), collapsed by city.
 * E.g. Day1 Paro→Thimphu, Day2 Thimphu, Day3→Punakha → Thimphu 2N, Punakha 1N…
 */
export function staySlotsFromDays(
  days: Array<{
    day?: number;
    route?: string;
    title?: string;
    overnight?: string;
    description?: string;
  }>,
): OvernightStaySlot[] {
  const nights: { day: number; city: string }[] = [];
  let lastCity: string | null = null;

  for (let i = 0; i < days.length; i++) {
    const d = days[i]!;
    const dayNum = d.day ?? i + 1;
    const blob = [d.overnight, d.route, d.title, d.description].filter(Boolean).join(" · ");
    if (isDepartureDay(blob) && !d.overnight?.trim()) continue;

    const fromOvernight =
      d.overnight && !/tbd|assign in ops/i.test(d.overnight)
        ? resolveCityName(d.overnight.replace(/·.*$/, "").trim()) ||
          findRouteCityInText(d.overnight)
        : null;
    const fromRoute = findRouteCityInText([d.route, d.title, d.description].filter(Boolean).join(" "));
    const city: string | null = fromOvernight || fromRoute || lastCity;
    if (!city) continue;
    lastCity = city;
    nights.push({ day: dayNum, city });
  }

  if (!nights.length) return [];

  const slots: OvernightStaySlot[] = [];
  for (const n of nights) {
    const last = slots[slots.length - 1];
    if (last && last.city === n.city) {
      last.nights += 1;
      last.dayTo = n.day;
    } else {
      slots.push({
        city: n.city,
        nights: 1,
        dayFrom: n.day,
        dayTo: n.day,
      });
    }
  }
  return slots;
}
