import type { SessionContext } from "@/lib/agency";

const FALLBACK_PLATFORM_ADMIN = "bhutansilverpine@gmail.com";

/** Platform superadmin: env email match, membership role, or known owner. */
export function isPlatformAdmin(ctx: SessionContext | null): boolean {
  if (!ctx) return false;

  const email = ctx.email?.trim().toLowerCase() ?? "";
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email === adminEmail) return true;
  if (email === FALLBACK_PLATFORM_ADMIN) return true;

  return ctx.membership?.role === "platform_admin";
}
