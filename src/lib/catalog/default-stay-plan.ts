import type { BriefIntent } from "./types";
import type { StaySegment } from "./stay-plan";

/**
 * Infer a sensible nights-per-city route when the brief has no stay_plan.
 * Ensures per-city hotel pick always has cities to fill.
 */
export function defaultStayPlan(intent: Pick<BriefIntent, "days" | "entry_point">): StaySegment[] {
  const nights = Math.max((intent.days || 7) - 1, 1);
  const entry = (intent.entry_point || "Paro").toLowerCase();
  const land =
    /bagdogra|hasimara|phuentsholing|pling|ixb|land/.test(entry);

  if (nights <= 2) {
    return [{ city: "Paro", nights }];
  }
  if (nights === 3) {
    return [
      { city: "Thimphu", nights: 1 },
      { city: "Paro", nights: 2 },
    ];
  }
  if (nights === 4) {
    return [
      { city: "Thimphu", nights: 1 },
      { city: "Punakha", nights: 1 },
      { city: "Paro", nights: 2 },
    ];
  }
  if (nights === 5) {
    if (land) {
      return [
        { city: "Phuentsholing", nights: 1 },
        { city: "Thimphu", nights: 1 },
        { city: "Punakha", nights: 1 },
        { city: "Paro", nights: 2 },
      ];
    }
    return [
      { city: "Thimphu", nights: 2 },
      { city: "Punakha", nights: 1 },
      { city: "Paro", nights: 2 },
    ];
  }

  // 6+ nights
  const paro = 2;
  const punakha = Math.min(2, Math.max(1, Math.floor((nights - paro) / 3)));
  let thimphu = nights - paro - punakha;
  const segments: StaySegment[] = [];

  if (land && nights >= 6) {
    const pling = 1;
    thimphu = Math.max(1, thimphu - pling);
    segments.push({ city: "Phuentsholing", nights: pling });
  }

  if (thimphu > 0) segments.push({ city: "Thimphu", nights: thimphu });
  if (punakha > 0) segments.push({ city: "Punakha", nights: punakha });
  segments.push({ city: "Paro", nights: paro });
  return segments;
}

export function ensureStayPlan(intent: BriefIntent): BriefIntent {
  if (intent.stay_plan?.length) return intent;
  return { ...intent, stay_plan: defaultStayPlan(intent) };
}
