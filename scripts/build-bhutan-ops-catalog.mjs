import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "html-references", "bhutan-ops-catalog");
const IMG = path.join(OUT, "images", "entry-points");
const DATA = path.join(ROOT, "supabase", "scripts", "data");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, headers) {
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ].join("\n");
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

function mealPlan(h) {
  const raw = (h.meal_plan || "").toString().trim().toUpperCase();
  if (["MAP", "BB", "CP", "EP", "AP"].includes(raw)) return raw;
  if (h.breakfast_included && (h.lunch_available || h.dinner_available)) return "MAP";
  if (h.breakfast_included) return "BB";
  return "EP";
}

function inferGender(name) {
  const n = String(name || "").toLowerCase().replace(/\s+/g, " ").trim();
  const femaleExact = new Set([
    "sonam choden",
    "ugyen tshomo",
    "karma zangmo",
    "sonam lhamo",
    "yangchen pem",
    "chimi dem",
    "tandin choki",
    "dorji bidha",
    "chencho lham",
  ]);
  if (femaleExact.has(n)) return { gender: "female", gender_confidence: "name_lexicon" };
  const femaleTokens =
    /(tshomo|lhamo|\blham\b|wangmo|zangmo|choden|deki|dema|\bdem\b|bidha|yangchen|yangzom|pelmo|dolma|choki|wangzom|lhadon|selden)$/;
  const last = n.split(" ").slice(-1)[0] || "";
  if (femaleTokens.test(last) || femaleTokens.test(n)) {
    return { gender: "female", gender_confidence: "name_suffix" };
  }
  const maleTokens =
    /(wangchuk|wangchuk|dorji|tshering|gyeltshen|tobgay|penjor|wangdi|rinchen|jigme|phuntsho|dendup|norbu|chophel|yoezer|tandin|namgay|sangay|kinley|tenzin|karma|ugyen|tashi|sonam|pema|dawa|nima|thinley)/;
  if (maleTokens.test(last) || maleTokens.test(n)) {
    return { gender: "male", gender_confidence: "name_heuristic_unconfirmed" };
  }
  return { gender: "unknown", gender_confidence: "needs_gms_lookup" };
}

function languageGroups(langs) {
  const list = (Array.isArray(langs) ? langs : String(langs || "").split(/[,/|]/))
    .map((s) => s.trim())
    .filter(Boolean);
  const lower = list.map((s) => s.toLowerCase());
  const has = (re) => lower.some((s) => re.test(s));
  return {
    languages: list.length ? list : ["English"],
    group_chinese: has(/chinese|mandarin|putonghua|中文/),
    group_japanese: has(/japanese|nihongo|日本語/),
    group_korean: has(/korean|hangul|한국어/),
    group_hindi: has(/hindi|हिन्दी/),
    group_european: has(/french|german|spanish|italian|portuguese|russian/),
    group_dzongkha: has(/dzongkha/),
    group_english: has(/english/) || list.length === 0,
    group_other: list.filter((s) => !/english|chinese|mandarin|japanese|korean|hindi|dzongkha|french|german|spanish/i.test(s)),
  };
}

function roundMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  return Math.round(Number(n) * 100) / 100;
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": UA, ...headers } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, headers).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, buf });
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(45000, () => req.destroy(new Error(`timeout ${url}`)));
  });
}

async function downloadFile(url, dest) {
  const { status, buf, headers } = await get(url, { Accept: "*/*" });
  if (status !== 200) throw new Error(`HTTP ${status} ${url}`);
  const type = String(headers["content-type"] || "");
  if (type.includes("text/html")) throw new Error(`HTML not image ${url}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function commonsThumb(filename, dest) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    `File:${filename}`,
  )}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1600&format=json`;
  const { buf } = await get(api, { Accept: "application/json" });
  const json = JSON.parse(buf.toString("utf8"));
  const page = Object.values(json.query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`no commons info ${filename}`);
  await downloadFile(info.thumburl || info.url, dest);
  return {
    file: path.basename(dest),
    source_page: `https://commons.wikimedia.org/wiki/File:${filename.replace(/ /g, "_")}`,
    artist: info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, "") || "",
    license: info.extmetadata?.LicenseShortName?.value || "",
    original: info.url,
  };
}

const hotelSql = fs.readFileSync(path.join(DATA, "library_hotels_rows.sql"), "utf8");
const guideSql = fs.readFileSync(path.join(DATA, "library_guides_rows.sql"), "utf8");
const activitySql = fs.readFileSync(path.join(DATA, "library_activities_rows.sql"), "utf8");

