import { ItineraryRenderer } from "@/components/templates/ItineraryRenderer";
import { getSessionContext } from "@/lib/agency";
import { resolvePreviewAgencyId } from "@/lib/portal/preview-access";
import {
  loadPreviewItinerary,
  parsePreviewPack,
} from "@/lib/preview/load-preview-itinerary";

export default async function ItineraryPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pack?: string }>;
}) {
  const { id } = await params;
  const { pack: packParam } = await searchParams;
  const pack = parsePreviewPack(packParam);

  const agencyId = await resolvePreviewAgencyId(id);
  const ctx = await getSessionContext();
  const { itinerary, brand, ops } = await loadPreviewItinerary(agencyId, id);
  const resolvedBrand = brand || ctx?.brand;

  return (
    <ItineraryRenderer
      itinerary={itinerary}
      brand={resolvedBrand || undefined}
      ops={ops}
      pack={pack}
    />
  );
}
