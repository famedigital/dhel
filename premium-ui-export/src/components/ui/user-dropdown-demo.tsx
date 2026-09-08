"use client";

import { UserDropdown } from "@/components/ui/user-dropdown";

export default function DemoOne() {
  return (
    <div className="flex min-h-[50vh] items-start justify-center bg-background p-10">
      <UserDropdown />
    </div>
  );
}
