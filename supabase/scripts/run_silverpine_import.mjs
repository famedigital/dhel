/**
 * Run Silverpine library import against DATABASE_URL (.env.local).
 * Usage: node supabase/scripts/run_silverpine_import.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnvLocal();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const steps = [
  { label: "truncate staging", sql: "TRUNCATE public.library_hotels, public.library_guides, public.library_activities;" },
  {
    label: "hotels",
    file: path.join(__dirname, "data/library_hotels_rows.sql"),
  },
  {
    label: "guides",
    file: path.join(__dirname, "data/library_guides_rows.sql"),
  },
  {
    label: "activities",
    file: path.join(__dirname, "data/library_activities_rows.sql"),
  },
  {
    label: "transform",
    file: path.join(__dirname, "02_silverpine_transform_to_catalog.sql"),
  },
];

await client.connect();
try {
  for (const step of steps) {
    const sql = step.file ? fs.readFileSync(step.file, "utf8") : step.sql;
    process.stdout.write(`Running ${step.label}... `);
    await client.query(sql);
    console.log("ok");
  }

  const counts = await client.query(`
    SELECT 'library_hotels' AS entity, count(*)::int AS rows FROM public.library_hotels
    UNION ALL SELECT 'library_guides', count(*)::int FROM public.library_guides
    UNION ALL SELECT 'library_activities', count(*)::int FROM public.library_activities
    UNION ALL SELECT 'catalog_hotels', count(*)::int FROM public.catalog_hotels
    UNION ALL SELECT 'catalog_room_rates', count(*)::int FROM public.catalog_room_rates
    UNION ALL SELECT 'catalog_guides', count(*)::int FROM public.catalog_guides
    UNION ALL SELECT 'catalog_activities', count(*)::int FROM public.catalog_activities
    ORDER BY 1
  `);
  console.table(counts.rows);
} finally {
  await client.end();
}
