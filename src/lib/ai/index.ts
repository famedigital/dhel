import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { briefIntentSchema, itineraryContentSchema } from "./schemas";
import type { Brand, ItineraryContent, ItineraryLanguage } from "@/lib/types";
import type { BriefIntent, PackageOption } from "@/lib/catalog";
import { enrichBriefIntent } from "@/lib/catalog/brief-enrichment";
import { buildStubContent, buildStubClientReply, type BuildStubContentOpts } from "@/lib/generate/stub";
import { completeItineraryContent } from "./complete-content";
import { aiProviderLabel, type AiProvider, resolveAiProvider } from "./config";
import { cursorGenerateObject, cursorGenerateText } from "./cursor-client";
import { resolveCursorKey } from "./credentials";
import { resolveGeminiModel } from "./model";
import { sanitizeItineraryContent } from "./sanitize-content";
import { findBestHtmlReference } from "@/lib/reference/load-corpus";
import { referencePromptBlock } from "@/lib/reference/apply-reference";

export type AiContentSource = "gemini" | "cursor" | "stub";

function getGeminiModel(apiKey: string) {
  const google = createGoogleGenerativeAI({ apiKey });
  return google(resolveGeminiModel(process.env.GEMINI_MODEL));
}

type ProviderAttempt = { provider: AiProvider; apiKey: string };

/** Primary provider first, then the other if a key exists. */
function providerAttempts(
  primary: AiProvider,
  geminiKey: string | null | undefined,
  cursorKey: string | null | undefined,
  explicitKey?: string | null,
): ProviderAttempt[] {
  const attempts: ProviderAttempt[] = [];
  const push = (provider: AiProvider, apiKey: string | null | undefined) => {
    if (!apiKey?.trim()) return;
    if (attempts.some((a) => a.provider === provider)) return;
    attempts.push({ provider, apiKey: apiKey.trim() });
  };

  if (primary === "cursor") {
    push("cursor", explicitKey ?? cursorKey);
    push("gemini", geminiKey);
  } else {
    push("gemini", explicitKey ?? geminiKey);
    push("cursor", cursorKey);
  }
  return attempts;
}

function briefParsePrompt(rawBrief: string) {
  return `Parse this Bhutan travel enquiry into structured intent.

RULES — do NOT invent missing facts:
- If pax/adults not stated, use pax=2, adults=2 but nationalities should be ["International"] only when truly unknown.
- If days not stated and no night route (e.g. "2n pling"), use days=7.
- If entry point not stated, use entry_point="Paro".
- If budget not stated, use budget_tier="unknown" (not "mid").
- If travel dates/month not mentioned, leave travel_dates empty.
- If client name appears, extract it; otherwise omit client_name.

When explicit in brief:
- Infer pax, days, nationalities, entry point (Paro/Hasimara/Bagdogra/Phuentsholing), budget tier, language (en or zh if Chinese), travel dates.
- Currency: INR if INR/rupees/₹/Indian market; USD if dollars explicit; Indian nationals → ["Indian"] and usually INR.
- Meal plan (MAP, BB, CP, EP) and star rating (2–5 star) when mentioned.
- If "3 star hotel", set hotel_star_rating=3 — do NOT suggest luxury.
- If nights per town listed (e.g. "2n pling, 2n tphu, 2n paro"), set days = total nights + 1.

Brief:
"""
${rawBrief}
"""`;
}

