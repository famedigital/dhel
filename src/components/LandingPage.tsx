import Link from "next/link";
import { ClassicLuxuryDocument } from "@/components/templates/ClassicLuxury";
import { SAMPLE_BRIEF, sampleItinerary } from "@/lib/demo/sample-itinerary";

const STEPS = [
  {
    n: "01",
    title: "Paste the guest brief",
    body: "Days, language, and a short note — or tap a Bhutan preset chip.",
  },
  {
    n: "02",
    title: "Generate the draft",
    body: "Gemini builds letter and day prose only. Hotels, rooms, guide, driver come from live ops.",
  },
  {
    n: "03",
    title: "Ops + PDF",
    body: "Assign live room #s, guide, driver, money — print Guest or Ops voucher pack.",
  },
] as const;

const PAINS = [
  { label: "Hours in Word", detail: "Rebuilding the same structure every enquiry" },
  { label: "Scattered ops", detail: "Hotel rooms, guides, drivers live in chat threads" },
  { label: "Fake overnights", detail: "AI invents hotels that do not exist in stock" },
] as const;

const SCOPE_IN = [
  "Live hotels / rooms / guides / drivers",
  "Clients CRM + trip ops desk",
  "Hotel vouchers with real room numbers",
  "Payments ledger (in / out)",
  "AI narrative + Classic Luxury PDF",
] as const;

const SCOPE_OUT = [
  "Separate guide/driver logins (later)",
  "Bank-card / OTA fare shopping",
  "Stripe guest checkout",
  "Amadeus live GDS (schema only)",
] as const;

export function LandingPage() {
  const demo = sampleItinerary();

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="app-logo">
          Itinerary <em>Studio</em>
        </Link>
        <nav className="landing-nav-links">
          <a href="#how">How it works</a>
          <a href="#scope">Scope</a>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Start free
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">Agent portal · live ops desk</p>
          <h1 className="landing-brand">
            Itinerary <em>Studio</em>
          </h1>
          <p className="landing-headline">
            Stop rebuilding itineraries — and stop inventing hotel rooms.
          </p>
          <p className="landing-support">
            AI writes the guest story. Live inventory, guides, drivers, room numbers, and payments are
            real rows you update — free agent tools; you earn on the flow of information + support.
          </p>
          <div className="landing-cta">
            <Link href="/signup" className="btn btn-primary">
              Create agency
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Sign in
            </Link>
            <a href="#demo" className="btn btn-ghost">
              See sample PDF
            </a>
          </div>
          <ul className="landing-time">
            <li>
              <strong>~2 hrs</strong>
              <span>manual rewrite</span>
            </li>
            <li className="landing-time-arrow" aria-hidden>
              →
            </li>
            <li>
              <strong>~3 min</strong>
              <span>brief → draft → print</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="pain-heading">
        <h2 id="pain-heading" className="landing-section-title">
          Nobody rebuilds all of it cleanly. So you waste hours.
        </h2>
        <p className="landing-section-lead">
          Agents juggle the same three messes before every guest send. Studio collapses them into one
          ops path.
        </p>
        <div className="landing-pain-grid">
          {PAINS.map((p) => (
            <div key={p.label} className="landing-pain">
              <p className="landing-pain-label">{p.label}</p>
              <p className="landing-pain-detail">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="how" aria-labelledby="how-heading">
        <h2 id="how-heading" className="landing-section-title">
          How it works
        </h2>
        <p className="landing-section-lead">Three steps. The rest is polish and brand.</p>
        <ol className="landing-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="landing-step">
              <span className="landing-step-n">{s.n}</span>
              <div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section landing-demo" id="demo" aria-labelledby="demo-heading">
        <div className="landing-demo-head">
          <h2 id="demo-heading" className="landing-section-title">
            Value you can show
          </h2>
          <p className="landing-section-lead">
            Illustration of the Classic Luxury output from a short brief. Sign in to generate live
            drafts for your agency.
          </p>
          <div className="landing-brief-chip">
            <span className="landing-brief-label">Sample brief</span>
            <p>{SAMPLE_BRIEF}</p>
          </div>
        </div>
        <div className="landing-preview-wrap">
          <div className="landing-preview-label no-print">Classic Luxury · sample only</div>
          <div className="landing-preview-scroll">
            <ClassicLuxuryDocument itinerary={demo} brand={demo.brand_snapshot} />
          </div>
        </div>
      </section>

      <section className="landing-section" id="scope" aria-labelledby="scope-heading">
        <h2 id="scope-heading" className="landing-section-title">
          Product boundary — know what v1 is
        </h2>
        <div className="landing-scope-grid">
          <div className="landing-scope landing-scope-in">
            <h3>In scope today</h3>
            <ul>
              {SCOPE_IN.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="landing-scope landing-scope-out">
            <h3>Not this product</h3>
            <ul>
              {SCOPE_OUT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          Itinerary <em>Studio</em> · multi-agency white-label for private Bhutan tours
        </p>
        <div className="landing-footer-links">
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Create account</Link>
          <a href="/api/health">Health</a>
        </div>
      </footer>
    </div>
  );
}
