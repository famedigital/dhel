import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";

export type PortalRole = "guide" | "driver";

export type PortalGuideRow = {
  id: string;
  agency_id: string;
  name: string;
  phone: string | null;
  languages: string | null;
  license_no: string | null;
  active: boolean;
  notes: string | null;
  day_rate_usd: number | null;
  portal_user_id: string | null;
  photo_url: string | null;
  bio: string | null;
  bio_draft: string | null;
  bank: string | null;
  account_no: string | null;
  payee_name: string | null;
  emv_static: string | null;
  portal_email: string | null;
};

export type PortalDriverRow = {
  id: string;
  agency_id: string;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  plate: string | null;
  active: boolean;
  notes: string | null;
  day_rate_usd: number | null;
  portal_user_id: string | null;
  photo_url: string | null;
  bio: string | null;
  bio_draft: string | null;
  bank: string | null;
  account_no: string | null;
  payee_name: string | null;
  emv_static: string | null;
  vehicle_photos: string[] | null;
  portal_email: string | null;
};

export type PortalStaff =
  | {
      role: "guide";
      row: PortalGuideRow;
      agencyId: string;
      userId: string;
      viewingAs: boolean;
      isAdmin: boolean;
    }
  | {
      role: "driver";
      row: PortalDriverRow;
      agencyId: string;
      userId: string;
      viewingAs: boolean;
      isAdmin: boolean;
    };

async function db() {
  return createAdminClient() ?? (await createClient());
}

/** Resolve portal staff. `asId` only honored for platform admin. */
export async function getPortalStaff(opts?: {
  role?: PortalRole;
  asId?: string | null;
}): Promise<PortalStaff | null> {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  const admin = isPlatformAdmin(ctx);
  const supabase = await db();
  const asId = opts?.asId?.trim() || null;

  if (admin && asId) {
    if (opts?.role === "driver" || !opts?.role) {
      const { data: driver } = await supabase.from("drivers").select("*").eq("id", asId).maybeSingle();
      if (driver) {
        return {
          role: "driver",
          row: driver as PortalDriverRow,
          agencyId: driver.agency_id as string,
          userId: ctx.userId,
          viewingAs: true,
          isAdmin: true,
        };
      }
    }
    if (opts?.role === "guide" || !opts?.role) {
      const { data: guide } = await supabase.from("guides").select("*").eq("id", asId).maybeSingle();
      if (guide) {
        return {
          role: "guide",
          row: guide as PortalGuideRow,
          agencyId: guide.agency_id as string,
          userId: ctx.userId,
          viewingAs: true,
          isAdmin: true,
        };
      }
    }
  }

  const { data: guide } = await supabase
    .from("guides")
    .select("*")
    .eq("portal_user_id", ctx.userId)
    .maybeSingle();
  if (guide && (!opts?.role || opts.role === "guide")) {
    return {
      role: "guide",
      row: guide as PortalGuideRow,
      agencyId: guide.agency_id as string,
      userId: ctx.userId,
      viewingAs: false,
      isAdmin: admin,
    };
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("*")
    .eq("portal_user_id", ctx.userId)
    .maybeSingle();
  if (driver && (!opts?.role || opts.role === "driver")) {
    return {
      role: "driver",
      row: driver as PortalDriverRow,
      agencyId: driver.agency_id as string,
      userId: ctx.userId,
      viewingAs: false,
      isAdmin: admin,
    };
  }

  return null;
}

export async function listAssignedTrips(staff: PortalStaff) {
  const supabase = await db();
  const col = staff.role === "guide" ? "guide_id" : "driver_id";
  const { data: staffRows } = await supabase
    .from("itinerary_staff")
    .select("id, itinerary_id, role, guides(name), drivers(name)")
    .eq(col, staff.row.id);

  const ids = [...new Set((staffRows ?? []).map((r) => r.itinerary_id as string))];
  if (!ids.length) return [];

  const { data: trips } = await supabase
    .from("itineraries")
    .select("id, title, client_name, content, language, updated_at, status")
    .in("id", ids)
    .order("updated_at", { ascending: false });

  return trips ?? [];
}

export function engagementFromTrips(
  trips: Array<{ content?: unknown; title?: string | null; client_name?: string | null }>,
): { status: "available" | "engaged"; label: string } {
  if (!trips.length) return { status: "available", label: "No upcoming assignments" };
  const first = trips[0];
  const name = first.client_name || first.title || "Trip";
  return { status: "engaged", label: `Engaged · ${name}` };
}
