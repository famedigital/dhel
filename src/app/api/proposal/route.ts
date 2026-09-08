import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  generateClientReplySafe,
  generateItineraryContent,
  parseBriefSafe,
  resolveAiCredentials,
} from "@/lib/ai";
import {
  buildAssistantMessage,
  buildBriefFromMessages,
  buildClarifyingQuestions,
} from "@/lib/ai/clarify-questions";
import {
  computePackages,
  buildCompareTable,
  DEFAULT_MARKUP,
  findFormGaps,
  findPreHotelGaps,
  resolveCatalogHotels,
  loadPlatformConfig,
  listHotelChoicesForRoute,
  computePackageFromHotelSelections,
  composeFinalBrief,
  enrichItineraryContent,
  loadCatalogActivitiesFromDb,
  loadCatalogHotelImages,
  loadCatalogGuidesFromDb,
  ensureStayPlan,
  mergeTripCostsFromBrief,
  findCostGaps,
  formatCostSummary,
  type AgencyMarkupSettings,
  type BriefIntent,
} from "@/lib/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildGenerationMeta } from "@/lib/ai/generation-meta";
import { friendlyAiWarning } from "@/lib/ai/friendly-warning";
import { mergeRateDefaults, formatVehicleRatesList } from "@/lib/agency/rate-defaults";
import type { DisplayCurrency } from "@/lib/catalog/types";
import type { Brand } from "@/lib/types";

async function resolveRateDefaults(supabase: Awaited<ReturnType<typeof createClient>>, agencyId: string) {
  const { data } = await supabase
    .from("agency_settings")
    .select("rate_defaults")
    .eq("agency_id", agencyId)
    .maybeSingle();
  return mergeRateDefaults(data?.rate_defaults);
}

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const briefIntentOverrideSchema = z
  .object({
    pax: z.number().int().min(1).max(30),
    adults: z.number().int().min(1).max(30),
    children: z.number().int().min(0).max(20),
    days: z.number().int().min(3).max(21),
    nationalities: z.array(z.string()).min(1),
    entry_point: z.string().min(1),
    budget_tier: z.enum(["economy", "mid", "comfort", "luxury", "unknown"]),
    language: z.enum(["en", "zh"]),
    currency: z.enum(["USD", "INR", "BTN"]),
    meal_plan: z.enum(["MAP", "BB", "CP", "EP"]).optional(),
    hotel_star_rating: z.number().int().min(2).max(5).optional(),
    travel_dates: z.string().optional(),
    client_name: z.string().optional(),
    stay_plan: z
      .array(z.object({ city: z.string(), nights: z.number().int().positive() }))
      .optional(),
    trip_costs: z
      .object({
        currency: z.enum(["USD", "INR", "BTN"]).optional(),
        room_avg_per_night: z.number().optional(),
        guide_per_day: z.number().optional(),
        car_per_day: z.number().optional(),
        transfer_per_trip: z.number().optional(),
        sdf_per_person_per_day: z.number().optional(),
        include_sdf: z.boolean().optional(),
        sell_total_locked: z.number().optional(),
        sell_currency: z.enum(["USD", "INR", "BTN"]).optional(),
        confirmed: z.boolean().optional(),
      })
      .optional(),
    raw_brief: z.string(),
  })
  .optional();

const bodySchema = z.object({
  brief: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  messages: z.array(chatMessageSchema).optional(),
  rateTier: z.enum(["agent", "b2c"]).default("agent"),
  action: z.enum(["parse", "narrative", "full"]).default("full"),
  optionId: z.string().optional(),
  language: z.enum(["en", "zh"]).optional(),
  skipGapCheck: z.boolean().optional(),
  confirmedIntent: briefIntentOverrideSchema,
  hotelSelections: z
    .array(
      z.object({
        city: z.string().min(1),
        hotelId: z.string().min(1),
        nights: z.number().int().positive(),
      }),
    )
    .optional(),
});

async function resolveMarkup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agencyId: string,
): Promise<AgencyMarkupSettings> {
  const { data } = await supabase
    .from("agency_settings")
    .select("markup_settings")
    .eq("agency_id", agencyId)
    .maybeSingle();
  if (data?.markup_settings && typeof data.markup_settings === "object") {
    return { ...DEFAULT_MARKUP, ...(data.markup_settings as AgencyMarkupSettings) };
  }
  return DEFAULT_MARKUP;
}