function narrativePrompt(opts: {
  brief: string;
  clientName?: string | null;
  days: number;
  language: ItineraryLanguage;
  brand?: Brand | null;
  packageOption?: PackageOption;
  stayPlan?: BriefIntent["stay_plan"];
  entryPoint?: string;
  defaultVehicleType?: string;
}) {
  const brandName = opts.brand?.display_name || "the agency";
  const voice = opts.brand?.voice || "warm, professional, luxurious but grounded";
  const langInstruction =
    opts.language === "zh"
      ? "Write ALL user-facing strings in Simplified Chinese (zh-CN)."
      : "Write ALL user-facing strings in polished British/International English.";

  const pricingBlock = opts.packageOption
    ? `Use EXACT pricing: currency ${opts.packageOption.currency}, total ${opts.packageOption.sell_total}, per_person ${opts.packageOption.sell_per_person}, pax from brief. Do NOT invent other totals.`
    : "Pricing is indicative land package in USD.";

  const ref = findBestHtmlReference({
    days: opts.days,
    language: opts.language,
    brief: opts.brief,
    stayPlan: opts.stayPlan,
    entryPoint: opts.entryPoint,
  });
  const referenceBlock = ref ? `\n\n${referencePromptBlock(ref)}` : "";

  return `You are a senior Bhutan destination travel designer for ${brandName}.
Brand voice: ${voice}
${langInstruction}

Return a COMPLETE itinerary JSON with ALL sections populated:
- cover fields (eyebrow, trip_title, prepared_for, group, travel_dates, gateway, departing_from)
- letter with greeting and 3 paragraphs
- pricing block with inclusions/exclusions
- flights summary with inbound/outbound legs
- days array with EXACTLY ${opts.days} entries (day 1..${opts.days}), each with title, route, description, activities[], overnight, meals
- closing notes

${pricingBlock}
Include Tiger's Nest (Paro) on a suitable day if days >= 5.
HOTELS (code-prepared only):
- Do NOT invent hotel names, room numbers, guide names, driver names, or image URLs.
- Overnight must be exactly "${opts.packageOption?.hotel.hotel_name ?? "TBD overnight — assign in Ops"}" (or per-city from package stays when multi-city).
- If no package hotel was provided, use "TBD overnight — assign in Ops" for every overnight.
- Photos are attached by the app from Cloudinary — never invent image URLs or filenames.

CRITICAL — vehicle and guide fields:
- vehicle MUST be exactly "${opts.defaultVehicleType?.trim() || (opts.language === "zh" ? "运营团队安排" : "Assigned in Ops")}" (max 80 characters, no IDs, no repetition).
- guide MUST be exactly "${opts.language === "zh" ? "运营团队安排" : "Assigned in Ops"}" (max 40 characters, no IDs, no repetition).
- Never invent system IDs, flow codes, or long repeated text in any field.
- Keep each day description under 400 words; activity names under 80 characters.
Client: ${opts.clientName || "the guests"}
Brief:
"""
${opts.brief}
"""${referenceBlock}`;
}

type NarrativeContext = {
  brief: string;
  clientName?: string | null;
  days: number;
  language: ItineraryLanguage;
  brand?: Brand | null;
  packageOption?: PackageOption;
  stayPlan?: BriefIntent["stay_plan"];
  pax?: number;
  adults?: number;
  children?: number;
  entryPoint?: string;
  travelDates?: string;
  defaultVehicleType?: string;
  vehicleRates?: import("@/lib/agency/rate-defaults").VehicleRateCategory[];
};

function stubOptsFromContext(opts: NarrativeContext): BuildStubContentOpts {
  return {
    brief: opts.brief,
    clientName: opts.clientName,
    days: opts.days,
    language: opts.language,
    brand: opts.brand,
    packageOption: opts.packageOption,
    stayPlan: opts.stayPlan,
    pax: opts.pax,
    adults: opts.adults,
    children: opts.children,
    entryPoint: opts.entryPoint,
    travelDates: opts.travelDates,
    defaultVehicleType: opts.defaultVehicleType,
    vehicleRates: opts.vehicleRates,
  };
}

function finalizeNarrativeContent(
  partial: ItineraryContent,
  opts: NarrativeContext,
): ItineraryContent {
  return sanitizeItineraryContent(
    completeItineraryContent(partial, stubOptsFromContext(opts)),
    opts.language,
  );
}

