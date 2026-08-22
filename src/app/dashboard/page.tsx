import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ItinerariesDataTable } from "@/components/dhel/ItinerariesDataTable";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { seedDemoItinerary } from "@/app/actions/itineraries";
import type { Itinerary } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/desk/login");
  if (!ctx.agency) redirect("/onboarding");

  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("itineraries")
    .select("id, title, client_name, language, template_id, status, updated_at")
    .eq("agency_id", ctx.agency.id)
    .order("updated_at", { ascending: false });

  const items = ((data || []) as Itinerary[]).map((it) => ({
    id: it.id,
    title: it.title,
    client_name: it.client_name || "",
    language: it.language,
    template_id: it.template_id,
    status: it.status,
    updated_at: it.updated_at,
  }));

  const canDelete = ctx.membership?.role === "owner";

  return (
    <AppShell
      agencyName={ctx.agency.name}
      email={ctx.email}
      role={ctx.membership?.role}
      contentWidth="wide"
    >
      <div className="toolbar">
        <div>
          <h1 className="page-title">Itineraries</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Cloud drafts for {ctx.agency.name}. Daily path: brief → generate → Classic Luxury PDF.
          </p>
        </div>
        <div className="toolbar-actions">
          <form action={seedDemoItinerary}>
            <button type="submit" className="btn btn-secondary">
              Seed demo PDF
            </button>
          </form>
          <Link href="/desk" className="btn btn-primary">
            New proposal
          </Link>
        </div>
      </div>

      {params.error ? <Alert variant="destructive">{params.error}</Alert> : null}

      <div className="panel overflow-hidden p-4 sm:p-5">
        {items.length === 0 ? (
          <EmptyState
            title="No itineraries yet"
            description="Start from a client WhatsApp brief on the proposal desk, or seed a demo PDF to explore the flow."
            action={
              <>
                <Link href="/desk" className="btn btn-primary">
                  New proposal
                </Link>
                <form action={seedDemoItinerary}>
                  <button type="submit" className="btn btn-secondary">
                    Seed demo PDF
                  </button>
                </form>
              </>
            }
          />
        ) : (
          <ItinerariesDataTable items={items} canDelete={canDelete} />
        )}
      </div>
    </AppShell>
  );
}
