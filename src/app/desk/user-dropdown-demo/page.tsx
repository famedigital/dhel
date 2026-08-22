"use client";

import DemoOne from "@/components/ui/user-dropdown-demo";

export default function UserDropdownDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          User dropdown
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Account menu used in the desk header — click the avatar.
        </p>
      </div>
      <DemoOne />
    </div>
  );
}
