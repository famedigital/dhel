import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogGuide = {
  id: string;
  name: string;
  license_no: string | null;
  day_rate_usd: number;
  languages: string | null;
  metadata: Record<string, unknown> | null;
};

export type CatalogActivity = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  metadata: Record<string, unknown> | null;
};

export type PlatformConfig = {
  guide_day_rate_usd: number;
  guide_day_rate_inr: number;
  car_day_rate_usd: number;
  car_day_rate_inr: number;
  fx_usd_inr: number;
};

const DEFAULT_PLATFORM: PlatformConfig = {
  guide_day_rate_usd: 35,
  guide_day_rate_inr: 2500,
  car_day_rate_usd: 235,
  car_day_rate_inr: 7000,
  fx_usd_inr: 84,
};

function imagesFromMetadata(metadata: Record<string, unknown> | null): string[] {
  if (!metadata) return [];
  const raw = metadata.images ?? metadata.image_urls;
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string" && u.startsWith("http"));
  }
  if (typeof metadata.image_url === "string") return [metadata.image_url];
  return [];
}

export async function loadCatalogGuidesFromDb(
  supabase: SupabaseClient,
): Promise<CatalogGuide[]> {
  const { data, error } = await supabase
    .from("catalog_guides")
    .select("id, name, license_no, day_rate_usd, languages, metadata")
    .eq("active", true)
    .order("name");
  if (error || !data?.length) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    license_no: (row.license_no as string | null) ?? null,
    day_rate_usd: Number(row.day_rate_usd) || 35,
    languages: (row.languages as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  }));
}

export async function loadCatalogActivitiesFromDb(
  supabase: SupabaseClient,
): Promise<CatalogActivity[]> {
  const { data, error } = await supabase
    .from("catalog_activities")
    .select("id, name, slug, location, category, description, image_url, metadata")
    .eq("active", true)
    .order("name");
  if (error || !data?.length) return [];
  return data.map((row) => {
    const metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    const images = imagesFromMetadata(metadata);
    const image_url =
      (row.image_url as string | null) ??
      (typeof metadata?.image_url === "string" ? metadata.image_url : null) ??
      images[0] ??
      null;
    return {
      id: row.id as string,
      name: row.name as string,
      slug: (row.slug as string) || (row.name as string).toLowerCase().replace(/\s+/g, "-"),
      location: (row.location as string | null) ?? null,
      category: (row.category as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      image_url,
      images: image_url && !images.includes(image_url) ? [image_url, ...images] : images,
      metadata,
    };
  });
}

export async function loadPlatformConfig(
  supabase: SupabaseClient,
): Promise<PlatformConfig> {
  const { data, error } = await supabase.from("platform_config").select("key, value");
  if (error || !data?.length) return DEFAULT_PLATFORM;

  const map = new Map(data.map((r) => [r.key as string, r.value]));
  const num = (k: string, fallback: number) => {
    const v = map.get(k);
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  return {
    guide_day_rate_usd: num("guide_day_rate_usd", DEFAULT_PLATFORM.guide_day_rate_usd),
    guide_day_rate_inr: num("guide_day_rate_inr", DEFAULT_PLATFORM.guide_day_rate_inr),
    car_day_rate_usd: num("car_day_rate_usd", DEFAULT_PLATFORM.car_day_rate_usd),
    car_day_rate_inr: num("car_day_rate_inr", DEFAULT_PLATFORM.car_day_rate_inr),
    fx_usd_inr: num("fx_usd_inr", DEFAULT_PLATFORM.fx_usd_inr),
  };
}

export async function loadCatalogHotelImages(
  supabase: SupabaseClient,
  hotelName: string,
  city?: string,
): Promise<string[]> {
  let query = supabase
    .from("catalog_hotels")
    .select("metadata")
    .ilike("name", `%${hotelName.split(" ")[0]}%`)
    .limit(5);
  if (city) query = query.ilike("city", `%${city}%`);
  const { data } = await query;
  for (const row of data ?? []) {
    const meta = row.metadata as Record<string, unknown> | null;
    const urls = imagesFromMetadata(meta);
    if (urls.length) return urls.slice(0, 5);
    if (typeof meta?.image_url === "string") return [meta.image_url];
  }
  return [];
}
