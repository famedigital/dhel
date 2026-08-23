"use client";

import { useEffect, useState } from "react";

const SIZE = {
  sm: "w-32",
  md: "w-32 sm:w-40",
  lg: "w-56",
} as const;

export function EmvQr({
  payload,
  size = "lg",
}: {
  payload: string;
  size?: keyof typeof SIZE;
}) {
  const [svg, setSvg] = useState("");
  const box = SIZE[size];

  useEffect(() => {
    if (!payload) {
      setSvg("");
      return;
    }
    let gone = false;
    void import("qrcode").then((mod) =>
      mod
        .toString(payload, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#10251c", light: "#ffffff" },
        })
        .then((next) => {
          if (!gone) setSvg(next);
        }),
    );
    return () => {
      gone = true;
    };
  }, [payload]);

  if (!payload || !svg) {
    return <div className={`mx-auto aspect-square ${box} bg-[var(--paper)]`} aria-hidden />;
  }

  return (
    <div
      className={`mx-auto ${box} bg-[var(--paper)] p-1 [&_svg]:h-full [&_svg]:w-full`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
