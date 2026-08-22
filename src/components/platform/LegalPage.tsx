import Link from "next/link";
import type { Metadata } from "next";
import { getLiveLegalContent } from "@/lib/platform/cms";
import { LEGAL_FALLBACKS, type LegalSlug } from "@/lib/platform/legal-fallbacks";

function renderMarkdown(body: string) {
  return body.split("\n\n").map((block, i) => {
    if (block.startsWith("# ")) {
      return (
        <h2 key={i} className="legal-h2">
          {block.replace(/^#\s+/, "")}
        </h2>
      );
    }
    const parts = block.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} className="legal-p">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
        )}
      </p>
    );
  });
}

export async function buildLegalPage(slug: LegalSlug) {
  const cms = await getLiveLegalContent(slug);
  const fallback = LEGAL_FALLBACKS[slug];
  const title = cms?.title ?? fallback.title;
  const body = cms?.body ?? fallback.body;
  const version = cms?.version ?? fallback.version;

  const metadata: Metadata = {
    title: `${title} — Dhel`,
    description: `${title} for Dhel Bhutan travel platform.`,
    robots: { index: true, follow: true },
  };

  const page = (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl">
          Dhel
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/desk/login">Agent sign in</Link>
        </nav>
      </header>
      <main className="app-main legal-page">
        <p className="field-hint">Last updated {version}</p>
        <h1 className="page-title">{title}</h1>
        <article>{renderMarkdown(body)}</article>
      </main>
    </div>
  );

  return { metadata, page };
}
