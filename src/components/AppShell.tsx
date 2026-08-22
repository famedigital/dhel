"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Map, Users, Building2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { AppBreadcrumb } from "@/components/dhel/AppBreadcrumb";
import { AppShellUserMenu } from "@/components/dhel/AppShellUserMenu";
import { DhelAppMark } from "@/components/dhel/DhelLogo";
import { SyncStatusBadge } from "@/components/dhel/SyncStatusBadge";
import { BRAND_NAME } from "@/lib/brand";

const NAV = [
  { label: "Proposal", href: "/desk", icon: FileText },
  { label: "Trips", href: "/dashboard", icon: Map },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Resources", href: "/resources/hotels", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

function BrandMark({ open }: { open: boolean }) {
  return (
    <Link href="/desk" className="relative z-20 flex items-center gap-2.5 py-1 text-sm font-normal">
      <DhelAppMark className="h-6 w-6" />
      {open ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-pre font-[family-name:var(--font-ui)] text-[15px] font-semibold tracking-[0.02em] text-sidebar-foreground"
        >
          {BRAND_NAME}
        </motion.span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  children,
  agencyName,
  role,
  email,
  chatLayout = false,
  contentWidth = "default",
}: {
  children: ReactNode;
  agencyName?: string | null;
  role?: string | null;
  email?: string | null;
  chatLayout?: boolean;
  /** default ≈768px centered; wide ≈1152px; full = no max */
  contentWidth?: "default" | "wide" | "full";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const width = chatLayout || contentWidth === "full" ? "full" : contentWidth;

  return (
    <div className={cn("app-shell app-shell--sidebar", chatLayout && "app-shell--chat")}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <BrandMark open={open} />
            <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/desk" && pathname.startsWith(item.href));
                return (
                  <SidebarLink
                    key={item.href}
                    link={{
                      label: item.label,
                      href: item.href,
                      icon: (
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            active
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/70",
                          )}
                        />
                      ),
                    }}
                    className={cn("rounded-md px-2", active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}
                  />
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
            <div className={cn("flex items-center gap-2 px-1", !open && "justify-center")}>
              <SyncStatusBadge />
              {open ? (
                <div className="min-w-0 text-xs text-sidebar-foreground/60">
                  {agencyName ? (
                    <p className="truncate font-medium text-sidebar-foreground">{agencyName}</p>
                  ) : null}
                  {email ? <p className="truncate">{email}</p> : null}
                </div>
              ) : null}
            </div>
            <div className={cn("flex", open ? "justify-start px-1" : "justify-center")}>
              <AppShellUserMenu agencyName={agencyName} email={email} role={role} />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <main
        id="main-content"
        className={cn("app-main app-main--with-sidebar", chatLayout && "app-main--chat")}
      >
        <div
          className={cn(
            "app-main-inner",
            width === "wide" && "app-main-inner--wide",
            width === "full" && "app-main-inner--full",
          )}
        >
          {!chatLayout ? <AppBreadcrumb className="mb-4" /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
