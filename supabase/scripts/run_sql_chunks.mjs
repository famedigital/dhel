/** Run SQL chunk files against Supabase via DATABASE_URL (.env.local). */
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

const chunks = process.argv.slice(2);
if (!chunks.length) {
  console.error("Usage: node run_sql_chunks.mjs <file.sql> [...]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const file of chunks) {
    const sql = fs.readFileSync(file, "utf8");
    process.stdout.write(`Running ${path.basename(file)}... `);
    await client.query(sql);
    console.log("ok");
  }
} finally {
  await client.end();
}
