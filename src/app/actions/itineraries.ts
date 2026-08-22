"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/agency";
import { generateItineraryContent, resolveAiCredentials } from "@/lib/ai";
import type { ItineraryLanguage, TemplateId } from "@/lib/types";

export async function createItinerary(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");

  const title = String(formData.get("title") || "Untitled itinerary").trim();
  const clientName = String(formData.get("client_name") || "").trim() || null;
  const clientId = String(formData.get("client_id") || "").trim() || null;
  const brief = String(formData.get("brief") || "").trim();
  const language = (String(formData.get("language") || "en") as ItineraryLanguage) || "en";
  const template_id =
    (String(formData.get("template_id") || ctx.brand?.default_template_id || "classic-luxury") as TemplateId);
  const days = Number(formData.get("days") || 7) || 7;
  const generateNow = formData.get("generate") === "1";

  const supabase = await createClient();

  let content = {};
  let warning: string | undefined;

  if (generateNow && brief) {
    const { provider, apiKey, geminiKey, cursorKey } = await resolveAiCredentials(ctx.agency.id);
    const result = await generateItineraryContent({
      apiKey,
      provider,
      geminiKey,
      cursorKey,
      brief,
      clientName,
      days,
      language,
      brand: ctx.brand,
    });
    content = result.content;
    warning = result.warning;
  }

  const { data, error } = await supabase
    .from("itineraries")
    .insert({
      agency_id: ctx.agency.id,
      title,
      client_name: clientName,
      client_id: clientId,
      brief,
      language,
      template_id,
      content,
      brand_snapshot: ctx.brand,
      status: "draft",
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      "/itineraries/new?error=" +
        encodeURIComponent(error?.message || "Could not create itinerary"),
    );
  }

  revalidatePath("/dashboard");
  const q = warning ? `?warning=${encodeURIComponent(warning)}` : "";
  redirect(`/itineraries/${data.id}${q}`);
}

export async function updateItinerary(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/login");

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const client_name = String(formData.get("client_name") || "").trim() || null;
  const client_id = String(formData.get("client_id") || "").trim() || null;
  const brief = String(formData.get("brief") || "").trim() || null;
  const language = String(formData.get("language") || "en");
  const template_id = String(formData.get("template_id") || "classic-luxury");
  const status = String(formData.get("status") || "draft");

  // Nested content fields from form
  const contentRaw = String(formData.get("content_json") || "");
  let content: unknown = undefined;
  if (contentRaw) {
    try {
      content = JSON.parse(contentRaw);
    } catch {
      redirect(`/itineraries/${id}?error=` + encodeURIComponent("Invalid content JSON"));
    }
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    title,
    client_name,
    client_id,
    brief,
    language,
    template_id,
    status,
  };
  if (content !== undefined) patch.content = content;

  const { error } = await supabase
    .from("itineraries")
    .update(patch)
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);

  if (error) {
    redirect(`/itineraries/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/itineraries/${id}`);
  revalidatePath("/dashboard");
  redirect(`/itineraries/${id}?tab=narrative&saved=1`);
}

