export type LegalSlug = "terms" | "privacy" | "cookies" | "agent-agreement";

export const LEGAL_FALLBACKS: Record<
  LegalSlug,
  { title: string; version: string; body: string }
> = {
  terms: {
    title: "Terms of Service",
    version: "2026-08-22",
    body: `# Terms of Service

Dhel provides a trip builder and indicative quote tool for Bhutan travel. Quotes are **not confirmed bookings** until a licensed travel agent contacts you.

Prices reflect catalog rates at the time of quote. SDF, visa, and festival rules may change.

Dhel is a technology platform — not a tour operator unless explicitly stated.`,
  },
  privacy: {
    title: "Privacy Policy",
    version: "2026-08-22",
    body: `# Privacy Policy

We collect email, phone, country, and trip brief text to generate quotes and assign leads to partner agencies.

Data is stored in Supabase. We use Vercel Analytics and may use session replay tools (e.g. Microsoft Clarity) on public pages.

Trip briefs may be processed by Google Gemini when AI features are used. We do not sell personal data to third parties.

Contact support to request access or deletion of your data.`,
  },
  cookies: {
    title: "Cookie Policy",
    version: "2026-08-22",
    body: `# Cookie Policy

We use essential session cookies for authentication and optional analytics cookies on public marketing pages.

**Analytics:** Vercel Analytics, Microsoft Clarity (if enabled).

You can control cookies through your browser settings. Disabling cookies may limit sign-in and builder features.`,
  },
  "agent-agreement": {
    title: "Agent Agreement",
    version: "2026-08-22",
    body: `# Agent Agreement

By using Dhel you agree to accurate client quotes, licensed operation in Bhutan, and subscription terms (Pilot, Starter, Pro, Network).

**Billing:** Plans are activated after bank QR payment and screenshot verification — no Stripe in v1.

**Network commission:** 3% on Pelbu-network hotel and guide bookings where applicable.

You own client relationships. Dhel provides software only. Data is isolated per agency (RLS).`,
  },
};
