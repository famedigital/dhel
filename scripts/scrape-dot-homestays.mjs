import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const OUT = path.join("data", "html-references", "bhutan-ops-catalog");
const SRC = path.join(OUT, "source");
fs.mkdirSync(SRC, { recursive: true });

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(new URL(res.headers.location, url).toString()).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} ${url}`));
          }
          resolve(Buffer.concat(chunks).toString("utf8"));
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(45000, () => req.destroy(new Error("timeout " + url)));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractPage(html) {
  const m = html.match(/data-page="([^"]+)"/);
  if (!m) throw new Error("no data-page");
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function flattenHomestay(row) {
  const loc =
    row.location?.name ||
    row.location?.value ||
    row.dzongkhag ||
    row.gewog ||
    (Array.isArray(row.locations) ? row.locations.map((l) => l.value || l.name).join(", ") : "") ||
    "";
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    email: row.email || "",
    phone: row.contact != null ? String(row.contact) : "",
    website: row.website || "",
    location: loc,
    description: (row.description_excerpt || row.description || "").replace(/\s+/g, " ").trim(),
    cover_photo: row.cover_photo?.url || "",
    profile_url: `https://services.bhutan.travel/search/homestay/${row.slug}`,
    whatsapp: row.contact ? `https://wa.me/975${String(row.contact).replace(/^975/, "")}` : "",
  };
}

const firstHtml = await get("https://services.bhutan.travel/search/homestay?page=1");
const first = extractPage(firstHtml);
const results = first.props.results;
const lastPage = results.last_page || 1;
const total = results.total;
console.log("homestays total", total, "pages", lastPage, "filters", Object.keys(first.props.filters || {}));
fs.writeFileSync(path.join(SRC, "dot-homestay-page1.json"), JSON.stringify(first, null, 2));

const rows = [...results.data];
for (let page = 2; page <= lastPage; page++) {
  await sleep(250);
  const html = await get(`https://services.bhutan.travel/search/homestay?page=${page}`);
  const parsed = extractPage(html);
  const batch = parsed.props.results.data || [];
  console.log("page", page, "got", batch.length);
  rows.push(...batch);
}

const list = rows.map(flattenHomestay);
const byName = new Map();
for (const h of list) {
  const key = `${h.name}|${h.phone}|${h.email}`.toLowerCase();
  if (!byName.has(key)) byName.set(key, h);
}
const unique = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

const headers = ["name", "location", "phone", "email", "website", "profile_url", "whatsapp", "description"];
const csv = [headers.join(","), ...unique.map((r) => headers.map((h) => csvEscape(r[h])).join(","))].join("\n");

fs.writeFileSync(path.join(OUT, "homestays.json"), JSON.stringify(unique, null, 2));
fs.writeFileSync(path.join(OUT, "homestays.csv"), csv);
fs.writeFileSync(
  path.join(OUT, "homestays-raw.json"),
  JSON.stringify(
    {
      source: "https://services.bhutan.travel/search/homestay",
      scraped_at: new Date().toISOString(),
      portal_total: total,
      fetched: rows.length,
      unique: unique.length,
      filters: first.props.filters,
      rows,
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({ fetched: rows.length, unique: unique.length, total, sample: unique.slice(0, 5) }, null, 2));
