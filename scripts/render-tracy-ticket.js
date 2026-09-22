/** Render only issued Drukair tickets (121NCE) into JPEG pages for the guide. */
const fs = require("fs");
const path = require("path");

async function main() {
  const { PDFiumLibrary } = require("@hyzyla/pdfium");
  const sharp = require("sharp");

  const root = path.join(__dirname, "..", "data", "html-references", "tracy-attachments");
  const outDir = path.join(root, "pages");
  fs.mkdirSync(outDir, { recursive: true });

  const pdfPath = path.join(root, "121NCE-TICKETS.pdf");
  const buff = fs.readFileSync(pdfPath);

  async function renderFunction(options) {
    return await sharp(options.data, {
      raw: { width: options.width, height: options.height, channels: 4 },
    })
      .jpeg({ quality: 88 })
      .toBuffer();
  }

  const library = await PDFiumLibrary.init();
  const document = await library.loadDocument(buff);
  const written = [];
  let n = 0;
  for (const page of document.pages()) {
    n++;
    const image = await page.render({ scale: 2, render: renderFunction });
    const outName = `121NCE_TICKETS_p${n}.jpg`;
    fs.writeFileSync(path.join(outDir, outName), Buffer.from(image.data));
    written.push(outName);
    console.log("wrote", outName, Math.round(fs.statSync(path.join(outDir, outName)).size / 1024) + "kb");
  }
  document.destroy();
  library.destroy();
  console.log("pages", written.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
