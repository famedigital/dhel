import Link from "next/link";
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
import {
  deleteRoom,
  saveHotel,
  saveRoom,
  seedAgencyResources,
  importCatalogHotels,
} from "@/app/actions/ops";
import { CloudinaryUpload } from "@/components/media/CloudinaryUpload";
import type { Hotel, Room } from "@/lib/types";

function ResourceNav() {
  return (
    <div className="chips" style={{ marginBottom: "1rem" }}>
      <Link className="chip" href="/resources/hotels">
        Hotels
      </Link>
      <Link className="chip" href="/resources/guides">
        Guides
      </Link>
      <Link className="chip" href="/resources/drivers">
        Drivers
      </Link>
    </div>
  );
}

export default async function HotelsPage({
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
  const { data: hotelsData } = await supabase
    .from("hotels")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .order("name");
  const hotels = (hotelsData || []) as Hotel[];
  const { data: roomsData } = await supabase
    .from("rooms")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .order("room_number");
  const rooms = (roomsData || []) as Room[];

  return (
    <AppShell agencyName={ctx.agency.name} email={ctx.email} role={ctx.membership?.role} contentWidth="wide">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Hotels & rooms</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Live inventory — room numbers assigned on itineraries become vouchers.
          </p>
        </div>
        <div className="toolbar-actions">
          <form action={importCatalogHotels}>
            <button type="submit" className="btn btn-secondary">
              Import from library
            </button>
          </form>
          <form action={seedAgencyResources}>
            <button type="submit" className="btn btn-secondary">
              Seed Pelbu Suites
            </button>
          </form>
        </div>
      </div>
      <ResourceNav />
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Hotel images</p>
        <p className="field-hint" style={{ marginBottom: "0.75rem" }}>
          Upload to Cloudinary — paste the returned URL into hotel notes or catalog metadata.
        </p>
        <CloudinaryUpload folder="hotels" label="Upload hotel photo" />
      </div>

      {hotels.map((h) => {
        const hotelRooms = rooms.filter((r) => r.hotel_id === h.id);
        return (
          <div className="panel" key={h.id} style={{ marginBottom: "1rem" }}>
            <div className="toolbar" style={{ marginBottom: "0.75rem" }}>
              <div>
                <p className="section-title" style={{ marginBottom: 0 }}>
                  {h.name}
                </p>
                <p className="field-hint">
                  {[h.city, h.phone, h.email].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <span className="badge">{h.active ? "active" : "inactive"}</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Room #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotelRooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <strong>{r.room_number}</strong>
                    </TableCell>
                    <TableCell>{r.room_type}</TableCell>
                    <TableCell>
                      <span className="badge">{r.status}</span>
                    </TableCell>
                    <TableCell>
                      <form action={deleteRoom}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="btn btn-ghost btn-sm">
                          Remove
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <form action={saveRoom} className="form-stack" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="hotel_id" value={h.id} />
              <p className="section-title">Add room</p>
              <div className="grid-2">
                <div className="field">
                  <label>Room number</label>
                  <input className="input" name="room_number" required placeholder="305" />
                </div>
                <div className="field">
                  <label>Type</label>
                  <input className="input" name="room_type" defaultValue="Deluxe Twin" />
                </div>
              </div>
              <div className="field">
                <label>Status</label>
                <select className="select" name="status" defaultValue="available">
                  <option value="available">available</option>
                  <option value="held">held</option>
                  <option value="blocked">blocked</option>
                  <option value="maintenance">maintenance</option>
                </select>
              </div>
              <div className="field">
                <label>Net rate USD / night (manual)</label>
                <input className="input" name="net_rate_usd" type="number" step="0.01" placeholder="e.g. 95" />
              </div>
              <button type="submit" className="btn btn-secondary">
                Add room
              </button>
            </form>
          </div>
        );
      })}

      <div className="panel">
        <p className="section-title">Add hotel</p>
        <form action={saveHotel} className="form-stack">
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input className="input" name="name" required />
            </div>
            <div className="field">
              <label>City</label>
              <input className="input" name="city" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Phone</label>
              <input className="input" name="phone" />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" name="email" type="email" />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <input className="input" name="address" />
          </div>
          <button type="submit" className="btn btn-primary">
            Create hotel
          </button>
        </form>
      </div>
    </AppShell>
  );
}
