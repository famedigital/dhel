"use client";

import { Footer } from "@/components/ui/footer-demo";

export default function FooterDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          Site footer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Theme toggle, link columns, and social row — used on the public home page.
        </p>
      </div>
      <Footer />
    </div>
  );
}
