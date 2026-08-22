import { createAdminClient } from "@/lib/supabase/admin";
import { type AiProvider, resolveAiProvider, resolvePlatformAiKey } from "./config";

export async function resolveAgencyGeminiKey(agencyId: string): Promise<string | null> {
  let apiKey: string | null = resolvePlatformAiKey("gemini");
  const admin = createAdminClient();
  if (admin) {
    const { data: secret } = await admin
      .from("agency_secrets")
      .select("gemini_api_key")
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (secret?.gemini_api_key) apiKey = secret.gemini_api_key as string;
  }
  return apiKey;
}

/** Platform Cursor key only for now (agency-level storage can follow). */
export function resolveCursorKey(): string | null {
  return resolvePlatformAiKey("cursor");
}

export async function resolveAiCredentials(agencyId: string | null): Promise<{
  provider: AiProvider;
  apiKey: string | null;
  geminiKey: string | null;
  cursorKey: string | null;
}> {
  const provider = resolveAiProvider();
  const cursorKey = resolveCursorKey();
  const geminiKey = agencyId
    ? await resolveAgencyGeminiKey(agencyId)
    : resolvePlatformAiKey("gemini");

  if (provider === "cursor") {
    return { provider, apiKey: cursorKey, geminiKey, cursorKey };
  }
  return { provider, apiKey: geminiKey, geminiKey, cursorKey };
}
