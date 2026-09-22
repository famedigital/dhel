const fs = require("fs");
const https = require("https");
const path = require("path");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const MC = "9f3b52b7-72af-4f74-adc1-2ed0403f00c0";
const OUT_DIR = path.join("data", "html-references", "images", "tourism-hires");
const META_DIR = path.join(OUT_DIR, "_meta");

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": UA,
          Accept: "application/json",
          Origin: "https://app.snapsea.io",
          Referer: "https://app.snapsea.io/",
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`${res.statusCode} ${url} ${d.slice(0, 200)}`));
          }
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(
      url,
      { headers: { "User-Agent": UA, Referer: "https://app.snapsea.io/" } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(dest, () => {});
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      },
    );
    req.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function unwrap(item) {
  return item.file || item;
}

function slugify(name) {
  return String(name || "image")
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

async function allPages(url) {
  const all = [];
  while (url) {
    const data = await get(url);
    all.push(...(data.results || []));
    url = data.next;
  }
  return all;
}

async function listAlbums() {
  const albums = await allPages(
    `https://api.snapsea.io/api/v1/public/mediacentre/albums/${MC}/?page_size=100`,
  );
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(path.join(META_DIR, "albums.json"), JSON.stringify(albums, null, 2));
  for (const a of albums.sort((x, y) => String(x.title).localeCompare(y.title))) {
    console.log(`${a.uuid} | ${a.title} | files=${JSON.stringify(a.file_count)} | parent=${a.parent_album}`);
  }
  console.log(`TOTAL ALBUMS ${albums.length}`);
}

async function listFiles(albumUuid, albumTitle) {
  const files = await allPages(
    `https://api.snapsea.io/api/v1/public/mediacentre/album/files/${albumUuid}/?page_size=100`,
  );
  const safe = slugify(albumTitle);
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(path.join(META_DIR, `files-${safe}.json`), JSON.stringify(files, null, 2));
  for (const item of files) {
    const f = unwrap(item);
    const v = f.latest_version || {};
    console.log(
      `${f.uuid} | ${f.name} | ${v.width}x${v.height} | ${v.file_type} | ${v.size} | ${v.url}`,
    );
  }
  console.log(`TOTAL FILES ${files.length} in ${albumTitle}`);
}

async function downloadAlbum(albumUuid, albumTitle, limit = 12) {
  const files = await allPages(
    `https://api.snapsea.io/api/v1/public/mediacentre/album/files/${albumUuid}/?page_size=100`,
  );
  const images = files
    .map(unwrap)
    .filter((f) => {
      const v = f.latest_version || {};
      const type = v.file_type || "";
      const size = v.size || 0;
      const w = Math.max(v.width || 0, v.height || 0);
      return type.startsWith("image/") && w >= 2400 && size > 400_000 && size < 15_000_000;
    })
    .sort((a, b) => (b.latest_version.width || 0) - (a.latest_version.width || 0));
  const destDir = path.join(OUT_DIR, slugify(albumTitle));
  fs.mkdirSync(destDir, { recursive: true });
  const credits = [];
  const selected = images.slice(0, limit);
  for (const f of selected) {
    const v = f.latest_version;
    const ext = (v.file_type || "image/jpeg").split("/")[1] || "jpg";
    const fname = `${slugify(f.name) || f.uuid}.${ext === "jpeg" ? "jpg" : ext}`;
    const dest = path.join(destDir, fname);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) {
      console.log(`SKIP ${fname}`);
    } else {
      console.log(`GET ${fname} ${v.width}x${v.height} ${(v.size / 1024 / 1024).toFixed(1)}MB`);
      await download(v.url, dest);
    }
    credits.push({
      file: fname,
      original_name: f.name,
      photographer: f.copyright || f.source_display_name || f.latest_version?.source?.creator?.name || "",
      width: v.width,
      height: v.height,
      url: `https://app.snapsea.io/p/file/${f.uuid}`,
    });
  }
  fs.writeFileSync(path.join(destDir, "credits.json"), JSON.stringify(credits, null, 2));
  console.log(`DONE ${albumTitle} ${selected.length}/${images.length}`);
}

const cmd = process.argv[2];
if (cmd === "albums") listAlbums();
else if (cmd === "files") listFiles(process.argv[3], process.argv[4] || process.argv[3]);
else if (cmd === "download") downloadAlbum(process.argv[3], process.argv[4], Number(process.argv[5] || 12));
else {
  console.error("usage: albums | files <uuid> <title> | download <uuid> <title> [limit]");
  process.exit(1);
}
