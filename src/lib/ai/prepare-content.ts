import type { ItineraryContent, ItineraryLanguage } from "@/lib/types";
import { completeItineraryContent } from "./complete-content";
import { sanitizeItineraryContent } from "./sanitize-content";
import type { BuildStubContentOpts } from "@/lib/generate/stub";

export function normalizeItineraryContent(raw: unknown): ItineraryContent {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return normalizeItineraryContent(parsed);
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as ItineraryContent;
  return {};
}

/** Always return a full guest-PDF-ready content object. */
export function prepareItineraryContentForRender(
  raw: unknown,
  opts: BuildStubContentOpts,
): ItineraryContent {
  const partial = normalizeItineraryContent(raw);
  return sanitizeItineraryContent(
    completeItineraryContent(partial, opts),
    opts.language,
  );
}

export type PrepareContentInput = BuildStubContentOpts & { raw: unknown };

export function prepareFromBriefContext(input: PrepareContentInput): ItineraryContent {
  const { raw, ...stubOpts } = input;
  return prepareItineraryContentForRender(raw, stubOpts);
}
