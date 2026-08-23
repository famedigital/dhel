import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { invitePortalLogin } from "@/app/actions/portal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function PlatformPortalDirectory({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    error?: string;
    saved?: string;
    message?: string;
  }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!isPlatformAdmin(ctx)) redirect("/desk");
  const q = await searchParams;
  const tab = q.tab === "drivers" ? "drivers" : "guides";

  const supabase = createAdminClient() ?? (await createClient());
  const { data: agencies } = await supabase.from("agencies").select("id, name").order("name");
  const { data: guides } = await supabase
    .from("guides")
    .select("id, name, phone, agency_id, portal_user_id, portal_email, emv_static, active, agencies(name)")
    .order("name");
  const { data: drivers } = await supabase
    .from("drivers")
    .select(
      "id, name, phone, agency_id, portal_user_id, portal_email, emv_static, active, vehicle_type, plate, agencies(name)",
    )
    .order("name");

  const rows = tab === "guides" ? guides || [] : drivers || [];

  return (
    <PlatformShell email={ctx.email}>
      <h1 className="page-title">Field portals</h1>
      <p className="page-lead">
        All guide and car portals — invite login, open as staff, see bank QR status.
      </p>
      {q.error ? <div className="alert alert-error">{q.error}</div> : null}
      {q.saved ? (
        <div className="alert alert-ok">{q.message || "Saved."}</div>
      ) : null}

      <div className="chips" style={{ marginBottom: "1rem" }}>
        <Link className="chip" href="/platform/portal?tab=guides" data-active={tab === "guides"}>
          Guides ({guides?.length ?? 0})
        </Link>
        <Link className="chip" href="/platform/portal?tab=drivers" data-active={tab === "drivers"}>
          Cars / drivers ({drivers?.length ?? 0})
        </Link>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>Bank QR</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const agencyName =
                r.agencies && typeof r.agencies === "object" && "name" in r.agencies
                  ? String((r.agencies as { name: string }).name)
                  : "—";
              const linked = Boolean(r.portal_user_id);
              const openHref =
                tab === "guides"
                  ? `/portal/guide?as=${r.id}`
                  : `/portal/driver?as=${r.id}`;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong>{r.name}</strong>
                    <p className="field-hint" style={{ margin: 0 }}>
                      {r.phone || "—"}
                      {"plate" in r && r.plate ? ` · ${r.plate}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>{agencyName}</TableCell>
                  <TableCell>
                    <span className="badge">{linked ? "linked" : "not invited"}</span>
                    {r.portal_email ? (
                      <p className="field-hint" style={{ margin: 0 }}>
                        {r.portal_email}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{r.emv_static ? "Yes" : "No"}</TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    <Link href={openHref} className="btn btn-secondary btn-sm">
                      Open portal
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!rows.length ? (
          <p className="field-hint mt-3">
            No {tab} in agency roster yet. Assign staff on a trip (creates roster rows) or invite
            below.
          </p>
        ) : null}
      </div>

      <div className="panel">
        <p className="section-title">Invite portal login</p>
        <p className="field-hint mb-3">
          Creates (or links) an Auth user and sets portal_user_id on a guide/driver row. Default
          temp password: Portal123!
        </p>
        <form action={invitePortalLogin} className="form-stack">
          <div className="field">
            <label>Agency</label>
            <select
              className="select"
              name="agency_id"
              defaultValue={ctx.agency?.id || agencies?.[0]?.id || ""}
              required
            >
              {(agencies || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Role</label>
              <select className="select" name="role" defaultValue={tab === "drivers" ? "driver" : "guide"}>
                <option value="guide">Guide</option>
                <option value="driver">Driver / car</option>
              </select>
            </div>
            <div className="field">
              <label>Existing roster id (optional)</label>
              <input className="input" name="id" placeholder="uuid from table above" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input className="input" name="name" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" name="email" type="email" required />
            </div>
          </div>
          <div className="field">
            <label>Temp password</label>
            <input className="input" name="password" defaultValue="Portal123!" />
          </div>
          <button type="submit" className="btn btn-primary">
            Invite
          </button>
        </form>
      </div>
    </PlatformShell>
  );
}
