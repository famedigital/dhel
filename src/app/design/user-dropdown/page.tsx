"use client";

import DemoOne from "@/components/ui/user-dropdown-demo";

export default function UserDropdownDesignPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <h1 className="page-title mb-2">User dropdown</h1>
        <p className="page-lead mb-8">Profile icon, status badge, premium menu.</p>
        <DemoOne />
      </div>
    </div>
  );
}
