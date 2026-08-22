import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { ensureOpsSeed } from "@/lib/ops";
import { deleteDriver, saveDriver } from "@/app/actions/ops";
import type { Driver } from "@/lib/types";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");
  const q = await searchParams;
  await ensureOpsSeed(ctx.agency.id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("drivers")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .order("name");
  const drivers = (data || []) as Driver[];

  return (
    <AppShell agencyName={ctx.agency.name} email={ctx.email} role={ctx.membership?.role} contentWidth="wide">
      <h1 className="page-title">Drivers</h1>
      <p className="page-lead">Live driver/vehicle roster — plate and phone print on ops pack.</p>
      <div className="chips" style={{ marginBottom: "1rem" }}>
        <a className="chip" href="/resources/hotels">Hotels</a>
        <a className="chip" href="/resources/guides">Guides</a>
        <a className="chip" href="/resources/drivers">Drivers</a>
      </div>
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Day rate USD</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <strong>{d.name}</strong>
                </TableCell>
                <TableCell>{d.phone || "—"}</TableCell>
                <TableCell>{d.vehicle_type || "—"}</TableCell>
                <TableCell>{d.plate || "—"}</TableCell>
                <TableCell>{d.day_rate_usd != null ? `$${d.day_rate_usd}` : "—"}</TableCell>
                <TableCell>
                  <form action={deleteDriver}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      Delete
                    </button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="panel">
        <p className="section-title">Add driver</p>
        <form action={saveDriver} className="form-stack">
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input className="input" name="name" required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" name="phone" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Vehicle</label>
              <input className="input" name="vehicle_type" placeholder="Hyundai Santa Fe" />
            </div>
            <div className="field">
              <label>Plate</label>
              <input className="input" name="plate" />
            </div>
          </div>
          <div className="field">
            <label>Day rate USD (manual net)</label>
            <input className="input" name="day_rate_usd" type="number" step="0.01" placeholder="235" />
          </div>
          <button type="submit" className="btn btn-primary">
            Save driver
          </button>
        </form>
      </div>
    </AppShell>
  );
}
