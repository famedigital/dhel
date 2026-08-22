import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function SidebarPreviewPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] p-4 sm:p-8">
      <div className="mx-auto mb-6 max-w-7xl">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
          Sidebar preview
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Hover the rail on desktop · menu icon on mobile. Wire this into{" "}
          <code className="text-xs">AppShell</code> when ready to replace the current nav.
        </p>
      </div>
      <SidebarDemo />
    </main>
  );
}