const hotelRows = parsePgValues(hotelSql).map((f) => ({
  id: f[0],
  name: f[1],
  location: f[2],
  category: f[3],
  star_rating: f[4],
  cost_per_room_inr: f[5],
  cost_per_room_usd: f[6],
  room_type: f[7] || "Standard",
  max_occupancy: f[8],
  extra_bed_cost_inr: f[9],
  breakfast_included: f[10],
  lunch_available: f[11],
  dinner_available: f[12],
  meal_plan: f[13],
  image_url: f[14],
  phone: f[25],
  email: f[26],
  website: f[27],
  is_active: f[28],
  city: f[18] || f[2],
}));

const guideRows = parsePgValues(guideSql).map((f) => {
  const name = f[20] || f[1];
  const langs = languageGroups(f[2]);
  const gender = inferGender(name);
  return {
    id: f[0],
    name,
    languages: langs.languages.join(", "),
    guide_type: f[3],
    license_no: f[4],
    cost_per_day_inr: f[7],
    cost_per_day_usd: f[8],
    city: f[10],
    phone: f[11],
    is_active: f[15],
    ...langs,
    ...gender,
  };
});

const activityRows = parsePgValues(activitySql).map((f) => ({
  id: f[0],
  name: f[33] || f[1],
  location: f[2],
  category: f[3],
  cost_usd: f[8],
  cost_inr: f[9],
  image_url: f[17],
  images: f[18] || [],
}));

const uniqueHotels = [];
const hotelSeen = new Set();
for (const h of hotelRows) {
  const key = `${h.name}||${h.city || h.location}`;
  if (hotelSeen.has(key)) continue;
  hotelSeen.add(key);
  uniqueHotels.push(h);
}

const uniqueActivities = [];
const actSeen = new Set();
for (const a of activityRows) {
  const key = `${String(a.name).toLowerCase()}||${String(a.location || "").toLowerCase()}`;
  if (actSeen.has(key)) continue;
  actSeen.add(key);
  uniqueActivities.push(a);
}

const seasons = {
  high: { months: ["Mar", "Apr", "May", "Sep", "Oct", "Nov"], factor: 1 },
  low: { months: ["Dec", "Jan", "Feb"], factor: 0.85 },
  off: { months: ["Jun", "Jul", "Aug"], factor: 0.7 },
};

const hotelCost = uniqueHotels.map((h) => {
  const meal = mealPlan(h);
  const highInr = Number(h.cost_per_room_inr) || null;
  const highUsd = Number(h.cost_per_room_usd) || (highInr ? roundMoney(highInr / 84) : null);
  return {
    name: h.name,
    city: h.city || h.location,
    star_rating: h.star_rating,
    category: h.category,
    room_type: h.room_type || "Standard",
    meal_plan: meal,
    high_season_inr: highInr,
    high_season_usd: highUsd,
    low_season_inr: highInr == null ? null : Math.round(highInr * seasons.low.factor),
    low_season_usd: highUsd == null ? null : roundMoney(highUsd * seasons.low.factor),
    off_season_inr: highInr == null ? null : Math.round(highInr * seasons.off.factor),
    off_season_usd: highUsd == null ? null : roundMoney(highUsd * seasons.off.factor),
    extra_bed_inr: h.extra_bed_cost_inr,
    phone: h.phone,
    email: h.email,
    image_url: h.image_url,
    seasonal_note: "High = listed Silverpine net. Low/off are planning bands (85%/70%), not hotel contracts.",
  };
});

