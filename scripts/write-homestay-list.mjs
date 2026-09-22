import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const OUT = path.join("data", "html-references", "bhutan-ops-catalog");
const SRC = path.join(OUT, "source");
fs.mkdirSync(SRC, { recursive: true });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(new URL(res.headers.location, url).toString()).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      },
    );
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout " + url)));
    req.end();
  });
}

function getText(url) {
  return get(url).then((r) => ({ status: r.status, text: r.body.toString("utf8") }));
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function digits(phone) {
  const first = String(phone || "").split("/")[0];
  const d = first.replace(/\D/g, "").replace(/^975/, "");
  return d || "";
}

/** DOT certified village homestay roster (public numbered list, 1–123). */
const certified = [
  ["Bumthang", "Pema Lhazom Homestay", "17292177", 5, 10, "pemalhazom51@gmail.com"],
  ["Bumthang", "Dorjibee (Ugyen Lhamo) Homestay", "77661132", 4, 8, "chimmidelker88@gmail.com"],
  ["Bumthang", "Sherab Doma Homestay", "17723673", 4, 8, "kamdex@gmail.com"],
  ["Bumthang", "Dechen Gawa Homestay", "17291600", 2, 4, "bumthangchakhar@gmail.com"],
  ["Bumthang", "Tshewang Choden Homestay", "77757909", 3, 6, ""],
  ["Bumthang", "Sangay Dawa Homestay", "77351570", 2, 4, ""],
  ["Bumthang", "Yeshi Wangmo Homestay", "17235076", 4, 8, ""],
  ["Bumthang", "Lemo Homestay", "17670870", 2, 4, ""],
  ["Bumthang", "Tshomo Homestay (Pangri)", "17861095", 4, 8, ""],
  ["Bumthang", "Tashi Wangmo / Ura (VHS)", "77639828 / 17639828", 4, 8, ""],
  ["Bumthang", "Tshomo Homestay (Dorjibee)", "17649947", 5, 10, "dekidrodu@gmail.com"],
  ["Bumthang", "Dechen Homestay", "17917619 / 17383434", 4, 8, ""],
  ["Bumthang", "Yeshi Nidup Homestay", "17795211 / 17802028", 3, 6, ""],
  ["Bumthang", "Ngawang Homestay", "17622222 / 17345565", 3, 6, "Aimhightour1762@gmai.com"],
  ["Chhukha", "Sonam Choki Homestay", "17986512", 4, 8, ""],
  ["Chhukha", "Gangkhap Homestay", "77700153", 1, 2, ""],
  ["Chhukha", "Lhamo Homestay", "17933178", 2, 4, ""],
  ["Chhukha", "Dekis Homestay", "77678937", 3, 6, ""],
  ["Chhukha", "Kaydee Homestay", "17589430", 1, 2, ""],
  ["Dagana", "Sangay Lhaden Homestay", "17538263 / 17937371", 2, 4, ""],
  ["Dagana", "Karma Homestay", "17691632", 2, 4, ""],
  ["Gasa", "Namgay Homestay", "17537744", 4, 8, ""],
  ["Gasa", "Chador Zangmo Homestay", "17422868", 4, 8, ""],
  ["Gasa", "Karma Yuden Homestay", "17408142", 4, 8, ""],
  ["Gasa", "Bagos (Chencho) Homestay", "17817425", 4, 8, ""],
  ["Gasa", "Tashi Dechiling Homestay", "17696921", 4, 8, "sonamyounten87@gmail.com"],
  ["Haa", "Phub Dem Homestay", "77250421", 2, 4, ""],
  ["Haa", "Namgay Wangmo Homestay", "77448319", 3, 6, ""],
  ["Haa", "Kinley Wangchuk Homestay", "17654981", 3, 6, ""],
  ["Haa", "Choden Homestay", "17657450", 4, 8, ""],
  ["Haa", "Lhaki Homestay", "77639036", 3, 6, ""],
  ["Haa", "Kinley Wangmo Homestay", "17810332", 4, 8, ""],
  ["Haa", "Jam Tshering Homestay", "17617782", 3, 6, ""],
  ["Haa", "Chhimmi Homestay", "77240938", 4, 8, ""],
  ["Haa", "Ugyen Homestay", "77265817", 5, 10, ""],
  ["Haa", "Pema Dema Homestay", "77209984", 3, 6, ""],
  ["Haa", "Kelzang Dawa Homestay", "17610449", 3, 6, ""],
  ["Haa", "Damcho Pem Homestay", "17628873 / 17648468", 4, 8, ""],
  ["Lhuentse", "Yangkula Homestay", "17788454", 5, 10, ""],
  ["Lhuentse", "Tshering Mo Homestay", "17576688", 5, 10, ""],
  ["Lhuentse", "Rinchen Yangtsho Homestay", "17813058", 3, 6, ""],
  ["Lhuentse", "Chimi Yuden Homestay", "17576688", 2, 4, ""],
  ["Lhuentse", "Norbu Homestay", "17310774", 3, 6, ""],
  ["Lhuentse", "Norbu Lhaden Homestay", "17700848 / 17932885", 2, 4, ""],
  ["Lhuentse", "Bumpa Dema Homestay", "77714102 / 17303515", 3, 6, ""],
  ["Lhuentse", "Namgay Zam Homestay", "17788383", 2, 4, ""],
  ["Lhuentse", "Tashi Pelmo Homestay", "17695200", 2, 4, ""],
  ["Lhuentse", "Sonam Zangmo Homestay", "17380638", 2, 4, ""],
  ["Lhuentse", "Tashi Chozom Homestay", "17788394", 3, 6, ""],
  ["Lhuentse", "Kinzang Tobgay Homestay", "17626618", 4, 8, ""],
  ["Lhuentse", "Deki Peldon Homestay", "17814374", 4, 8, ""],
  ["Mongar", "Yoezer Homestay (Thridangbi)", "17644057", 2, 4, ""],
  ["Paro", "Paro Village View Homestay", "77210636", 3, 6, ""],
  ["Paro", "Ugyen Homestay", "77665376", 4, 8, ""],
  ["Paro", "Terton Sherab Maebar Homestay", "17841344", 2, 3, ""],
  ["Paro", "Deki Homestay", "17610851", 3, 6, ""],
  ["Paro", "Gatana Homestay", "17580425", 3, 6, ""],
  ["Paro", "Kinley Lhamo Homestay", "17609123", 3, 6, ""],
  ["Paro", "Tshering Homestay", "17687642", 4, 8, ""],
  ["Paro", "Paro Penlop Heritage Homestay", "17622667", 4, 8, ""],
  ["Paro", "Tashi Lhamo Homestay", "17666293", 2, 4, ""],
  ["Paro", "Dema Homestay", "17628150", 4, 8, ""],
  ["Paro", "Chencho Dema Homestay", "17675757", 4, 7, "chenchodema5757@gmail.com"],
  ["Paro", "Travellers Homestay", "17604517", 4, 8, ""],
  ["Paro", "Paro Kichu Homestay", "17620695", 3, 6, "killaychoki@gmail.com"],
  ["Paro", "Gensa Homestay", "17614157", 3, 6, ""],
  ["Paro", "Sangay Homestay", "17969145", 3, 6, ""],
  ["Paro", "Chencho Dorji Homestay", "17824314", 1, 1, "nchoki@yahoo.com"],
  ["Paro", "Bara Homestay", "17710171", 3, 6, "somyanday@gmail.com"],
  ["Paro", "Dorji Dema Homestay", "17791416", 3, 6, "sherabdorjee76@gmail.com"],
  ["Paro", "Pema Wangchuk Homestay", "77368059 / 17982509", 3, 6, ""],
  ["Punakha", "Chimi Lhakhang Homestay", "17851311", 3, 6, "dagozam07@gmail.com"],
  ["Punakha", "Lala Homestay", "17660506", 3, 6, ""],
  ["Punakha", "Chechey Homestay", "17545898", 4, 8, ""],
  ["Punakha", "Chimi Wangmo Homestay", "77606530", 3, 6, ""],
  ["Punakha", "Leki Wangmo Homestay", "17615212", 4, 8, ""],
  ["Punakha", "Happiness Field Homestay", "17609998", 3, 8, "yangchenkarma698@gmail.com"],
  ["Punakha", "Thinley Wangmo Homestay", "17659143", 3, 6, ""],
  ["Punakha", "Mendrelgang Homestay", "77469174", 5, 7, ""],
  ["Punakha", "Namgay Zam Homestay", "17843335", 3, 6, "tenzinom1995@gmail.com"],
  ["Punakha", "Yuwakha Homestay", "17623793 / 77623793", 3, 6, ""],
  ["Punakha", "Sonam Chenzom Homestay", "17605948", 3, 6, "kinleyd2014@gmail.com"],
  ["Punakha", "Mendelgang Heritage Homestay", "17603474", 3, 6, "mendegangheritagehome@gmail.com"],
  ["Punakha", "Pema Zangmo Homestay", "17475742", 2, 4, ""],
  ["Punakha", "Lotay Gyeltshen Homestay", "17619315", 3, 6, ""],
  ["Punakha", "FAM Heritage Homestay", "17619962", 2, 4, "tdorjinsb@gmail.com"],
  ["Trashigang", "Merak Homestay", "17745042", 3, 6, ""],
  ["Trashigang", "Naktsang Homestay (Rangshikhar)", "17116766", 3, 6, "dek_pel@yahoo.com"],
  ["Trashigang", "Wangpo Tshering Homestay", "17356380", 2, 4, ""],
  ["Thimphu", "Sisina Homestay", "17902417", 3, 3, ""],
  ["Trashi Yangtse", "Chorten Dendup Homestay", "17701156", 5, 10, ""],
  ["Trashi Yangtse", "Jigme Tenzin Homestay", "17714103", 4, 8, ""],
  ["Trashi Yangtse", "Thukten Tshering Homestay", "17659821", 3, 6, ""],
  ["Trongsa", "Dorji Tse Homestay", "77619923", 3, 6, "tshodee90@gmail.com"],
  ["Wangdue Phodrang", "Dawa Lham Homestay", "17845863", 3, 6, ""],
  ["Wangdue Phodrang", "Dechen Om Homestay", "17870644", 2, 4, ""],
  ["Wangdue Phodrang", "Karma Wangmo Homestay", "17683831 / 77234698", 5, 10, "karmawangmohomestay@gmail.com"],
  ["Wangdue Phodrang", "Karma Homestay", "17683831", 2, 4, "klley89@gmail.com"],
  ["Wangdue Phodrang", "Sonam Yuden Homestay", "17625853", 4, 8, ""],
  ["Wangdue Phodrang", "Passang Zam Homestay", "17443219", 4, 8, "passanghomestay@gmail.com"],
  ["Wangdue Phodrang", "Sigay Homestay", "17995496 / 17841894", 5, 10, ""],
  ["Wangdue Phodrang", "Kuenzang Choeling Homestay", "17364619 / 77379375", 3, 6, "passangzangmo@gmail.com"],
  ["Wangdue Phodrang", "Dophu Wangmo Homestay", "17749283", 2, 4, ""],
  ["Wangdue Phodrang", "Dorji Om Homestay", "17964102 / 77875586", 3, 6, ""],
  ["Wangdue Phodrang", "Gyelmo Homestay", "17970585", 4, 8, ""],
  ["Wangdue Phodrang", "Lhakpa Homestay", "17518940", 5, 10, ""],
  ["Wangdue Phodrang", "Pem Homestay", "17736941", 5, 10, ""],
  ["Wangdue Phodrang", "Phub Gyeltshen Homestay", "77343118 / 17879831", 3, 6, ""],
  ["Wangdue Phodrang", "Phub Lham Homestay", "17512152 / 77890836", 3, 6, "Dechenma604@gmail.com"],
  ["Wangdue Phodrang", "Phub Lhamo Homestay", "77376000", 5, 10, ""],
  ["Wangdue Phodrang", "Shakar Homestay", "77422570 / 17754508", 2, 4, "Dekigawa995@gmail.com"],
  ["Wangdue Phodrang", "Tshering Lhamo Homestay", "17846102", 3, 6, "Yeegadema123@gmail.com"],
  ["Wangdue Phodrang", "Wangchuk Dema Homestay", "17451374 / 17861601", 4, 8, "wangchukdema174@gmail.com"],
  ["Wangdue Phodrang", "Yangka Homestay", "17846897", 4, 8, ""],
  ["Wangdue Phodrang", "Zangmo Homestay", "17512474", 4, 8, ""],
  ["Wangdue Phodrang", "Kumbu Lhamo Homestay", "77807211", 4, 8, ""],
  ["Wangdue Phodrang", "Tokha Menchu Homestay", "17512512 / 17253939", 3, 6, ""],
  ["Wangdue Phodrang", "Pemba Homestay", "17734049 / 17447754", 3, 6, "peewang312@yahoo.com"],
  ["Wangdue Phodrang", "Dechen Peldon Homestay", "17527214", 5, 10, ""],
  ["Zhemgang", "Tsewang Buthri Homestay", "17545152", 2, 4, "sonamyaden102@gmail.com"],
  ["Zhemgang", "Tshering Yuden Homestay", "77444780", 3, 6, "chodentashi17@gmail.com"],
  ["Zhemgang", "Sonam Yangzom Homestay", "17878185", 4, 8, ""],
  ["Zhemgang", "Yeshi Choden Homestay", "17483910", 5, 10, ""],
];

/** Extra DOT-licensed profiles found on the live portal / internet, not in the numbered 123 PDF. */
const extras = [
  {
    dzongkhag: "Punakha",
    name: "Damchi Homestay",
    phone: "77212308",
    rooms: 3,
    beds: null,
    email: "Kinleydema205@gmail.com",
    license: "DOT/SCD/HS-PKHA-23/2024",
    slug: "damchi-homestay",
    village: "Damchi / Kabjisa",
  },
  {
    dzongkhag: "Punakha",
    name: "Kinley Om Homestay",
    phone: "17775611",
    rooms: 3,
    beds: null,
    email: "omkinley493@gmail.com",
    license: "DOT/SCD/HS/PKHA-26/2024",
    slug: "kinley-om-homestay",
  },
  {
    dzongkhag: "Punakha",
    name: "Zomlingthang Homestay",
    phone: "17721172",
    rooms: 3,
    beds: null,
    email: "pemazam1982@gmail.com",
    license: "DOT/SCD/HS-PKHA-30/2024",
    slug: "zomlingthang-homestay",
    village: "Zomlingthang",
  },
  {
    dzongkhag: "Trashigang",
    name: "Sangay Dema Home Stay",
    phone: "17261119",
    rooms: 4,
    beds: null,
    email: "tashidorji1119@gmail.com",
    license: "HS-TGNG-6/2024",
    slug: "sangay-dema-home-stay",
    village: "Merak / Gengu",
  },
];

const knownSlugs = [
  "karma-wangmo-village-homestay-1",
  "wangchuk-dema-village-homestay",
  "chimi-lhakhang-village-homestay",
  "chimmi-homestay",
  "jam-tshering-homestay",
  "damchi-homestay",
  "kinley-om-homestay",
  "zomlingthang-homestay",
  "sangay-dema-home-stay",
  "namgay-zam-homestay",
  "kumbu-lhamo-homestay",
  "lala-homestay",
  "mendrelgang-homestay",
  "paro-village-view-homestay",
  "travellers-homestay",
  "passang-zam-homestay",
  "lhakpa-homestay",
  "pem-homestay",
  "ngawang-homestay",
];

function rowFromCertified([dzongkhag, name, phone, rooms, beds, email], i) {
  const d = digits(phone);
  return {
    no: i + 1,
    name,
    dzongkhag,
    village: "",
    phone,
    rooms,
    beds,
    email: email || "",
    license: "",
    slug: "",
    profile_url: "",
    whatsapp: d ? `https://wa.me/975${d}` : "",
    source: "DOT certified village homestay list",
    certification: "DOT certified VHS",
  };
}

function rowFromExtra(e, no) {
  const d = digits(e.phone);
  return {
    no,
    name: e.name,
    dzongkhag: e.dzongkhag,
    village: e.village || "",
    phone: e.phone,
    rooms: e.rooms,
    beds: e.beds,
    email: e.email || "",
    license: e.license || "",
    slug: e.slug || "",
    profile_url: e.slug ? `https://services.bhutan.travel/search/homestay/${e.slug}` : "",
    whatsapp: d ? `https://wa.me/975${d}` : "",
    source: "services.bhutan.travel homestay profile (licensed, not on numbered PDF)",
    certification: "DOT licensed (portal)",
  };
}

function parsePortal(html) {
  const name = html.match(/<h1[^>]*>\s*([^<(]+)/i)?.[1]?.trim();
  const license = html.match(/License No\.?\s*<\/[^>]+>\s*([^<]+)/i)?.[1]?.trim()
    || html.match(/License No\.([A-Z0-9/.-]+)/i)?.[1]?.trim();
  const email = html.match(/Email\s*<\/[^>]+>\s*([^\s<]+@[^\s<]+)/i)?.[1]?.trim()
    || html.match(/mailto:([^"']+)/i)?.[1];
  const phone = html.match(/Mobile No\.?\s*<\/[^>]+>\s*\(?\+?975\)?\s*([0-9]+)/i)?.[1]
    || html.match(/\(\+975\)\s*([0-9]+)/)?.[1];
  const location = html.match(/Location\s*<\/[^>]+>\s*([^<]+)/i)?.[1]?.trim();
  const rooms = Number(html.match(/No\. of Rooms\s*<\/[^>]+>\s*([0-9]+)/i)?.[1] || "") || null;
  const year = html.match(/Operation Year\s*<\/[^>]+>\s*([0-9]{4})/i)?.[1] || "";
  if (!name || /page not found|404/i.test(html.slice(0, 2000))) return null;
  return { name: name.replace(/\s+/g, " "), license: license || "", email: email || "", phone: phone || "", location: location || "", rooms, year };
}

const list = certified.map(rowFromCertified);
for (const e of extras) list.push(rowFromExtra(e, list.length + 1));

const slugSet = new Set(knownSlugs);
for (const r of list) {
  slugSet.add(slugify(r.name));
  slugSet.add(slugify(r.name.replace(/homestay/i, "village homestay")));
  slugSet.add(slugify(r.name.replace(/home stay/i, "homestay")));
}

const portalHits = [];
const slugs = [...slugSet];
for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const url = `https://services.bhutan.travel/search/homestay/${slug}`;
  try {
    const { status, text } = await getText(url);
    if (status === 200) {
      const parsed = parsePortal(text);
      if (parsed && parsed.name && !/Search Homestays/i.test(parsed.name)) {
        portalHits.push({ slug, url, ...parsed });
        console.log("portal", slug, parsed.name, parsed.license || "");
      }
    }
  } catch (err) {
    console.log("skip", slug, err.message);
  }
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/village /g, "")
    .replace(/home stay/g, "homestay")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

for (const hit of portalHits) {
  const hitNorm = norm(hit.name);
  let match = list.find((r) => norm(r.name) === hitNorm || (r.dzongkhag === hit.location && norm(r.name).includes(hitNorm.split(" ")[0])));
  if (!match) {
    match = list.find((r) => hitNorm.includes(norm(r.name).replace(" homestay", "")) || norm(r.name).includes(hitNorm.replace(" homestay", "")));
  }
  if (match) {
    match.slug = hit.slug;
    match.profile_url = hit.url;
    if (hit.license) match.license = hit.license;
    if (hit.email && !match.email) match.email = hit.email;
    if (hit.phone && !String(match.phone).includes(hit.phone)) {
      match.phone = match.phone ? `${match.phone} / ${hit.phone}` : hit.phone;
      const d = digits(match.phone);
      if (d) match.whatsapp = `https://wa.me/975${d}`;
    }
  } else if (!list.some((r) => norm(r.name) === hitNorm)) {
    list.push(
      rowFromExtra(
        {
          dzongkhag: hit.location || "",
          name: hit.name.replace(/\s*\(Homestay\)\s*$/i, ""),
          phone: hit.phone,
          rooms: hit.rooms,
          beds: null,
          email: hit.email,
          license: hit.license,
          slug: hit.slug,
        },
        list.length + 1,
      ),
    );
  }
}

list.forEach((r, i) => {
  r.no = i + 1;
});

const headers = [
  "no",
  "name",
  "dzongkhag",
  "village",
  "phone",
  "rooms",
  "beds",
  "email",
  "license",
  "profile_url",
  "whatsapp",
  "certification",
  "source",
];
const csv = [headers.join(","), ...list.map((r) => headers.map((h) => csvEscape(r[h])).join(","))].join("\n");

const byDzongkhag = {};
for (const r of list) {
  byDzongkhag[r.dzongkhag] ??= [];
  byDzongkhag[r.dzongkhag].push({ name: r.name, phone: r.phone, rooms: r.rooms, beds: r.beds, email: r.email });
}

fs.writeFileSync(path.join(OUT, "homestays.json"), JSON.stringify(list, null, 2));
fs.writeFileSync(path.join(OUT, "homestays.csv"), csv);
fs.writeFileSync(
  path.join(OUT, "homestays-by-dzongkhag.json"),
  JSON.stringify(
    {
      generated_at: new Date().toISOString().slice(0, 10),
      total: list.length,
      certified_pdf: certified.length,
      extra_portal_licensed: list.length - certified.length,
      by_dzongkhag: Object.fromEntries(
        Object.entries(byDzongkhag).map(([k, v]) => [k, { count: v.length, homestays: v }]),
      ),
      notes: [
        "Live search https://services.bhutan.travel/search/homestay currently indexes 1 complete public card (Karma Wangmo). Individual profile URLs still exist.",
        "Core roster is the public DOT certified village homestay list (123 numbered entries).",
        "Extra rows are DOT-licensed profiles found on the portal / internet that are not on that numbered PDF (mostly 2024 Punakha/Trashigang licences).",
        "Overnight tourist stays at uncertified private homes are prohibited under DoT 2024 accommodation rules.",
        "Confirm rooms/beds/phone before quoting.",
      ],
    },
    null,
    2,
  ),
);
fs.writeFileSync(path.join(SRC, "dot-homestay-portal-hits.json"), JSON.stringify(portalHits, null, 2));

try {
  const pdf = await get("https://www.reisefernsehen.com/downloads/dot-certified-list-latest-home-stay.pdf");
  if (pdf.status === 200 && pdf.body.length > 1000) {
    fs.writeFileSync(path.join(SRC, "dot-certified-homestays.pdf"), pdf.body);
    console.log("pdf bytes", pdf.body.length);
  }
} catch (e) {
  console.log("pdf skip", e.message);
}

const summaryPath = path.join(OUT, "_summary.json");
if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  summary.homestays = {
    rows: list.length,
    certified_pdf: certified.length,
    extra_portal_licensed: list.length - certified.length,
    dzongkhags: Object.keys(byDzongkhag).length,
    coverage:
      "DOT certified village homestay roster (123) plus extra licensed portal profiles. Live search index currently shows 1 card.",
  };
  if (!summary.sources.includes("https://services.bhutan.travel/search/homestay")) {
    summary.sources.push("https://services.bhutan.travel/search/homestay");
    summary.sources.push("https://www.reisefernsehen.com/downloads/dot-certified-list-latest-home-stay.pdf");
  }
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
}

console.log(
  JSON.stringify(
    {
      total: list.length,
      certified: certified.length,
      extras: list.length - certified.length,
      portal_hits: portalHits.length,
      by_dzongkhag: Object.fromEntries(Object.entries(byDzongkhag).map(([k, v]) => [k, v.length])),
    },
    null,
    2,
  ),
);
