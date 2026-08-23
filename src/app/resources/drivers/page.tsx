import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ResourceNav } from "@/components/resources/ResourceNav";
import { DriversRosterPanel } from "@/components/resources/DriversRosterPanel";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { ensureOpsSeed } from "@/lib/ops";
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

  return (
    <AppShell
      agencyName={ctx.agency.name}
      email={ctx.email}
      role={ctx.membership?.role}
      contentWidth="wide"
    >
      <div className="toolbar">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Live agency roster — trip Staff selects from this list.
          </p>
        </div>
      </div>
      <ResourceNav active="/resources/drivers" />
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}

      <DriversRosterPanel drivers={(data || []) as Driver[]} />
    </AppShell>
  );
}
