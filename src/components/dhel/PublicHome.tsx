"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer-demo";
import { DhelAppMark } from "./DhelLogo";
import { DhelInteractiveHero } from "./DhelInteractiveHero";
import { BRAND_NAME } from "@/lib/brand";
import { getFestivals } from "@/lib/catalog";

const PROBLEMS = [
  "Stop rebuilding itineraries in Word every enquiry",
  "Stop AI inventing hotels that don't exist",
  "Stop ops scattered across WhatsApp threads",
  "Stop guessing SDF and visa rules by nationality",
  "Get a client-ready PDF in minutes — real rates",
];

export function PublicHome() {
  const [problemIdx, setProblemIdx] = useState(0);
  const festivals = getFestivals()
    .filter((f) => new Date(f.start) >= new Date())
    .slice(0, 5);

  useEffect(() => {
    const t = setInterval(() => setProblemIdx((i) => (i + 1) % PROBLEMS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <DhelAppMark className="h-9 w-9" priority />
          <span className="font-[family-name:var(--font-ui)] text-xl font-semibold tracking-[0.02em]">
            {BRAND_NAME}
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/build" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">
            Stash a trip
          </Link>
          <Link href="/desk/login" className="text-sm font-medium text-[var(--primary)]">
            Agent sign in
          </Link>
        </div>
      </header>

      <DhelInteractiveHero />

      <p className="mx-auto max-w-xl px-4 text-center text-lg font-medium transition-opacity duration-500">
        {PROBLEMS[problemIdx]}
      </p>

      <div className="mx-auto mt-12 grid max-w-2xl gap-4 px-4 md:grid-cols-2">
        <Link href="/desk/login">
          <Card className="h-full border-[var(--border)] bg-[var(--card)]/90 transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-xl">Travel agent</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              Local brief → your hotels → Gemini fills the template → guest PDF.
            </CardContent>
          </Card>
        </Link>
        <Link href="/build">
          <Card className="h-full border-[var(--border)] bg-[var(--card)]/90 transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-xl">Traveler stash</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              Build a Bhutan trip, keep it offline on your phone when data runs out.
            </CardContent>
          </Card>
        </Link>
      </div>

      {festivals.length ? (
        <section className="mx-auto mt-16 max-w-3xl px-4">
          <h2 className="mb-4 text-center font-[family-name:var(--font-display)] text-2xl">Upcoming festivals</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {festivals.map((f) => (
              <Link
                key={f.id}
                href={`/build?festival=${f.slug}`}
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm hover:border-[var(--primary)]"
              >
                {f.name} · {f.location}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
