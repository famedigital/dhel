import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";

export default async function GuideTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: "guide", asId: params.as });
  if (!staff) {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }
  const trips = await listAssignedTrips(staff);
  const q = params.as ? `?as=${params.as}` : "";

  return (
    <PortalShell
      role="guide"
      name={staff.row.name}
      viewingAs={staff.viewingAs}
      asId={params.as}
    >
      <h1 className="page-title">Trips</h1>
      <ul className="mt-4 space-y-3">
        {trips.map((t) => (
          <li key={t.id}>
            <Link
              href={`/portal/guide/trips/${t.id}${q}`}
              className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="font-medium">{t.title || "Trip"}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t.client_name || "Guest"} · Open for field pack &amp; Today
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {!trips.length ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">No assigned trips.</p>
      ) : null}
    </PortalShell>
  );
}
