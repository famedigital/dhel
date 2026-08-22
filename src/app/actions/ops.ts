"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/agency";
import { ensureOpsSeed } from "@/lib/ops";

function revalidateClients(id?: string) {
  revalidatePath("/clients");
  if (id) revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
}

export async function saveClient(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");

  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    redirect("/clients?error=" + encodeURIComponent("Name required"));
  }

  const row = {
    agency_id: ctx.agency.id,
    name,
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    nationality: String(formData.get("nationality") || "").trim() || null,
    passport_notes: String(formData.get("passport_notes") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("clients")
      .update(row)
      .eq("id", id)
      .eq("agency_id", ctx.agency.id);
    if (error) redirect("/clients?error=" + encodeURIComponent(error.message));
    revalidateClients(id);
    redirect(`/clients/${id}?saved=1`);
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) {
    redirect("/clients?error=" + encodeURIComponent(error?.message || "Create failed"));
  }
  revalidateClients(data.id);
  redirect(`/clients/${data.id}?saved=1`);
}

export async function deleteClient(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id).eq("agency_id", ctx.agency.id);
  revalidateClients();
  redirect("/clients");
}

export async function saveHotel(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/resources/hotels?error=" + encodeURIComponent("Name required"));

  const row = {
    agency_id: ctx.agency.id,
    name,
    city: String(formData.get("city") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    active: formData.get("active") !== "0",
  };

  const supabase = await createClient();
  if (id) {
    await supabase.from("hotels").update(row).eq("id", id).eq("agency_id", ctx.agency.id);
  } else {
    await supabase.from("hotels").insert(row);
  }
  revalidatePath("/resources/hotels");
  redirect("/resources/hotels?saved=1");
}

export async function saveRoom(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "").trim() || null;
  const hotel_id = String(formData.get("hotel_id") || "");
  const room_number = String(formData.get("room_number") || "").trim();
  if (!hotel_id || !room_number) {
    redirect("/resources/hotels?error=" + encodeURIComponent("Hotel and room number required"));
  }

  const row = {
    agency_id: ctx.agency.id,
    hotel_id,
    room_number,
    room_type: String(formData.get("room_type") || "Standard").trim() || "Standard",
    status: String(formData.get("status") || "available"),
    notes: String(formData.get("notes") || "").trim() || null,
    net_rate_usd: formData.get("net_rate_usd")
      ? Number(formData.get("net_rate_usd"))
      : null,
  };

  const supabase = await createClient();
  if (id) {
    await supabase.from("rooms").update(row).eq("id", id).eq("agency_id", ctx.agency.id);
  } else {
    await supabase.from("rooms").insert(row);
  }
  revalidatePath("/resources/hotels");
  redirect("/resources/hotels?saved=1");
}

export async function deleteRoom(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("rooms").delete().eq("id", id).eq("agency_id", ctx.agency.id);
  revalidatePath("/resources/hotels");
  redirect("/resources/hotels");
}

