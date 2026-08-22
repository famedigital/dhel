"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { DhelAppMark } from "@/components/dhel/DhelLogo";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export function DhelInteractiveHero() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx.set(e.clientX - r.left);
      my.set(e.clientY - r.top);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <div ref={ref} className="relative overflow-hidden py-16 text-center md:py-24">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(320px circle at ${sx}px ${sy}px, rgba(11,31,58,0.10), transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #0f172a 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex flex-col items-center gap-5 md:gap-6">
        <DhelAppMark
          className="h-28 w-28 shadow-[0_18px_40px_rgba(11,31,58,0.22)] md:h-36 md:w-36"
          priority
        />
        <p className="font-[family-name:var(--font-ui)] text-5xl font-semibold tracking-[0.02em] md:text-6xl">
          {BRAND_NAME}
        </p>
      </div>
      <p className="relative mt-3 text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {BRAND_TAGLINE}
      </p>
    </div>
  );
}
