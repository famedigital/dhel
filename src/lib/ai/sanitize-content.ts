import type { ItineraryContent, ItineraryLanguage } from "@/lib/types";

const OPS_VEHICLE_EN = "Assigned in Ops";
const OPS_GUIDE_EN = "Assigned in Ops";
const OPS_VEHICLE_ZH = "运营团队安排";
const OPS_GUIDE_ZH = "运营团队安排";

function opsVehicle(lang: ItineraryLanguage): string {
  return lang === "zh" ? OPS_VEHICLE_ZH : OPS_VEHICLE_EN;
}

function opsGuide(lang: ItineraryLanguage): string {
  return lang === "zh" ? OPS_GUIDE_ZH : OPS_GUIDE_EN;
}

/** Detect runaway repetition / fake system IDs from model hallucination. */
export function isCorruptedOpsField(value: string | undefined): boolean {
  if (!value) return false;
  if (value.length > 120) return true;
  if (/Flow System ID|Component Group|BHU-VEC-/i.test(value)) return true;
  if (/(\d{8,})\1/.test(value)) return true;
  if (/(.{12,})\1{2,}/.test(value)) return true;
  return false;
}

export function clampText(value: string | undefined, maxLen: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trim()}…`;
}

export function sanitizeItineraryContent(
  raw: ItineraryContent,
  language: ItineraryLanguage = "en",
): ItineraryContent {
  const content: ItineraryContent = { ...raw };

  content.eyebrow = clampText(content.eyebrow, 120);
  content.trip_title = clampText(content.trip_title, 160);
  content.prepared_for = clampText(content.prepared_for, 120);
  content.departing_from = clampText(content.departing_from, 80);
  content.gateway = clampText(content.gateway, 80);
  content.group = clampText(content.group, 80);
  content.travel_dates = clampText(content.travel_dates, 80);

  content.vehicle = isCorruptedOpsField(content.vehicle)
    ? opsVehicle(language)
    : clampText(content.vehicle, 80) ?? opsVehicle(language);
  content.guide = isCorruptedOpsField(content.guide)
    ? opsGuide(language)
    : clampText(content.guide, 80) ?? opsGuide(language);

  if (content.letter) {
    content.letter = {
      ...content.letter,
      date: clampText(content.letter.date, 40),
      greeting: clampText(content.letter.greeting, 120),
      paragraphs: content.letter.paragraphs
        ?.map((p) => clampText(p, 800))
        .filter((p): p is string => Boolean(p))
        .slice(0, 6),
    };
  }

  if (content.pricing) {
    content.pricing = {
      ...content.pricing,
      currency: clampText(content.pricing.currency, 8) ?? content.pricing.currency,
      note: clampText(content.pricing.note, 200),
      exclusions: clampText(content.pricing.exclusions, 400),
      flight_extra_note: clampText(content.pricing.flight_extra_note, 200),
      inclusions: content.pricing.inclusions
        ?.map((i) => clampText(i, 200))
        .filter((i): i is string => Boolean(i))
        .slice(0, 12),
    };
  }

  if (content.flights) {
    content.flights = {
      ...content.flights,
      summary: clampText(content.flights.summary, 200),
      booking_notes: content.flights.booking_notes
        ?.map((n) => clampText(n, 200))
        .filter((n): n is string => Boolean(n))
        .slice(0, 8),
      legs: content.flights.legs?.slice(0, 6).map((leg) => ({
        ...leg,
        date: clampText(leg.date, 40),
        airline: clampText(leg.airline, 60),
        flight_number: clampText(leg.flight_number, 20),
        from: clampText(leg.from, 40),
        to: clampText(leg.to, 40),
        depart: clampText(leg.depart, 20),
        arrive: clampText(leg.arrive, 20),
        notes: clampText(leg.notes, 200),
      })),
    };
  }

  if (content.days) {
    content.days = content.days.slice(0, 21).map((day) => ({
      ...day,
      title: clampText(day.title, 120) ?? `Day ${day.day}`,
      route: clampText(day.route, 160) ?? "",
      description: clampText(day.description, 1200) ?? "",
      overnight: clampText(day.overnight, 120),
      meals: clampText(day.meals, 40),
      image: clampText(day.image, 500),
      activities: (day.activities ?? [])
        .map((a) => clampText(a, 120))
        .filter((a): a is string => Boolean(a))
        .slice(0, 10),
      journal: day.journal
        ?.slice(0, 4)
        .map((j) => ({
          heading: clampText(j.heading, 80) ?? "",
          text: clampText(j.text, 600) ?? "",
        })),
    }));
  }

  if (content.closing) {
    content.closing = {
      includes_fit: content.closing.includes_fit
        ?.map((i) => clampText(i, 200))
        .filter((i): i is string => Boolean(i))
        .slice(0, 10),
      notes: content.closing.notes
        ?.map((n) => clampText(n, 200))
        .filter((n): n is string => Boolean(n))
        .slice(0, 6),
    };
  }

  return content;
}
