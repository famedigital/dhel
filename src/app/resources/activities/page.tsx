import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ResourceNav } from "@/components/resources/ResourceNav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteCatalogActivity,
  saveCatalogActivity,
} from "@/app/actions/catalog";

type CatalogActivity = {
  id: string;
  name: string;
  slug: string | null;
  dzongkhag: string | null;
  net_usd: number | null;
  net_inr: number | null;
  active: boolean;
};

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");
  const q = await searchParams;
  const canEdit = isPlatformAdmin(ctx);

  const supabase = createAdminClient() ?? (await createClient());
  const { data, error } = await supabase
    .from("catalog_activities")
    .select("id, name, slug, dzongkhag, net_usd, net_inr, active")
    .order("name");
  const activities = (data || []) as CatalogActivity[];

  return (
    <AppShell agencyName={ctx.agency.name} email={ctx.email} role={ctx.membership?.role} contentWidth="wide">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Activities</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Master activity library (browse). Hotels / guides / drivers use your agency roster —
            same tables as trip assign.
          </p>
        </div>
        <p className="field-hint" style={{ margin: 0 }}>
          {activities.length} activities
        </p>
      </div>
      <ResourceNav active="/resources/activities" />
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {error ? <div className="alert alert-error">{error.message}</div> : null}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        {activities.length === 0 ? (
          <p className="field-hint">No activities in the master catalog yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Net USD</TableHead>
                <TableHead>Net INR</TableHead>
                <TableHead>Status</TableHead>
                {canEdit ? <TableHead></TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <strong>{a.name}</strong>
                  </TableCell>
                  <TableCell>{a.dzongkhag || "—"}</TableCell>
                  <TableCell>{a.net_usd != null ? `$${a.net_usd}` : "—"}</TableCell>
                  <TableCell>{a.net_inr != null ? `₹${a.net_inr}` : "—"}</TableCell>
                  <TableCell>
                    <span className="badge">{a.active ? "active" : "inactive"}</span>
                  </TableCell>
                  {canEdit ? (
                    <TableCell>
                      <form action={deleteCatalogActivity}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="btn btn-ghost btn-sm">
                          Delete
                        </button>
                      </form>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {canEdit ? (
        <div className="panel">
          <p className="section-title">Add activity (superadmin)</p>
          <form action={saveCatalogActivity} className="form-stack">
            <div className="grid-2">
              <div className="field">
                <label>Name</label>
                <input className="input" name="name" required />
              </div>
              <div className="field">
                <label>Location / dzongkhag</label>
                <input className="input" name="dzongkhag" placeholder="Paro" />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Net USD</label>
                <input className="input" name="net_usd" type="number" step="0.01" />
              </div>
              <div className="field">
                <label>Net INR</label>
                <input className="input" name="net_inr" type="number" step="0.01" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Save activity
            </button>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
