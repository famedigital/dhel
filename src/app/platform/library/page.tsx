import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LibraryBulkUpload } from "@/components/platform/LibraryBulkUpload";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";

export default async function PlatformLibraryPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!isPlatformAdmin(ctx)) redirect("/desk");

  return (
    <PlatformShell email={ctx.email}>
      <h1 className="page-title">Master library</h1>
      <p className="page-lead">
        Superadmin bulk upload for hotels, room rates, guides, and drivers. CRUD and server import
        follow in Phase 2.1.
      </p>

      <LibraryBulkUpload />

      <div className="panel">
        <p className="section-title">Quick links</p>
        <p className="field-hint">
          <Link href="/platform/cms" className="underline">
            CMS
          </Link>{" "}
          ·{" "}
          <Link href="/resources/hotels" className="underline">
            Agent hotel resources
          </Link>
        </p>
      </div>
    </PlatformShell>
  );
}
