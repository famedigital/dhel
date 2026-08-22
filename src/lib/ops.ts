import { createClient } from "@/lib/supabase/server";

/**
 * Ensure agency has seed live inventory (Pelbu Suites rooms + sample guide/driver).
 * Idempotent: skips if any hotel already exists for the agency.
 */
export async function ensureOpsSeed(agencyId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("hotels")
    .select("id")
    .eq("agency_id", agencyId)
    .limit(1);
  if (existing && existing.length > 0) return { seeded: false };

  const { data: hotel, error: hErr } = await supabase
    .from("hotels")
    .insert({
      agency_id: agencyId,
      name: "Pelbu Suites",
      city: "Thimphu",
      phone: "+975 17 000 100",
      email: "stay@pelbusuites.bt",
      address: "Thimphu, Bhutan",
      notes: "Primary inventory — update room numbers live from Resources.",
      active: true,
    })
    .select("id")
    .single();

  if (hErr || !hotel) {
    return { seeded: false, error: hErr?.message };
  }

  const rooms = [
    { room_number: "101", room_type: "Deluxe Twin", status: "available" },
    { room_number: "102", room_type: "Deluxe Double", status: "available" },
    { room_number: "201", room_type: "Suite Valley", status: "available" },
    { room_number: "202", room_type: "Suite Mountain", status: "available" },
    { room_number: "301", room_type: "Family Twin", status: "available" },
  ].map((r) => ({
    agency_id: agencyId,
    hotel_id: hotel.id,
    ...r,
  }));

  await supabase.from("rooms").insert(rooms);

  await supabase.from("guides").insert([
    {
      agency_id: agencyId,
      name: "Kinley Dorji",
      phone: "+975 17 111 201",
      languages: "English, Dzongkha",
      license_no: "BTN-G-2018-044",
      active: true,
    },
    {
      agency_id: agencyId,
      name: "Pema Lhamo",
      phone: "+975 17 111 202",
      languages: "English, Chinese, Dzongkha",
      license_no: "BTN-G-2020-118",
      active: true,
    },
  ]);

  await supabase.from("drivers").insert([
    {
      agency_id: agencyId,
      name: "Tashi Wangchuk",
      phone: "+975 17 222 301",
      vehicle_type: "Hyundai Santa Fe",
      plate: "BP-1-A1234",
      active: true,
    },
    {
      agency_id: agencyId,
      name: "Sonam Tshering",
      phone: "+975 17 222 302",
      vehicle_type: "Toyota Prado",
      plate: "BP-2-B5678",
      active: true,
    },
  ]);

  return { seeded: true };
}

export async function loadItineraryOps(agencyId: string, itineraryId: string) {
  const supabase = await createClient();
  const [staysR, staffR, paymentsR, hotelsR, roomsR, guidesR, driversR, travelersR, flightsR] =
    await Promise.all([
      supabase
        .from("itinerary_stays")
        .select("*, hotels(*), rooms(*)")
        .eq("agency_id", agencyId)
        .eq("itinerary_id", itineraryId)
        .order("check_in", { ascending: true }),
      supabase
        .from("itinerary_staff")
        .select("*, guides(*), drivers(*)")
        .eq("agency_id", agencyId)
        .eq("itinerary_id", itineraryId),
      supabase
        .from("payments")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("itinerary_id", itineraryId)
        .order("created_at", { ascending: true }),
      supabase.from("hotels").select("*").eq("agency_id", agencyId).eq("active", true),
      supabase.from("rooms").select("*").eq("agency_id", agencyId),
      supabase.from("guides").select("*").eq("agency_id", agencyId).eq("active", true),
      supabase.from("drivers").select("*").eq("agency_id", agencyId).eq("active", true),
      supabase
        .from("trip_travelers")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("itinerary_id", itineraryId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("trip_flights")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("itinerary_id", itineraryId)
        .order("created_at", { ascending: true }),
    ]);

  return {
    stays: staysR.data || [],
    staff: staffR.data || [],
    payments: paymentsR.data || [],
    hotels: hotelsR.data || [],
    rooms: roomsR.data || [],
    guides: guidesR.data || [],
    drivers: driversR.data || [],
    travelers: travelersR.data || [],
    flights: flightsR.data || [],
  };
}
