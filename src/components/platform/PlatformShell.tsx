import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/platform/library", label: "Library" },
  { href: "/platform/portal", label: "Field portals" },
  { href: "/platform/cms", label: "CMS" },
  { href: "/platform/billing", label: "Billing" },
  { href: "/platform/analytics", label: "Analytics" },
];

export function PlatformShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/platform/library" className="app-logo">
            Dhel Platform
          </Link>
          <nav className="app-nav">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="app-user">
            <div className="app-user-meta">
              {email ? <span>{email}</span> : null}
              <span>platform admin</span>
            </div>
            <Link href="/desk" className="btn btn-ghost btn-sm">
              Agent desk
            </Link>
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
