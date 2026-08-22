import type { Brand, Itinerary } from "@/lib/types";

export function EditorialDocument({
  itinerary,
  brand,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
}) {
  const c = itinerary.content || {};
  const b = brand || itinerary.brand_snapshot;
  return (
    <div className="doc-root template-shell editorial-shell">
      <section className="page">
        <div className="page-body" style={{ position: "relative", top: 0, height: "auto" }}>
          <div className="template-shell-banner">
            <strong>Coming later · shell only</strong>
            Editorial Deep is reserved for a culture-forward layout. Client-facing PDFs should use{" "}
            <em>Classic Luxury</em> until this template ships as production-ready.
          </div>
          <p className="section-label">Editorial Deep</p>
          <h2 className="page-heading">{c.trip_title || itinerary.title}</h2>
          <p className="page-sub">Letter excerpt only in this shell.</p>
          {(c.letter?.paragraphs || []).map((p, i) => (
            <p className="day-desc" key={i} style={{ marginBottom: "4mm" }}>
              {p}
            </p>
          ))}
          <p className="page-sub">Brand: {b?.display_name || "Agency"}</p>
        </div>
      </section>
    </div>
  );
}
