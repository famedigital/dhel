import type { GenerationMeta } from "@/lib/types";
import type { PackageOption } from "@/lib/catalog";
import { findBestHtmlReference } from "@/lib/reference/load-corpus";

export function buildGenerationMeta(opts: {
  messages?: Array<{ role: string; content: string }>;
  rawBrief: string;
  narrativePrompt?: string;
  aiProvider?: string;
  packageOption?: PackageOption;
  compare?: unknown[];
  clientReply?: string;
  warnings?: string[];
  clarificationsAsked?: string[];
}): GenerationMeta {
  const ref = findBestHtmlReference({
    days: opts.packageOption?.hotel.nights ? opts.packageOption.hotel.nights + 1 : 7,
    language: "en",
    brief: opts.rawBrief,
  });

  return {
    messages: opts.messages,
    final_brief: opts.rawBrief,
    clarifications_asked: opts.clarificationsAsked,
    narrative_prompt: opts.narrativePrompt,
    reference_file: ref?.sourceFile,
    ai_provider: opts.aiProvider,
    package_option: opts.packageOption as unknown as Record<string, unknown>,
    compare_table: opts.compare,
    client_reply: opts.clientReply,
    warnings: opts.warnings,
    generated_at: new Date().toISOString(),
  };
}
