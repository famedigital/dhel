"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "@/app/actions/auth";
import { UserDropdown } from "@/components/ui/user-dropdown";

function initialsFrom(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/[\s@._-]+/).filter(Boolean);
  if (!parts.length) return "DH";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AppShellUserMenu({
  agencyName,
  email,
  role,
}: {
  agencyName?: string | null;
  email?: string | null;
  role?: string | null;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const name = agencyName?.trim() || email?.split("@")[0] || "Agent";
  const username = email ? `@${email}` : role ? `@${role}` : "@agent";

  async function onAction(action: string) {
    switch (action) {
      case "profile":
      case "settings":
      case "notifications":
        router.push("/settings");
        break;
      case "appearance":
        setTheme(theme === "dark" ? "light" : "dark");
        break;
      case "logout":
        await signOut();
        break;
      case "help":
        router.push("/terms");
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
        initials: initialsFrom(agencyName || email || "Dhel"),
        status: role || "online",
        avatar: undefined,
      }}
      onAction={onAction}
    />
  );
}