const vehicles = [
  { category: "Hatchback / city taxi", models: "Alto, WagonR, i20, Eeco", pax: "2–3 + driver", typical_inr_day: 3500, typical_usd_day: 42, use: "Local hops / tight budget; rarely used for multi-day FIT" },
  { category: "Compact SUV", models: "Hyundai Creta, Tucson, Santa Fe, Mahindra Scorpio, Bolero", pax: "3–4 + driver", typical_inr_day: 4500, typical_usd_day: 54, use: "Standard 2–4 pax FIT, Indian FIT workhorse" },
  { category: "MPV / family", models: "Toyota Innova / Innova Crysta, Ertiga, Hyundai H1", pax: "5–6 + driver", typical_inr_day: 5500, typical_usd_day: 66, use: "Families with luggage; H1 as van alternative" },
  { category: "Luxury SUV", models: "Toyota Land Cruiser Prado", pax: "3–4 + driver", typical_inr_day: 7000, typical_usd_day: 84, use: "VIP / Chinese FIT / winter snow routes" },
  { category: "Premium 4WD", models: "Toyota Land Cruiser 200/300", pax: "3–4 + driver", typical_inr_day: 14000, typical_usd_day: 167, use: "High-end FIT, east Bhutan, rough roads" },
  { category: "Minivan", models: "Toyota Hiace", pax: "7–8 + driver", typical_inr_day: 7500, typical_usd_day: 89, use: "Small groups 5–8 pax" },
  { category: "High-roof van", models: "Toyota Hiace Highroof", pax: "8 + driver", typical_inr_day: 9000, typical_usd_day: 107, use: "Comfort groups, taller guests, more luggage" },
  { category: "Coaster minibus", models: "Toyota Coaster 4-cyl / 6-cyl", pax: "18–21 + driver", typical_inr_day: 10500, typical_usd_day: 125, use: "Coach groups; 6-cyl ~ Nu 12,000" },
  { category: "Pickup / utility", models: "Toyota Hilux, Isuzu D-Max", pax: "3–4 + driver", typical_inr_day: 5500, typical_usd_day: 66, use: "Trekking support, east / farm roads" },
];

const guideRates = [
  { market: "Indian / regional FIT", languages: "English / Hindi", day_inr: 2500, day_usd: 35, notes: "Silverpine library default; chauffeur not included" },
  { market: "International FIT (EN)", languages: "English", day_inr: 7140, day_usd: 85, notes: "App seed default for USD packages" },
  { market: "Chinese / Mandarin specialist", languages: "Mandarin + English", day_inr: 4500, day_usd: 55, notes: "Premium; scarce in high season — confirm before costing" },
  { market: "Japanese / Korean / European language", languages: "JP / KR / FR / DE / ES", day_inr: 5000, day_usd: 60, notes: "Very limited pool; book early" },
  { market: "Female guide request", languages: "as available", day_inr: 2500, day_usd: 35, notes: "Same base rate; availability tighter (~122 licensed female nationally)" },
];

