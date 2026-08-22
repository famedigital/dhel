"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const LONG_CHARS = 480;

export function ExpandableText({
  children,
  className,
  threshold = LONG_CHARS,
}: {
  children: string;
  className?: string;
  threshold?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = children.length > threshold;

  if (!isLong) {
    return <span className={cn("whitespace-pre-wrap break-words", className)}>{children}</span>;
  }

  return (
    <span className={cn("block whitespace-pre-wrap break-words", className)}>
      <span className={cn(!expanded && "line-clamp-6")}>{children}</span>
      <button
        type="button"
        className="mt-2 block text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </span>
  );
}
