import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff } from "@/lib/portal/staff";

/** Entry: route staff to role home; superadmin without staff link → directory. */
export default async function PortalIndexPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");

  const staff = await getPortalStaff();
  if (staff) redirect(`/portal/${staff.role}`);

  if (isPlatformAdmin(ctx)) redirect("/platform/portal");

  redirect(
    "/portal/login?error=" +
      encodeURIComponent("No guide/driver profile linked to this account"),
  );
}
