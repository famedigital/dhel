const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

async function main() {
  const dir = path.join(__dirname, "..", "data", "html-references", "tracy-attachments");
  for (const f of fs.readdirSync(dir).filter((x) => x.toLowerCase().endsWith(".pdf"))) {
    const data = await pdf(fs.readFileSync(path.join(dir, f)));
    console.log("\n==== " + f + " pages=" + data.numpages + " ====");
    console.log((data.text || "").slice(0, 4500));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
