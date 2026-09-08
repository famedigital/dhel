"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import ThemeToogle from "@/components/ui/footer";

export function FooterDemo() {
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border bg-background px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">My App</p>
          <p className="text-sm text-muted-foreground">Premium UI export demo</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToogle />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-4xl text-xs text-muted-foreground">
        Theme: {theme ?? "system"}
      </p>
    </footer>
  );
}
