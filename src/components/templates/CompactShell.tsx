import type { Brand, Itinerary } from "@/lib/types";

export function CompactDocument({
  itinerary,
  brand,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
}) {
  const c = itinerary.content || {};
  const b = brand || itinerary.brand_snapshot;
  return (
    <div className="doc-root template-shell compact-shell">
      <section className="page">
        <div className="page-body" style={{ position: "relative", top: 0, height: "auto" }}>
          <div className="template-shell-banner">
            <strong>Coming later · shell only</strong>
            Compact is a condensed reading view for internal review. For client-ready PDFs in this
            release, switch the template to <em>Classic Luxury</em> and use Preview / Print.
          </div>
          <p className="section-label">Compact template</p>
          <h2 className="page-heading">{c.trip_title || itinerary.title}</h2>
          <p className="page-sub">Dense outline of the generated day plan.</p>
          <p className="letter-body">
            {(c.days || []).map((d) => (
              <span key={d.day}>
                <strong>
                  D{d.day}. {d.title}
                </strong>
                {" — "}
                {d.description}
                <br />
              </span>
            ))}
          </p>
          <p className="page-sub" style={{ marginTop: "8mm" }}>
            Brand: {b?.display_name || "Agency"}
          </p>
        </div>
      </section>
    </div>
  );
}
