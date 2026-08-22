import type { ItineraryContent, ItineraryLanguage } from "@/lib/types";
import type { BuildStubContentOpts } from "@/lib/generate/stub";
import type { ParsedHtmlItinerary } from "./types";

/** Adapt a reference itinerary to the current brief (day count, client, pricing from package). */
export function adaptReferenceContent(
  ref: ParsedHtmlItinerary,
  opts: BuildStubContentOpts,
  packagePricing?: ItineraryContent["pricing"],
): ItineraryContent {
  const client = opts.clientName || (opts.language === "zh" ? "尊贵宾客" : "Traveller");
  const refDays = ref.content.days ?? [];
  const targetDays = Math.max(3, Math.min(opts.days || 7, 14));

  const scaledDays = scaleDays(refDays, targetDays, opts.language);

  const greeting =
    opts.language === "zh"
      ? `尊敬的 ${client}，`
      : `Dear ${client.split(" ")[0] || client},`;

  return {
    ...ref.content,
    eyebrow:
      ref.content.eyebrow ??
      (opts.stayPlan?.length
        ? `${targetDays}-Day Bhutan · ${opts.stayPlan.map((s) => s.city).join(" → ")}`
        : ref.content.eyebrow),
    trip_title: ref.content.trip_title,
    prepared_for: opts.language === "zh" ? `专为 ${client} 准备` : `Prepared for ${client}`,
    departing_from: opts.entryPoint?.trim() || ref.content.departing_from,
    group: ref.content.group,
    travel_dates: opts.travelDates?.trim() || ref.content.travel_dates,
    vehicle: opts.defaultVehicleType?.trim() || ref.content.vehicle_type || ref.content.vehicle,
    vehicle_type: opts.defaultVehicleType?.trim() || ref.content.vehicle_type || ref.content.vehicle,
    guide: ref.content.guide ?? (opts.language === "zh" ? "运营团队安排" : "Assigned in Ops"),
    letter: {
      ...ref.content.letter,
      greeting,
      paragraphs: ref.content.letter?.paragraphs?.length
        ? ref.content.letter.paragraphs
        : undefined,
    },
    pricing: packagePricing ?? ref.content.pricing,
    days: scaledDays,
  };
}

function scaleDays(
  refDays: NonNullable<ItineraryContent["days"]>,
  targetDays: number,
  language: ItineraryLanguage,
): NonNullable<ItineraryContent["days"]> {
  if (!refDays.length) return refDays;
  if (refDays.length === targetDays) return refDays.map((d, i) => ({ ...d, day: i + 1 }));

  if (refDays.length > targetDays) {
    return refDays.slice(0, targetDays).map((d, i) => ({ ...d, day: i + 1 }));
  }

  const result = refDays.map((d) => ({ ...d }));
  while (result.length < targetDays) {
    const last = refDays[refDays.length - 1]!;
    const n = result.length + 1;
    result.push({
      ...last,
      day: n,
      title: language === "zh" ? `第 ${n} 天 · 行程` : `Day ${n} · Continue`,
      route: last.route,
      description: last.description,
    });
  }
  return result;
}

export function referencePromptBlock(ref: ParsedHtmlItinerary): string {
  return `SILVERPINE REFERENCE ITINERARY (${ref.sourceFile}, ${ref.days} days, route: ${ref.cities.join(" → ") || ref.routeText.slice(0, 120)}):

Match this voice, structure, and detail level. Sample excerpt:
"""
${ref.promptExcerpt.slice(0, 2500)}
"""

Use the same professional tone. Include specific activities, routes, and hotel bands like the reference — adapted to the client's brief.`;
}
