import type { ItineraryContent } from "@/lib/types";
import type { PackageOption } from "./types";
import type { CatalogActivity, CatalogGuide } from "./db-catalog-ext";
import { resolveImage } from "@/lib/media/resolve-image";

function cityFromText(text: string): string | null {
  const t = text.toLowerCase();
  const cities = [
    "paro",
    "thimphu",
    "punakha",
    "bumthang",
    "phuentsholing",
    "wangdue",
    "trongsa",
    "gangtey",
    "phobjikha",
  ];
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

function overnightForDay(
  dayIndex: number,
  packageOption?: PackageOption,
): string | undefined {
  const stays = packageOption?.hotel.stays;
  if (!stays?.length) {
    return packageOption?.hotel.hotel_name
      ? `${packageOption.hotel.city} · ${packageOption.hotel.hotel_name}`
      : undefined;
  }
  let cursor = 0;
  for (const stay of stays) {
    const end = cursor + stay.nights;
    // Day 1 often arrives; overnight nights map roughly dayIndex 0..nights-1
    if (dayIndex < end) {
      return `${stay.city} · ${stay.hotel_name}`;
    }
    cursor = end;
  }
  const last = stays[stays.length - 1]!;
  return `${last.city} · ${last.hotel_name}`;
}

export type HotelStayImages = {
  hotel: string;
  city: string;
  image_urls: string[];
};

export type EnrichCatalogInput = {
  content: ItineraryContent;
  packageOption?: PackageOption;
  activities?: CatalogActivity[];
  guides?: CatalogGuide[];
  hotelImageUrls?: string[];
  hotelImagesByStay?: HotelStayImages[];
};

export function enrichItineraryContent(opts: EnrichCatalogInput): ItineraryContent {
  const {
    content,
    packageOption,
    activities = [],
    guides = [],
    hotelImageUrls = [],
    hotelImagesByStay = [],
  } = opts;
  const next: ItineraryContent = { ...content };

  // Keep guide as Ops placeholder unless already set to Assigned in Ops
  if (packageOption && (!next.guide || next.guide === "Assigned in Ops")) {
    next.guide = "Assigned in Ops";
  }
  // Avoid overwriting with catalog guide names into guest PDF
  void guides;

  if (next.days?.length) {
    next.days = next.days.map((d, i) => {
      const matched = activities.length ? matchActivitiesForDay(d, activities) : [];
      const hero = matched[0]?.image_url ?? d.hero_image ?? d.image;
      const activity_images = matched.slice(0, 4).map((a) => ({
        url: resolveImage({ explicit: a.image_url, cityHint: a.location, kind: "day" }),
        caption: a.name,
      }));
      const overnight =
        d.overnight && !/tbd|assign in ops/i.test(d.overnight)
          ? d.overnight
          : overnightForDay(i, packageOption) ?? d.overnight;
      return {
        ...d,
        overnight,
        hero_image: resolveImage({ explicit: hero, cityHint: d.route || d.title, kind: "day" }),
        activity_images: activity_images.length ? activity_images : d.activity_images,
      };
    });
  }

  if (next.hotel_options?.length && hotelImagesByStay.length) {
    next.hotel_options = next.hotel_options.map((o) => {
      const match =
        hotelImagesByStay.find(
          (h) =>
            h.hotel.toLowerCase().includes(o.hotel.toLowerCase().slice(0, 8)) ||
            (o.city && h.city.toLowerCase().includes(o.city.toLowerCase().slice(0, 4))),
        ) ?? hotelImagesByStay.find((h) => h.image_urls.length);
      return {
        ...o,
        image_urls: o.image_urls?.length ? o.image_urls : match?.image_urls ?? [],
      };
    });
  } else if (next.hotel_options?.length && hotelImageUrls.length) {
    next.hotel_options = next.hotel_options.map((o) => ({
      ...o,
      image_urls: o.image_urls?.length ? o.image_urls : hotelImageUrls,
    }));
  }

  if (!next.cover_image) {
    next.cover_image = resolveImage({
      cityHint: packageOption?.hotel.city || next.gateway || "Paro",
      kind: "cover",
    });
  }

  return next;
}
