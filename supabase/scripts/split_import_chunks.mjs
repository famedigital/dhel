import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const outDir = path.join(__dirname, "chunks");
fs.mkdirSync(outDir, { recursive: true });

function splitInsert(filename, table, batchSize = 25) {
  const raw = fs.readFileSync(path.join(dataDir, filename), "utf8").trim();
  const valuesStart = raw.indexOf("VALUES");
  const header = raw.slice(0, valuesStart + "VALUES".length);
  const valuesBody = raw.slice(valuesStart + "VALUES".length).replace(/;\s*$/, "");
  const rows = valuesBody.split(/\),\s*\(/).map((part, i, arr) => {
    if (i === 0) return part.replace(/^\s*\(/, "");
    if (i === arr.length - 1) return part.replace(/\)\s*$/, "");
    return part;
  });

  const chunks = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((row, idx) => (idx === 0 ? `(${row})` : idx === batch.length - 1 ? `(${row})` : `(${row})`))
      .join(",\n");
    chunks.push(`${header}\n${values};`);
  }

  chunks.forEach((chunk, idx) => {
    fs.writeFileSync(path.join(outDir, `${table}_${String(idx + 1).padStart(2, "0")}.sql`), chunk);
  });
  console.log(`${table}: ${rows.length} rows -> ${chunks.length} chunks`);
}

for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
splitInsert("library_hotels_rows.sql", "hotels", 20);
splitInsert("library_guides_rows.sql", "guides", 30);
splitInsert("library_activities_rows.sql", "activities", 15);
