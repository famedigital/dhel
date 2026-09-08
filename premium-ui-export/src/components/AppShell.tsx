"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Settings, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { AppShellUserMenu } from "@/components/AppShellUserMenu";

/** Customize nav items for your app */
export const DEFAULT_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FileText },
  { label: "Team", href: "/team", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export type AppNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

function BrandMark({ open, brandName }: { open: boolean; brandName: string }) {
  return (
    <Link href="/dashboard" className="relative z-20 flex items-center gap-2.5 py-1 text-sm font-normal">
      <div
        className="h-6 w-6 flex-shrink-0 rounded-md bg-sidebar-primary"
        aria-hidden
      />
      {open ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-pre font-[family-name:var(--font-ui)] text-[15px] font-semibold tracking-[0.02em] text-sidebar-foreground"
        >
          {brandName}
        </motion.span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  children,
  brandName = "My App",
  displayName,
  email,
  role,
  chatLayout = false,
  contentWidth = "default",
  nav = DEFAULT_NAV,
  homeHref = "/dashboard",
  onUserAction,
}: {
  children: ReactNode;
  brandName?: string;
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  chatLayout?: boolean;
  contentWidth?: "default" | "wide" | "full";
  nav?: readonly AppNavItem[];
  homeHref?: string;
  onUserAction?: (action: string) => void | Promise<void>;
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
            <BrandMark open={open} brandName={brandName} />
            <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
              {nav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== homeHref && pathname.startsWith(item.href));
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
                    className={cn(
                      "rounded-md px-2",
                      active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  />
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
            <div className={cn("flex items-center gap-2 px-1", !open && "justify-center")}>
              {open ? (
                <div className="min-w-0 text-xs text-sidebar-foreground/60">
                  {displayName ? (
                    <p className="truncate font-medium text-sidebar-foreground">{displayName}</p>
                  ) : null}
                  {email ? <p className="truncate">{email}</p> : null}
                </div>
              ) : null}
            </div>
            <div className={cn("flex", open ? "justify-start px-1" : "justify-center")}>
              <AppShellUserMenu
                displayName={displayName}
                email={email}
                role={role}
                onAction={onUserAction}
              />
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
          {!chatLayout ? <AppBreadcrumb homeHref={homeHref} className="mb-4" /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
