export type AiProvider = "gemini" | "cursor";

export function resolveAiProvider(): AiProvider {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "cursor") return "cursor";
  return "gemini";
}

export function resolvePlatformAiKey(provider: AiProvider = resolveAiProvider()): string | null {
  if (provider === "cursor") {
    return process.env.CURSOR_API_KEY?.trim() || null;
  }
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export function resolveCursorModel(): string {
  return process.env.CURSOR_MODEL?.trim() || "composer-2";
}

export function aiProviderLabel(provider: AiProvider): string {
  return provider === "cursor" ? "Cursor" : "Gemini";
}

/** Google AI Studio keys: AIza… (classic) or AQ.… (newer). */
export function looksLikeGeminiApiKey(key: string | null | undefined): boolean {
  const trimmed = key?.trim();
  return Boolean(trimmed && (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.")));
}
