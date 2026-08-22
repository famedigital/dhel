import { notFound } from "next/navigation";
import { collectClassicLuxuryImageUrls } from "@/components/templates/ClassicLuxury";
import { loadAgencyRateDefaults } from "@/app/actions/agency";
import { prepareFromBriefContext } from "@/lib/ai/prepare-content";
import { parseStayPlan } from "@/lib/catalog/stay-plan";
import { formatVehicleRatesList } from "@/lib/agency/rate-defaults";
import { loadItineraryOps } from "@/lib/ops";
import { createClient } from "@/lib/supabase/server";
import type {
  Brand,
  Driver,
  Guide,
  Hotel,
  Itinerary,
  ItineraryOpsBundle,
  ItineraryStaff,
  ItineraryStay,
  Payment,
  Room,
} from "@/lib/types";

export type PreviewPack = "guest" | "ops" | "field";

export function parsePreviewPack(packParam?: string): PreviewPack {
  if (packParam === "ops") return "ops";
  if (packParam === "field") return "field";
  return "guest";
}

export async function loadPreviewItinerary(agencyId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (!data) notFound();

  const row = data as Itinerary;
  const lang = (row.language as "en" | "zh") || "en";
  const stayPlan = parseStayPlan(row.brief || "");
  const routeDays = stayPlan?.reduce((n, s) => n + s.nights, 0);
  const inferredDays = routeDays ? routeDays + 1 : row.content?.days?.length || 7;
  const rateDefaults = await loadAgencyRateDefaults(agencyId);
  const prepared = prepareFromBriefContext({
    raw: row.content,
    brief: row.brief || "",
    clientName: row.client_name,
    days: inferredDays,
    language: lang,
    brand: (row.brand_snapshot as Brand | null) ?? null,
    stayPlan,
    defaultVehicleType: rateDefaults.default_vehicle_type,
    vehicleRates: rateDefaults.vehicle_rates,
  });

  const itinerary = {
    ...row,
    content: {
      ...prepared,
      hotel_options: prepared.hotel_options?.length
        ? prepared.hotel_options
        : row.content?.hotel_options,
      selected_option_id: row.content?.selected_option_id ?? prepared.selected_option_id,
      vehicle_type: prepared.vehicle_type ?? rateDefaults.default_vehicle_type,
      vehicle_options: prepared.vehicle_options?.length
        ? prepared.vehicle_options
        : formatVehicleRatesList(
            rateDefaults,
            (prepared.pricing?.currency as "USD" | "INR" | "BTN") || "USD",
          ),
    },
  };

  const brand = itinerary.brand_snapshot || null;
  const imageUrls = collectClassicLuxuryImageUrls(itinerary, brand);
  const opsRaw = await loadItineraryOps(agencyId, id);
  const ops: ItineraryOpsBundle = {
    stays: opsRaw.stays as ItineraryStay[],
    staff: opsRaw.staff as ItineraryStaff[],
    payments: opsRaw.payments as Payment[],
    hotels: opsRaw.hotels as Hotel[],
    rooms: opsRaw.rooms as Room[],
    guides: opsRaw.guides as Guide[],
    drivers: opsRaw.drivers as Driver[],
  };

  return { itinerary, brand, imageUrls, ops };
}
