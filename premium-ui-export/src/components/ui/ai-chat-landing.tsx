"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";
import { PromptInput, type PromptInputProps } from "@/components/ui/ai-chat-input";

export type AiChatLandingProps = {
  /** `desk` fits AppShell chat layout; `hero` is full-screen with optional dot pattern */
  variant?: "desk" | "hero";
  eyebrow?: string;
  greeting: string;
  description?: string;
  footer?: ReactNode;
  showDotPattern?: boolean;
  className?: string;
  promptClassName?: string;
} & Pick<PromptInputProps, "placeholder" | "onSubmit" | "value" | "onChange">;

export function AiChatLanding({
  variant = "desk",
  eyebrow,
  greeting,
  description,
  footer,
  showDotPattern = variant === "hero",
  className,
  promptClassName,
  ...promptProps
}: AiChatLandingProps) {
  const greetingBlock = (
    <>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="desk-chat-greeting">{greeting}</h1>
      {description ? (
        <p className="max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
      ) : null}
    </>
  );

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "relative flex min-h-full w-full flex-col overflow-hidden bg-background",
          className,
        )}
      >
        {showDotPattern ? (
          <DotPattern
            className={cn(
              "fill-[var(--primary)]/35",
              "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
            )}
          />
        ) : null}
        <div className="relative z-10 flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center">{greetingBlock}</div>
        </div>
        <div className="desk-chat-dock relative z-10">
          <div className={cn("desk-chat-box mx-auto w-full max-w-[760px] space-y-3", promptClassName)}>
            <PromptInput fullWidth minimal {...promptProps} />
            {footer}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("desk-chat flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col px-4 sm:px-6">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 pb-8 pt-10 text-center">
            {greetingBlock}
          </div>
        </div>
      </div>
      <div className="desk-chat-dock relative shrink-0">
        <div className="mx-auto w-full max-w-[760px] space-y-3">
          <PromptInput
            fullWidth
            minimal
            className={cn("desk-chat-box mx-auto", promptClassName)}
            {...promptProps}
          />
          {footer}
        </div>
      </div>
    </div>
  );
}
