import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "html-references", "bhutan-ops-catalog");
const SRC = path.join(OUT, "source");
const IMG_REL = "data/html-references/bhutan-ops-catalog/images/entry-points";

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(OUT, file), "utf8"));
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur.replace(/\r$/, ""));
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur.replace(/\r$/, ""));
    if (row.some((x) => x !== "")) rows.push(row);
  }
  const headers = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function parsePgValues(sql) {
  const start = sql.indexOf("VALUES");
  if (start < 0) return [];
  const body = sql.slice(start + 6).trim().replace(/;\s*$/, "");
  const rows = [];
  let i = 0;
  while (i < body.length) {
    while (i < body.length && (body[i] === "," || /\s/.test(body[i]))) i++;
    if (body[i] !== "(") break;
    i++;
    const fields = [];
    while (i < body.length) {
      while (i < body.length && /\s/.test(body[i])) i++;
      if (body[i] === ")") {
        i++;
        break;
      }
      if (body.slice(i, i + 4).toUpperCase() === "NULL") {
        fields.push(null);
        i += 4;
      } else if (body.slice(i, i + 5).toUpperCase() === "ARRAY") {
        const open = body.indexOf("[", i);
        const close = body.indexOf("]", open);
        const inner = body.slice(open + 1, close);
        const items = [];
        const re = /'((?:\\'|[^'])*)'/g;
        let m;
        while ((m = re.exec(inner))) items.push(m[1].replace(/\\'/g, "'"));
        fields.push(items);
        i = close + 1;
      } else if (body[i] === "'") {
        i++;
        let s = "";
        while (i < body.length) {
          if (body[i] === "'" && body[i + 1] === "'") {
            s += "'";
            i += 2;
            continue;
          }
          if (body[i] === "\\") {
            s += body[i + 1] ?? "";
            i += 2;
            continue;
          }
          if (body[i] === "'") {
            i++;
            break;
          }
          s += body[i++];
        }
        fields.push(s);
      } else if (body[i] === "t" || body[i] === "f") {
        const word = body.slice(i).match(/^(true|false)/i)?.[0];
        fields.push(word.toLowerCase() === "true");
        i += word.length;
      } else {
        let s = "";
        while (i < body.length && body[i] !== "," && body[i] !== ")") s += body[i++];
        const t = s.trim();
        fields.push(t === "" ? null : Number.isNaN(Number(t)) ? t : Number(t));
      }
      while (i < body.length && /\s/.test(body[i])) i++;
      if (body[i] === ",") i++;
    }
    rows.push(fields);
  }
  return rows;
}

function clean(v) {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || s === "null" || s === "undefined") return "";
  return s;
}

function unique(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const s = clean(x);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function digits(phone) {
  const first = String(phone || "").split(/[/|,]/)[0];
  const d = first.replace(/\D/g, "").replace(/^975/, "");
  return d.length >= 7 ? d : "";
}

function wa(phone) {
  const d = digits(phone);
  return d ? `https://wa.me/975${d}` : "";
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/chhimi/g, "chimi")
    .replace(/phodrang/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function row({
  id,
  type,
  subtype,
  name,
  address,
  phone,
  email,
  url,
  photos,
  source,
  details,
}) {
  return {
    id: clean(id),
    type,
    subtype: clean(subtype),
    name: clean(name),
    address: clean(address),
    phone: clean(phone),
    email: clean(email),
    url: clean(url),
    photos: unique(photos || []),
    source: clean(source),
    details: details || {},
  };
}

const hotelsCsv = parseCsv(fs.readFileSync(path.join(SRC, "library_hotels_rows.csv"), "utf8"));
const hotelsJson = readJson("hotels.json");
const hotelCostByKey = new Map(
  hotelsJson.map((h) => [`${norm(h.name)}|${norm(h.city)}`, h]),
);
const hotelSeen = new Set();
const hotels = [];
for (const h of hotelsCsv) {
  const key = `${norm(h.name)}|${norm(h.city || h.location)}`;
  if (hotelSeen.has(key)) continue;
  hotelSeen.add(key);
  const cost = hotelCostByKey.get(key) || {};
  const address = [h.address, h.city || h.location].filter(Boolean).join(", ");
  const photos = unique([h.image_url, ...(String(h.images || "").match(/https?:\/\/[^,\s]+/g) || [])]);
  const phone = h.phone || cost.phone;
  const email = h.email || cost.email;
  hotels.push(
    row({
      id: h.id,
      type: "hotel",
      subtype: [h.star_rating ? `${h.star_rating}-star` : "", h.category, h.room_type || "Standard", cost.meal_plan || h.meal_plan]
        .filter(Boolean)
        .join(" | "),
      name: h.name,
      address,
      phone,
      email,
      url: h.website || wa(phone),
      photos,
      source: "hotels.json + source/library_hotels_rows.csv",
      details: {
        star_rating: h.star_rating || cost.star_rating || "",
        category: h.category,
        meal_plan: cost.meal_plan || h.meal_plan || "",
        high_season_inr: cost.high_season_inr ?? h.cost_per_room_inr,
        high_season_usd: cost.high_season_usd ?? h.cost_per_room_usd,
        low_season_inr: cost.low_season_inr ?? "",
        off_season_inr: cost.off_season_inr ?? "",
        extra_bed_inr: cost.extra_bed_inr ?? h.extra_bed_cost_inr,
        check_in: h.check_in_time,
        check_out: h.check_out_time,
        heating: h.room_heating,
        hot_water: h.hot_water,
        whatsapp: h.whatsapp || wa(phone),
      },
    }),
  );
}

const homestays = readJson("homestays.json").map((h) =>
  row({
    id: `homestay-${h.no}`,
    type: "homestay",
    subtype: [h.certification, h.rooms ? `${h.rooms} rooms` : "", h.beds ? `${h.beds} beds` : ""]
      .filter(Boolean)
      .join(" | "),
    name: h.name,
    address: [h.village, h.dzongkhag].filter(Boolean).join(", "),
    phone: h.phone,
    email: h.email,
    url: h.profile_url || h.whatsapp || wa(h.phone),
    photos: [],
    source: "homestays.json",
    details: {
      dzongkhag: h.dzongkhag,
      village: h.village,
      rooms: h.rooms,
      beds: h.beds,
      license: h.license,
      slug: h.slug,
      whatsapp: h.whatsapp || wa(h.phone),
    },
  }),
);

const guides = readJson("guides.json").map((g) =>
  row({
    id: g.id,
    type: "guide",
    subtype: [g.guide_type, g.gender, Array.isArray(g.languages) ? g.languages.join("/") : g.languages]
      .filter(Boolean)
      .join(" | "),
    name: g.name,
    address: g.city,
    phone: g.phone,
    email: "",
    url: wa(g.phone) || "https://gms.tourism.gov.bt/",
    photos: [],
    source: "guides.json",
    details: {
      license_no: g.license_no,
      languages: g.languages,
      gender: g.gender,
      gender_confidence: g.gender_confidence,
      cost_per_day_inr: g.cost_per_day_inr,
      cost_per_day_usd: g.cost_per_day_usd,
      chinese: g.group_chinese,
      is_active: g.is_active,
    },
  }),
);

const vehiclesJson = readJson("drivers-and-vehicles.json");
const vehicles = (vehiclesJson.categories || []).map((v, i) =>
  row({
    id: `vehicle-${i + 1}`,
    type: "vehicle",
    subtype: `${v.category} | chauffeur-included`,
    name: v.models,
    address: "Bhutan nationwide (operator hire; chauffeur included)",
    phone: "",
    email: "",
    url: "",
    photos: [],
    source: "drivers-and-vehicles.json",
    details: {
      category: v.category,
      pax: v.pax,
      typical_inr_day: v.typical_inr_day,
      typical_usd_day: v.typical_usd_day,
      use: v.use,
      self_drive: false,
    },
  }),
);

const activitySqlPath = fs.existsSync(path.join(SRC, "library_activities_rows.sql"))
  ? path.join(SRC, "library_activities_rows.sql")
  : path.join(ROOT, "supabase", "scripts", "data", "library_activities_rows.sql");
const activityRows = parsePgValues(fs.readFileSync(activitySqlPath, "utf8")).map((f) => ({
  id: f[0],
  name: f[33] || f[1],
  location: f[2] || "",
  category: f[3] || "attraction",
  cost_usd: f[8],
  cost_inr: f[9],
  image_url: f[17],
  images: f[18] || [],
}));
const activityUnique = [];
const actSeen = new Set();
for (const a of activityRows) {
  const key = `${norm(a.name)}|${norm(a.location)}`;
  if (actSeen.has(key)) continue;
  actSeen.add(key);
  activityUnique.push(a);
}

const fees = readJson("entry-fees.json");
const credits = JSON.parse(fs.readFileSync(path.join(OUT, "images", "entry-points", "credits.json"), "utf8"));
const creditsBySlug = new Map(credits.map((c) => [c.slug, c]));

function photosForSlug(slug, extra = []) {
  const c = creditsBySlug.get(slug);
  const local = c?.file ? [`${IMG_REL}/${c.file}`] : [];
  const remote = [c?.source, c?.original].filter(Boolean);
  return unique([...extra, ...local, ...remote]);
}

function matchFee(name, location) {
  const n = norm(name);
  const loc = norm(location);
  return (
    fees.find((f) => norm(f.site) === n) ||
    fees.find((f) => n.includes(norm(f.site)) || norm(f.site).includes(n)) ||
    fees.find((f) => loc && loc === norm(f.dzongkhag) && (n.includes(norm(f.site).split(" ")[0]) || norm(f.site).includes(n.split(" ")[0])))
  );
}

const attractionSeen = new Set();
const attractions = [];
for (const a of activityUnique) {
  const fee = matchFee(a.name, a.location);
  const key = `${norm(a.name)}|${norm(a.location || fee?.dzongkhag)}`;
  attractionSeen.add(key);
  if (fee) attractionSeen.add(`${norm(fee.site)}|${norm(fee.dzongkhag)}`);
  attractions.push(
    row({
      id: a.id,
      type: "attraction",
      subtype: [a.category, fee ? `entry Nu ${fee.fee_nu}` : "no listed fee"].filter(Boolean).join(" | "),
      name: a.name,
      address: a.location || fee?.dzongkhag || "",
      phone: "",
      email: "",
      url: fee?.slug ? `https://www.drukasia.com/bhutan/bhutan-monument-attractions-entrance-fees/` : "",
      photos: photosForSlug(fee?.slug, [a.image_url, ...(a.images || [])]),
      source: "library_activities + entry-fees.json + images/entry-points",
      details: {
        category: a.category,
        fee_nu: fee?.fee_nu ?? a.cost_inr,
        fee_usd: fee?.fee_usd ?? a.cost_usd,
        slug: fee?.slug || "",
      },
    }),
  );
}

for (const f of fees) {
  const key = `${norm(f.site)}|${norm(f.dzongkhag)}`;
  if ([...attractionSeen].some((k) => k.startsWith(norm(f.site)) || norm(f.site).includes(k.split("|")[0]))) {
    const already = attractions.some((a) => norm(a.name) === norm(f.site) || norm(a.name).includes(norm(f.site)) || norm(f.site).includes(norm(a.name)));
    if (already) continue;
  }
  if (attractionSeen.has(key)) continue;
  attractionSeen.add(key);
  attractions.push(
    row({
      id: `entry-${f.slug}`,
      type: "attraction",
      subtype: f.fee_nu ? `entry-point | entry Nu ${f.fee_nu}` : "entry-point",
      name: f.site,
      address: f.dzongkhag,
      phone: "",
      email: "",
      url: "https://www.drukasia.com/bhutan/bhutan-monument-attractions-entrance-fees/",
      photos: photosForSlug(f.slug),
      source: "entry-fees.json + images/entry-points",
      details: { fee_nu: f.fee_nu, fee_usd: f.fee_usd, slug: f.slug },
    }),
  );
}

const rows = [...hotels, ...homestays, ...guides, ...vehicles, ...attractions];
const typeOrder = { hotel: 1, homestay: 2, guide: 3, vehicle: 4, attraction: 5 };
rows.sort((a, b) => (typeOrder[a.type] || 9) - (typeOrder[b.type] || 9) || a.name.localeCompare(b.name));

const csvHeaders = ["id", "type", "subtype", "name", "address", "phone", "email", "url", "photos", "source"];
const csv = [
  csvHeaders.join(","),
  ...rows.map((r) =>
    csvHeaders
      .map((h) => csvEscape(h === "photos" ? r.photos.join(" | ") : r[h]))
      .join(","),
  ),
].join("\n");

const counts = {};
for (const r of rows) counts[r.type] = (counts[r.type] || 0) + 1;

const master = {
  generated_at: new Date().toISOString().slice(0, 10),
  folder: "data/html-references/bhutan-ops-catalog",
  how_to_use:
    "This is the canonical Bhutan ops lookup. Filter `type` (hotel | homestay | guide | vehicle | attraction). Columns: name, address, phone, email, url, photos, subtype. `details` holds rates/rooms/licenses. Per-type files remain the richer source if a field is empty here.",
  counts: { total: rows.length, ...counts },
  coverage: {
    hotels: "Silverpine dump ~99 unique hotels — not the full DOT hotel directory (~203+).",
    homestays: "DOT certified VHS 123 + 4 extra licensed portal profiles.",
    guides: "Silverpine dump ~100 guides — national pool is much larger. Gender is heuristic.",
    vehicles: "Hire categories only; no named public driver roster. Chauffeur included.",
    attractions: "Library activities + entry-fee sites + local entry-point photos.",
  },
  related_files: {
    hotels: "hotels.json / hotels.csv",
    homestays: "homestays.json / homestays.csv / homestays-by-dzongkhag.json",
    guides: "guides.json / guides.csv / guides-by-group.json / guide-rates.csv",
    vehicles: "drivers-and-vehicles.json / vehicles.csv",
    attractions: "entry-fees.json / images/entry-points/",
    costing: "cost-sheet.json",
  },
  rows,
};

fs.writeFileSync(path.join(OUT, "MASTER.json"), JSON.stringify(master, null, 2));
fs.writeFileSync(path.join(OUT, "MASTER.csv"), csv);

const summaryPath = path.join(OUT, "_summary.json");
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
summary.master_sheet = {
  csv: "MASTER.csv",
  json: "MASTER.json",
  readme: "README.md",
  rows: rows.length,
  counts,
};
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(JSON.stringify({ total: rows.length, counts }, null, 2));
