/** Cloudinary cloud used in Silverpine catalog imports */
import { resolveReferenceImage } from "@/lib/reference/resolve-reference-image";

export const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dvivq8oji";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2a2926"/><stop offset="100%" stop-color="#8a857c"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><text x="400" y="255" fill="#faf8f5" font-family="Georgia,serif" font-size="28" text-anchor="middle">Bhutan</text></svg>`,
  );

const CITY_HERO: Record<string, string> = {
  paro: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Paro_Taktsang%2C_Bhutan_%28edited%29.jpg/1280px-Paro_Taktsang%2C_Bhutan_%28edited%29.jpg",
  thimphu: "https://upload.wikimedia.org/wikipedia/commons/8/86/Buddha_Dordenma_statue%2C_Thimphu_06.jpg",
  punakha: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Punakha_Dzong%2C_Bhutan_02.jpg/1280px-Punakha_Dzong%2C_Bhutan_02.jpg",
  phuentsholing: "https://res.cloudinary.com/dvivq8oji/image/upload/v1774164642/activities/thimphu/stroll-the-town-1.jpg",
  pling: "https://res.cloudinary.com/dvivq8oji/image/upload/v1774164642/activities/thimphu/stroll-the-town-1.jpg",
  bumthang: "https://res.cloudinary.com/dvivq8oji/image/upload/v1774164642/activities/thimphu/stroll-the-town-1.jpg",
  wangdue: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Punakha_Dzong%2C_Bhutan_02.jpg/1280px-Punakha_Dzong%2C_Bhutan_02.jpg",
};

export const DEFAULT_COVER =
  "https://res.cloudinary.com/dvivq8oji/image/upload/v1768424905/Buddha_Dordenma_otznqw.jpg";

export const DEFAULT_SIGNATORY =
  "/images/Rajiv_Tshering.jpg";

export type ResolveImageOpts = {
  explicit?: string | null;
  catalogUrl?: string | null;
  cityHint?: string | null;
  kind?: "cover" | "letter" | "day" | "hotel";
};

function cityFromHint(hint?: string | null): string | undefined {
  if (!hint) return undefined;
  const t = hint.toLowerCase();
  for (const key of Object.keys(CITY_HERO)) {
    if (t.includes(key)) return key;
  }
  if (t.includes("tiger") || t.includes("taktsang")) return "paro";
  if (t.includes("dochula") || t.includes("takin")) return "thimphu";
  return undefined;
}

export function resolveImage(opts: ResolveImageOpts): string {
  if (opts.explicit?.trim()) {
    const ex = opts.explicit.trim();
    if (ex.startsWith("images/") || ex.startsWith("./images/")) {
      return resolveReferenceImage(ex);
    }
    return ex;
  }
  if (opts.catalogUrl?.trim()) return opts.catalogUrl.trim();

  const city = cityFromHint(opts.cityHint);
  if (city && CITY_HERO[city]) return CITY_HERO[city];

  if (opts.kind === "cover") return DEFAULT_COVER;
  if (opts.kind === "letter") return DEFAULT_SIGNATORY;

  return PLACEHOLDER;
}

export function cloudinaryUploadUrl(publicId: string, transforms?: string): string {
  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload`;
  return transforms ? `${base}/${transforms}/${publicId}` : `${base}/${publicId}`;
}

/** Collect image URLs for print preloading */
export function collectDocumentImageUrls(input: {
  coverSrc?: string;
  letterSrc?: string;
  days?: Array<{
    hero_image?: string;
    activity_images?: { url: string }[];
    image?: string;
  }>;
  hotelImageUrls?: string[];
}): string[] {
  const urls = new Set<string>();
  const add = (u?: string | null) => {
    if (u?.trim() && !u.startsWith("data:")) urls.add(u.trim());
  };
  add(input.coverSrc ?? resolveImage({ kind: "cover" }));
  add(input.letterSrc ?? resolveImage({ kind: "letter" }));
  for (const d of input.days ?? []) {
    add(d.hero_image ?? d.image);
    for (const img of d.activity_images ?? []) add(img.url);
  }
  for (const u of input.hotelImageUrls ?? []) add(u);
  return [...urls];
}
