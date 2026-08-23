import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";

export default async function DriverTodayRedirect({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: "driver", asId: sp.as });
  if (!staff) {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }
  const trips = await listAssignedTrips(staff);
  const q = sp.as ? `?as=${sp.as}` : "";
  if (!trips.length) redirect(`/portal/driver/trips${q}`);
  redirect(`/portal/driver/trips/${trips[0].id}/today${q}`);
}