export async function regenerateItinerary(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/login");

  const id = String(formData.get("id") || "");
  const brief = String(formData.get("brief") || "").trim();
  const language = (String(formData.get("language") || "en") as ItineraryLanguage) || "en";
  const days = Number(formData.get("days") || 7) || 7;
  const clientName = String(formData.get("client_name") || "").trim() || null;

  if (!brief) {
    redirect(`/itineraries/${id}?error=` + encodeURIComponent("Brief required to generate"));
  }

  const { provider, apiKey, geminiKey, cursorKey } = await resolveAiCredentials(ctx.agency.id);
  const result = await generateItineraryContent({
    apiKey,
    provider,
    geminiKey,
    cursorKey,
    brief,
    clientName,
    days,
    language,
    brand: ctx.brand,
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("itineraries")
    .update({
      content: result.content,
      brief,
      language,
      client_name: clientName,
      brand_snapshot: ctx.brand,
    })
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);

  if (error) {
    redirect(`/itineraries/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/itineraries/${id}`);
  const q = result.warning
    ? `?warning=${encodeURIComponent(result.warning)}`
    : "?saved=1";
  redirect(`/itineraries/${id}${q}`);
}

export async function duplicateItinerary(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/login");

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { data: src, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .eq("agency_id", ctx.agency.id)
    .single();

  if (error || !src) {
    redirect("/dashboard?error=" + encodeURIComponent(error?.message || "Not found"));
  }

  const { data: copy, error: insertError } = await supabase
    .from("itineraries")
    .insert({
      agency_id: ctx.agency.id,
      title: `${src.title} (copy)`,
      client_name: src.client_name,
      status: "draft",
      template_id: src.template_id,
      language: src.language,
      brief: src.brief,
      content: src.content,
      brand_snapshot: src.brand_snapshot || ctx.brand,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (insertError || !copy) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent(insertError?.message || "Duplicate failed"),
    );
  }

  revalidatePath("/dashboard");
  redirect(`/itineraries/${copy.id}`);
}

export async function deleteItinerary(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/dashboard?error=" + encodeURIComponent("Owner only"));
  }
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase
    .from("itineraries")
    .delete()
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteItineraries(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency || ctx.membership?.role !== "owner") {
    redirect("/dashboard?error=" + encodeURIComponent("Owner only"));
  }
  const raw = String(formData.get("ids") || "");
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) redirect("/dashboard");

  const supabase = await createClient();
  await supabase
    .from("itineraries")
    .delete()
    .in("id", ids)
    .eq("agency_id", ctx.agency.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Seeds a full demo trip: narrative + client + stays with room # + staff + payments. */
export async function seedDemoItinerary() {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");

  const { SAMPLE_BRIEF, SAMPLE_CONTENT } = await import(
    "@/lib/demo/sample-itinerary"
  );
  const { ensureOpsSeed } = await import("@/lib/ops");
  await ensureOpsSeed(ctx.agency.id);

  const supabase = await createClient();

  // Client
  let clientId: string | null = null;
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("agency_id", ctx.agency.id)
    .eq("name", "Mehra family")
    .maybeSingle();
  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: created } = await supabase
      .from("clients")
      .insert({
        agency_id: ctx.agency.id,
        name: "Mehra family",
        phone: "+91 98 0000 0000",
        email: "mehra@example.com",
        nationality: "India",
      })
      .select("id")
      .single();
    clientId = created?.id || null;
  }

  // Adjust sample content overnights to TBD
  const content = {
    ...SAMPLE_CONTENT,
    vehicle: "Assigned in Ops (live driver)",
    guide: "Assigned in Ops (live guide)",
    days: (SAMPLE_CONTENT.days || []).map((d) => ({
      ...d,
      overnight:
        d.day < 7
          ? "TBD overnight — assign in Ops from live inventory"
          : undefined,
    })),
  };

  const { data, error } = await supabase
    .from("itineraries")
    .insert({
      agency_id: ctx.agency.id,
      title: "DEMO — West 7D Mehra",
      client_name: "Mehra family",
      client_id: clientId,
      brief: SAMPLE_BRIEF,
      language: "en",
      template_id: "classic-luxury",
      content,
      brand_snapshot: ctx.brand,
      status: "ready",
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent(error?.message || "Could not seed demo itinerary"),
    );
  }

  const { data: hotel } = await supabase
    .from("hotels")
    .select("id")
    .eq("agency_id", ctx.agency.id)
    .eq("name", "Pelbu Suites")
    .maybeSingle();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, room_number")
    .eq("agency_id", ctx.agency.id)
    .eq("hotel_id", hotel?.id || "")
    .eq("status", "available")
    .limit(1)
    .maybeSingle();
  const { data: guide } = await supabase
    .from("guides")
    .select("id, name")
    .eq("agency_id", ctx.agency.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, name")
    .eq("agency_id", ctx.agency.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (hotel?.id && room?.id) {
    await supabase.from("itinerary_stays").insert({
      agency_id: ctx.agency.id,
      itinerary_id: data.id,
      hotel_id: hotel.id,
      room_id: room.id,
      day_from: 1,
      day_to: 2,
      rate: 360,
      currency: "USD",
      notes: "Demo stay — live room assigned",
    });
    await supabase.from("rooms").update({ status: "held" }).eq("id", room.id);
  }

  if (guide?.id) {
    await supabase.from("itinerary_staff").insert({
      agency_id: ctx.agency.id,
      itinerary_id: data.id,
      role: "guide",
      guide_id: guide.id,
      day_from: 1,
      day_to: 7,
    });
  }
  if (driver?.id) {
    await supabase.from("itinerary_staff").insert({
      agency_id: ctx.agency.id,
      itinerary_id: data.id,
      role: "driver",
      driver_id: driver.id,
      day_from: 1,
      day_to: 7,
    });
  }

  await supabase.from("payments").insert([
    {
      agency_id: ctx.agency.id,
      itinerary_id: data.id,
      direction: "in",
      party_type: "client",
      party_label: "Mehra family deposit",
      amount: 1500,
      currency: "USD",
      status: "paid",
      paid_at: new Date().toISOString().slice(0, 10),
      method: "Bank",
    },
    {
      agency_id: ctx.agency.id,
      itinerary_id: data.id,
      direction: "out",
      party_type: "hotel",
      party_label: "Pelbu Suites nights",
      amount: 360,
      currency: "USD",
      status: "planned",
    },
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/resources/hotels");
  redirect(`/preview/${data.id}?pack=guest`);
}
