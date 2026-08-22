/** Stable default — avoid gemini-flash-latest (often 403 / denied on new projects). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

const BLOCKED_OR_ALIAS_MODELS = new Set([
  "gemini-flash-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
]);

export function resolveGeminiModel(envValue?: string | null): string {
  const raw = envValue?.trim();
  if (!raw || BLOCKED_OR_ALIAS_MODELS.has(raw)) {
    return DEFAULT_GEMINI_MODEL;
  }
  return raw;
}
