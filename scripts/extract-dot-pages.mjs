import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const OUT = "data/html-references/bhutan-ops-catalog";

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { "User-Agent": UA, Accept: "*/*", ...headers },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(new URL(res.headers.location, url).toString(), headers).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.setTimeout(45000, () => req.destroy(new Error("timeout " + url)));
    req.end();
  });
}

function extractPage(html) {
  const m = html.match(/data-page="([^"]+)"/);
  if (!m) throw new Error("no data-page");
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

function summarize(obj, depth = 0) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    return {
      _array: obj.length,
      sample: obj[0] ? summarize(obj[0], depth + 1) : null,
    };
  }
  if (typeof obj === "object") {
    if (depth > 3) return Object.keys(obj);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "ziggy" || k === "errors") continue;
      out[k] = summarize(v, depth + 1);
    }
    return out;
  }
  return obj;
}

const hotelHtml = fs.readFileSync(path.join(OUT, "source/dot-hotel-probe-html.txt"), "utf8");
const hotelPage = extractPage(hotelHtml);
fs.writeFileSync(path.join(OUT, "source/dot-hotel-page.json"), JSON.stringify(hotelPage, null, 2));
console.log("hotel component", hotelPage.component);
console.log("hotel version", hotelPage.version);
console.log("hotel props keys", Object.keys(hotelPage.props || {}));
console.log("hotel summary", JSON.stringify(summarize(hotelPage.props), null, 2).slice(0, 4000));

const guide = await get("https://services.bhutan.travel/search/guide");
fs.writeFileSync(path.join(OUT, "source/dot-guide-probe-html.txt"), guide.body);
const guidePage = extractPage(guide.body);
fs.writeFileSync(path.join(OUT, "source/dot-guide-page.json"), JSON.stringify(guidePage, null, 2));
console.log("guide component", guidePage.component);
console.log("guide version", guidePage.version);
console.log("guide props keys", Object.keys(guidePage.props || {}));
console.log("guide summary", JSON.stringify(summarize(guidePage.props), null, 2).slice(0, 4000));
