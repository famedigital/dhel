import fs from "node:fs";
import path from "node:path";
import type { BriefIntent } from "@/lib/catalog";
import type { ItineraryLanguage } from "@/lib/types";
import { parseHtmlItinerary } from "./parse-html-itinerary";
import type { ParsedHtmlItinerary } from "./types";

const SKIP_FILES = new Set([
  "tracy-guide-zh.html",
  "tracy-guide-en.html",
  "tracy-bank-zh.html",
]);

/** Statically scoped so Turbopack/Vercel does not trace the whole repo. */
const CORPUS_DIR = path.join(process.cwd(), "data", "html-references");

let cached: ParsedHtmlItinerary[] | null = null;

function htmlCandidates(): string[] {
  if (!fs.existsSync(CORPUS_DIR)) return [];
  return fs
    .readdirSync(CORPUS_DIR)
    .filter((f) => f.endsWith(".html") && !SKIP_FILES.has(f))
    .map((f) => path.join(CORPUS_DIR, f));
}

export function loadHtmlReferenceCorpus(): ParsedHtmlItinerary[] {
  if (cached) return cached;
  const parsed: ParsedHtmlItinerary[] = [];
  for (const filePath of htmlCandidates()) {
    try {
      const html = fs.readFileSync(filePath, "utf8");
      const doc = parseHtmlItinerary(path.basename(filePath), html);
      if (doc && doc.content.days?.length) parsed.push(doc);
    } catch {
      /* skip unreadable */
    }
  }
  cached = parsed.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
  return cached;
}

export function scoreReference(
  ref: ParsedHtmlItinerary,
  opts: {
    days: number;
    language: ItineraryLanguage;
    brief: string;
    stayPlan?: BriefIntent["stay_plan"];
    entryPoint?: string;
  },
): number {
  let score = 0;
  score -= Math.abs(ref.days - opts.days) * 8;

  if (ref.language === opts.language) score += 12;

  const briefLower = opts.brief.toLowerCase();
  for (const city of ref.cities) {
    if (briefLower.includes(city.toLowerCase())) score += 10;
  }

  for (const seg of opts.stayPlan ?? []) {
    if (ref.routeText.toLowerCase().includes(seg.city.toLowerCase())) score += 18;
  }

  const entry = (opts.entryPoint ?? "").toLowerCase();
  if (entry) {
    for (const ep of ref.entryPoints) {
      if (entry.includes(ep.toLowerCase()) || ep.toLowerCase().includes(entry)) score += 20;
    }
    if (/bagdogra|hasimara|pling|phuentsholing/i.test(briefLower)) {
      if (ref.entryPoints.some((e) => /bagdogra|hasimara|phuentsholing/i.test(e))) score += 15;
    }
  }

  if (/tiger|taktsang/i.test(briefLower) && /tiger|taktsang/i.test(ref.routeText + ref.title)) {
    score += 8;
  }

  return score;
}

export function findBestHtmlReference(opts: {
  days: number;
  language: ItineraryLanguage;
  brief: string;
  stayPlan?: BriefIntent["stay_plan"];
  entryPoint?: string;
  minScore?: number;
}): ParsedHtmlItinerary | null {
  const corpus = loadHtmlReferenceCorpus();
  if (!corpus.length) return null;

  let best: ParsedHtmlItinerary | null = null;
  let bestScore = -Infinity;
  for (const ref of corpus) {
    const s = scoreReference(ref, opts);
    if (s > bestScore) {
      bestScore = s;
      best = ref;
    }
  }

  const min = opts.minScore ?? 15;
  return bestScore >= min ? best : null;
}

export function listHtmlReferences(): Array<{ id: string; file: string; days: number; cities: string[] }> {
  return loadHtmlReferenceCorpus().map((r) => ({
    id: r.id,
    file: r.sourceFile,
    days: r.days,
    cities: r.cities,
  }));
}

export function clearReferenceCache() {
  cached = null;
}
