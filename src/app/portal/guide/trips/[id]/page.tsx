import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function loadTrip(staffRole: "guide" | "driver", asId: string | undefined, itineraryId: string) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: staffRole, asId });
  if (!staff) {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }
  const trips = await listAssignedTrips(staff);
  const allowed = staff.isAdmin || trips.some((t) => t.id === itineraryId);
  if (!allowed && !staff.viewingAs) {
    // Admin view-as or assigned only
    const admin = createAdminClient();
    if (!admin && !staff.isAdmin) redirect(`/portal/${staffRole}/trips`);
  }
  const supabase = createAdminClient() ?? (await createClient());
  const { data: trip } = await supabase
    .from("itineraries")
    .select("id, title, client_name, language, content")
    .eq("id", itineraryId)
    .maybeSingle();
  if (!trip) redirect(`/portal/${staffRole}/trips`);
  return { staff, trip, q: asId ? `?as=${asId}` : "" };
}

export default async function GuideTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { staff, trip, q } = await loadTrip("guide", sp.as, id);

  return (
    <PortalShell role="guide" name={staff.row.name} viewingAs={staff.viewingAs} asId={sp.as}>
      <h1 className="page-title">{trip.title || "Trip"}</h1>
      <p className="page-lead">{trip.client_name || "Guest"}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={`/preview/${trip.id}?pack=field`}
          className="btn btn-primary text-center"
          target="_blank"
        >
          Open field pack (no rates)
        </Link>
        <Link
          href={`/portal/guide/trips/${trip.id}/today${q}`}
          className="btn btn-secondary text-center"
        >
          Today — upload ops log
        </Link>
        <Link href={`/portal/guide/trips${q}`} className="btn btn-ghost text-center">
          Back to trips
        </Link>
      </div>
    </PortalShell>
  );
}
