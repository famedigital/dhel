import Link from "next/link";
import { redirect } from "next/navigation";
import { approveBillingSubmission } from "@/app/actions/platform-billing";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";

type Submission = {
  id: string;
  agency_id: string;
  plan: string;
  amount: number;
  currency: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  agencies?: { name: string } | null;
};

export default async function PlatformBillingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!isPlatformAdmin(ctx)) redirect("/desk");

  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_submissions")
    .select("*, agencies(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const pending = (data ?? []) as Submission[];

  return (
    <PlatformShell email={ctx.email}>
      <h1 className="page-title">Billing approvals</h1>
      <p className="page-lead">
        Verify bank QR payment screenshots and activate agency plans (Pro / Network).
      </p>

      {pending.length === 0 ? (
        <div className="panel">
          <p className="empty">No pending payment screenshots.</p>
          <p className="field-hint">
            Agencies upload from Settings → Upgrade after paying via mBoB/BNB SCAN&amp;Pay.
          </p>
        </div>
      ) : (
        <div className="stack-gap">
          {pending.map((row) => (
            <div key={row.id} className="panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="section-title">{row.agencies?.name ?? row.agency_id}</p>
                  <p className="field-hint">
                    {row.plan} · {row.currency} {row.amount} ·{" "}
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveBillingSubmission}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button type="submit" className="btn btn-primary">
                      Approve
                    </button>
                  </form>
                  <form action={approveBillingSubmission}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button type="submit" className="btn btn-secondary">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
              {row.screenshot_url ? (
                <p className="field-hint" style={{ marginTop: "0.75rem" }}>
                  Screenshot:{" "}
                  <Link href={row.screenshot_url} className="underline" target="_blank">
                    View upload
                  </Link>
                </p>
              ) : (
                <p className="field-hint" style={{ marginTop: "0.75rem" }}>
                  No screenshot URL on file.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