function clientReplyPrompt(opts: {
  brief: string;
  language: ItineraryLanguage;
  sellPerPerson: number;
  currency: string;
  days: number;
  brandName: string;
}) {
  const lang = opts.language === "zh" ? "Simplified Chinese" : "English";
  return `Write a short WhatsApp-ready reply (${lang}) for a Bhutan travel agent (${opts.brandName}).
Mention ${opts.days}-day trip, from ${opts.currency} ${opts.sellPerPerson} per person (land only, indicative).
Warm, professional, no ops breakdown. Under 120 words.

Client brief:
${opts.brief}`;
}

export async function parseBrief(
  apiKey: string,
  rawBrief: string,
  provider: AiProvider = resolveAiProvider(),
): Promise<BriefIntent> {
  if (provider === "cursor") {
    const object = await cursorGenerateObject(apiKey, briefParsePrompt(rawBrief), briefIntentSchema);
    return enrichBriefIntent(rawBrief, object);
  }

  const { object } = await generateObject({
    model: getGeminiModel(apiKey),
    schema: briefIntentSchema,
    prompt: briefParsePrompt(rawBrief),
  });
  return enrichBriefIntent(rawBrief, object);
}

export async function parseBriefSafe(opts: {
  rawBrief: string;
  provider?: AiProvider;
  geminiKey?: string | null;
  cursorKey?: string | null;
  apiKey?: string | null;
  /** Default false — local regex parse only. Set true to use Gemini/Cursor parse. */
  useAiParse?: boolean;
}): Promise<{ intent: BriefIntent; source: AiContentSource; warning?: string }> {
  const { parseBriefLocal } = await import("@/lib/catalog/parse-brief-local");

  if (!opts.useAiParse) {
    return {
      intent: parseBriefLocal(opts.rawBrief),
      source: "stub",
    };
  }

  const primary = opts.provider ?? resolveAiProvider();
  const attempts = providerAttempts(
    primary,
    opts.geminiKey,
    opts.cursorKey ?? resolveCursorKey(),
    opts.apiKey,
  );

  if (!attempts.length) {
    return {
      intent: parseBriefLocal(opts.rawBrief),
      source: "stub",
      warning: "No AI API key configured — used local brief parse.",
    };
  }

  let lastError: string | undefined;
  for (const { provider, apiKey } of attempts) {
    try {
      const intent = await parseBrief(apiKey, opts.rawBrief, provider);
      const warning =
        provider !== primary
          ? `${aiProviderLabel(primary)} unavailable; used ${aiProviderLabel(provider)} for brief parsing.`
          : undefined;
      return { intent, source: provider, warning };
    } catch (err) {
      lastError = err instanceof Error ? err.message : `${aiProviderLabel(provider)} failed`;
    }
  }

  return {
    intent: parseBriefLocal(opts.rawBrief),
    source: "stub",
    warning: lastError
      ? `${aiProviderLabel(primary)} error (${lastError}). Used local brief parse.`
      : undefined,
  };
}

export async function generateNarrative(opts: NarrativeContext & {
  apiKey: string;
  provider?: AiProvider;
}): Promise<{ content: ItineraryContent; source: "gemini" | "cursor" }> {
  const provider = opts.provider ?? resolveAiProvider();

  if (provider === "cursor") {
    const object = await cursorGenerateObject(
      opts.apiKey,
      narrativePrompt(opts),
      itineraryContentSchema,
    );
    return {
      content: finalizeNarrativeContent(object as ItineraryContent, opts),
      source: "cursor",
    };
  }

  const { object } = await generateObject({
    model: getGeminiModel(opts.apiKey),
    schema: itineraryContentSchema,
    prompt: narrativePrompt(opts),
    maxOutputTokens: 8192,
  });

  return {
    content: finalizeNarrativeContent(object as ItineraryContent, opts),
    source: "gemini",
  };
}

export async function generateClientReply(opts: {
  apiKey: string;
  provider?: AiProvider;
  brief: string;
  language: ItineraryLanguage;
  sellPerPerson: number;
  currency: string;
  days: number;
  brandName: string;
}): Promise<string> {
  const provider = opts.provider ?? resolveAiProvider();

  if (provider === "cursor") {
    return cursorGenerateText(opts.apiKey, clientReplyPrompt(opts));
  }

  const { text } = await generateText({
    model: getGeminiModel(opts.apiKey),
    prompt: clientReplyPrompt(opts),
  });
  return text.trim();
}

