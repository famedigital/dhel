import type {
  Brand,
  Itinerary,
  ItineraryOpsBundle,
  ItineraryContent,
} from "@/lib/types";

function brandName(b?: Partial<Brand> | null) {
  return b?.display_name || "Agency";
}

/** Internal ops print pack: vouchers, staff sheets, money. */
export function OpsPackDocument({
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
  const payments = ops.payments || [];
  const moneyIn = payments
    .filter((p) => p.direction === "in")
    .reduce((a, p) => a + Number(p.amount), 0);
  const moneyOut = payments
    .filter((p) => p.direction === "out")
    .reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="doc-root ops-pack">
      <section className="page">
        <header className="page-header">
          <div className="brand">{brandName(b)}</div>
          <div className="meta">OPS PACK · INTERNAL</div>
        </header>
        <div className="page-body">
          <p className="section-label">Operations</p>
          <h2 className="page-heading">{itinerary.title}</h2>
          <p className="page-sub">
            Guest: {guest} · Status: {itinerary.status}
          </p>
          <div className="price-grid">
            <div className="price-card">
              <p className="num">Stays</p>
              <h3>{stays.length}</h3>
              <p className="hint">
                {stays.filter((s) => s.room_id).length} with room #
              </p>
            </div>
            <div className="price-card">
              <p className="num">Staff</p>
              <h3>{staff.length}</h3>
              <p className="hint">Guides + drivers</p>
            </div>
            <div className="price-card">
              <p className="num">Money in / out</p>
              <h3 style={{ fontSize: "14pt" }}>
                {moneyIn.toLocaleString()} / {moneyOut.toLocaleString()}
              </h3>
              <p className="hint">Margin {(moneyIn - moneyOut).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <footer className="page-footer">
          <span className="ft-left">{guest}</span>
          <span className="ft-mid">{brandName(b)} · Ops</span>
          <span className="ft-right">01</span>
        </footer>
      </section>

      {stays.map((s, i) => {
        const hotel = s.hotels;
        const room = s.rooms;
        return (
          <section className="page" key={s.id}>
            <header className="page-header">
              <div className="brand">{brandName(b)}</div>
              <div className="meta">HOTEL VOUCHER</div>
            </header>
            <div className="page-body">
              <p className="section-label">Voucher {String(i + 1).padStart(2, "0")}</p>
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
                <dt>Room number</dt>
                <dd>
                  {room ? (
                    <strong style={{ fontSize: "16pt" }}>#{room.room_number}</strong>
                  ) : (
                    "UNASSIGNED"
                  )}
                </dd>
                <dt>Room type</dt>
                <dd>{room?.room_type || "—"}</dd>
                <dt>Hotel phone</dt>
                <dd>{hotel?.phone || "—"}</dd>
                <dt>Rate</dt>
                <dd>
                  {s.rate != null
                    ? `${s.currency} ${Number(s.rate).toLocaleString()}`
                    : "—"}
                </dd>
                <dt>Notes</dt>
                <dd>{s.notes || "—"}</dd>
              </dl>
              <div className="highlight-note" style={{ marginTop: "8mm" }}>
                Confirmed only when room number is set from live inventory. Present this
                voucher at check-in.
              </div>
            </div>
            <footer className="page-footer">
              <span className="ft-left">{guest}</span>
              <span className="ft-mid">Hotel voucher</span>
              <span className="ft-right">{String(i + 2).padStart(2, "0")}</span>
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
              <div className="meta">{isGuide ? "GUIDE SHEET" : "DRIVER SHEET"}</div>
            </header>
            <div className="page-body">
              <p className="section-label">{isGuide ? "Guide" : "Driver"}</p>
              <h2 className="page-heading">
                {isGuide ? guide?.name : driver?.name}
              </h2>
              <dl className="day-meta">
                <dt>Phone</dt>
                <dd>{(isGuide ? guide?.phone : driver?.phone) || "—"}</dd>
                {isGuide ? (
                  <>
                    <dt>Languages</dt>
                    <dd>{guide?.languages || "—"}</dd>
                    <dt>License</dt>
                    <dd>{guide?.license_no || "—"}</dd>
                  </>
                ) : (
                  <>
                    <dt>Vehicle</dt>
                    <dd>{driver?.vehicle_type || "—"}</dd>
                    <dt>Plate</dt>
                    <dd>
                      <strong>{driver?.plate || "—"}</strong>
                    </dd>
                  </>
                )}
                <dt>Days</dt>
                <dd>
                  {s.day_from != null
                    ? `D${s.day_from}${s.day_to != null ? `–D${s.day_to}` : ""}`
                    : "Full trip"}
                </dd>
                <dt>Guest</dt>
                <dd>{guest}</dd>
                <dt>Notes</dt>
                <dd>{s.notes || "—"}</dd>
              </dl>
            </div>
            <footer className="page-footer">
              <span className="ft-left">{guest}</span>
              <span className="ft-mid">Staff</span>
              <span className="ft-right">
                {String(stays.length + 2 + i).padStart(2, "0")}
              </span>
            </footer>
          </section>
        );
      })}

      <section className="page">
        <header className="page-header">
          <div className="brand">{brandName(b)}</div>
          <div className="meta">PAYMENTS</div>
        </header>
        <div className="page-body">
          <p className="section-label">Ledger</p>
          <h2 className="page-heading">Client & supplier money</h2>
          <div className="hotel-rows">
            {payments.length === 0 ? (
              <p className="page-sub">No payment rows recorded.</p>
            ) : (
              payments.map((p) => (
                <div className="hotel-row" key={p.id}>
                  <div className="hotel-row-main">
                    <strong>
                      {p.direction.toUpperCase()} · {p.party_label || p.party_type}
                    </strong>
                    <br />
                    <span className="hotel-alt">
                      {p.status}
                      {p.method ? ` · ${p.method}` : ""}
                      {p.paid_at ? ` · ${p.paid_at}` : ""}
                      {p.note ? ` · ${p.note}` : ""}
                    </span>
                  </div>
                  <div className="hotel-row-price">
                    {p.currency} <strong>{Number(p.amount).toLocaleString()}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="price-hero" style={{ marginTop: "8mm" }}>
            <div>
              <p className="label">In − Out (all statuses)</p>
              <p className="amount">USD {(moneyIn - moneyOut).toLocaleString()}</p>
            </div>
            <p className="note">
              In {moneyIn.toLocaleString()} · Out {moneyOut.toLocaleString()}
            </p>
          </div>
        </div>
        <footer className="page-footer">
          <span className="ft-left">{guest}</span>
          <span className="ft-mid">Payments</span>
          <span className="ft-right">END</span>
        </footer>
      </section>
    </div>
  );
}
