import type { ReactNode } from "react";

/** Auth-aware pages supply PortalShell; login stays bare. */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