const entryFees = [
  { dzongkhag: "Paro", site: "Taktsang (Tiger's Nest)", fee_nu: 1000, fee_usd: 12, slug: "taktsang" },
  { dzongkhag: "Paro", site: "National Museum (Ta Dzong)", fee_nu: 500, fee_usd: 6, slug: "ta-dzong" },
  { dzongkhag: "Paro", site: "Kyichu Lhakhang", fee_nu: 500, fee_usd: 6, slug: "kyichu" },
  { dzongkhag: "Paro", site: "Dungtse / Dumtse Lhakhang", fee_nu: 500, fee_usd: 6, slug: "dungtse" },
  { dzongkhag: "Paro", site: "Paro Rinpung Dzong", fee_nu: 500, fee_usd: 6, slug: "rinpung-dzong" },
  { dzongkhag: "Thimphu", site: "Tashichho Dzong", fee_nu: 500, fee_usd: 6, slug: "tashichho-dzong" },
  { dzongkhag: "Thimphu", site: "Simtokha Dzong", fee_nu: 500, fee_usd: 6, slug: "simtokha-dzong" },
  { dzongkhag: "Thimphu", site: "Changangkha Lhakhang", fee_nu: 500, fee_usd: 6, slug: "changangkha" },
  { dzongkhag: "Thimphu", site: "National Memorial Chorten", fee_nu: 500, fee_usd: 6, slug: "memorial-chorten" },
  { dzongkhag: "Thimphu", site: "Buddha Dordenma", fee_nu: 300, fee_usd: 3.6, slug: "buddha-dordenma" },
  { dzongkhag: "Thimphu", site: "Royal Textile Academy", fee_nu: 500, fee_usd: 6, slug: "textile-academy" },
  { dzongkhag: "Thimphu", site: "Zorig Chusum (Painting School)", fee_nu: 500, fee_usd: 6, slug: "zorig-chusum-thimphu" },
  { dzongkhag: "Thimphu", site: "Institute of Traditional Medicine", fee_nu: 500, fee_usd: 6, slug: "traditional-medicine" },
  { dzongkhag: "Thimphu", site: "Folk Heritage Museum", fee_nu: 300, fee_usd: 3.6, slug: "folk-heritage" },
  { dzongkhag: "Thimphu", site: "Simply Bhutan", fee_nu: 1000, fee_usd: 12, slug: "simply-bhutan" },
  { dzongkhag: "Thimphu", site: "Choki Traditional Art School", fee_nu: 1000, fee_usd: 12, slug: "choki-art" },
  { dzongkhag: "Thimphu", site: "Postal Museum", fee_nu: 250, fee_usd: 2.9, slug: "postal-museum" },
  { dzongkhag: "Thimphu", site: "Motithang Takin Preserve", fee_nu: 300, fee_usd: 3.6, slug: "takin-preserve" },
  { dzongkhag: "Thimphu", site: "Changyul Park", fee_nu: 100, fee_usd: 1.2, slug: "changyul-park" },
  { dzongkhag: "Thimphu", site: "Tachogang Lhakhang", fee_nu: 300, fee_usd: 3.6, slug: "tachogang" },
  { dzongkhag: "Thimphu", site: "Serbithang Botanical Park", fee_nu: 100, fee_usd: 1.2, slug: "serbithang" },
  { dzongkhag: "Lamperi", site: "Royal Botanical Gardens", fee_nu: 100, fee_usd: 1.2, slug: "lamperi-gardens" },
  { dzongkhag: "Punakha", site: "Punakha Dzong", fee_nu: 500, fee_usd: 6, slug: "punakha-dzong" },
  { dzongkhag: "Punakha", site: "Chimi Lhakhang", fee_nu: 500, fee_usd: 6, slug: "chimi-lhakhang" },
  { dzongkhag: "Punakha", site: "Khamsum Yulley Namgyal Chorten", fee_nu: 100, fee_usd: 1.2, slug: "khamsum" },
  { dzongkhag: "Punakha", site: "Sangchen Dorji Lhendrup Nunnery", fee_nu: 200, fee_usd: 2.4, slug: "sangchen-nunnery" },
  { dzongkhag: "Wangdue Phodrang", site: "Wangduephodrang Dzong", fee_nu: 500, fee_usd: 6, slug: "wangdue-dzong" },
  { dzongkhag: "Phobjikha", site: "Black-Necked Crane Centre", fee_nu: 200, fee_usd: 2.4, slug: "crane-centre" },
  { dzongkhag: "Trongsa", site: "Trongsa Dzong", fee_nu: 500, fee_usd: 6, slug: "trongsa-dzong" },
  { dzongkhag: "Trongsa", site: "Ta Dzong Museum", fee_nu: 500, fee_usd: 6, slug: "trongsa-ta-dzong" },
  { dzongkhag: "Bumthang", site: "Jambay Lhakhang", fee_nu: 500, fee_usd: 6, slug: "jambay-lhakhang" },
  { dzongkhag: "Bumthang", site: "Wangdicholing Palace Museum", fee_nu: 500, fee_usd: 6, slug: "wangdicholing" },
  { dzongkhag: "Bumthang", site: "Ogyen Choling Museum", fee_nu: 400, fee_usd: 4.8, slug: "ogyen-choling" },
  { dzongkhag: "Trashi Yangtse", site: "Zorig Chusum Institute", fee_nu: 100, fee_usd: 1.2, slug: "zorig-yangtse" },
  { dzongkhag: "Trashigang", site: "Trashigang Dzong", fee_nu: 500, fee_usd: 6, slug: "trashigang-dzong" },
  { dzongkhag: "Mongar", site: "Mongar Dzong", fee_nu: 500, fee_usd: 6, slug: "mongar-dzong" },
  { dzongkhag: "Lhuentse", site: "Lhuentse Dzong", fee_nu: 500, fee_usd: 6, slug: "lhuentse-dzong" },
  { dzongkhag: "Border", site: "Phuentsholing immigration gate", fee_nu: 0, fee_usd: 0, slug: "phuentsholing-gate" },
  { dzongkhag: "Border", site: "Paro International Airport (PBH)", fee_nu: 0, fee_usd: 0, slug: "paro-airport" },
  { dzongkhag: "Border", site: "Gelephu land entry", fee_nu: 0, fee_usd: 0, slug: "gelephu-entry" },
  { dzongkhag: "Border", site: "Samdrup Jongkhar land entry", fee_nu: 0, fee_usd: 0, slug: "samdrup-jongkhar-entry" },
];

const female = guideRows.filter((g) => g.gender === "female");
const male = guideRows.filter((g) => g.gender === "male");
const unknown = guideRows.filter((g) => g.gender === "unknown");
const chinese = guideRows.filter((g) => g.group_chinese);
const otherLang = guideRows.filter((g) => !g.group_english || g.group_other.length || g.group_hindi || g.group_japanese);

