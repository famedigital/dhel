"use client";

import { Footer } from "@/components/ui/footer-demo";

export default function FooterDesignPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <h1 className="page-title mb-2">Footer</h1>
          <p className="page-lead">Scroll down for footer + theme toggle.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