export async function saveGuide(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/resources/guides?error=" + encodeURIComponent("Name required"));

  const row = {
    agency_id: ctx.agency.id,
    name,
    phone: String(formData.get("phone") || "").trim() || null,
    languages: String(formData.get("languages") || "").trim() || null,
    license_no: String(formData.get("license_no") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    active: formData.get("active") !== "0",
    day_rate_usd: formData.get("day_rate_usd") ? Number(formData.get("day_rate_usd")) : null,
  };

  const supabase = await createClient();
  if (id) {
    await supabase.from("guides").update(row).eq("id", id).eq("agency_id", ctx.agency.id);
  } else {
    await supabase.from("guides").insert(row);
  }
  revalidatePath("/resources/guides");
  redirect("/resources/guides?saved=1");
}

export async function deleteGuide(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("guides").delete().eq("id", id).eq("agency_id", ctx.agency.id);
  revalidatePath("/resources/guides");
  redirect("/resources/guides");
}

export async function saveDriver(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/resources/drivers?error=" + encodeURIComponent("Name required"));

  const row = {
    agency_id: ctx.agency.id,
    name,
    phone: String(formData.get("phone") || "").trim() || null,
    vehicle_type: String(formData.get("vehicle_type") || "").trim() || null,
    plate: String(formData.get("plate") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    active: formData.get("active") !== "0",
    day_rate_usd: formData.get("day_rate_usd") ? Number(formData.get("day_rate_usd")) : null,
  };

  const supabase = await createClient();
  if (id) {
    await supabase.from("drivers").update(row).eq("id", id).eq("agency_id", ctx.agency.id);
  } else {
    await supabase.from("drivers").insert(row);
  }
  revalidatePath("/resources/drivers");
  redirect("/resources/drivers?saved=1");
}

export async function deleteDriver(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("drivers").delete().eq("id", id).eq("agency_id", ctx.agency.id);
  revalidatePath("/resources/drivers");
  redirect("/resources/drivers");
}

export async function seedAgencyResources() {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  await ensureOpsSeed(ctx.agency.id);
  revalidatePath("/resources/hotels");
  revalidatePath("/resources/guides");
  revalidatePath("/resources/drivers");
  redirect("/resources/hotels?saved=1");
}

export async function importCatalogHotels() {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");

  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());
  const { data: catalogRows } = await supabase
    .from("catalog_hotels")
    .select("name, city, star_rating, phone, metadata")
    .eq("active", true)
    .limit(50);

  if (!catalogRows?.length) {
    redirect("/resources/hotels?error=" + encodeURIComponent("No catalog hotels found"));
  }

  const { data: existing } = await supabase
    .from("hotels")
    .select("name")
    .eq("agency_id", ctx.agency.id);
  const existingNames = new Set((existing ?? []).map((h) => (h.name as string).toLowerCase()));

  let imported = 0;
  for (const row of catalogRows) {
    const name = row.name as string;
    if (existingNames.has(name.toLowerCase())) continue;
    const meta = (row.metadata as Record<string, unknown> | null) ?? null;
    const imageUrl =
      typeof meta?.image_url === "string"
        ? meta.image_url
        : Array.isArray(meta?.images)
          ? (meta.images.find((u) => typeof u === "string") as string | undefined)
          : undefined;

    const { error } = await supabase.from("hotels").insert({
      agency_id: ctx.agency.id,
      name,
      city: (row.city as string) || null,
      star_rating: Number(row.star_rating) || null,
      phone: (row.phone as string) || null,
      notes: imageUrl ? `Image: ${imageUrl}` : null,
    });
    if (!error) {
      imported++;
      existingNames.add(name.toLowerCase());
    }
  }

  revalidatePath("/resources/hotels");
  redirect(
    `/resources/hotels?saved=1&warning=` +
      encodeURIComponent(`Imported ${imported} hotels from platform catalog`),
  );
}

async function holdRoom(roomId: string | null, hold: boolean) {
  if (!roomId) return;
  const supabase = await createClient();
  await supabase
    .from("rooms")
    .update({ status: hold ? "held" : "available" })
    .eq("id", roomId);
}

export async function addStay(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const hotel_id = String(formData.get("hotel_id") || "");
  const room_id = String(formData.get("room_id") || "").trim() || null;

  if (!itinerary_id || !hotel_id) {
    redirect(
      `/itineraries/${itinerary_id}?tab=stays&error=` +
        encodeURIComponent("Hotel required"),
    );
  }

  const supabase = await createClient();

  // Overlap check: same room already on overlapping dates for another stay
  if (room_id) {
    const check_in = String(formData.get("check_in") || "") || null;
    const check_out = String(formData.get("check_out") || "") || null;
    if (check_in && check_out) {
      const { data: conflicts } = await supabase
        .from("itinerary_stays")
        .select("id")
        .eq("room_id", room_id)
        .lt("check_in", check_out)
        .gt("check_out", check_in)
        .limit(1);
      if (conflicts && conflicts.length > 0) {
        redirect(
          `/itineraries/${itinerary_id}?tab=stays&error=` +
            encodeURIComponent("Room already booked on overlapping dates"),
        );
      }
    }
  }

  const { error } = await supabase.from("itinerary_stays").insert({
    agency_id: ctx.agency.id,
    itinerary_id,
    hotel_id,
    room_id,
    day_from: Number(formData.get("day_from") || 0) || null,
    day_to: Number(formData.get("day_to") || 0) || null,
    check_in: String(formData.get("check_in") || "") || null,
    check_out: String(formData.get("check_out") || "") || null,
    rate: formData.get("rate") ? Number(formData.get("rate")) : null,
    currency: String(formData.get("currency") || "USD"),
    notes: String(formData.get("notes") || "").trim() || null,
    voucher_url: String(formData.get("voucher_url") || "").trim() || null,
  });

  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=stays&error=` +
        encodeURIComponent(error.message),
    );
  }

  if (room_id) await holdRoom(room_id, true);
  revalidatePath(`/itineraries/${itinerary_id}`);
  revalidatePath("/resources/hotels");
  redirect(`/itineraries/${itinerary_id}?tab=stays&saved=1`);
}

export async function deleteStay(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const supabase = await createClient();
  const { data: stay } = await supabase
    .from("itinerary_stays")
    .select("room_id")
    .eq("id", id)
    .eq("agency_id", ctx.agency.id)
    .maybeSingle();
  await supabase
    .from("itinerary_stays")
    .delete()
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  if (stay?.room_id) await holdRoom(stay.room_id as string, false);
  revalidatePath(`/itineraries/${itinerary_id}`);
  revalidatePath("/resources/hotels");
  redirect(`/itineraries/${itinerary_id}?tab=stays`);
}

export async function updateStayVoucher(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const voucher_url = String(formData.get("voucher_url") || "").trim() || null;
  const supabase = await createClient();
  const { error } = await supabase
    .from("itinerary_stays")
    .update({ voucher_url, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=stays&error=` +
        encodeURIComponent(error.message),
    );
  }
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=stays&saved=1`);
}

export async function addStaff(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const role = String(formData.get("role") || "guide");
  const guide_id =
    role === "guide" ? String(formData.get("guide_id") || "") || null : null;
  const driver_id =
    role === "driver" ? String(formData.get("driver_id") || "") || null : null;

  if ((role === "guide" && !guide_id) || (role === "driver" && !driver_id)) {
    redirect(
      `/itineraries/${itinerary_id}?tab=staff&error=` +
        encodeURIComponent("Select a guide or driver"),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("itinerary_staff").insert({
    agency_id: ctx.agency.id,
    itinerary_id,
    role,
    guide_id,
    driver_id,
    day_from: Number(formData.get("day_from") || 0) || null,
    day_to: Number(formData.get("day_to") || 0) || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=staff&error=` +
        encodeURIComponent(error.message),
    );
  }
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=staff&saved=1`);
}

export async function deleteStaff(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const supabase = await createClient();
  await supabase
    .from("itinerary_staff")
    .delete()
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=staff`);
}

