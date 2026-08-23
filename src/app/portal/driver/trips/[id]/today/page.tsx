import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { CloudinaryUpload } from "@/components/media/CloudinaryUpload";
import { addTripOpsLog } from "@/app/actions/portal";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DriverTodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string; saved?: string }>;
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
  if (!staff.isAdmin && !trips.some((t) => t.id === id)) redirect("/portal/driver/trips");

  const supabase = createAdminClient() ?? (await createClient());
  const { data: logs } = await supabase
    .from("trip_ops_logs")
    .select("*")
    .eq("itinerary_id", id)
    .eq("role", "driver")
    .order("created_at", { ascending: false })
    .limit(20);

  const as = sp.as || "";

  return (
    <PortalShell role="driver" name={staff.row.name} viewingAs={staff.viewingAs} asId={sp.as}>
      <h1 className="page-title">Today</h1>
      {sp.saved ? <div className="alert alert-ok">Logged.</div> : null}
      <div className="panel mt-4">
        <CloudinaryUpload folder="ops-logs" label="Upload receipt" />
      </div>
      <form action={addTripOpsLog} className="form-stack panel mt-4">
        <input type="hidden" name="role" value="driver" />
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="itinerary_id" value={id} />
        <div className="field">
          <label>Type</label>
          <select className="select" name="category" defaultValue="fuel">
            <option value="fuel">Fuel / road</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Amount Nu</label>
          <input className="input" name="amount_nu" type="number" step="0.01" />
        </div>
        <div className="field">
          <label>Photo URL</label>
          <input className="input" name="photo_url" />
        </div>
        <div className="field">
          <label>Note</label>
          <input className="input" name="note" />
        </div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {(logs || []).map((log) => (
          <div key={log.id} className="rounded-xl border p-3 text-sm">
            <strong className="capitalize">{String(log.category)}</strong>
            {log.amount_nu != null ? ` · Nu ${log.amount_nu}` : ""}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
