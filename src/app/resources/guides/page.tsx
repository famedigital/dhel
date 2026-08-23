import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ResourceNav } from "@/components/resources/ResourceNav";
import { GuidesRosterPanel } from "@/components/resources/GuidesRosterPanel";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { ensureOpsSeed } from "@/lib/ops";
import type { Guide } from "@/lib/types";

export default async function GuidesPage({
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
  const { data } = await supabase
    .from("guides")
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
          <h1 className="page-title">Guides</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Live agency roster — trip Staff selects from this list.
          </p>
        </div>
      </div>
      <ResourceNav active="/resources/guides" />
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {q.warning ? <div className="alert alert-warn">{q.warning}</div> : null}

      <GuidesRosterPanel guides={(data || []) as Guide[]} />
    </AppShell>
  );
}
