import type {
  Brand,
  Itinerary,
  ItineraryContent,
  ItineraryOpsBundle,
} from "@/lib/types";

function brandName(b?: Partial<Brand> | null) {
  return b?.display_name || "Agency";
}

/** Guide/driver field pack — itinerary + ops contacts, no rates or payments. */
export function FieldPackDocument({
  itinerary,
  brand,
  ops,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
  ops: ItineraryOpsBundle;
}) {
  const b = brand || itinerary.brand_snapshot;
  const c = itinerary.content || ({} as ItineraryContent);
  const guest = itinerary.client_name || c.prepared_for || "Guest";
  const stays = ops.stays || [];
  const staff = ops.staff || [];
  const days = c.days || [];

  return (
    <div className="doc-root field-pack">
      <section className="page">
        <header className="page-header">
          <div className="brand">{brandName(b)}</div>
          <div className="meta">MOBILE FIELD · STAFF ONLY</div>
        </header>
        <div className="page-body">
          <p className="section-label">Trip briefing</p>
          <h2 className="page-heading">{itinerary.title}</h2>
          <p className="page-sub">
            Guest: {guest}
            {c.group ? ` · ${c.group}` : ""}
            {c.travel_dates ? ` · ${c.travel_dates}` : ""}
          </p>
          <dl className="day-meta">
            <dt>Vehicle</dt>
            <dd>{c.vehicle || "As assigned"}</dd>
            <dt>Gateway</dt>
            <dd>{c.gateway || c.departing_from || "Paro"}</dd>
            <dt>Guide (itinerary)</dt>
            <dd>{c.guide || "See staff sheet"}</dd>
          </dl>
          <div className="highlight-note" style={{ marginTop: "8mm" }}>
            Internal use only — no client rates or payment details in this pack.
          </div>
        </div>
        <footer className="page-footer">
          <span className="ft-left">{guest}</span>
          <span className="ft-mid">{brandName(b)} · Field</span>
          <span className="ft-right">01</span>
        </footer>
      </section>

      {days.map((day, i) => (
        <section className="page" key={day.day ?? i}>
          <header className="page-header">
            <div className="brand">{brandName(b)}</div>
            <div className="meta">DAY {day.day}</div>
          </header>
          <div className="page-body">
            <p className="section-label">Day {day.day}</p>
            <h2 className="page-heading">{day.title}</h2>
            <p className="page-sub">{day.route}</p>
            <p>{day.description}</p>
            {day.activities?.length ? (
              <ul className="field-hint" style={{ marginTop: "4mm", lineHeight: 1.6 }}>
                {day.activities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : null}
            <dl className="day-meta" style={{ marginTop: "6mm" }}>
              <dt>Overnight</dt>
              <dd>{day.overnight || "—"}</dd>
              <dt>Meals</dt>
              <dd>{day.meals || "—"}</dd>
            </dl>
          </div>
          <footer className="page-footer">
            <span className="ft-left">{guest}</span>
            <span className="ft-mid">Day {day.day}</span>
            <span className="ft-right">{String(i + 2).padStart(2, "0")}</span>
          </footer>
        </section>
      ))}

      {stays.map((s, i) => {
        const hotel = s.hotels;
        const room = s.rooms;
        return (
          <section className="page" key={s.id}>
            <header className="page-header">
              <div className="brand">{brandName(b)}</div>
              <div className="meta">HOTEL CONFIRMATION</div>
            </header>
            <div className="page-body">
              <p className="section-label">Stay {String(i + 1).padStart(2, "0")}</p>
              <h2 className="page-heading">{hotel?.name || "Hotel"}</h2>
              <p className="page-sub">{hotel?.city || hotel?.address}</p>
              <dl className="day-meta">
                <dt>Guest</dt>
                <dd>{guest}</dd>
                <dt>Dates</dt>
                <dd>
                  {[s.check_in, s.check_out].filter(Boolean).join(" → ") ||
                    (s.day_from != null
                      ? `Day ${s.day_from}${s.day_to != null ? `–${s.day_to}` : ""}`
                      : "TBD")}
                </dd>
                <dt>Room</dt>
                <dd>
                  {room ? `#${room.room_number} · ${room.room_type}` : "Assign at desk"}
                </dd>
                <dt>Hotel phone</dt>
                <dd>{hotel?.phone || "—"}</dd>
                <dt>Notes</dt>
                <dd>{s.notes || "—"}</dd>
              </dl>
            </div>
            <footer className="page-footer">
              <span className="ft-left">{guest}</span>
              <span className="ft-mid">Hotel</span>
              <span className="ft-right">{String(days.length + 2 + i).padStart(2, "0")}</span>
            </footer>
          </section>
        );
      })}

      {staff.map((s, i) => {
        const isGuide = s.role === "guide";
        const guide = s.guides;
        const driver = s.drivers;
        return (
          <section className="page" key={s.id}>
            <header className="page-header">
              <div className="brand">{brandName(b)}</div>
              <div className="meta">{isGuide ? "GUIDE" : "DRIVER"}</div>
            </header>
            <div className="page-body">
              <p className="section-label">{isGuide ? "Guide" : "Driver"}</p>
              <h2 className="page-heading">{isGuide ? guide?.name : driver?.name}</h2>
              <dl className="day-meta">
                <dt>Phone</dt>
                <dd>{(isGuide ? guide?.phone : driver?.phone) || "—"}</dd>
                {isGuide ? (
                  <>
                    <dt>Languages</dt>
                    <dd>{guide?.languages || "—"}</dd>
                  </>
                ) : (
                  <>
                    <dt>Vehicle</dt>
                    <dd>
                      {driver?.vehicle_type || "—"} · {driver?.plate || "—"}
                    </dd>
                  </>
                )}
                <dt>Days</dt>
                <dd>
                  {s.day_from != null
                    ? `D${s.day_from}${s.day_to != null ? `–D${s.day_to}` : ""}`
                    : "Full trip"}
                </dd>
              </dl>
            </div>
            <footer className="page-footer">
              <span className="ft-left">{guest}</span>
              <span className="ft-mid">Staff</span>
              <span className="ft-right">END</span>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
