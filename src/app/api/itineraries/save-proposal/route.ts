import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prepareFromBriefContext } from "@/lib/ai/prepare-content";
import {
  enrichItineraryContent,
  loadCatalogActivitiesFromDb,
  loadCatalogGuidesFromDb,
  loadCatalogHotelImages,
} from "@/lib/catalog";
import { parseStayPlan } from "@/lib/catalog/stay-plan";
import type { PackageOption } from "@/lib/catalog";
import type { Brand, GenerationMeta, ItineraryContent } from "@/lib/types";

const bodySchema = z.object({
  brief: z.string(),
  content: z.record(z.string(), z.unknown()),
  clientName: z.string().optional(),
  days: z.number().default(7),
  language: z.enum(["en", "zh"]).default("en"),
  packageId: z.string().optional(),
  packageOption: z.record(z.string(), z.unknown()).optional(),
  pax: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  entryPoint: z.string().optional(),
  travelDates: z.string().optional(),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  generationMeta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "No agency" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: brand } = await supabase.from("brands").select("*").eq("agency_id", membership.agency_id).maybeSingle();
  const stayPlan = parseStayPlan(parsed.data.brief);
  const packageOption = parsed.data.packageOption as PackageOption | undefined;

  const catalogClient = createAdminClient() ?? supabase;
  const [activities, guides, hotelImages] = await Promise.all([
    loadCatalogActivitiesFromDb(catalogClient).catch(() => []),
    loadCatalogGuidesFromDb(catalogClient).catch(() => []),
    packageOption
      ? loadCatalogHotelImages(catalogClient, packageOption.hotel.hotel_name, packageOption.hotel.city).catch(() => [])
      : Promise.resolve([]),
  ]);

  let content = prepareFromBriefContext({
    raw: parsed.data.content,
    brief: parsed.data.brief,
    clientName: parsed.data.clientName,
    days: parsed.data.days,
    language: parsed.data.language,
    brand: (brand as Brand | null) ?? null,
    packageOption,
    stayPlan,
    pax: parsed.data.pax,
    adults: parsed.data.adults,
    children: parsed.data.children,
    entryPoint: parsed.data.entryPoint,
    travelDates: parsed.data.travelDates,
  }) as ItineraryContent;

  content = enrichItineraryContent({
    content,
    packageOption,
    activities,
    guides,
    hotelImageUrls: hotelImages,
  });

  const generation_meta: GenerationMeta = {
    ...(parsed.data.generationMeta as GenerationMeta | undefined),
    messages: parsed.data.messages ?? (parsed.data.generationMeta as GenerationMeta)?.messages,
    final_brief: parsed.data.brief,
    generated_at: new Date().toISOString(),
  };

  const title = parsed.data.clientName
    ? `${parsed.data.clientName} · ${parsed.data.days}D Bhutan`
    : `${parsed.data.days}-Day Bhutan Proposal`;

  const { data, error } = await supabase
    .from("itineraries")
    .insert({
      agency_id: membership.agency_id,
      title,
      client_name: parsed.data.clientName ?? null,
      status: "draft",
      template_id: "classic-luxury",
      language: parsed.data.language,
      brief: parsed.data.brief,
      content,
      brand_snapshot: brand,
      generation_meta,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
