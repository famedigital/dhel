"use client";

import { DotPatternDemo } from "@/components/ui/dot-pattern-demo";

export default function DotPatternDemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl">
        <DotPatternDemo />
      </div>
    </div>
  );
}