ensureDir(OUT);
ensureDir(IMG);

fs.writeFileSync(path.join(OUT, "hotels.json"), JSON.stringify(hotelCost, null, 2));
fs.writeFileSync(
  path.join(OUT, "hotels.csv"),
  toCsv(hotelCost, [
    "name",
    "city",
    "star_rating",
    "category",
    "room_type",
    "meal_plan",
    "high_season_inr",
    "high_season_usd",
    "low_season_inr",
    "low_season_usd",
    "off_season_inr",
    "off_season_usd",
    "phone",
    "email",
  ]),
);

fs.writeFileSync(path.join(OUT, "guides.json"), JSON.stringify(guideRows, null, 2));
fs.writeFileSync(
  path.join(OUT, "guides.csv"),
  toCsv(guideRows, [
    "name",
    "gender",
    "gender_confidence",
    "languages",
    "group_chinese",
    "group_english",
    "guide_type",
    "license_no",
    "city",
    "phone",
    "cost_per_day_inr",
    "cost_per_day_usd",
  ]),
);

fs.writeFileSync(
  path.join(OUT, "guides-by-group.json"),
  JSON.stringify(
    {
      note: "Gender is inferred from Bhutanese name patterns because the Silverpine dump has no gender field. Confirm against https://gms.tourism.gov.bt/. Language fields in the dump are almost all English only — Chinese/other speakers exist nationally but were not tagged in this export.",
      counts: {
        total: guideRows.length,
        female: female.length,
        male: male.length,
        unknown: unknown.length,
        chinese_tagged: chinese.length,
        other_language_tagged: otherLang.length,
      },
      female,
      male,
      unknown,
      chinese,
      other_languages: otherLang,
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(OUT, "drivers-and-vehicles.json"),
  JSON.stringify(
    {
      note: "Bhutan does not publish a public national roster of tourist drivers. Licensed tour operators hire/contract chauffeurs with the vehicle. This file is the agent-hire vehicle catalog (chauffeur included, guide extra, fuel usually included for standard west-Bhutan routing; extra km/east/winter may surcharge).",
      hire_rules: {
        self_drive: false,
        chauffeur_included: true,
        guide_included: false,
        typical_booking_lead_days: 20,
        popular_models: ["Santa Fe", "Tucson", "Creta", "Hiace", "Prado", "Innova", "Coaster", "H1", "Hilux"],
      },
      categories: vehicles,
      drivers_in_this_dataset: [],
    },
    null,
    2,
  ),
);

fs.writeFileSync(path.join(OUT, "vehicles.csv"), toCsv(vehicles, ["category", "models", "pax", "typical_inr_day", "typical_usd_day", "use"]));
fs.writeFileSync(path.join(OUT, "guide-rates.csv"), toCsv(guideRates, ["market", "languages", "day_inr", "day_usd", "notes"]));
fs.writeFileSync(path.join(OUT, "entry-fees.json"), JSON.stringify(entryFees, null, 2));
fs.writeFileSync(
  path.join(OUT, "entry-fees.csv"),
  toCsv(entryFees, ["dzongkhag", "site", "fee_nu", "fee_usd", "slug"]),
);

const costSheet = {
  generated_at: new Date().toISOString().slice(0, 10),
  fx: { USD_INR: 84, USD_BTN: 84 },
  seasons,
  hotels: hotelCost,
  guides: guideRates,
  cars: vehicles,
  entry_fees: entryFees,
  sdf: {
    indian_or_saarc_ppn_usd: 15,
    international_ppn_usd: 100,
  },
};

fs.writeFileSync(path.join(OUT, "cost-sheet.json"), JSON.stringify(costSheet, null, 2));

const summary = {
  generated_at: new Date().toISOString(),
  live_db: {
    project: "npqxvxvwjanpjlpggddx (pelbuItinerary)",
    public_tables: "none after restore — catalog_hotels / catalog_guides / catalog_drivers do not exist yet",
  },
  this_folder: "data/html-references/bhutan-ops-catalog",
  hotels: {
    rows: uniqueHotels.length,
    cities: [...new Set(uniqueHotels.map((h) => h.city || h.location))].sort(),
    coverage: "Silverpine library dump (~100 rows; Table Editor export cap). Official DOT registered hotels 2025 is larger (~300+ star hotels). Not a complete national inventory.",
  },
  guides: {
    rows: guideRows.length,
    female: female.length,
    male: male.length,
    unknown: unknown.length,
    chinese_tagged: chinese.length,
    coverage: "Silverpine dump of licensed guides, languages almost all English. National pool ~1,809 certified guides / ~122 female (DoT statements). Confirm gender/language on GMS.",
  },
  drivers: {
    named_drivers: 0,
    vehicle_categories: vehicles.length,
    coverage: "No public driver directory. Vehicle categories + agent-quoted day rates collected.",
  },
  entry_fees: entryFees.length,
  sources: [
    "supabase/scripts/data/library_hotels_rows.sql",
    "supabase/scripts/data/library_guides_rows.sql",
    "supabase/scripts/data/library_activities_rows.sql",
    "https://www.drukasia.com/bhutan/bhutan-monument-attractions-entrance-fees/ (Jan 2026)",
    "https://www.windhorsetours.com/bhutan/bhutan-travel-info/entrance-fees-monuments-bhutan/ (2026)",
    "https://www.heavenlybhutan.com/car-rentals-in-bt/",
    "https://www.bhutantravelservice.com/car-rental",
    "https://gms.tourism.gov.bt/",
    "https://services.bhutan.travel/search/hotel",
  ],
};

fs.writeFileSync(path.join(OUT, "_summary.json"), JSON.stringify(summary, null, 2));

const activityImageMap = [
  { slug: "taktsang", match: /taktsang|tiger/i },
  { slug: "punakha-dzong", match: /punakha dzong/i },
  { slug: "tashichho-dzong", match: /tashichho/i },
  { slug: "buddha-dordenma", match: /buddha dordenma/i },
  { slug: "kyichu", match: /kyichu/i },
  { slug: "chimi-lhakhang", match: /chhimi|chimi/i },
  { slug: "memorial-chorten", match: /memorial chorten/i },
  { slug: "takin-preserve", match: /takin/i },
  { slug: "simtokha-dzong", match: /simtokha/i },
  { slug: "changangkha", match: /changangkha/i },
  { slug: "rinpung-dzong", match: /rinpung/i },
  { slug: "ta-dzong", match: /national museum|ta dzong/i },
  { slug: "trongsa-dzong", match: /trongsa dzong/i },
  { slug: "wangdue-dzong", match: /wangdue/i },
  { slug: "jambay-lhakhang", match: /jambay/i },
  { slug: "paro-airport", match: /paro airport/i },
];

const commonsFiles = [
  { slug: "phuentsholing-gate", file: "Immigration Check-Post, Phuentsholing, Bhutan.jpg" },
  { slug: "punakha-dzong-commons", file: "Punakha Dzong, Bhutan 03.jpg" },
  { slug: "tashichho-dzong-commons", file: "Tashichho Dzong, Bhutan 01.jpg" },
  { slug: "buddha-dordenma-commons", file: "Buddha Dordenma statue, Thimphu 06.jpg" },
  { slug: "taktsang-commons", file: "Paro, Taktsang Goemba (Tiger's Nest) (15221622304).jpg" },
];

const credits = [];

for (const map of activityImageMap) {
  const act = uniqueActivities.find((a) => map.match.test(a.name));
  const url = act?.images?.[0] || act?.image_url;
  if (!url) continue;
  const dest = path.join(IMG, `${map.slug}.jpg`);
  try {
    const bytes = await downloadFile(url, dest);
    credits.push({
      slug: map.slug,
      file: `${map.slug}.jpg`,
      source: url,
      license: "Silverpine / agency Cloudinary library (internal reuse)",
      bytes,
    });
    console.log("saved", map.slug, bytes);
  } catch (err) {
    console.error("skip", map.slug, err.message);
  }
}

for (const item of commonsFiles) {
  const dest = path.join(IMG, `${item.slug}.jpg`);
  try {
    const meta = await commonsThumb(item.file, dest);
    credits.push({ slug: item.slug, ...meta });
    console.log("commons", item.slug);
  } catch (err) {
    console.error("commons fail", item.slug, err.message);
  }
}

fs.writeFileSync(path.join(IMG, "credits.json"), JSON.stringify(credits, null, 2));

console.log(
  JSON.stringify(
    {
      hotels: uniqueHotels.length,
      guides: guideRows.length,
      female: female.length,
      male: male.length,
      images: credits.length,
      out: OUT,
    },
    null,
    2,
  ),
);