export async function generateClientReplySafe(opts: {
  apiKey: string | null;
  provider?: AiProvider;
  geminiKey?: string | null;
  cursorKey?: string | null;
  brief: string;
  language: ItineraryLanguage;
  sellPerPerson: number;
  currency: string;
  days: number;
  brandName: string;
}): Promise<{ text: string; source: AiContentSource; warning?: string }> {
  const primary = opts.provider ?? resolveAiProvider();
  const attempts = providerAttempts(
    primary,
    opts.geminiKey ?? (primary === "gemini" ? opts.apiKey : null),
    opts.cursorKey ?? resolveCursorKey(),
    opts.apiKey,
  );

  if (!attempts.length) {
    return {
      text: buildStubClientReply(opts),
      source: "stub",
    };
  }

  let lastError: string | undefined;
  for (const { provider, apiKey } of attempts) {
    try {
      const text = await generateClientReply({ ...opts, apiKey, provider });
      const warning =
        provider !== primary
          ? `${aiProviderLabel(primary)} unavailable; used ${aiProviderLabel(provider)} for client reply.`
          : undefined;
      return { text, source: provider, warning };
    } catch (err) {
      lastError = err instanceof Error ? err.message : `${aiProviderLabel(provider)} failed`;
    }
  }

  return {
    text: buildStubClientReply(opts),
    source: "stub",
    warning: lastError ? `${aiProviderLabel(primary)} error (${lastError}). Fell back to stub reply.` : undefined,
  };
}

export async function generateItineraryContent(opts: NarrativeContext & {
  apiKey: string | null;
  provider?: AiProvider;
  geminiKey?: string | null;
  cursorKey?: string | null;
}): Promise<{ content: ItineraryContent; source: AiContentSource; warning?: string }> {
  const stubOpts = stubOptsFromContext(opts);
  const primary = opts.provider ?? resolveAiProvider();
  const attempts = providerAttempts(
    primary,
    opts.geminiKey ?? (primary === "gemini" ? opts.apiKey : null),
    opts.cursorKey ?? resolveCursorKey(),
    opts.apiKey,
  );

  if (!attempts.length) {
    return {
      content: sanitizeItineraryContent(buildStubContent(stubOpts), opts.language),
      source: "stub",
      warning: `No ${aiProviderLabel(primary)} API key. Set ${primary === "cursor" ? "CURSOR_API_KEY" : "GEMINI_API_KEY"} (AIza… from Google AI Studio) or add CURSOR_API_KEY as fallback.`,
    };
  }

  const errors: string[] = [];
  for (const { provider, apiKey } of attempts) {
    try {
      const result = await generateNarrative({ ...opts, apiKey, provider });
      const warning =
        provider !== primary
          ? `${aiProviderLabel(primary)} unavailable; used ${aiProviderLabel(provider)} for draft.`
          : undefined;
      return { ...result, warning };
    } catch (err) {
      const message = err instanceof Error ? err.message : `${aiProviderLabel(provider)} failed`;
      errors.push(`${aiProviderLabel(provider)}: ${message}`);
    }
  }

  const primaryError = errors[0] ?? `${aiProviderLabel(primary)} failed`;
  const fallbackHint =
    attempts.length < 2 && !resolveCursorKey()
      ? " Add CURSOR_API_KEY or a valid GEMINI_API_KEY (starts with AIza) from https://aistudio.google.com/apikey"
      : "";

  return {
    content: sanitizeItineraryContent(buildStubContent(stubOpts), opts.language),
    source: "stub",
    warning: `${primaryError}. Fell back to stub draft.${fallbackHint}`,
  };
}

export { resolveAiCredentials, resolveAgencyGeminiKey, resolveCursorKey } from "./credentials";
export { resolveAiProvider, aiProviderLabel, resolveCursorModel } from "./config";
export { generateItineraryContent as generateWithAiSdk };
