import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import { resolveAiCredentials } from "@/lib/ai";
import { resolveGeminiModel } from "@/lib/ai/model";
import { cursorGenerateText } from "@/lib/ai/cursor-client";
import type { DayContent } from "@/lib/types";

const bodySchema = z.object({
  itineraryId: z.string().uuid(),
  dayIndex: z.number().int().min(0),
  mode: z.enum(["polish", "expand_activities", "shorten", "custom"]).default("polish"),
  instruction: z.string().max(500).optional(),
  /** Optional unsaved day from the editor form */
  day: z
    .object({
      day: z.number().optional(),
      title: z.string().optional(),
      route: z.string().optional(),
      description: z.string().optional(),
      activities: z.array(z.string()).optional(),
      overnight: z.string().optional(),
      meals: z.string().optional(),
    })
    .optional(),
});

function parseDayJson(text: string): Partial<DayContent> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<DayContent>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "No agency" }, { status: 403 });

  const { data: it } = await supabase
    .from("itineraries")
    .select("id, content")
    .eq("id", parsed.data.itineraryId)
    .eq("agency_id", membership.agency_id)
    .maybeSingle();
  if (!it) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = (it.content || {}) as { days?: DayContent[] };
  const day = {
    ...(content.days?.[parsed.data.dayIndex] || {
      day: parsed.data.dayIndex + 1,
      title: "",
      route: "",
      description: "",
      activities: [],
    }),
    ...(parsed.data.day || {}),
  } as DayContent;
  if (!content.days?.[parsed.data.dayIndex] && !parsed.data.day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  const modeHint =
    parsed.data.mode === "expand_activities"
      ? "Expand activities into 3–6 concrete bullet lines. Keep route/overnight/meals unless empty."
      : parsed.data.mode === "shorten"
        ? "Tighten description and activities; keep facts."
        : parsed.data.mode === "custom"
          ? parsed.data.instruction || "Improve clarity for a luxury FIT guest PDF."
          : "Polish description and activities for Classic Luxury guest PDF. Do not invent hotel names.";

  const prompt = `You help edit one Bhutan itinerary day for a travel agent desk.

Task: ${modeHint}

Return ONLY valid JSON with keys you change among:
route, title, description, activities (string array), overnight, meals

Current day:
${JSON.stringify(day, null, 2)}`;

  const { provider, apiKey, geminiKey, cursorKey } = await resolveAiCredentials(
    membership.agency_id,
  );

  let text = "";
  try {
    if (provider === "cursor" && (apiKey || cursorKey)) {
      text = await cursorGenerateText((apiKey || cursorKey)!, prompt);
    } else if (geminiKey || apiKey) {
      const google = createGoogleGenerativeAI({ apiKey: (geminiKey || apiKey)! });
      const result = await generateText({
        model: google(resolveGeminiModel(process.env.GEMINI_MODEL)),
        prompt,
      });
      text = result.text;
    } else {
      return NextResponse.json({ error: "No AI key configured" }, { status: 503 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI failed" },
      { status: 502 },
    );
  }

  const patch = parseDayJson(text);
  if (!patch) {
    return NextResponse.json({ error: "AI returned unreadable JSON", raw: text }, { status: 502 });
  }

  const nextDay: DayContent = {
    ...day,
    ...patch,
    day: day.day,
    activities: Array.isArray(patch.activities) ? patch.activities : day.activities,
  };

  return NextResponse.json({ day: nextDay });
}
