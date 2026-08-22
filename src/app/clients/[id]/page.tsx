import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { deleteClient, saveClient } from "@/app/actions/ops";
import type { Client, Itinerary, ItineraryStay, Payment } from "@/lib/types";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("agency_id", ctx.agency.id)
    .maybeSingle();
  if (!client) notFound();
  const c = client as Client;

  const { data: trips } = await supabase
    .from("itineraries")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .or(`client_id.eq.${id},client_name.ilike.%${c.name}%`)
    .order("updated_at", { ascending: false });

  const itineraries = (trips || []) as Itinerary[];

  const completeness: Record<
    string,
    { stays: number; rooms: number; staff: number; moneyIn: number; moneyOut: number }
  > = {};

  for (const it of itineraries) {
    const [stays, staff, payments] = await Promise.all([
      supabase
        .from("itinerary_stays")
        .select("id, room_id")
        .eq("itinerary_id", it.id),
      supabase.from("itinerary_staff").select("id").eq("itinerary_id", it.id),
      supabase.from("payments").select("direction, amount, status").eq("itinerary_id", it.id),
    ]);
    const stayRows = (stays.data || []) as Pick<ItineraryStay, "id" | "room_id">[];
    const payRows = (payments.data || []) as Pick<Payment, "direction" | "amount" | "status">[];
    completeness[it.id] = {
      stays: stayRows.length,
      rooms: stayRows.filter((s) => s.room_id).length,
      staff: (staff.data || []).length,
      moneyIn: payRows
        .filter((p) => p.direction === "in" && p.status === "paid")
        .reduce((a, p) => a + Number(p.amount), 0),
      moneyOut: payRows
        .filter((p) => p.direction === "out" && p.status === "paid")
        .reduce((a, p) => a + Number(p.amount), 0),
    };
  }

  return (
    <AppShell agencyName={ctx.agency.name} email={ctx.email} role={ctx.membership?.role}>
      <div className="toolbar">
        <div>
          <p className="field-hint" style={{ marginBottom: 4 }}>
            <Link href="/clients">← Clients</Link>
          </p>
          <h1 className="page-title">{c.name}</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Contact + ops completeness for linked trips.
          </p>
        </div>
        <div className="toolbar-actions">
          <Link
            href={`/itineraries/new?client_id=${c.id}&client_name=${encodeURIComponent(c.name)}`}
            className="btn btn-primary"
          >
            New itinerary
          </Link>
        </div>
      </div>
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="panel">
          <p className="section-title">Profile</p>
          <form action={saveClient} className="form-stack">
            <input type="hidden" name="id" value={c.id} />
            <div className="field">
              <label htmlFor="name">Name</label>
              <input className="input" id="name" name="name" defaultValue={c.name} required />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input className="input" id="phone" name="phone" defaultValue={c.phone || ""} />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  className="input"
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={c.email || ""}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="nationality">Nationality</label>
              <input
                className="input"
                id="nationality"
                name="nationality"
                defaultValue={c.nationality || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="passport_notes">Passport notes</label>
              <input
                className="input"
                id="passport_notes"
                name="passport_notes"
                defaultValue={c.passport_notes || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea
                className="textarea"
                id="notes"
                name="notes"
                rows={3}
                defaultValue={c.notes || ""}
              />
            </div>
            <div className="split-actions">
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
          <form action={deleteClient} style={{ marginTop: "0.75rem" }}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="btn btn-danger">
              Delete client
            </button>
          </form>
        </div>

        <div className="panel">
          <p className="section-title">Itineraries</p>
          {itineraries.length === 0 ? (
            <p className="empty">No trips yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Title</TableHead>
                  <TableHead>Ops</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itineraries.map((it) => {
                  const o = completeness[it.id];
                  return (
                    <TableRow key={it.id}>
                      <TableCell>
                        <Link href={`/itineraries/${it.id}`}>{it.title}</Link>
                        <div className="field-hint">{it.status}</div>
                      </TableCell>
                      <TableCell>
                        <span className="badge">
                          stays {o?.stays || 0}/{o?.rooms || 0} rooms
                        </span>{" "}
                        <span className="badge">staff {o?.staff || 0}</span>{" "}
                        <span className="badge">
                          ${(o?.moneyIn || 0).toFixed(0)} in / ${(o?.moneyOut || 0).toFixed(0)} out
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link className="btn btn-ghost btn-sm" href={`/itineraries/${it.id}?tab=stays`}>
                          Ops
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
