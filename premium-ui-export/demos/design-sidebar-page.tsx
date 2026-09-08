import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function SidebarDesignPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="page-title mb-2">Sidebar</h1>
      <p className="page-lead mb-6">Animated collapsible sidebar — hover to expand on desktop.</p>
      <SidebarDemo />
    </div>
  );
}
