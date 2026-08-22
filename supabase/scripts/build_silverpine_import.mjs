import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const outFile = path.join(__dirname, "silverpine_full_import.sql");

const parts = [
  fs.readFileSync(path.join(__dirname, "01_silverpine_staging_tables.sql"), "utf8"),
  "-- STEP 2: Load Silverpine library rows\n",
  fs.readFileSync(path.join(dataDir, "library_hotels_rows.sql"), "utf8"),
  ";\n",
  fs.readFileSync(path.join(dataDir, "library_guides_rows.sql"), "utf8"),
  ";\n",
  fs.readFileSync(path.join(dataDir, "library_activities_rows.sql"), "utf8"),
  ";\n",
  fs.readFileSync(path.join(__dirname, "02_silverpine_transform_to_catalog.sql"), "utf8"),
];

fs.writeFileSync(outFile, parts.join("\n"), "utf8");

for (const f of [
  "library_hotels_rows.sql",
  "library_guides_rows.sql",
  "library_activities_rows.sql",
]) {
  const s = fs.readFileSync(path.join(dataDir, f), "utf8");
  const rows = (s.match(/\),\s*\('/g) || []).length + 1;
  console.log(`${f}: ~${rows} rows, ${s.length} bytes`);
}
console.log(`Wrote ${outFile} (${fs.statSync(outFile).size} bytes)`);