export async function addPayment(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const amount = Number(formData.get("amount") || 0);
  if (!amount) {
    redirect(
      `/itineraries/${itinerary_id}?tab=money&error=` +
        encodeURIComponent("Amount required"),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    agency_id: ctx.agency.id,
    itinerary_id,
    direction: String(formData.get("direction") || "in"),
    party_type: String(formData.get("party_type") || "client"),
    party_id: String(formData.get("party_id") || "").trim() || null,
    party_label: String(formData.get("party_label") || "").trim() || null,
    amount,
    currency: String(formData.get("currency") || "USD"),
    method: String(formData.get("method") || "").trim() || null,
    status: String(formData.get("status") || "planned"),
    paid_at: String(formData.get("paid_at") || "") || null,
    note: String(formData.get("note") || "").trim() || null,
  });

  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=money&error=` +
        encodeURIComponent(error.message),
    );
  }
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=money&saved=1`);
}

export async function updatePaymentStatus(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const status = String(formData.get("status") || "planned");
  const supabase = await createClient();
  await supabase
    .from("payments")
    .update({
      status,
      paid_at:
        status === "paid"
          ? new Date().toISOString().slice(0, 10)
          : null,
    })
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=money&saved=1`);
}

export async function deletePayment(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const supabase = await createClient();
  await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=money`);
}

