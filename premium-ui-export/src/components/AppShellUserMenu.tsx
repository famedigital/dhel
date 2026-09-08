"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { UserDropdown } from "@/components/ui/user-dropdown";

function initialsFrom(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/[\s@._-]+/).filter(Boolean);
  if (!parts.length) return "ME";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AppShellUserMenu({
  displayName,
  email,
  role,
  onAction,
}: {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  onAction?: (action: string) => void | Promise<void>;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const name = displayName?.trim() || email?.split("@")[0] || "User";
  const username = email ? `@${email}` : role ? `@${role}` : "@user";

  async function handleAction(action: string) {
    if (onAction) {
      await onAction(action);
      return;
    }

    switch (action) {
      case "profile":
      case "settings":
      case "notifications":
        router.push("/settings");
        break;
      case "appearance":
        setTheme(theme === "dark" ? "light" : "dark");
        break;
      case "help":
        router.push("/help");
        break;
      case "logout":
        router.push("/login");
        break;
      default:
        break;
    }
  }

  return (
    <UserDropdown
      user={{
        name,
        username,
        initials: initialsFrom(displayName || email || name),
        status: "online",
        avatar: undefined,
      }}
      onAction={handleAction}
    />
  );
}
