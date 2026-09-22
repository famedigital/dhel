import type { Brand, ItineraryLanguage } from "@/lib/types";
import type { BriefIntent, PackageOption } from "@/lib/catalog";
import {
  buildStubClientReply,
  buildStubContent,
} from "@/lib/generate/stub";

/**
 * Deterministic guest itinerary from locked intent + package.
 * No LLM — Tracy-class polish is optional via AI later.
 */
export function buildTemplateItineraryContent(opts: {
  intent: BriefIntent;
  packageOption: PackageOption;
  brand?: Brand | null;
  language?: ItineraryLanguage;
  defaultVehicleType?: string;
}) {
  const language = opts.language ?? opts.intent.language ?? "en";
  const content = buildStubContent({
    brief: opts.intent.raw_brief,
    clientName: opts.intent.client_name,
    days: opts.intent.days,
    language,
    brand: opts.brand,
    packageOption: opts.packageOption,
    stayPlan: opts.intent.stay_plan,
    pax: opts.intent.pax,
    adults: opts.intent.adults,
    children: opts.intent.children,
    entryPoint: opts.intent.entry_point,
    travelDates: opts.intent.travel_dates,
    defaultVehicleType: opts.defaultVehicleType,
  });

  // Mark as template draft in eyebrow when English
  if (language === "en" && content.eyebrow) {
    content.eyebrow = `${content.eyebrow} · Draft`;
  }

  return content;
}

export function buildTemplateClientReply(opts: {
  intent: BriefIntent;
  packageOption: PackageOption;
  brandName: string;
  language?: ItineraryLanguage;
}) {
  const language = opts.language ?? opts.intent.language ?? "en";
  return buildStubClientReply({
    language,
    sellPerPerson: opts.packageOption.sell_per_person,
    currency: opts.packageOption.currency,
    days: opts.intent.days,
    brandName: opts.brandName,
  });
}
