"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SyncStatusBadge } from "@/components/dhel/SyncStatusBadge";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell portal-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/portal" className="app-logo">
            Dhel Stash
          </Link>
          <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
            Field guide
          </span>
          <nav className="app-nav hidden md:flex">
            <Link href="/portal">Home</Link>
            <Link href="/portal/today">Today</Link>
            <Link href="/portal/profile">Profile</Link>
          </nav>
          <div className="ml-auto">
            <SyncStatusBadge />
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <nav className="portal-bottom-nav" aria-label="Portal">
        <Link href="/portal" data-active={pathname === "/portal" ? "true" : "false"}>
          Home
        </Link>
        <Link href="/portal/today" data-active={pathname?.startsWith("/portal/today") ? "true" : "false"}>
          Today
        </Link>
        <Link
          href="/portal/profile"
          data-active={pathname?.startsWith("/portal/profile") ? "true" : "false"}
        >
          Profile
        </Link>
      </nav>
    </div>
  );
}
