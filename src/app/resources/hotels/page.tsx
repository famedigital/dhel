import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ResourceNav } from "@/components/resources/ResourceNav";
import { HotelsRosterPanel } from "@/components/resources/HotelsRosterPanel";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { ensureOpsSeed } from "@/lib/ops";
import type { Hotel, Room } from "@/lib/types";

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; warning?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");
  const q = await searchParams;
  await ensureOpsSeed(ctx.agency.id);

  const supabase = await createClient();
  const [{ data: hotels }, { data: rooms }] = await Promise.all([
    supabase.from("hotels").select("*").eq("agency_id", ctx.agency.id).order("name"),
    supabase.from("rooms").select("*").eq("agency_id", ctx.agency.id).order("room_number"),
  ]);

  return (
    <AppShell
      agencyName={ctx.agency.name}
      email={ctx.email}
      role={ctx.membership?.role}
      contentWidth="wide"
    >
      <div className="toolbar">
        <div>
          <h1 className="page-title">Hotels</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Live agency roster — trip Stays selects from this list.
          </p>
        </div>
      </div>
      <ResourceNav active="/resources/hotels" />
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {q.warning ? <div className="alert alert-warn">{q.warning}</div> : null}

      <HotelsRosterPanel hotels={(hotels || []) as Hotel[]} rooms={(rooms || []) as Room[]} />
    </AppShell>
  );
}
