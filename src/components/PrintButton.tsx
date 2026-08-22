"use client";

import { useState } from "react";

async function preloadImages(urls: string[]) {
  await Promise.all(
    urls
      .filter(Boolean)
      .map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          }),
      ),
  );
}

export function PrintButton({ imageUrls = [] }: { imageUrls?: string[] }) {
  const [hint, setHint] = useState(false);

  async function handlePrint() {
    setHint(true);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready;
    }
    await preloadImages(imageUrls);
    window.print();
  }

  return (
    <div className="print-actions">
      {hint ? (
        <p className="print-hint no-print">
          Tip: enable <strong>Background graphics</strong> in the print dialog for cover colours.
        </p>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={() => void handlePrint()}>
        Download PDF
      </button>
    </div>
  );
}
