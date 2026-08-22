import { redirect } from "next/navigation";
import { PreviewShell } from "@/components/preview/PreviewShell";
import { getSessionContext } from "@/lib/agency";
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

  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");

  // Auth gate only — document CSS stays inside the iframe route
  await loadPreviewItinerary(ctx.agency.id, id);

  return <PreviewShell itineraryId={id} pack={pack} />;
}
