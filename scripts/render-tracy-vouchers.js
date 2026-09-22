/**
 * Rasterize Tracy vouchers with PDFium (Chrome's engine) + sharp.
 * Tickets: only 121NCE-TICKETS.pdf (issued; skip earlier PNR email).
 */
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const requireEsm = createRequire(__filename);

async function main() {
  const { PDFiumLibrary } = require("@hyzyla/pdfium");
  const sharp = require("sharp");
  const pdfParse = require("pdf-parse");

  const root = path.join(__dirname, "..", "data", "html-references", "tracy-attachments");
  const outDir = path.join(root, "pages");
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));

  async function renderFunction(options) {
    return await sharp(options.data, {
      raw: { width: options.width, height: options.height, channels: 4 },
    })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  const files = [
    { file: "121NCE-TICKETS.pdf", maxPages: 4, label: "Drukair tickets PNR 121NCE" },
    { file: "Thimphu_Pema_Realm.pdf", maxPages: 2, label: "Thimphu · The Pema by Realm" },
    { file: "Jakar_Lodge_confirmation_voucher_2_.pdf", maxPages: 1, label: "Bumthang · Jakar Village Lodge" },
    { file: "Dhumra_Billing_Bhutan_Silverpine_Guest_s_x_2pax_1_.pdf", maxPages: 2, label: "Punakha · Dhumra Farm" },
    { file: "Paro_Tenzinling_Bhutan_Silverpine_x_2_PAX-MAP_1_.pdf", maxPages: 1, label: "Paro · Tenzinling Resort" },
  ];

  const library = await PDFiumLibrary.init();
  const manifest = [];

  for (const { file, maxPages, label } of files) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) {
      console.warn("missing", file);
      continue;
    }
    const buff = fs.readFileSync(full);
    let text = "";
    try {
      text = (await pdfParse(buff)).text || "";
    } catch (e) {
      console.warn("text", file, e.message);
    }

    const document = await library.loadDocument(buff);
    const slug = file.replace(/\.pdf$/i, "").replace(/[^\w]+/g, "_").slice(0, 48);
    const pages = [];
    let n = 0;
    for (const page of document.pages()) {
      n++;
      if (n > maxPages) break;
      const image = await page.render({ scale: 2, render: renderFunction });
      const outName = `${slug}_p${n}.jpg`;
      fs.writeFileSync(path.join(outDir, outName), Buffer.from(image.data));
      pages.push(`tracy-attachments/pages/${outName}`);
      console.log("wrote", outName, Math.round(fs.statSync(path.join(outDir, outName)).size / 1024) + "kb");
    }
    document.destroy();
    manifest.push({ file, label, slug, rendered: pages, textPreview: text.slice(0, 3000) });
  }

  library.destroy();

  // Dewachen from Excel (already known)
  manifest.push({
    file: "dewachen_Silver_pine_2_.xlsx",
    label: "Phobjikha · Dewachen Hotel & Spa",
    slug: "Dewachen",
    rendered: [],
    textPreview:
      "Twin ×1 · CI 28/09/26 · CO 29/09/26 · MAP · Nu 9,540.30 paid · Balance Due 0.00 · Tel +975-17117508",
  });

  fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("done", manifest.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
