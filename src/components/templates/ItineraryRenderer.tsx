import type { Brand, Itinerary, ItineraryOpsBundle, TemplateId } from "@/lib/types";
import { ClassicLuxuryDocument } from "@/components/templates/ClassicLuxury";
import { ClassicLuxuryZhDocument } from "@/components/templates/ClassicLuxuryZh";
import { CompactDocument } from "@/components/templates/CompactShell";
import { EditorialDocument } from "@/components/templates/EditorialShell";
import { FieldPackDocument } from "@/components/templates/FieldPack";
import { OpsPackDocument } from "@/components/templates/OpsPack";

export function ItineraryRenderer({
  itinerary,
  brand,
  templateId,
  ops,
  pack = "guest",
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
  templateId?: TemplateId;
  ops?: ItineraryOpsBundle | null;
  pack?: "guest" | "ops" | "field";
}) {
  if (pack === "field" && ops) {
    return <FieldPackDocument itinerary={itinerary} brand={brand} ops={ops} />;
  }

  if (pack === "ops" && ops) {
    return <OpsPackDocument itinerary={itinerary} brand={brand} ops={ops} />;
  }

  const t = templateId || itinerary.template_id || "classic-luxury";
  if (t === "compact") {
    return <CompactDocument itinerary={itinerary} brand={brand} />;
  }
  if (t === "editorial-deep") {
    return <EditorialDocument itinerary={itinerary} brand={brand} />;
  }
  if (itinerary.language === "zh" && t === "classic-luxury") {
    return <ClassicLuxuryZhDocument itinerary={itinerary} brand={brand} ops={ops} />;
  }
  return (
    <ClassicLuxuryDocument itinerary={itinerary} brand={brand} ops={ops} />
  );
}
