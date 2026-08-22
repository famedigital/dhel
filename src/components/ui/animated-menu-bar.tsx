"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type DefaultMenuKey =
  | "dashboard"
  | "notifications"
  | "settings"
  | "help"
  | "security";

export type MenuBarItem<T extends string = string> = {
  key: T;
  label: string;
  icon: React.ReactNode;
  dividerBefore?: boolean;
};

function IconButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-3.5">
        {icon}
      </span>
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-200",
          // Mobile footer: always show label. Desktop: expand on hover/active.
          "max-w-[4.5rem] opacity-100 md:max-w-0 md:opacity-0",
          (hovered || active) && "md:max-w-[5.5rem] md:opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}

const defaultIcons: Record<DefaultMenuKey, React.ReactNode> = {
  dashboard: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 9.5L12 4l9 5.5v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  notifications: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  settings: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  help: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  ),
  security: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

const DEFAULT_ITEMS: MenuBarItem<DefaultMenuKey>[] = [
  { key: "dashboard", label: "Dashboard", icon: defaultIcons.dashboard },
  {
    key: "notifications",
    label: "Notifications",
    icon: defaultIcons.notifications,
    dividerBefore: true,
  },
  { key: "settings", label: "Settings", icon: defaultIcons.settings },
  { key: "help", label: "Help", icon: defaultIcons.help },
  { key: "security", label: "Security", icon: defaultIcons.security },
];

export interface MenuBarProps<T extends string = DefaultMenuKey> {
  items?: MenuBarItem<T>[];
  active?: T;
  onSelect?: (key: T) => void;
  className?: string;
}

export function MenuBar<T extends string = DefaultMenuKey>({
  items,
  active,
  onSelect,
  className,
}: MenuBarProps<T>) {
  const list = (items ?? DEFAULT_ITEMS) as MenuBarItem<T>[];
  const current = active ?? (list[0]?.key as T | undefined);

  return (
    <nav
      className={cn(
        "flex w-fit items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5 shadow-sm",
        className,
      )}
    >
      {list.map((item) => (
        <React.Fragment key={item.key}>
          {item.dividerBefore ? (
            <div className="mx-0.5 h-3.5 w-px bg-[var(--border)]" aria-hidden />
          ) : null}
          <IconButton
            icon={item.icon}
            label={item.label}
            active={current === item.key}
            onClick={() => onSelect?.(item.key)}
          />
        </React.Fragment>
      ))}
    </nav>
  );
}
