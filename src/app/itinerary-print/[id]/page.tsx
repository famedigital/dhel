import { redirect } from "next/navigation";
import { ItineraryRenderer } from "@/components/templates/ItineraryRenderer";
import { getSessionContext } from "@/lib/agency";
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

  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");

  const { itinerary, brand, ops } = await loadPreviewItinerary(ctx.agency.id, id);
  const resolvedBrand = brand || ctx.brand;

  return (
    <ItineraryRenderer
      itinerary={itinerary}
      brand={resolvedBrand || undefined}
      ops={ops}
      pack={pack}
    />
  );
}
