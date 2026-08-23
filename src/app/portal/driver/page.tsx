import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import {
  engagementFromTrips,
  getPortalStaff,
  listAssignedTrips,
} from "@/lib/portal/staff";

export default async function PortalDriverHome({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");

  const staff = await getPortalStaff({ role: "driver", asId: params.as });
  if (!staff || staff.role !== "driver") {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login?error=" + encodeURIComponent("No driver profile linked"));
  }

  const trips = await listAssignedTrips(staff);
  const engagement = engagementFromTrips(trips);
  const q = params.as ? `?as=${params.as}` : "";
  const row = staff.row;

  return (
    <PortalShell
      role="driver"
      name={staff.row.name}
      viewingAs={staff.viewingAs}
      asId={params.as}
    >
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
        {row.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Car / driver portal
        {row.vehicle_type ? ` · ${row.vehicle_type}` : ""}
        {row.plate ? ` · ${row.plate}` : ""}
      </p>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Status</p>
        <p className="mt-1 text-lg font-medium">{engagement.label}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Bank QR: {row.emv_static ? "Set" : "Not set"}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium">Upcoming trips</p>
        {trips.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No assignments yet.</p>
        ) : (
          trips.slice(0, 5).map((t) => (
            <Link
              key={t.id}
              href={`/portal/driver/trips/${t.id}${q}`}
              className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="font-medium">{t.title || "Trip"}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t.client_name || "Guest"}
              </p>
            </Link>
          ))
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <Link href={`/portal/driver/trips${q}`} className="btn btn-secondary flex-1 text-center">
          All trips
        </Link>
        <Link href={`/portal/driver/profile${q}`} className="btn btn-primary flex-1 text-center">
          Profile
        </Link>
      </div>
    </PortalShell>
  );
}
