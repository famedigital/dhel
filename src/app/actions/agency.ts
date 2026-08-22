"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/agency";
import { mergeRateDefaults, type AgencyRateDefaults } from "@/lib/agency/rate-defaults";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function createAgency(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);

  if (!name || !slug) {
    redirect("/onboarding?error=" + encodeURIComponent("Name is required"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_agency_with_owner", {
    p_name: name,
    p_slug: slug,
  });

  if (error) {
    redirect("/onboarding?error=" + encodeURIComponent(error.message));
  }

  void data;
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateBrand(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Owner only"));
  }

  const supabase = await createClient();
  const payload = {
    display_name: String(formData.get("display_name") || "").trim(),
    website: String(formData.get("website") || "").trim() || null,
    whatsapp: String(formData.get("whatsapp") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    voice: String(formData.get("voice") || "").trim() || null,
    signatory_names: String(formData.get("signatory_names") || "").trim() || null,
    signatory_title: String(formData.get("signatory_title") || "").trim() || null,
    since_year: formData.get("since_year")
      ? Number(formData.get("since_year"))
      : null,
    default_template_id: String(formData.get("default_template_id") || "classic-luxury"),
  };

  const { error } = await supabase
    .from("brands")
    .update(payload)
    .eq("agency_id", ctx.agency.id);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function saveGeminiKey(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Owner only"));
  }

  const key = String(formData.get("gemini_api_key") || "").trim();
  if (!key) {
    redirect("/settings?error=" + encodeURIComponent("Paste a key to update (blank keeps existing)"));
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_agency_gemini_key", {
    p_agency_id: ctx.agency.id,
    p_key: key,
  });
  if (error) redirect("/settings?error=" + encodeURIComponent(error.message));

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function saveMarkupSettings(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Owner only"));
  }

  const markup_settings = {
    default_markup_percent: Number(formData.get("default_markup_percent") || 10),
    markup_mode: "percent_on_cost" as const,
    pelbu_own_hotel_markup_percent: Number(formData.get("pelbu_own_hotel_markup_percent") || 0),
    hotel_markup_percent: Number(formData.get("hotel_markup_percent") || 10),
    min_margin_percent: Number(formData.get("min_margin_percent") || 5),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("agency_settings").upsert({
    agency_id: ctx.agency.id,
    markup_settings,
  });

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function uploadBrandLetterPhoto(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Owner only"));
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/settings?error=" + encodeURIComponent("Choose a photo to upload"));
  }
  if (file.size > 5 * 1024 * 1024) {
    redirect("/settings?error=" + encodeURIComponent("Photo must be under 5 MB"));
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${ctx.agency.id}/letter.${safeExt}`;

  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(path, bytes, { upsert: true, contentType: file.type || "image/jpeg" });

  if (uploadError) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(
          `Upload failed: ${uploadError.message}. Apply migration 20260822_agency_rate_defaults.sql for the brand-assets bucket.`,
        ),
    );
  }

  const { error: brandError } = await supabase
    .from("brands")
    .update({ letter_photo_path: path })
    .eq("agency_id", ctx.agency.id);

  if (brandError) {
    redirect("/settings?error=" + encodeURIComponent(brandError.message));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

function parseVehicleRates(formData: FormData): AgencyRateDefaults["vehicle_rates"] {
  const categories = formData.getAll("vehicle_category").map(String);
  const rates = formData.getAll("vehicle_day_rate").map((v) => Number(v));
  return categories
    .map((category, i) => ({ category: category.trim(), day_rate_usd: rates[i] || 0 }))
    .filter((v) => v.category && v.day_rate_usd > 0);
}

function parseRoomRates(formData: FormData): AgencyRateDefaults["room_category_rates"] {
  const labels = formData.getAll("room_label").map(String);
  const stars = formData.getAll("room_star").map((v) => Number(v));
  const meals = formData.getAll("room_meal").map(String);
  const nets = formData.getAll("room_net_usd").map((v) => Number(v));
  return labels
    .map((label, i) => ({
      label: label.trim(),
      star: stars[i] || 3,
      meal: meals[i] || "MAP",
      net_usd: nets[i] || 0,
    }))
    .filter((r) => r.label && r.net_usd > 0);
}

export async function saveRateDefaults(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Owner only"));
  }

  const rate_defaults: AgencyRateDefaults = {
    guide_day_rate_usd: Number(formData.get("guide_day_rate_usd") || 85),
    car_day_rate_usd: Number(formData.get("car_day_rate_usd") || 235),
    default_vehicle_type: String(formData.get("default_vehicle_type") || "").trim() || undefined,
    vehicle_rates: parseVehicleRates(formData),
    room_category_rates: parseRoomRates(formData),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("agency_settings").upsert({
    agency_id: ctx.agency.id,
    rate_defaults,
  });

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function loadAgencyRateDefaults(agencyId: string): Promise<AgencyRateDefaults> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agency_settings")
    .select("rate_defaults")
    .eq("agency_id", agencyId)
    .maybeSingle();
  return mergeRateDefaults(data?.rate_defaults);
}
