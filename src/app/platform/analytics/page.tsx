import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";

const PLACEHOLDER_METRICS = [
  { label: "Public home visits (7d)", value: "—", hint: "Wire Vercel Analytics" },
  { label: "Build funnel starts", value: "—", hint: "Event: build_start" },
  { label: "Agent signups", value: "—", hint: "memberships created" },
  { label: "PDFs generated", value: "—", hint: "itineraries status=ready" },
  { label: "B2C leads", value: "—", hint: "b2c_leads count" },
  { label: "Clarity sessions", value: "—", hint: "Microsoft Clarity dashboard" },
];

export default async function PlatformAnalyticsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!isPlatformAdmin(ctx)) redirect("/desk");

  return (
    <PlatformShell email={ctx.email}>
      <h1 className="page-title">Analytics</h1>
      <p className="page-lead">
        Phase 2 metrics placeholder. Connect Vercel Analytics, Clarity, and Supabase counts in
        Phase 2.1.
      </p>

      <div className="grid-2">
        {PLACEHOLDER_METRICS.map((metric) => (
          <div key={metric.label} className="panel">
            <p className="section-title">{metric.label}</p>
            <p style={{ fontSize: "2rem", margin: "0.25rem 0", fontFamily: "var(--font-display)" }}>
              {metric.value}
            </p>
            <p className="field-hint">{metric.hint}</p>
          </div>
        ))}
      </div>
    </PlatformShell>
  );
}
