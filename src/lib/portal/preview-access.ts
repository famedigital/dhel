import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Agency id for preview/print: desk membership or assigned portal staff. */
export async function resolvePreviewAgencyId(itineraryId: string): Promise<string> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const staff = await getPortalStaff();
  if (staff) {
    const linked = staff.row.portal_user_id === ctx.userId;
    if (linked || staff.viewingAs) {
      if (!staff.isAdmin && !staff.viewingAs) {
        const trips = await listAssignedTrips(staff);
        if (!trips.some((t) => t.id === itineraryId)) {
          redirect(`/portal/${staff.role}/trips`);
        }
      }
      return staff.agencyId;
    }
  }

  if (ctx.agency?.id) return ctx.agency.id;

  if (isPlatformAdmin(ctx)) {
    const db = createAdminClient() ?? (await createClient());
    const { data } = await db
      .from("itineraries")
      .select("agency_id")
      .eq("id", itineraryId)
      .maybeSingle();
    if (data?.agency_id) return data.agency_id as string;
  }

  redirect("/onboarding");
}
