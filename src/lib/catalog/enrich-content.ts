import type { ItineraryContent } from "@/lib/types";
import type { PackageOption } from "./types";
import type { CatalogActivity, CatalogGuide } from "./db-catalog-ext";
import { resolveImage } from "@/lib/media/resolve-image";

function cityFromText(text: string): string | null {
  const t = text.toLowerCase();
  const cities = ["paro", "thimphu", "punakha", "bumthang", "phuentsholing", "wangdue", "trongsa", "gangtey"];
  for (const c of cities) {
    if (t.includes(c)) return c;
  }
  if (t.includes("pling")) return "phuentsholing";
  if (t.includes("tphu")) return "thimphu";
  return null;
}

function matchActivitiesForDay(
  day: NonNullable<ItineraryContent["days"]>[number],
  activities: CatalogActivity[],
): CatalogActivity[] {
  const hay = `${day.route} ${day.title} ${day.description} ${(day.activities || []).join(" ")}`.toLowerCase();
  const city = cityFromText(hay);

  const scored = activities
    .map((a) => {
      let score = 0;
      const loc = (a.location || "").toLowerCase();
      if (city && loc.includes(city)) score += 3;
      if (a.name && hay.includes(a.name.toLowerCase().slice(0, 12))) score += 2;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);

  if (scored.length) return scored.slice(0, 4).map((x) => x.a);

  if (city) {
    return activities.filter((a) => (a.location || "").toLowerCase().includes(city)).slice(0, 4);
  }
  return activities.slice(0, 3);
}

export type EnrichCatalogInput = {
  content: ItineraryContent;
  packageOption?: PackageOption;
  activities?: CatalogActivity[];
  guides?: CatalogGuide[];
  hotelImageUrls?: string[];
};

export function enrichItineraryContent(opts: EnrichCatalogInput): ItineraryContent {
  const { content, packageOption, activities = [], guides = [], hotelImageUrls = [] } = opts;
  const next: ItineraryContent = { ...content };

  if (packageOption && !next.guide) {
    const guide = guides.find((g) => g.languages?.includes("English")) ?? guides[0];
    if (guide) next.guide = guide.name;
  }

  if (next.days?.length && activities.length) {
    next.days = next.days.map((d) => {
      const matched = matchActivitiesForDay(d, activities);
      const hero = matched[0]?.image_url ?? d.hero_image ?? d.image;
      const activity_images = matched.slice(0, 4).map((a) => ({
        url: resolveImage({ explicit: a.image_url, cityHint: a.location, kind: "day" }),
        caption: a.name,
      }));
      return {
        ...d,
        hero_image: resolveImage({ explicit: hero, cityHint: d.route || d.title, kind: "day" }),
        activity_images: activity_images.length ? activity_images : d.activity_images,
      };
    });
  }

  if (next.hotel_options?.length && hotelImageUrls.length) {
    next.hotel_options = next.hotel_options.map((o) => ({
      ...o,
      image_urls: o.image_urls?.length ? o.image_urls : hotelImageUrls,
    }));
  } else if (next.hotel_options?.length && packageOption && hotelImageUrls.length) {
    next.hotel_options = next.hotel_options.map((o) =>
      o.recommended || o.id === next.selected_option_id ? { ...o, image_urls: hotelImageUrls } : o,
    );
  }

  return next;
}
