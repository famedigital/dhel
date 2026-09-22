import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { "User-Agent": UA, Accept: "text/html" },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(new URL(res.headers.location, url).toString()).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    req.on("error", reject);
    req.setTimeout(45000, () => req.destroy(new Error("timeout " + url)));
    req.end();
  });
}

function extractPage(html) {
  const m = html.match(/data-page="([^"]+)"/);
  if (!m) throw new Error("no data-page in " + html.slice(0, 120));
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

const urls = [
  "https://services.bhutan.travel/search/guide/pema-wangda",
  "https://services.bhutan.travel/search/guide?genders=female",
  "https://services.bhutan.travel/search/guide?gender=female",
  "https://services.bhutan.travel/search/guide?filters[genders]=female",
  "https://services.bhutan.travel/build/assets/SearchFilters-72678a92.js",
];

for (const url of urls) {
  const body = await get(url);
  const dest = "data/html-references/bhutan-ops-catalog/source/" + url.replace(/[^\w]+/g, "_").slice(-80);
  fs.writeFileSync(dest, body);
  if (url.includes(".js")) {
    console.log("js len", body.length);
    const hits = body.match(/.{0,80}gender.{0,80}/gi)?.slice(0, 12) || [];
    console.log(hits.join("\n"));
  } else {
    try {
      const page = extractPage(body);
      const r = page.props?.results;
      console.log(url, "total", r?.total, "page", r?.current_page, "data", r?.data?.length, "keys", r?.data?.[0] ? Object.keys(r.data[0]) : Object.keys(page.props || {}));
      if (!r) console.log("prop keys", Object.keys(page.props || {}), JSON.stringify(page.props).slice(0, 500));
    } catch (e) {
      console.log(url, e.message, body.slice(0, 160).replace(/\s+/g, " "));
    }
  }
}
