"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function requireAdmin() {
  return getSessionContext().then((ctx) => {
    if (!ctx) redirect("/login");
    if (!isPlatformAdmin(ctx)) {
      redirect("/resources/hotels?error=" + encodeURIComponent("Only superadmin can edit the master library"));
    }
    return ctx;
  });
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

function revalidateLibrary() {
  revalidatePath("/resources/hotels");
  revalidatePath("/resources/guides");
  revalidatePath("/resources/activities");
  revalidatePath("/platform/library");
}

export async function saveCatalogHotel(formData: FormData) {
  await requireAdmin();
  const supabase = await db();
  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const active = String(formData.get("active") || "true") === "true";
  if (!name) {
    redirect("/resources/hotels?error=" + encodeURIComponent("Hotel name required"));
  }

  if (id) {
    const { data: existing } = await supabase
      .from("catalog_hotels")
      .select("metadata")
      .eq("id", id)
      .maybeSingle();
    const meta = {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      phone,
    };
    const { error } = await supabase
      .from("catalog_hotels")
      .update({ name, city, active, metadata: meta, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) redirect("/resources/hotels?error=" + encodeURIComponent(error.message));
  } else {
    const { error } = await supabase.from("catalog_hotels").insert({
      name,
      city,
      active,
      source: "catalog",
      metadata: phone ? { phone } : {},
    });
    if (error) redirect("/resources/hotels?error=" + encodeURIComponent(error.message));
  }

  revalidateLibrary();
  redirect("/resources/hotels?saved=1");
}

export async function deleteCatalogHotel(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/resources/hotels");
  const supabase = await db();
  const { error } = await supabase.from("catalog_hotels").delete().eq("id", id);
  if (error) redirect("/resources/hotels?error=" + encodeURIComponent(error.message));
  revalidateLibrary();
  redirect("/resources/hotels?saved=1");
}

export async function saveCatalogGuide(formData: FormData) {
  await requireAdmin();
  const supabase = await db();
  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    redirect("/resources/guides?error=" + encodeURIComponent("Guide name required"));
  }

  const row = {
    name,
    phone: String(formData.get("phone") || "").trim() || null,
    languages: String(formData.get("languages") || "").trim() || null,
    license_no: String(formData.get("license_no") || "").trim() || null,
    day_rate_usd: Number(formData.get("day_rate_usd")) || null,
    day_rate_inr: Number(formData.get("day_rate_inr")) || null,
    active: String(formData.get("active") || "true") === "true",
    notes: String(formData.get("notes") || "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("catalog_guides").update(row).eq("id", id);
    if (error) redirect("/resources/guides?error=" + encodeURIComponent(error.message));
  } else {
    const { error } = await supabase.from("catalog_guides").insert(row);
    if (error) redirect("/resources/guides?error=" + encodeURIComponent(error.message));
  }

  revalidateLibrary();
  redirect("/resources/guides?saved=1");
}

export async function deleteCatalogGuide(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/resources/guides");
  const supabase = await db();
  const { error } = await supabase.from("catalog_guides").delete().eq("id", id);
  if (error) redirect("/resources/guides?error=" + encodeURIComponent(error.message));
  revalidateLibrary();
  redirect("/resources/guides?saved=1");
}

export async function saveCatalogActivity(formData: FormData) {
  await requireAdmin();
  const supabase = await db();
  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    redirect("/resources/activities?error=" + encodeURIComponent("Activity name required"));
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const row = {
    name,
    slug: String(formData.get("slug") || "").trim() || slugBase || null,
    dzongkhag: String(formData.get("dzongkhag") || "").trim() || null,
    net_usd: Number(formData.get("net_usd")) || null,
    net_inr: Number(formData.get("net_inr")) || null,
    active: String(formData.get("active") || "true") === "true",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("catalog_activities").update(row).eq("id", id);
    if (error) redirect("/resources/activities?error=" + encodeURIComponent(error.message));
  } else {
    const { error } = await supabase.from("catalog_activities").insert(row);
    if (error) redirect("/resources/activities?error=" + encodeURIComponent(error.message));
  }

  revalidateLibrary();
  redirect("/resources/activities?saved=1");
}

export async function deleteCatalogActivity(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/resources/activities");
  const supabase = await db();
  const { error } = await supabase.from("catalog_activities").delete().eq("id", id);
  if (error) redirect("/resources/activities?error=" + encodeURIComponent(error.message));
  revalidateLibrary();
  redirect("/resources/activities?saved=1");
}
