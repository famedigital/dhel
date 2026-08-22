import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { DotPattern } from "@/components/ui/dot-pattern";
import { DhelAppMark } from "@/components/dhel/DhelLogo";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AuthShell({
  title = "Agent sign in",
  description,
  error,
  message,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  error?: string | null;
  message?: string | null;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="auth-layout">
      {/* Brand panel — desktop */}
      <aside className="auth-brand-panel relative overflow-hidden">
        <DotPattern
          width={22}
          height={22}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "fill-[var(--primary)]/25",
            "[mask-image:radial-gradient(70%_60%_at_50%_0%,white,transparent)]",
          )}
        />
        <div className="auth-brand-inner relative z-10">
          <Link href="/" className="auth-brand-lockup">
            <DhelAppMark className="auth-logo-mark" priority />
            <span className="auth-wordmark">{BRAND_NAME}</span>
          </Link>
          <p className="auth-tagline">{BRAND_TAGLINE}</p>
          <p className="auth-brand-copy">
            Paste client WhatsApp. Compare real hotels. Ship a client PDF in minutes — not another Word doc.
          </p>
          <ul className="auth-brand-points">
            <li>Live ops — rooms, guides, payments</li>
            <li>Classic Luxury PDF — your agency brand</li>
            <li>Built for Bhutan agents</li>
          </ul>
        </div>
        <p className="auth-brand-footer relative z-10">Powered by {BRAND_NAME}</p>
      </aside>

      {/* Form panel */}
      <main className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-mobile-brand">
            <Link href="/" className="auth-brand-lockup auth-brand-lockup--sm">
              <DhelAppMark className="auth-logo-mark auth-logo-mark--sm" priority />
              <span className="auth-wordmark auth-wordmark--sm">{BRAND_NAME}</span>
            </Link>
            <p className="auth-tagline auth-tagline--sm">{BRAND_TAGLINE}</p>
          </div>

          <div className="auth-card">
            <header className="auth-card-header">
              <h1 className="auth-card-title">{title}</h1>
              {description ? <p className="auth-card-desc">{description}</p> : null}
            </header>

            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {message ? <Alert variant="success">{message}</Alert> : null}

            <div className="auth-card-body">{children}</div>

            <footer className="auth-card-footer">{footer}</footer>
          </div>
        </div>
      </main>
    </div>
  );
}
