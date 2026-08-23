import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmvQr } from "@/components/pay/emv-qr";
import { CloudinaryUpload } from "@/components/media/CloudinaryUpload";
import { polishPortalBio, savePortalProfile } from "@/app/actions/portal";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff } from "@/lib/portal/staff";

export default async function DriverProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx) redirect("/portal/login");
  const staff = await getPortalStaff({ role: "driver", asId: params.as });
  if (!staff || staff.role !== "driver") {
    if (isPlatformAdmin(ctx)) redirect("/platform/portal");
    redirect("/portal/login");
  }

  const d = staff.row;
  const as = params.as || "";
  const vehiclePhotos = (d.vehicle_photos || []).join("\n");

  return (
    <PortalShell role="driver" name={d.name} viewingAs={staff.viewingAs} asId={params.as}>
      <h1 className="page-title">Profile</h1>
      {params.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {params.error ? <div className="alert alert-error">{params.error}</div> : null}

      <div className="panel mt-4">
        <p className="section-title">Photo</p>
        {d.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.photo_url} alt="" className="mb-3 h-24 w-24 rounded-full object-cover" />
        ) : null}
        <CloudinaryUpload folder="drivers" label="Upload headshot" />
      </div>

      <form action={savePortalProfile} className="form-stack panel mt-4">
        <input type="hidden" name="role" value="driver" />
        <input type="hidden" name="as" value={as} />
        <div className="field">
          <label>Photo URL</label>
          <input className="input" name="photo_url" defaultValue={d.photo_url || ""} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input className="input" name="phone" defaultValue={d.phone || ""} />
        </div>
        <div className="field">
          <label>Bio draft</label>
          <textarea className="input" name="bio_draft" rows={3} defaultValue={d.bio_draft || ""} />
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea className="input" name="bio" rows={4} defaultValue={d.bio || ""} />
        </div>
        <div className="field">
          <label>Vehicle photo URLs (one per line)</label>
          <textarea className="input" name="vehicle_photos" rows={3} defaultValue={vehiclePhotos} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Bank</label>
            <select className="select" name="bank" defaultValue={d.bank || "bob"}>
              <option value="bob">BoB mBoB</option>
              <option value="bnb">BNB mPAY</option>
            </select>
          </div>
          <div className="field">
            <label>Payee name</label>
            <input className="input" name="payee_name" defaultValue={d.payee_name || d.name} />
          </div>
        </div>
        <div className="field">
          <label>Account number</label>
          <input className="input" name="account_no" defaultValue={d.account_no || ""} />
        </div>
        <button type="submit" className="btn btn-primary">
          Save profile
        </button>
      </form>

      <form action={polishPortalBio} className="panel mt-4 form-stack">
        <input type="hidden" name="role" value="driver" />
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="bio_draft" value={d.bio_draft || d.bio || ""} />
        <button type="submit" className="btn btn-secondary">
          Polish bio with AI
        </button>
      </form>

      {d.emv_static ? (
        <div className="panel mt-4 text-center">
          <p className="section-title">Your SCAN &amp; PAY</p>
          <EmvQr payload={d.emv_static} size="lg" />
        </div>
      ) : null}
    </PortalShell>
  );
}