function resolveRawBrief(body: z.infer<typeof bodySchema>): string {
  if (body.messages?.length) {
    const fromMessages = buildBriefFromMessages(body.messages);
    if (fromMessages.length >= 10) return fromMessages;
  }
  return body.brief?.trim() ?? "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldMsgs = Object.values(flat.fieldErrors).flat().filter(Boolean);
    const message = flat.formErrors[0] || fieldMsgs[0] || "Invalid proposal request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const rawBrief = resolveRawBrief(parsed.data);
  if (rawBrief.length < 10) {
    return NextResponse.json(
      { error: "Brief too short — paste the client message or answer the questions." },
      { status: 400 },
    );
  }

  const isB2c = parsed.data.rateTier === "b2c";

  let agencyId: string | null = null;
  let brand: Brand | null = null;

  if (!isB2c) {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: membership } = await supabase
      .from("memberships")
      .select("agency_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: "No agency membership" }, { status: 403 });
    agencyId = membership.agency_id;
    const { data: brandRow } = await supabase.from("brands").select("*").eq("agency_id", agencyId).maybeSingle();
    brand = (brandRow as Brand | null) ?? null;
  }

  const { provider, apiKey, geminiKey, cursorKey } = await resolveAiCredentials(agencyId);

  // Local parse only — never Gemini for brief extraction
  const parsedBrief = await parseBriefSafe({
    rawBrief,
    provider,
    apiKey,
    geminiKey,
    cursorKey,
    useAiParse: false,
  });

  const briefIntent: BriefIntent = ensureStayPlan(
    mergeTripCostsFromBrief(
      parsed.data.confirmedIntent
        ? ({
            ...parsed.data.confirmedIntent,
            trip_costs: parsed.data.confirmedIntent.trip_costs
              ? {
                  currency: parsed.data.confirmedIntent.trip_costs.currency ?? "INR",
                  ...parsed.data.confirmedIntent.trip_costs,
                }
              : undefined,
          } as BriefIntent)
        : parsedBrief.intent,
    ),
  );

  const COST_GAPS = new Set([
    "room_avg",
    "guide_day",
    "car_day",
    "transfer_trip",
    "sdf",
    "cost_confirm",
  ]);
  const formGaps = findFormGaps(briefIntent);
  const tripFormGaps = formGaps.filter((g) => !COST_GAPS.has(g));
  const tripPasteGaps = findPreHotelGaps(rawBrief, briefIntent);
  // Prefer form gaps when agent sent confirmedIntent; else paste gaps for first parse
  const gaps = parsed.data.confirmedIntent ? tripFormGaps : tripPasteGaps;
  const ready =
    parsed.data.skipGapCheck ||
    (parsed.data.confirmedIntent ? tripFormGaps.length === 0 : tripPasteGaps.length === 0);
  const costGaps = findCostGaps(rawBrief, briefIntent);
  const costsReady =
    parsed.data.skipGapCheck || costGaps.length === 0 || Boolean(briefIntent.trip_costs?.confirmed);

  if (parsed.data.action === "parse" && !ready && !parsed.data.confirmedIntent) {
    const questions = buildClarifyingQuestions(gaps);
    return NextResponse.json({
      status: "needs_clarification",
      brief: briefIntent,
      gaps,
      questions,
      assistantMessage: buildAssistantMessage(briefIntent, gaps, questions),
      warning: undefined,
      aiProvider: "local",
      parseSource: "local",
    });
  }

  // Always return structured brief on parse so UI can show BriefIntentForm
  if (parsed.data.action === "parse" && !parsed.data.confirmedIntent) {
    return NextResponse.json({
      status: ready ? "needs_brief_confirm" : "needs_clarification",
      brief: briefIntent,
      gaps: ready ? undefined : gaps,
      questions: ready ? undefined : buildClarifyingQuestions(gaps),
      assistantMessage: ready
        ? "I extracted the trip details locally — confirm or edit them, then pick hotels."
        : buildAssistantMessage(briefIntent, gaps, buildClarifyingQuestions(gaps)),
      warning: undefined,
      aiProvider: "local",
      parseSource: "local",
    });
  }

  if (!ready) {
    const questions = buildClarifyingQuestions(gaps);
    return NextResponse.json({
      status: "needs_clarification",
      brief: briefIntent,
      gaps,
      questions,
      assistantMessage: buildAssistantMessage(briefIntent, gaps, questions),
      aiProvider: "local",
      parseSource: "local",
    });
  }

  const markup = agencyId ? await resolveMarkup(supabase, agencyId) : DEFAULT_MARKUP;
  const rateDefaults = agencyId ? await resolveRateDefaults(supabase, agencyId) : mergeRateDefaults(null);
  const catalogAdmin = createAdminClient() ?? supabase;
  const [catalogHotels, platformConfig] = await Promise.all([
    resolveCatalogHotels(catalogAdmin),
    loadPlatformConfig(catalogAdmin).catch(() => null),
  ]);
  const pricingDefaults = platformConfig
    ? {
        ...rateDefaults,
        guide_day_rate_usd: rateDefaults.guide_day_rate_usd ?? platformConfig.guide_day_rate_usd,
        car_day_rate_usd: rateDefaults.car_day_rate_usd ?? platformConfig.car_day_rate_usd,
      }
    : rateDefaults;

  const hotelChoices = listHotelChoicesForRoute(briefIntent, catalogHotels);

  const options = (() => {
    if (parsed.data.hotelSelections?.length) {
      const selected = computePackageFromHotelSelections(
        briefIntent,
        parsed.data.hotelSelections,
        markup,
        parsed.data.rateTier,
        catalogHotels,
        pricingDefaults,
      );
      return selected ? [selected] : [];
    }
    // With stay plan: agent picks per-city — don't pre-build Value/Recommended packages
    if (briefIntent.stay_plan?.length) {
      return [];
    }
    // Flat packages listed for agent to choose — never auto-select
    return computePackages(
      briefIntent,
      markup,
      parsed.data.rateTier,
      undefined,
      catalogHotels,
      pricingDefaults,
    ).map((o) => ({ ...o, recommended: false }));
  })();
  const compare = buildCompareTable(options);

  if (parsed.data.action === "parse" || parsed.data.action === "narrative") {
    // narrative without hotel still returns hotel UI payload
    if (parsed.data.action === "parse") {
      return NextResponse.json({
        status: "ready",
        brief: briefIntent,
        options,
        compare,
        hotelChoices,
        warning: undefined,
        aiProvider: "local",
        parseSource: "local",
        usedDefaults: parsed.data.skipGapCheck ?? false,
        assistantMessage: briefIntent.stay_plan?.length
          ? `Route: ${briefIntent.stay_plan.map((s) => `${s.city} ${s.nights}N`).join(" → ")}. Pick a hotel for each town.`
          : "Pick a hotel package — nothing is pre-selected.",
      });
    }
  }

  // Require explicit hotel choice — never fall back to recommended/first
  const selected = parsed.data.hotelSelections?.length
    ? options[0]
    : parsed.data.optionId
      ? options.find((o) => o.id === parsed.data.optionId)
      : undefined;

  if (!selected) {
    return NextResponse.json({
      status: "needs_hotel",
      brief: briefIntent,
      options,
      compare,
      hotelChoices,
      aiProvider: "local",
      parseSource: "local",
      assistantMessage:
        hotelChoices.length === 0 && options.length === 0
          ? "No hotel options in catalog for this route — check stay plan cities."
          : "Choose hotels before generating the itinerary draft.",
    });
  }

  // Cost lines required before narrative (ask if not written)
  if (!costsReady && parsed.data.action === "full") {
    const questions = buildClarifyingQuestions(costGaps);
    const nights =
      briefIntent.stay_plan?.reduce((s, x) => s + x.nights, 0) ??
      Math.max(briefIntent.days - 1, 1);
    const hint = briefIntent.trip_costs
      ? formatCostSummary(briefIntent.trip_costs, briefIntent.days, nights)
      : "room / guide / car / pickup-drop / SDF";
    return NextResponse.json({
      status: "needs_clarification",
      brief: briefIntent,
      gaps: costGaps,
      questions,
      options,
      compare,
      hotelChoices,
      selected,
      assistantMessage: `Hotels locked. Cost lines still needed (${hint}). ${buildAssistantMessage(briefIntent, costGaps, questions)}`,
      aiProvider: "local",
      parseSource: "local",
    });
  }

  const lang = parsed.data.language ?? briefIntent.language ?? "en";
  const brandName = brand?.display_name ?? "Dhel";
  const finalBrief = composeFinalBrief(briefIntent);

  const stayHotels =
    selected.hotel.stays?.length
      ? selected.hotel.stays
      : [
          {
            hotel_name: selected.hotel.hotel_name,
            city: selected.hotel.city,
          },
        ];

  // Narrative + reply + catalog enrichments in parallel
  const [narrative, reply, activities, guides, hotelImageBatches] = await Promise.all([
    generateItineraryContent({
      apiKey,
      provider,
      geminiKey,
      cursorKey,
      brief: finalBrief,
      clientName: briefIntent.client_name,
      days: briefIntent.days,
      language: lang,
      brand,
      packageOption: selected,
      stayPlan: briefIntent.stay_plan,
      pax: briefIntent.pax,
      adults: briefIntent.adults,
      children: briefIntent.children,
      entryPoint: briefIntent.entry_point,
      travelDates: briefIntent.travel_dates,
      defaultVehicleType: rateDefaults.default_vehicle_type,
      vehicleRates: rateDefaults.vehicle_rates,
    }),
    generateClientReplySafe({
      apiKey,
      provider,
      geminiKey,
      cursorKey,
      brief: finalBrief,
      language: lang,
      sellPerPerson: selected.sell_per_person,
      currency: selected.currency,
      days: briefIntent.days,
      brandName,
    }),
    loadCatalogActivitiesFromDb(catalogAdmin).catch(() => []),
    loadCatalogGuidesFromDb(catalogAdmin).catch(() => []),
    Promise.all(
      stayHotels.map((h) =>
        loadCatalogHotelImages(catalogAdmin, h.hotel_name, h.city).catch(() => [] as string[]),
      ),
    ),
  ]);

  if (narrative.source === "stub") {
    return NextResponse.json(
      {
        error:
          "AI narrative unavailable (stub). Check Gemini/Cursor API keys — refusing to ship a template as a finished guest PDF.",
        status: "error",
        source: "stub",
        warning: narrative.warning,
      },
      { status: 503 },
    );
  }

  const hotelImageByStay = stayHotels.map((h, i) => ({
    hotel: h.hotel_name,
    city: h.city,
    image_urls: hotelImageBatches[i] ?? [],
  }));
  const hotelImageUrls = hotelImageByStay.flatMap((x) => x.image_urls);

  const hotelOptionsFromStays = stayHotels.map((h, i) => ({
    id: `${selected.id}-stay-${i}`,
    label: `${h.city} · ${h.hotel_name}`,
    hotel: h.hotel_name,
    city: h.city,
    room: selected.hotel.room_type,
    nights: selected.hotel.stays?.[i]?.nights ?? selected.hotel.nights,
    total_pp: selected.sell_per_person,
    currency: selected.currency,
    recommended: true,
    image_urls: hotelImageByStay[i]?.image_urls ?? [],
  }));

  let content = enrichItineraryContent({
    content: {
      ...narrative.content,
      hotel_options: hotelOptionsFromStays.length
        ? hotelOptionsFromStays
        : compare.length
          ? compare.map((row) => ({
              id: row.id,
              label: options.find((o) => o.id === row.id)?.label ?? selected.label,
              hotel: row.hotel,
              city: row.city,
              room: row.room,
              nights: row.nights,
              total_pp: row.total_pp,
              currency: row.currency,
              recommended: row.id === selected.id,
            }))
          : [
              {
                id: selected.id,
                label: selected.label,
                hotel: selected.hotel.hotel_name,
                city: selected.hotel.city,
                room: selected.hotel.room_type,
                nights: selected.hotel.nights,
                total_pp: selected.sell_per_person,
                currency: selected.currency,
                recommended: true,
              },
            ],
      selected_option_id: selected.id,
      vehicle_type: rateDefaults.default_vehicle_type ?? narrative.content.vehicle_type,
      vehicle_options: formatVehicleRatesList(rateDefaults, selected.currency as DisplayCurrency),
      pricing: {
        ...narrative.content.pricing,
        currency: selected.currency,
        total: selected.sell_total,
        per_person: selected.sell_per_person,
        pax: briefIntent.pax,
      },
    },
    packageOption: selected,
    activities,
    guides,
    hotelImageUrls,
    hotelImagesByStay: hotelImageByStay,
  });

  const warnings: string[] = [];
  if (narrative.warning) warnings.push(narrative.warning);
  if (reply.warning) warnings.push(reply.warning);
  if (parsed.data.skipGapCheck) warnings.push("Generated with default/missing brief fields.");

  return NextResponse.json({
    status: "ready",
    brief: briefIntent,
    options,
    compare,
    hotelChoices,
    selected,
    content,
    clientReply: reply.text,
    source: narrative.source,
    aiProvider: provider,
    parseSource: "local",
    warning: friendlyAiWarning(warnings.length ? warnings.join(" ") : undefined),
    rawBrief: finalBrief,
    generationMeta: buildGenerationMeta({
      rawBrief: finalBrief,
      messages: parsed.data.messages,
      aiProvider: provider,
      packageOption: selected,
      compare,
      clientReply: reply.text,
      warnings: warnings.map((w) => friendlyAiWarning(w) ?? w),
      stayPlan: briefIntent.stay_plan,
      tripCosts: briefIntent.trip_costs as unknown as Record<string, unknown>,
    }),
  });
}
