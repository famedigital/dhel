import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateItineraryContent, resolveAiCredentials } from "@/lib/ai";
import type { Brand } from "@/lib/types";

const bodySchema = z.object({
  itineraryId: z.string().uuid().optional(),
  brief: z.string().min(10),
  clientName: z.string().optional(),
  days: z.number().int().min(3).max(21).default(7),
  language: z.enum(["en", "zh"]).default("en"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!membership) {
    return NextResponse.json({ error: "No agency membership" }, { status: 403 });
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("agency_id", membership.agency_id)
    .maybeSingle();

  const { provider, apiKey, geminiKey, cursorKey } = await resolveAiCredentials(membership.agency_id);

  const result = await generateItineraryContent({
    apiKey,
    provider,
    geminiKey,
    cursorKey,
    brief: parsed.data.brief,
    clientName: parsed.data.clientName,
    days: parsed.data.days,
    language: parsed.data.language,
    brand: (brand as Brand | null) ?? null,
  });

  if (parsed.data.itineraryId) {
    await supabase
      .from("itineraries")
      .update({
        content: result.content,
        brief: parsed.data.brief,
        language: parsed.data.language,
        brand_snapshot: brand,
      })
      .eq("id", parsed.data.itineraryId)
      .eq("agency_id", membership.agency_id);
  }

  return NextResponse.json({
    content: result.content,
    source: result.source,
    warning: result.warning,
  });
}
