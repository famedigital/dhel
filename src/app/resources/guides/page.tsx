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
import { deleteGuide, saveGuide } from "@/app/actions/ops";
import type { Guide } from "@/lib/types";

export default async function GuidesPage({
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
    .from("guides")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .order("name");
  const guides = (data || []) as Guide[];

  return (
    <AppShell agencyName={ctx.agency.name} email={ctx.email} role={ctx.membership?.role} contentWidth="wide">
      <h1 className="page-title">Guides</h1>
      <p className="page-lead">Live guide roster — assigned on itineraries (phone & license print on ops pack).</p>
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
              <TableHead>Languages</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Day rate USD</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guides.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <strong>{g.name}</strong>
                  {!g.active ? <span className="badge">inactive</span> : null}
                </TableCell>
                <TableCell>{g.phone || "—"}</TableCell>
                <TableCell>{g.languages || "—"}</TableCell>
                <TableCell>{g.license_no || "—"}</TableCell>
                <TableCell>{g.day_rate_usd != null ? `$${g.day_rate_usd}` : "—"}</TableCell>
                <TableCell>
                  <form action={deleteGuide}>
                    <input type="hidden" name="id" value={g.id} />
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
        <p className="section-title">Add guide</p>
        <form action={saveGuide} className="form-stack">
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
              <label>Languages</label>
              <input className="input" name="languages" placeholder="English, Chinese" />
            </div>
            <div className="field">
              <label>License</label>
              <input className="input" name="license_no" />
            </div>
          </div>
          <div className="field">
            <label>Day rate USD (manual net)</label>
            <input className="input" name="day_rate_usd" type="number" step="0.01" placeholder="85" />
          </div>
          <button type="submit" className="btn btn-primary">
            Save guide
          </button>
        </form>
      </div>
    </AppShell>
  );
}
