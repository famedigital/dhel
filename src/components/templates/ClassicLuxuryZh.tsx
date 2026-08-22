import type { Brand, Itinerary, ItineraryOpsBundle } from "@/lib/types";
import { ClassicLuxuryDocument } from "@/components/templates/ClassicLuxury";

/** Chinese guest PDF — delegates to ClassicLuxury with lang-zh styling. */
export function ClassicLuxuryZhDocument({
  itinerary,
  brand,
  ops,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
  ops?: ItineraryOpsBundle | null;
}) {
  return (
    <ClassicLuxuryDocument
      itinerary={{ ...itinerary, language: "zh" }}
      brand={brand}
      ops={ops}
    />
  );
}
