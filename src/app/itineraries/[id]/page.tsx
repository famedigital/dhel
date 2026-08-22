import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ContentEditor } from "@/components/ContentEditor";
import { OpsDesk } from "@/components/OpsDesk";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { ensureOpsSeed, loadItineraryOps } from "@/lib/ops";
import {
  deleteItinerary,
  duplicateItinerary,
  regenerateItinerary,
  updateItinerary,
} from "@/app/actions/itineraries";
import { friendlyAiWarning } from "@/lib/ai/friendly-warning";
import type {
  Client,
  Driver,
  Guide,
  Hotel,
  Itinerary,
  ItineraryStaff,
  ItineraryStay,
  Payment,
  Room,
  TripFlight,
  TripTraveler,
} from "@/lib/types";

export default async function ItineraryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
    warning?: string;
    tab?: string;
  }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const tab = q.tab || "narrative";
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");

  await ensureOpsSeed(ctx.agency.id);

  const supabase = await createClient();
  const { data } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .eq("agency_id", ctx.agency.id)
    .maybeSingle();

  if (!data) notFound();
  const it = data as Itinerary;

  const ops = await loadItineraryOps(ctx.agency.id, id);
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name")
    .eq("agency_id", ctx.agency.id)
    .order("name");
  const clients = (clientsData || []) as Pick<Client, "id" | "name">[];

  return (
    <AppShell
      agencyName={ctx.agency.name}
      email={ctx.email}
      role={ctx.membership?.role}
      contentWidth="wide"
    >
      <div className="toolbar">
        <div>
          <h1 className="page-title">{it.title}</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Narrative (AI) + live stays / staff / payments. Guest PDF reads real hotel rooms.
          </p>
        </div>
        <div className="toolbar-actions">
          <Link href={`/preview/${it.id}?pack=guest`} className="btn btn-secondary">
            Guest PDF
          </Link>
          <Link href={`/preview/${it.id}?pack=ops`} className="btn btn-ghost">
            Ops pack
          </Link>
          <form action={duplicateItinerary}>
            <input type="hidden" name="id" value={it.id} />
            <button type="submit" className="btn btn-ghost">
              Duplicate
            </button>
          </form>
        </div>
      </div>

      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {friendlyAiWarning(q.warning) ? <div className="alert alert-warn">{friendlyAiWarning(q.warning)}</div> : null}

      <OpsDesk
        itineraryId={it.id}
        tab={tab}
        tripTitle={it.title}
        expectedPax={Number(it.content?.pricing?.pax) || 0}
        days={Array.isArray(it.content?.days) ? it.content.days : []}
        generationMeta={it.generation_meta}
        stays={ops.stays as ItineraryStay[]}
        staff={ops.staff as ItineraryStaff[]}
        payments={ops.payments as Payment[]}
        hotels={ops.hotels as Hotel[]}
        rooms={ops.rooms as Room[]}
        guides={ops.guides as Guide[]}
        drivers={ops.drivers as Driver[]}
        travelers={ops.travelers as TripTraveler[]}
        flights={ops.flights as TripFlight[]}
      />

      {tab === "narrative" ? (
        <div className="editor-layout">
          <div className="panel">
            <form action={updateItinerary} className="form-stack">
              <input type="hidden" name="id" value={it.id} />
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="title">Title</label>
                  <input className="input" id="title" name="title" defaultValue={it.title} />
                </div>
                <div className="field">
                  <label htmlFor="client_id">Client (live CRM)</label>
                  <select
                    className="select"
                    id="client_id"
                    name="client_id"
                    defaultValue={it.client_id || ""}
                  >
                    <option value="">— free-text only —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="client_name">Client name (on PDF)</label>
                <input
                  className="input"
                  id="client_name"
                  name="client_name"
                  defaultValue={it.client_name || ""}
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="language">Language</label>
                  <select className="select" id="language" name="language" defaultValue={it.language}>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="template_id">Template</label>
                  <select
                    className="select"
                    id="template_id"
                    name="template_id"
                    defaultValue={it.template_id}
                  >
                    <option value="classic-luxury">Classic Luxury (client-ready PDF)</option>
                    <option value="compact">Compact (shell · not client-ready)</option>
                    <option value="editorial-deep">Editorial Deep (shell · not client-ready)</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select className="select" id="status" name="status" defaultValue={it.status}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="brief">Brief</label>
                <textarea
                  className="textarea"
                  id="brief"
                  name="brief"
                  rows={3}
                  defaultValue={it.brief || ""}
                />
              </div>

              <ContentEditor initialJson={it.content} itineraryId={it.id} />

              <div className="split-actions">
                <button type="submit" className="btn btn-primary">
                  Save narrative
                </button>
              </div>
            </form>
          </div>

          <div className="panel">
            <p className="section-title">Regenerate narrative</p>
            <p className="field-hint mb-4">
              AI drafts letter and day prose only. Hotels, room #s, guides, and drivers are assigned
              under Stays / Staff from live inventory.
            </p>
            <form action={regenerateItinerary} className="form-stack">
              <input type="hidden" name="id" value={it.id} />
              <input type="hidden" name="brief" value={it.brief || ""} />
              <input type="hidden" name="language" value={it.language} />
              <input type="hidden" name="client_name" value={it.client_name || ""} />
              <div className="field">
                <label htmlFor="days">Days</label>
                <input
                  className="input"
                  id="days"
                  name="days"
                  type="number"
                  min={3}
                  max={21}
                  defaultValue={(it.content?.days?.length as number) || 7}
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                Regenerate draft
              </button>
            </form>
          </div>

          {ctx.membership?.role === "owner" ? (
            <div className="panel">
              <p className="section-title">Danger zone</p>
              <form action={deleteItinerary}>
                <input type="hidden" name="id" value={it.id} />
                <button type="submit" className="btn btn-danger">
                  Delete itinerary
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
