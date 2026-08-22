import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
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
import { deleteClient, saveClient } from "@/app/actions/ops";
import type { Client } from "@/lib/types";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");
  const q = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .order("name");
  const clients = (data || []) as Client[];

  return (
    <AppShell agencyName={ctx.agency.name} email={ctx.email} role={ctx.membership?.role} contentWidth="wide">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Guest masters — linked itineraries carry live stays, staff, and payments.
          </p>
        </div>
      </div>
      {q.error ? <Alert variant="destructive">{q.error}</Alert> : null}
      {q.saved ? <Alert variant="success">Saved.</Alert> : null}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="panel">
          <p className="section-title">All clients</p>
          {clients.length === 0 ? (
            <EmptyState
              title="No clients yet"
              description="Add a guest master on the right — itineraries can link stays, staff, and payments later."
              className="py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/clients/${c.id}`} style={{ fontWeight: 500 }}>
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell>
                      <Link className="btn btn-ghost btn-sm" href={`/clients/${c.id}`}>
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="panel">
          <p className="section-title">New client</p>
          <form action={saveClient} className="form-stack">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input className="input" id="phone" name="phone" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="nationality">Nationality</label>
              <input className="input" id="nationality" name="nationality" />
            </div>
            <div className="field">
              <label htmlFor="passport_notes">Passport notes</label>
              <input className="input" id="passport_notes" name="passport_notes" />
            </div>
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea className="textarea" id="notes" name="notes" rows={3} />
            </div>
            <button type="submit" className="btn btn-primary">
              Create client
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
