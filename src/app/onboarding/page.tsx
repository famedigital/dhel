import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionContext } from "@/lib/agency";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.agency) redirect("/dashboard");

  const params = await searchParams;
  const { createAgency } = await import("@/app/actions/agency");

  return (
    <AppShell email={ctx.email}>
      <h1 className="page-title">Create your agency</h1>
      <p className="page-lead">
        Each login maps to one agency workspace with its own brand, keys, and itineraries.
      </p>
      {params.error ? <div className="alert alert-error">{params.error}</div> : null}
      <div className="panel" style={{ maxWidth: 520 }}>
        <form action={createAgency} className="form-stack">
          <div className="field">
            <label htmlFor="name">Agency name</label>
            <input className="input" id="name" name="name" required placeholder="Silverpine Tours" />
          </div>
          <div className="field">
            <label htmlFor="slug">URL slug</label>
            <input
              className="input"
              id="slug"
              name="slug"
              placeholder="silverpine"
              pattern="[a-z0-9-]+"
            />
            <p className="field-hint">Lowercase letters, numbers, and hyphens. Unique across the platform.</p>
          </div>
          <button type="submit" className="btn btn-primary">
            Create agency
          </button>
        </form>
      </div>
    </AppShell>
  );
}
