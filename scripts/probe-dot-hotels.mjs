import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

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
          const next = new URL(res.headers.location, url).toString();
          return get(next, headers).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            type: res.headers["content-type"],
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.setTimeout(40000, () => req.destroy(new Error("timeout " + url)));
    req.end();
  });
}

const urls = [
  ["html", "https://services.bhutan.travel/search/hotel", {}],
  [
    "inertia",
    "https://services.bhutan.travel/search/hotel",
    { "X-Inertia": "true", "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
  ],
  [
    "inertia-page",
    "https://services.bhutan.travel/search/hotel?page=1",
    { "X-Inertia": "true", Accept: "application/json" },
  ],
  ["json", "https://services.bhutan.travel/search/hotel", { Accept: "application/json" }],
  ["livewire", "https://services.bhutan.travel/livewire/message/search-hotel", { Accept: "application/json" }],
];

const outDir = "data/html-references/bhutan-ops-catalog/source";
fs.mkdirSync(outDir, { recursive: true });

for (const [label, url, headers] of urls) {
  try {
    const r = await get(url, headers);
    const dest = path.join(outDir, `dot-hotel-probe-${label}.txt`);
    fs.writeFileSync(dest, r.body);
    console.log(label, r.status, r.type, "len=" + r.body.length, "head=" + r.body.slice(0, 180).replace(/\s+/g, " "));
  } catch (e) {
    console.log(label, "FAIL", e.message);
  }
}
