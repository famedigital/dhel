import { Suspense } from "react";
import BuildPageClient from "./BuildPageClient";

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <BuildPageClient />
    </Suspense>
  );
}
