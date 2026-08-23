import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { CloudinaryUpload } from "@/components/media/CloudinaryUpload";
import { addTripOpsLog } from "@/app/actions/portal";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = [
  { id: "client_photo", label: "Client photo" },
  { id: "hotel_feedback", label: "Hotel feedback" },
  { id: "entry_ticket", label: "Entry ticket" },
  { id: "room_checkout", label: "Room checkout" },
  { id: "meal_bill", label: "Lunch / dinner bill" },
  { id: "cash", label: "Cash spent" },
  { id: "fuel", label: "Fuel / road" },
  { id: "other", label: "Other" },
] as const;

export default async function GuideTodayPage({
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
  const staff = await getPortalStaff({ role: "guide", asId: sp.as });
  if (!staff) {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }
  const trips = await listAssignedTrips(staff);
  if (!staff.isAdmin && !trips.some((t) => t.id === id)) redirect("/portal/guide/trips");

  const supabase = createAdminClient() ?? (await createClient());
  const { data: logs } = await supabase
    .from("trip_ops_logs")
    .select("*")
    .eq("itinerary_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  const as = sp.as || "";

  return (
    <PortalShell role="guide" name={staff.row.name} viewingAs={staff.viewingAs} asId={sp.as}>
      <h1 className="page-title">Today</h1>
      <p className="page-lead">Upload tickets, bills, and notes for the agent.</p>
      {sp.saved ? <div className="alert alert-ok">Logged.</div> : null}

      <div className="panel mt-4">
        <CloudinaryUpload folder="ops-logs" label="Upload photo first" />
        <p className="field-hint mt-2">Paste URL into the form below.</p>
      </div>

      <form action={addTripOpsLog} className="form-stack panel mt-4">
        <input type="hidden" name="role" value="guide" />
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="itinerary_id" value={id} />
        <div className="field">
          <label>Type</label>
          <select className="select" name="category" required defaultValue="entry_ticket">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Day #</label>
            <input className="input" name="day_number" type="number" min={1} />
          </div>
          <div className="field">
            <label>Amount Nu</label>
            <input className="input" name="amount_nu" type="number" step="0.01" />
          </div>
        </div>
        <div className="field">
          <label>Photo URL</label>
          <input className="input" name="photo_url" placeholder="https://…" />
        </div>
        <div className="field">
          <label>Note</label>
          <textarea className="input" name="note" rows={2} />
        </div>
        <button type="submit" className="btn btn-primary">
          Submit log
        </button>
      </form>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium">Recent logs</p>
        {(logs || []).map((log) => (
          <div
            key={log.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm"
          >
            <p className="font-medium capitalize">{String(log.category).replace(/_/g, " ")}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {log.amount_nu != null ? `Nu ${log.amount_nu} · ` : ""}
              {log.note || "—"}
            </p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
