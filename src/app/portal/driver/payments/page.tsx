import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff, listAssignedTrips } from "@/lib/portal/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DriverPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: "driver", asId: sp.as });
  if (!staff || staff.role !== "driver") {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }

  const trips = await listAssignedTrips(staff);
  const tripIds = trips.map((t) => t.id);
  const supabase = createAdminClient() ?? (await createClient());
  let payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    party_label: string | null;
    note: string | null;
    itinerary_id: string;
  }> = [];

  if (tripIds.length) {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, currency, status, party_label, note, itinerary_id, party_type, party_id")
      .in("itinerary_id", tripIds)
      .eq("direction", "out")
      .order("created_at", { ascending: false });
    payments = (data || []).filter(
      (p) =>
        p.party_id === staff.row.id ||
        p.party_type === "driver" ||
        (p.party_label || "").toLowerCase().includes(staff.row.name.toLowerCase().slice(0, 4)),
    );
  }

  const tripTitle = (id: string) =>
    trips.find((t) => t.id === id)?.title || trips.find((t) => t.id === id)?.client_name || "Trip";

  return (
    <PortalShell role="driver" name={staff.row.name} viewingAs={staff.viewingAs} asId={sp.as}>
      <h1 className="page-title">Payments</h1>
      <p className="page-lead">Float and pays from your agent (view only).</p>
      <div className="mt-4 space-y-3">
        {payments.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
          >
            <p className="font-medium">
              {p.currency} {Number(p.amount).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {tripTitle(p.itinerary_id)} · {p.status}
              {p.party_label ? ` · ${p.party_label}` : ""}
            </p>
            {p.note ? <p className="mt-1 text-sm">{p.note}</p> : null}
          </div>
        ))}
        {!payments.length ? (
          <p className="field-hint">No outgoing payments tagged to you yet.</p>
        ) : null}
      </div>
    </PortalShell>
  );
}
