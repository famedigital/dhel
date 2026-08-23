import { PreviewShell } from "@/components/preview/PreviewShell";
import { resolvePreviewAgencyId } from "@/lib/portal/preview-access";
import {
  loadPreviewItinerary,
  parsePreviewPack,
} from "@/lib/preview/load-preview-itinerary";

export default async function PreviewPage({
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

  // Auth gate only — document CSS stays inside the iframe route
  await loadPreviewItinerary(agencyId, id);

  return <PreviewShell itineraryId={id} pack={pack} />;
}
