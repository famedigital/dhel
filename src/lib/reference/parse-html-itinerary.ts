import type { ItineraryContent, ItineraryLanguage } from "@/lib/types";
import type {
  ParsedHtmlDay,
  ParsedHtmlHotelBlock,
  ParsedHtmlItinerary,
  ParsedHtmlCompareRow,
} from "./types";
import { resolveReferenceImage } from "./resolve-reference-image";

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseImgSrc(chunk: string, className: string): string | undefined {
  const m = chunk.match(new RegExp(`<img[^>]+class="${className}"[^>]+src="([^"]+)"`, "i"))
    ?? chunk.match(new RegExp(`<img[^>]+src="([^"]+)"[^>]+class="${className}"`, "i"));
  return m ? resolveReferenceImage(m[1]!) : undefined;
}

function parseDayRightImages(chunk: string): {
  hero_image?: string;
  activity_images?: { url: string; caption: string }[];
} {
  const right = chunk.match(/<div class="day-right">([\s\S]*?)<\/div>\s*<\/div>/i)?.[1];
  if (!right) return {};
  const hero = right.match(/<div class="day-loc">[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1];
  const activity_images = [...right.matchAll(/<figure>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?(?:<figcaption>([\s\S]*?)<\/figcaption>)?/gi)]
    .map((m) => ({
      url: resolveReferenceImage(m[1]!),
      caption: stripTags(m[2] ?? ""),
    }))
    .filter((x) => x.url);
  return {
    hero_image: hero ? resolveReferenceImage(hero) : undefined,
    activity_images: activity_images.length ? activity_images : undefined,
  };
}

function parseHotelBlocks(html: string): ParsedHtmlHotelBlock[] {
  const blocks: ParsedHtmlHotelBlock[] = [];
  for (const chunk of html.matchAll(/<div class="hotel-block">([\s\S]*?)<\/div>\s*(?=<div class="hotel-block">|<\/div>\s*<footer)/gi)) {
    const block = chunk[1]!;
    const head = stripTags(block.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    const nights = stripTags(block.match(/<span class="nights">([\s\S]*?)<\/span>/i)?.[1] ?? "");
    const meta = stripTags(block.match(/<p class="hotel-block-meta">([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const image_urls = [...block.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) =>
      resolveReferenceImage(m[1]!),
    );
    if (!head && !image_urls.length) continue;
    const [cityPart, namePart] = head.includes("·") ? head.split("·").map((s) => s.trim()) : [undefined, head];
    blocks.push({
      city: cityPart,
      name: namePart || head,
      nights: nights || undefined,
      meta: meta || undefined,
      image_urls,
    });
  }
  return blocks;
}

function parseCompareTable(html: string): {
  headers?: string[];
  rows?: ParsedHtmlCompareRow[];
} {
  const table = html.match(/<table class="cmp-table">([\s\S]*?)<\/table>/i)?.[1];
  if (!table) return {};
  const theadMatch = table.match(/<thead>[\s\S]*?<tr>([\s\S]*?)<\/tr>/i)?.[1];
  const headers = theadMatch
    ? [...theadMatch.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => stripTags(m[1]!)).filter(Boolean)
    : [];
  const rows: ParsedHtmlCompareRow[] = [];
  for (const row of table.matchAll(/<tbody>[\s\S]*?<tr>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
      stripTags(m[1]!),
    );
    if (cells.length < 2) continue;
    rows.push({ label: cells[0]!, values: cells.slice(1) });
  }
  return { headers: headers.length ? headers : undefined, rows: rows.length ? rows : undefined };
}

function parseClosingBlocks(html: string): ItineraryContent["closing"] {
  const closing: NonNullable<ItineraryContent["closing"]> = {};
  const dos = html.match(/<div class="closing-block dos">[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (dos) {
    closing.dos = [...dos[1]!.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]!));
  }
  const donts = html.match(/<div class="closing-block">[\s\S]*?<h3>Don['']ts<\/h3>[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (donts) {
    closing.donts = [...donts[1]!.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]!));
  }
  const docs = [...html.matchAll(/<h3>Documents required<\/h3>[\s\S]*?<ul>([\s\S]*?)<\/ul>/gi)][0];
  if (docs) {
    closing.docs = [...docs[1]!.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]!));
  }
  const packing = html.match(/<h3>Packing checklist<\/h3>[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (packing) {
    closing.packing = [...packing[1]!.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]!));
  }
  const validity = stripTags(html.match(/<div class="validity-box">[\s\S]*?<p class="v-text">([\s\S]*?)<\/p>/i)?.[1] ?? "");
  if (validity) closing.validity = validity;
  return Object.keys(closing).length ? closing : undefined;
}

function pickCoverDetail(html: string, label: string): string | undefined {
  const re = new RegExp(
    `<label>${label}<\\/label>\\s*<p>([\\s\\S]*?)<\\/p>`,
    "i",
  );
  const m = html.match(re);
  return m ? stripTags(m[1]!) : undefined;
}

function parseLetter(html: string): ItineraryContent["letter"] {
  const bodyMatch = html.match(/<div class="letter-body">([\s\S]*?)<\/div>/i);
  if (!bodyMatch) return undefined;
  const paragraphs = [...bodyMatch[1]!.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]!))
    .filter((p) => p.length > 20);
  const greeting = stripTags(html.match(/<p class="letter-greeting">([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const date = stripTags(html.match(/<p class="letter-date">([\s\S]*?)<\/p>/i)?.[1] ?? "");
  if (!paragraphs.length) return undefined;
  return {
    date: date || undefined,
    greeting: greeting || undefined,
    paragraphs,
  };
}

function parseInclusions(html: string): string[] {
  const block = html.match(/<div class="price-includes">[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (!block) return [];
  return [...block[1]!.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]!))
    .filter(Boolean);
}

function parseExclusions(html: string): string | undefined {
  const m = html.match(/<p class="price-note">([\s\S]*?)<\/p>/i);
  return m ? stripTags(m[1]!) : undefined;
}

function parsePricing(html: string): ItineraryContent["pricing"] | undefined {
  const currencyMatch = html.match(/(USD|INR|BTN)\s*([\d,]+)/);
  const perPersonMatch = html.match(/Per person[^<]*<[^>]+>[^<]*(USD|INR|BTN)\s*([\d,]+)/i)
    ?? html.match(/01 · Per person[\s\S]*?<p class="value">(USD|INR|BTN)\s*([\d,]+)/i);
  const totalMatch = html.match(/Total package price[\s\S]*?<p class="amount">(USD|INR|BTN)\s*([\d,]+)/i);

  const currency = totalMatch?.[1] ?? perPersonMatch?.[1] ?? currencyMatch?.[1] ?? "USD";
  const total = totalMatch ? Number(totalMatch[2]!.replace(/,/g, "")) : undefined;
  const per_person = perPersonMatch ? Number(perPersonMatch[2]!.replace(/,/g, "")) : undefined;
  const inclusions = parseInclusions(html);
  const exclusions = parseExclusions(html);

  if (!total && !per_person && !inclusions.length) return undefined;
  return {
    currency,
    total,
    per_person,
    note: stripTags(html.match(/<p class="page-sub">([\s\S]*?)<\/p>/i)?.[1] ?? "") || undefined,
    inclusions: inclusions.length ? inclusions : undefined,
    exclusions,
    flight_extra_note: "Flights extra · indicative range",
  };
}

function parseFlights(html: string): ItineraryContent["flights"] | undefined {
  const summary = stripTags(
    html.match(/Recommended flights[\s\S]*?<p class="page-sub">([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );
  const legs: NonNullable<ItineraryContent["flights"]>["legs"] = [];
  const cards = [...html.matchAll(/<div class="price-card">([\s\S]*?)<\/div>\s*<\/div>/gi)];
  for (const card of cards.slice(0, 6)) {
    const chunk = card[1]!;
    const num = stripTags(chunk.match(/<p class="num">([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const h3 = stripTags(chunk.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    const value = stripTags(chunk.match(/<p class="value"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const hint = stripTags(chunk.match(/<p class="hint">([\s\S]*?)<\/p>/i)?.[1] ?? "");
    if (!h3.includes("→") && !num.toLowerCase().includes("inbound") && !num.toLowerCase().includes("outbound")) {
      continue;
    }
    const dir = num.toLowerCase().includes("outbound") ? "outbound" : "inbound";
    const route = h3.split("→").map((s) => s.trim());
    legs.push({
      direction: dir as "inbound" | "outbound",
      date: num.replace(/inbound|outbound/i, "").trim() || undefined,
      from: route[0],
      to: route[1],
      airline: value.split(" ")[0],
      flight_number: value.split(" ").slice(1).join(" ") || undefined,
      notes: hint || undefined,
    });
  }
  if (!summary && !legs.length) return undefined;
  return { summary: summary || undefined, legs: legs.length ? legs : undefined };
}

function parseDayTables(html: string): ParsedHtmlDay[] {
  const days: ParsedHtmlDay[] = [];
  const tables = [...html.matchAll(/<table class="day-table">([\s\S]*?)<\/table>/gi)];
  for (const table of tables) {
    const rows = [...table[1]!.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
    for (const row of rows.slice(1)) {
      const cells = [...row[1]!.matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
        stripTags(m[1]!),
      );
      if (cells.length < 3) continue;
      const dayNum = parseInt(cells[0]!, 10);
      if (Number.isNaN(dayNum) || dayNum <= 0) continue;
      const plan = cells[2] ?? cells[1]!;
      const sleep = cells[3];
      days.push({
        day: dayNum,
        title: plan.slice(0, 100),
        route: plan,
        description: plan,
        activities: plan
          .split(/[·—–]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 4)
          .slice(0, 8),
        overnight: sleep,
        dateLabel: cells[1],
      });
    }
  }
  return days;
}

function parseDays(html: string): ParsedHtmlDay[] {
  const fromSections: ParsedHtmlDay[] = [];

  // Classic layout: day-number + day-route blocks inside page sections
  const sections = html.split(/<!--\s*=+\s*DAY/i);
  for (let i = 1; i < sections.length; i++) {
    const chunk = sections[i]!;
    const dayNumMatch = chunk.match(/(\d+)/);
    const day = dayNumMatch ? parseInt(dayNumMatch[1]!, 10) : fromSections.length + 1;

    const route = stripTags(chunk.match(/<h2 class="day-route">([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const dateLabel = stripTags(chunk.match(/<p class="day-number">([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const title = route || dateLabel || `Day ${day}`;

    const activities = [
      ...chunk.matchAll(/<div class="day-activities">[\s\S]*?<ul>([\s\S]*?)<\/ul>/i),
    ].flatMap((m) =>
      [...m[1]!.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((li) => stripTags(li[1]!)),
    );

    const desc = stripTags(chunk.match(/<p class="day-desc">([\s\S]*?)<\/p>/i)?.[1] ?? "");

    let overnight: string | undefined;
    const hotelMeta = chunk.match(/<dt>Hotel<\/dt>\s*<dd>([\s\S]*?)<\/dd>/i);
    if (hotelMeta) overnight = stripTags(hotelMeta[1]!);

    const photoNotes = stripTags(chunk.match(/<div class="day-photo">[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const images = parseDayRightImages(chunk);

    fromSections.push({
      day,
      title,
      route: route || title,
      description: desc || title,
      activities: activities.length ? activities : ["Private sightseeing"],
      overnight,
      dateLabel: dateLabel || undefined,
      hero_image: images.hero_image,
      activity_images: images.activity_images,
      photo_notes: photoNotes || undefined,
    });
  }

  const fromTables = parseDayTables(html);
  const merged = new Map<number, ParsedHtmlDay>();
  for (const d of [...fromSections, ...fromTables]) {
    const existing = merged.get(d.day);
    if (!existing || d.description.length > existing.description.length) {
      merged.set(d.day, d);
    }
  }
  return [...merged.values()].sort((a, b) => a.day - b.day);
}

const CITY_HINTS = [
  "Phuentsholing",
  "Thimphu",
  "Paro",
  "Punakha",
  "Bumthang",
  "Phobjikha",
  "Gangtey",
  "Trongsa",
  "Wangdue",
  "Hasimara",
  "Bagdogra",
];

function detectCities(text: string): string[] {
  const lower = text.toLowerCase();
  return CITY_HINTS.filter((c) => lower.includes(c.toLowerCase()));
}

function detectEntryPoints(text: string): string[] {
  const entries: string[] = [];
  if (/bagdogra|ixb/i.test(text)) entries.push("Bagdogra");
  if (/hasimara/i.test(text)) entries.push("Hasimara");
  if (/phuentsholing|pling/i.test(text)) entries.push("Phuentsholing");
  if (/paro|pbh|kathmandu|ktm/i.test(text)) entries.push("Paro");
  return entries;
}

export function parseHtmlItinerary(sourceFile: string, html: string): ParsedHtmlItinerary | null {
  if (!html.includes('class="page"')) return null;
  if (/guide|bank transfer|field pack/i.test(html.slice(0, 800)) && !html.includes("cover-title")) {
    return null;
  }

  const language: ItineraryLanguage = html.includes('lang="zh"') || /[\u4e00-\u9fff]/.test(html.slice(0, 2000))
    ? "zh"
    : "en";

  const eyebrow = stripTags(html.match(/<p class="cover-eyebrow">([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const trip_title = stripTags(html.match(/<p class="cover-title">([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const prepared_for = stripTags(html.match(/<p class="cover-client">([\s\S]*?)<\/p>/i)?.[1] ?? "");

  const vehicle =
    pickCoverDetail(html, "Vehicle") ??
    pickCoverDetail(html, "vehicle") ??
    stripTags(html.match(/<dt>Vehicle<\/dt>\s*<dd>([\s\S]*?)<\/dd>/i)?.[1] ?? "");
  const guide = pickCoverDetail(html, "Guide");
  const gateway = pickCoverDetail(html, "Gateway") ?? pickCoverDetail(html, "Route");
  const departing_from = pickCoverDetail(html, "Departing from");
  const group = pickCoverDetail(html, "Group");
  const travel_dates =
    pickCoverDetail(html, "Travel dates") ?? pickCoverDetail(html, "Dates");

  const days = parseDays(html);
  const letter = parseLetter(html);
  const pricing = parsePricing(html);
  const flights = parseFlights(html);
  const hotel_blocks = parseHotelBlocks(html);
  const { headers: compare_headers, rows: compare_rows } = parseCompareTable(html);
  const closingParsed = parseClosingBlocks(html);

  const routeText = [
    gateway,
    pickCoverDetail(html, "Route"),
    eyebrow,
    ...days.map((d) => d.route),
  ]
    .filter(Boolean)
    .join(" · ");

  const cities = detectCities(html);
  const entryPoints = detectEntryPoints(html);

  const content: ItineraryContent = {
    eyebrow: eyebrow || undefined,
    trip_title: trip_title || undefined,
    prepared_for: prepared_for || undefined,
    departing_from: departing_from || undefined,
    gateway: gateway || undefined,
    group: group || undefined,
    travel_dates: travel_dates || undefined,
    vehicle: vehicle || undefined,
    guide: guide || undefined,
    vehicle_type: vehicle || undefined,
    letter,
    pricing,
    flights,
    days: days.map((d) => ({
      day: d.day,
      title: d.title,
      route: d.route,
      description: d.description,
      activities: d.activities,
      overnight: d.overnight,
      meals: d.meals ?? "B / L / D",
      hero_image: d.hero_image,
      activity_images: d.activity_images,
      photo_notes: d.photo_notes,
    })),
    closing: closingParsed ?? {
      notes: ["Draft adapted from Silverpine reference itinerary."],
    },
  };

  const promptExcerpt = [
    letter?.paragraphs?.slice(0, 2).join("\n\n"),
    days
      .slice(0, 2)
      .map((d) => `Day ${d.day}: ${d.route}\n${d.description}\nActivities: ${d.activities.join("; ")}`)
      .join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  return {
    id: sourceFile.replace(/\.html$/i, ""),
    sourceFile,
    language,
    title: trip_title || sourceFile,
    days: days.length || 7,
    routeText,
    entryPoints,
    cities,
    content,
    promptExcerpt,
    hotel_blocks: hotel_blocks.length ? hotel_blocks : undefined,
    compare_headers,
    compare_rows,
  };
}
