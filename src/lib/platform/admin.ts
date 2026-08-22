import type { SessionContext } from "@/lib/agency";

/** Platform superadmin: env email match or membership role. */
export function isPlatformAdmin(ctx: SessionContext | null): boolean {
  if (!ctx) return false;

  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && ctx.email?.trim().toLowerCase() === adminEmail) {
    return true;
  }

  return ctx.membership?.role === "platform_admin";
}
