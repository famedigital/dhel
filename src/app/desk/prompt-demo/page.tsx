"use client";

import { cn } from "@/lib/utils";
import { PromptInput } from "@/components/ui/ai-chat-input";
import { DotPattern } from "@/components/ui/dot-pattern";

export default function PromptDemoPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <DotPattern
        className={cn(
          "fill-[var(--primary)]/35",
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
        )}
      />
      <div className="relative z-10 flex w-full max-w-lg justify-center p-4">
        <PromptInput
          onSubmit={(message, meta) => {
            console.log(message, meta);
          }}
          placeholder="Ask anything..."
        />
      </div>
    </div>
  );
}