export async function addTraveler(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!itinerary_id || !name) {
    redirect(
      `/itineraries/${itinerary_id}?tab=travelers&error=` +
        encodeURIComponent("Traveler name required"),
    );
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("trip_travelers")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", ctx.agency.id)
    .eq("itinerary_id", itinerary_id);

  const { error } = await supabase.from("trip_travelers").insert({
    agency_id: ctx.agency.id,
    itinerary_id,
    name,
    nationality: String(formData.get("nationality") || "").trim() || null,
    id_type: String(formData.get("id_type") || "").trim() || "passport",
    id_number: String(formData.get("id_number") || "").trim() || null,
    sdf_category: String(formData.get("sdf_category") || "other").trim() || "other",
    sdf_amount: formData.get("sdf_amount")
      ? Number(formData.get("sdf_amount"))
      : null,
    sdf_paid: String(formData.get("sdf_paid") || "") === "on",
    sort_order: count ?? 0,
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=travelers&error=` +
        encodeURIComponent(error.message),
    );
  }
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=travelers&saved=1`);
}

/** Create empty named slots so group size (pax) matches traveler rows. */
export async function seedTravelersFromPax(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const target = Math.min(30, Math.max(1, Number(formData.get("pax") || 0) || 0));
  if (!itinerary_id || !target) {
    redirect(
      `/itineraries/${itinerary_id}?tab=travelers&error=` +
        encodeURIComponent("Set pricing pax on Narrative first"),
    );
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("trip_travelers")
    .select("id, sort_order")
    .eq("agency_id", ctx.agency.id)
    .eq("itinerary_id", itinerary_id)
    .order("sort_order", { ascending: true });

  const have = existing?.length ?? 0;
  if (have >= target) {
    redirect(`/itineraries/${itinerary_id}?tab=travelers&saved=1`);
  }

  const rows = Array.from({ length: target - have }, (_, i) => ({
    agency_id: ctx.agency.id,
    itinerary_id,
    name: `Traveler ${have + i + 1}`,
    sdf_category: "other",
    sort_order: have + i,
  }));

  const { error } = await supabase.from("trip_travelers").insert(rows);
  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=travelers&error=` +
        encodeURIComponent(error.message),
    );
  }
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=travelers&saved=1`);
}

export async function updateTraveler(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) {
    redirect(
      `/itineraries/${itinerary_id}?tab=travelers&error=` +
        encodeURIComponent("Traveler name required"),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_travelers")
    .update({
      name,
      nationality: String(formData.get("nationality") || "").trim() || null,
      id_type: String(formData.get("id_type") || "").trim() || "passport",
      id_number: String(formData.get("id_number") || "").trim() || null,
      sdf_category: String(formData.get("sdf_category") || "other").trim() || "other",
      sdf_amount: formData.get("sdf_amount")
        ? Number(formData.get("sdf_amount"))
        : null,
      sdf_paid: String(formData.get("sdf_paid") || "") === "on",
      notes: String(formData.get("notes") || "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);

  if (error) {
    redirect(
      `/itineraries/${itinerary_id}?tab=travelers&error=` +
        encodeURIComponent(error.message),
    );
  }
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=travelers&saved=1`);
}

export async function deleteTraveler(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx?.agency) redirect("/onboarding");
  const id = String(formData.get("id") || "");
  const itinerary_id = String(formData.get("itinerary_id") || "");
  const supabase = await createClient();
  await supabase
    .from("trip_travelers")
    .delete()
    .eq("id", id)
    .eq("agency_id", ctx.agency.id);
  revalidatePath(`/itineraries/${itinerary_id}`);
  redirect(`/itineraries/${itinerary_id}?tab=travelers`);
}
