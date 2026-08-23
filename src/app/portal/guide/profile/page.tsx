import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmvQr } from "@/components/pay/emv-qr";
import { CloudinaryUpload } from "@/components/media/CloudinaryUpload";
import { polishPortalBio, savePortalProfile } from "@/app/actions/portal";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff } from "@/lib/portal/staff";

export default async function GuideProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: "guide", asId: params.as });
  if (!staff || staff.role !== "guide") {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }

  const g = staff.row;
  const as = params.as || "";

  return (
    <PortalShell role="guide" name={g.name} viewingAs={staff.viewingAs} asId={params.as}>
      <h1 className="page-title">Profile</h1>
      {params.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {params.error ? <div className="alert alert-error">{params.error}</div> : null}

      <div className="panel mt-4">
        <p className="section-title">Photo</p>
        {g.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.photo_url} alt="" className="mb-3 h-24 w-24 rounded-full object-cover" />
        ) : null}
        <CloudinaryUpload folder="guides" label="Upload headshot" />
        <p className="field-hint mt-2">Paste the returned URL into Photo URL below.</p>
      </div>

      <form action={savePortalProfile} className="form-stack panel mt-4">
        <input type="hidden" name="role" value="guide" />
        <input type="hidden" name="as" value={as} />
        <div className="field">
          <label>Photo URL</label>
          <input className="input" name="photo_url" defaultValue={g.photo_url || ""} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input className="input" name="phone" defaultValue={g.phone || ""} />
        </div>
        <div className="field">
          <label>Bio draft (rough notes)</label>
          <textarea className="input" name="bio_draft" rows={3} defaultValue={g.bio_draft || ""} />
        </div>
        <div className="field">
          <label>Bio (published)</label>
          <textarea className="input" name="bio" rows={4} defaultValue={g.bio || ""} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Bank</label>
            <select className="select" name="bank" defaultValue={g.bank || "bob"}>
              <option value="bob">BoB mBoB</option>
              <option value="bnb">BNB mPAY</option>
            </select>
          </div>
          <div className="field">
            <label>Payee name</label>
            <input className="input" name="payee_name" defaultValue={g.payee_name || g.name} />
          </div>
        </div>
        <div className="field">
          <label>Account number</label>
          <input className="input" name="account_no" defaultValue={g.account_no || ""} />
        </div>
        <button type="submit" className="btn btn-primary">
          Save profile
        </button>
      </form>

      <form action={polishPortalBio} className="panel mt-4 form-stack">
        <input type="hidden" name="role" value="guide" />
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="bio_draft" value={g.bio_draft || g.bio || ""} />
        <p className="section-title">Polish bio with AI</p>
        <p className="field-hint">Uses your draft above (save draft first if you just edited).</p>
        <button type="submit" className="btn btn-secondary">
          Polish with AI
        </button>
      </form>

      {g.emv_static ? (
        <div className="panel mt-4 text-center">
          <p className="section-title">Your SCAN &amp; PAY (static)</p>
          <EmvQr payload={g.emv_static} size="lg" />
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Agents see a dynamic QR with the payment amount when they pay you.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        License {g.license_no || "—"} · Day rate view-only (set by agency)
        {g.day_rate_usd != null ? ` · $${g.day_rate_usd}` : ""}
      </p>
    </PortalShell>
  );
}
