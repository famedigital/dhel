import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAiProvider, resolveCursorModel, resolvePlatformAiKey, looksLikeGeminiApiKey } from "@/lib/ai/config";
import { resolveCursorKey } from "@/lib/ai/credentials";
import { resolveGeminiModel } from "@/lib/ai/model";

/**
 * Demo readiness probe for local + Vercel.
 * demoReady = DB OK and at least one generation path (service role for agency keys OR platform AI key).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase env",
        demoReady: false,
        checklist: [
          "Set NEXT_PUBLIC_SUPABASE_URL",
          "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        ],
      },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("trip_presets").select("id").limit(1);

  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const aiProvider = resolveAiProvider();
  const geminiFallbackConfigured = Boolean(resolvePlatformAiKey("gemini"));
  const geminiKeyLooksValid = looksLikeGeminiApiKey(resolvePlatformAiKey("gemini"));
  const cursorConfigured = Boolean(resolveCursorKey());
  const dbOk = !error;
  const generationPath =
    serviceRoleConfigured || geminiFallbackConfigured || cursorConfigured;
  const demoReady = dbOk && generationPath;

  const checklist: string[] = [];
  if (!dbOk) checklist.push("Supabase DB not reachable (check URL/key + trip_presets RLS)");
  if (!serviceRoleConfigured) {
    checklist.push(
      "Optional: set SUPABASE_SERVICE_ROLE_KEY so per-agency Gemini keys can be read",
    );
  }
  if (aiProvider === "gemini" && geminiFallbackConfigured && !geminiKeyLooksValid) {
    checklist.push(
      "GEMINI_API_KEY does not look like a Google AI Studio key (expected AIza…). Create one at https://aistudio.google.com/apikey or set CURSOR_API_KEY + AI_PROVIDER=cursor",
    );
  }
  if (aiProvider === "gemini" && !geminiFallbackConfigured && !cursorConfigured) {
    checklist.push(
      "Optional: set GEMINI_API_KEY as platform fallback (or store key per agency in Settings)",
    );
  }
  if (aiProvider === "cursor" && !cursorConfigured) {
    checklist.push("Set CURSOR_API_KEY from Cursor Dashboard → API Keys");
  }
  if (!generationPath) {
    checklist.push(
      "Generation blocked: need SUPABASE_SERVICE_ROLE_KEY (with agency key) and/or platform AI key",
    );
  }
  if (demoReady) {
    checklist.push("Core demo path available — still complete brand + one ready itinerary in-app");
  }

  return NextResponse.json({
    ok: dbOk,
    demoReady,
    supabaseUrl: url,
    serviceRoleConfigured,
    aiProvider,
    geminiFallbackConfigured,
    geminiKeyLooksValid,
    cursorConfigured,
    geminiModel: resolveGeminiModel(process.env.GEMINI_MODEL),
    cursorModel: resolveCursorModel(),
    db: error ? error.message : "reachable",
    product: {
      name: "Itinerary Studio",
      pitch: "Brief → AI draft → Classic Luxury PDF for multi-agency Bhutan tours",
      not: [
        "OTA × card fare comparison",
        "Live hotel booking",
        "Guest payments",
        "Amadeus live search (schema only)",
      ],
    },
    checklist,
    docs: {
      presentation: "PRESENTATION.md",
      demo: "DEMO.md",
    },
  });
}
