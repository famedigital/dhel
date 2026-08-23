"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { portalSignOut } from "@/app/actions/portal";

export function PortalShell({
  children,
  role,
  name,
  viewingAs,
  asId,
}: {
  children: ReactNode;
  role: "guide" | "driver";
  name: string;
  viewingAs?: boolean;
  asId?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const as = asId || searchParams.get("as");
  const q = as ? `?as=${as}` : "";

  const home = `/portal/${role}${q}`;
  const trips = `/portal/${role}/trips${q}`;
  const today = `/portal/${role}/today${q}`;
  const profile = `/portal/${role}/profile${q}`;
  const payments = `/portal/${role}/payments${q}`;

  const onToday = pathname?.includes("/today");

  return (
    <div className="app-shell portal-shell">
      {viewingAs ? (
        <div className="bg-amber-100 px-3 py-2 text-center text-xs text-amber-950">
          Viewing as {name} ({role}) ·{" "}
          <Link href="/platform/portal" className="underline">
            Exit to directory
          </Link>
        </div>
      ) : null}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href={home} className="app-logo">
            Field portal
          </Link>
          <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
            {name}
          </span>
          <div className="ml-auto">
            <form action={portalSignOut}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="app-main mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>
      <nav className="portal-bottom-nav" aria-label="Portal">
        <Link href={home} data-active={pathname === `/portal/${role}` ? "true" : "false"}>
          Home
        </Link>
        <Link
          href={trips}
          data-active={pathname?.includes("/trips") && !onToday ? "true" : "false"}
        >
          Trips
        </Link>
        <Link href={today} data-active={onToday ? "true" : "false"}>
          Today
        </Link>
        <Link
          href={payments}
          data-active={pathname?.includes("/payments") ? "true" : "false"}
        >
          Pay
        </Link>
        <Link
          href={profile}
          data-active={pathname?.includes("/profile") ? "true" : "false"}
        >
          Profile
        </Link>
      </nav>
    </div>
  );
}
