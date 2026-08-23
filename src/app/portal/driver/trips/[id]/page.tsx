import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DriverTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: "driver", asId: sp.as });
  if (!staff) {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }
  const trips = await listAssignedTrips(staff);
  if (!staff.isAdmin && !trips.some((t) => t.id === id)) {
    redirect("/portal/driver/trips");
  }
  const supabase = createAdminClient() ?? (await createClient());
  const { data: trip } = await supabase
    .from("itineraries")
    .select("id, title, client_name")
    .eq("id", id)
    .maybeSingle();
  if (!trip) redirect("/portal/driver/trips");
  const q = sp.as ? `?as=${sp.as}` : "";

  return (
    <PortalShell role="driver" name={staff.row.name} viewingAs={staff.viewingAs} asId={sp.as}>
      <h1 className="page-title">{trip.title || "Trip"}</h1>
      <p className="page-lead">{trip.client_name || "Guest"}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={`/preview/${trip.id}?pack=field`}
          className="btn btn-primary text-center"
          target="_blank"
        >
          Open field pack
        </Link>
        <Link
          href={`/portal/driver/trips/${trip.id}/today${q}`}
          className="btn btn-secondary text-center"
        >
          Today — fuel &amp; uploads
        </Link>
      </div>
    </PortalShell>
  );
}
