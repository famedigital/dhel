/**
 * Ingest bhutan-ops-catalog MASTER.json →
 * 1) src/lib/catalog/master-hotels.generated.json (runtime fallback)
 * 2) Optional Supabase upsert when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set
 *
 * Usage: node scripts/ingest-master-catalog.mjs
 *        node scripts/ingest-master-catalog.mjs --db
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const masterPath = path.join(
  root,
  "data/html-references/bhutan-ops-catalog/MASTER.json",
);
const outHotels = path.join(root, "src/lib/catalog/master-hotels.generated.json");
const outGuides = path.join(root, "src/lib/catalog/master-guides.generated.json");

function loadMaster() {
  const raw = JSON.parse(fs.readFileSync(masterPath, "utf8"));
  const rows = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
  return rows;
}

function cityFromAddress(address) {
  if (!address || typeof address !== "string") return "Bhutan";
  const first = address.split(",")[0]?.trim();
  return first || "Bhutan";
}

function starFromDetails(details, subtype) {
  const s = details?.star_rating ?? subtype?.match(/(\d)\s*[-]?\s*star/i)?.[1];
  const n = Number(s);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 3;
}

function mapHotels(rows) {
  return rows
    .filter((r) => r.type === "hotel")
    .map((r) => {
      const details = r.details || {};
      const netUsd =
        Number(details.high_season_usd) ||
        (Number(details.high_season_inr) ? Number(details.high_season_inr) / 84 : 45);
      const meal = details.meal_plan || "BB";
      const city = cityFromAddress(r.address);
      const name = r.name;
      const isPelbu = /pelbu/i.test(name);
      return {
        id: r.id || `master-${r.name}`,
        name,
        city,
        star_rating: starFromDetails(details, r.subtype),
        source: isPelbu ? "pelbu" : "catalog",
        pelbu_property_id: isPelbu ? "pelbu-olakha" : undefined,
        rooms: [
          {
            type: "Standard",
            net_usd: Math.max(25, Math.round(netUsd)),
            meal,
          },
        ],
        phone: r.phone || undefined,
        email: r.email || undefined,
        photos: r.photos || [],
      };
    })
    .filter((h) => h.name && h.rooms[0].net_usd > 0);
}

function mapGuides(rows) {
  return rows
    .filter((r) => r.type === "guide")
    .map((r) => {
      const details = r.details || {};
      return {
        id: r.id || `guide-${r.name}`,
        name: r.name,
        phone: r.phone || null,
        languages: details.languages || r.subtype || "English",
        license_no: details.license_no || details.license || null,
        day_rate_usd: Number(details.day_rate_usd) || 30,
        active: true,
        notes: r.address || null,
      };
    })
    .filter((g) => g.name);
}

function mapVehicles(rows) {
  return rows
    .filter((r) => r.type === "vehicle")
    .map((r) => {
      const details = r.details || {};
      return {
        id: r.id || `vehicle-${r.name}`,
        name: r.name,
        phone: r.phone || null,
        vehicle_type: r.subtype || r.name,
        plate: details.plate || null,
        day_rate_usd: Number(details.day_rate_usd || details.day_rate_inr / 84) || 60,
        active: true,
      };
    });
}

async function upsertDb(hotels, guides, vehicles) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("Skip DB: set SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let hotelOk = 0;
  for (const h of hotels) {
    const { data, error } = await supabase
      .from("catalog_hotels")
      .upsert(
        {
          name: h.name,
          city: h.city,
          source: "catalog",
          active: true,
          metadata: {
            star_rating: h.star_rating,
            phone: h.phone,
            email: h.email,
            photos: h.photos,
            master_id: h.id,
          },
        },
        { onConflict: "name,city" },
      )
      .select("id")
      .maybeSingle();
    if (error || !data?.id) {
      console.warn("hotel upsert", h.name, error?.message);
      continue;
    }
    hotelOk++;
    for (const room of h.rooms) {
      await supabase.from("catalog_room_rates").upsert(
        {
          catalog_hotel_id: data.id,
          room_type: room.type,
          net_usd: room.net_usd,
          meal: room.meal,
          currency: "USD",
        },
        { onConflict: "catalog_hotel_id,room_type" },
      );
    }
  }

  let guideOk = 0;
  for (const g of guides) {
    const { error } = await supabase.from("catalog_guides").insert({
      name: g.name,
      phone: g.phone,
      languages: g.languages,
      license_no: g.license_no,
      day_rate_usd: g.day_rate_usd,
      active: true,
      notes: g.notes,
    });
    if (!error) guideOk++;
  }

  let vehicleOk = 0;
  for (const v of vehicles) {
    const { error } = await supabase.from("catalog_drivers").insert({
      name: v.name,
      phone: v.phone,
      vehicle_type: v.vehicle_type,
      plate: v.plate,
      day_rate_usd: v.day_rate_usd,
      active: true,
    });
    if (!error) vehicleOk++;
  }

  console.log(`DB upsert: hotels=${hotelOk} guides=${guideOk} vehicles=${vehicleOk}`);
}

const rows = loadMaster();
const hotels = mapHotels(rows);
const guides = mapGuides(rows);
const vehicles = mapVehicles(rows);

fs.mkdirSync(path.dirname(outHotels), { recursive: true });
fs.writeFileSync(
  outHotels,
  JSON.stringify(
    { generated_at: new Date().toISOString(), count: hotels.length, hotels },
    null,
    2,
  ),
);
fs.writeFileSync(
  outGuides,
  JSON.stringify(
    { generated_at: new Date().toISOString(), count: guides.length, guides, vehicles },
    null,
    2,
  ),
);
console.log(`Wrote ${hotels.length} hotels → ${outHotels}`);
console.log(`Wrote ${guides.length} guides / ${vehicles.length} vehicles → ${outGuides}`);

if (process.argv.includes("--db")) {
  await upsertDb(hotels, guides, vehicles);
}
