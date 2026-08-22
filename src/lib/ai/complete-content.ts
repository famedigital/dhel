import type { DayContent, ItineraryContent } from "@/lib/types";
import { buildStubContent, type BuildStubContentOpts } from "@/lib/generate/stub";
import { findBestHtmlReference } from "@/lib/reference/load-corpus";
import { adaptReferenceContent } from "@/lib/reference/apply-reference";

function hasMeaningfulDays(days: DayContent[] | undefined, expected: number): boolean {
  if (!days?.length) return false;
  if (days.length < Math.min(expected, 3)) return false;
  const filled = days.filter((d) => d.title?.trim() && d.description?.trim());
  return filled.length >= Math.min(expected, 3);
}

function hasPricing(pricing: ItineraryContent["pricing"]): boolean {
  return Boolean(
    pricing?.currency &&
      (typeof pricing.total === "number" || typeof pricing.per_person === "number"),
  );
}

function mergeLetter(
  partial: ItineraryContent["letter"],
  stub: ItineraryContent["letter"],
): ItineraryContent["letter"] {
  if (!stub && !partial) return undefined;
  const paragraphs =
    partial?.paragraphs?.filter((p) => p.trim()).length && partial?.paragraphs
      ? partial.paragraphs
      : stub?.paragraphs;
  return {
    ...stub,
    ...partial,
    date: partial?.date?.trim() || stub?.date,
    greeting: partial?.greeting?.trim() || stub?.greeting,
    paragraphs,
  };
}

function mergeDays(
  aiDays: DayContent[],
  stubDays: DayContent[],
  expectedDays: number,
): DayContent[] {
  const result: DayContent[] = [];
  for (let i = 0; i < expectedDays; i++) {
    const stub = stubDays[i];
    if (!stub) break;
    const ai = aiDays.find((d) => d.day === i + 1) ?? aiDays[i];
    if (ai?.title?.trim() && ai.description?.trim()) {
      result.push({
        ...stub,
        ...ai,
        day: i + 1,
        route: ai.route?.trim() || stub.route,
        activities: ai.activities?.length ? ai.activities : stub.activities,
        overnight: ai.overnight?.trim() || stub.overnight,
        meals: ai.meals?.trim() || stub.meals,
      });
    } else {
      result.push(stub);
    }
  }
  return result.length >= Math.min(expectedDays, stubDays.length) ? result : stubDays;
}

/** Fill gaps when the model returns only cover fields (title, guide, vehicle). */
export function completeItineraryContent(
  partial: ItineraryContent,
  stubOpts: BuildStubContentOpts,
): ItineraryContent {
  const stubOnly = buildStubContent(stubOpts);
  const ref = findBestHtmlReference({
    days: stubOpts.days,
    language: stubOpts.language,
    brief: stubOpts.brief,
    stayPlan: stubOpts.stayPlan,
    entryPoint: stubOpts.entryPoint,
  });
  const stub = ref ? adaptReferenceContent(ref, stubOpts, stubOnly.pricing) : stubOnly;
  const expectedDays = stubOpts.days;

  return {
    eyebrow: partial.eyebrow?.trim() || stub.eyebrow,
    trip_title: partial.trip_title?.trim() || stub.trip_title,
    prepared_for: partial.prepared_for?.trim() || stub.prepared_for,
    departing_from: partial.departing_from?.trim() || stub.departing_from,
    gateway: partial.gateway?.trim() || stub.gateway,
    group: partial.group?.trim() || stub.group,
    travel_dates: partial.travel_dates?.trim() || stub.travel_dates,
    vehicle: partial.vehicle?.trim() || stub.vehicle,
    guide: partial.guide?.trim() || stub.guide,
    vehicle_type: partial.vehicle_type?.trim() || stub.vehicle_type || partial.vehicle?.trim() || stub.vehicle,
    letter: mergeLetter(partial.letter, stub.letter),
    pricing: hasPricing(partial.pricing)
      ? {
          currency: partial.pricing?.currency ?? stub.pricing?.currency ?? "USD",
          ...stub.pricing,
          ...partial.pricing,
          inclusions: partial.pricing?.inclusions?.length
            ? partial.pricing.inclusions
            : stub.pricing?.inclusions,
        }
      : stub.pricing,
    flights:
      partial.flights?.legs?.length && partial.flights.legs.some((l) => l.from || l.to)
        ? {
            ...stub.flights,
            ...partial.flights,
            legs: partial.flights.legs,
            booking_notes: partial.flights.booking_notes?.length
              ? partial.flights.booking_notes
              : stub.flights?.booking_notes,
          }
        : stub.flights,
    days: hasMeaningfulDays(partial.days, expectedDays)
      ? mergeDays(partial.days!, stub.days ?? [], expectedDays)
      : stub.days,
    closing: {
      ...stub.closing,
      ...partial.closing,
      includes_fit: partial.closing?.includes_fit?.length
        ? partial.closing.includes_fit
        : stub.closing?.includes_fit,
      notes: partial.closing?.notes?.length ? partial.closing.notes : stub.closing?.notes,
    },
  };
}
