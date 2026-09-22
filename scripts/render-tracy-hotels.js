/** Render hotel vouchers + ticket for Tracy guide attachments. */
const fs = require("fs");
const path = require("path");

async function main() {
  const { PDFiumLibrary } = require("@hyzyla/pdfium");
  const sharp = require("sharp");

  const root = path.join(__dirname, "..", "data", "html-references", "tracy-attachments");
  const outDir = path.join(root, "pages");
  fs.mkdirSync(outDir, { recursive: true });

  async function renderFunction(options) {
    return await sharp(options.data, {
      raw: { width: options.width, height: options.height, channels: 4 },
    })
      .jpeg({ quality: 86 })
      .toBuffer();
  }

  const files = [
    { file: "Thimphu_Pema_Realm.pdf", max: 1, slug: "hotel_pema" },
    { file: "Jakar_Lodge_confirmation_voucher_2_.pdf", max: 1, slug: "hotel_jakar" },
    { file: "Dhumra_Billing_Bhutan_Silverpine_Guest_s_x_2pax_1_.pdf", max: 2, slug: "hotel_dhumra" },
    { file: "Paro_Tenzinling_Bhutan_Silverpine_x_2_PAX-MAP_1_.pdf", max: 1, slug: "hotel_tenzinling" },
  ];

  const library = await PDFiumLibrary.init();
  for (const { file, max, slug } of files) {
    const buff = fs.readFileSync(path.join(root, file));
    const document = await library.loadDocument(buff);
    let n = 0;
    for (const page of document.pages()) {
      n++;
      if (n > max) break;
      const image = await page.render({ scale: 2, render: renderFunction });
      const outName = `${slug}_p${n}.jpg`;
      fs.writeFileSync(path.join(outDir, outName), Buffer.from(image.data));
      console.log("wrote", outName, Math.round(fs.statSync(path.join(outDir, outName)).size / 1024) + "kb");
    }
    document.destroy();
  }
  library.destroy();
  console.log("hotel pages done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
