import type { Brand, Itinerary, ItineraryContent } from "@/lib/types";

function brandName(b?: Partial<Brand> | null) {
  return b?.display_name || "Agency";
}

/** Pre-trip guide briefing shell — expand with talking points and cultural notes. */
export function GuideBriefingDocument({
  itinerary,
  brand,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
}) {
  const b = brand || itinerary.brand_snapshot;
  const c = itinerary.content || ({} as ItineraryContent);
  const guest = itinerary.client_name || c.prepared_for || "Guest";

  return (
    <div className="doc-root guide-briefing">
      <section className="page">
        <header className="page-header">
          <div className="brand">{brandName(b)}</div>
          <div className="meta">GUIDE BRIEFING</div>
        </header>
        <div className="page-body">
          <p className="section-label">Briefing</p>
          <h2 className="page-heading">{itinerary.title}</h2>
          <p className="page-sub">Guest: {guest}</p>
          <div className="highlight-note" style={{ marginTop: "8mm" }}>
            Template shell — add client preferences, pace, dietary notes, and key
            talking points per day.
          </div>
        </div>
        <footer className="page-footer">
          <span className="ft-left">{guest}</span>
          <span className="ft-mid">{brandName(b)}</span>
          <span className="ft-right">01</span>
        </footer>
      </section>
    </div>
  );
}
