import { redirect } from "next/navigation";
import { portalSignIn } from "@/app/actions/portal";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff } from "@/lib/portal/staff";

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getSessionContext();
  if (ctx) {
    if (isPlatformAdmin(ctx)) {
      const staff = await getPortalStaff();
      if (!staff) redirect("/platform/portal");
      redirect(`/portal/${staff.role}`);
    }
    const staff = await getPortalStaff();
    if (staff) redirect(`/portal/${staff.role}`);
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
        Field portal
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Guides and drivers — sign in to see trips, upload field photos, and set your pay QR.
      </p>
      {params.error ? (
        <div className="alert alert-error mt-4">{params.error}</div>
      ) : null}
      <form action={portalSignIn} className="form-stack mt-6">
        <input type="hidden" name="next" value={params.next || "/portal"} />
        <div className="field">
          <label>Email</label>
          <input className="input" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
        Agent desk?{" "}
        <a className="underline" href="/desk/login">
          Sign in here
        </a>
      </p>
    </div>
  );
}
