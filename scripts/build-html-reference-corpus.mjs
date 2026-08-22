/**
 * Inspect Silverpine HTML reference corpus (root *.html files).
 * Run: node scripts/build-html-reference-corpus.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

// Dynamic import compiled TS won't work without tsx — duplicate minimal parse count via regex
const SKIP = new Set(["tracy-guide-zh.html", "tracy-guide-en.html", "tracy-bank-zh.html"]);
const files = fs.readdirSync(root).filter((f) => f.endsWith(".html") && !SKIP.has(f));

const rows = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const dayCount = (html.match(/class="day-route"/g) ?? []).length;
  const vehicle = html.match(/<label>Vehicle<\/label>\s*<p>([^<]+)<\/p>/i)?.[1]?.trim();
  rows.push({ file, dayCount, vehicle: vehicle ?? "—" });
}

console.log(`Silverpine HTML reference corpus: ${rows.length} files\n`);
for (const r of rows.sort((a, b) => a.file.localeCompare(b.file))) {
  console.log(`${r.file.padEnd(22)} ${String(r.dayCount).padStart(2)} days  vehicle: ${r.vehicle}`);
}
