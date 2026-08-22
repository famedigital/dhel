"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  itineraryId: string;
  tripTitle?: string;
};

export function FieldPackButton({ itineraryId, tripTitle }: Props) {
  const [copied, setCopied] = useState(false);

  async function shareLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/preview/${itineraryId}?pack=field`
        : `/preview/${itineraryId}?pack=field`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tripTitle ? `Field pack · ${tripTitle}` : "Field pack",
          text: "Guide/driver field pack (no rates)",
          url,
        });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="split-actions">
      <Link href={`/preview/${itineraryId}?pack=field`} className="btn btn-secondary">
        Field pack PDF
      </Link>
      <Button type="button" variant="outline" size="default" onClick={shareLink}>
        {copied ? "Link copied!" : "Share field pack"}
      </Button>
      <span className="field-hint" style={{ margin: 0 }}>
        No rates · staff only
      </span>
    </div>
  );
}
