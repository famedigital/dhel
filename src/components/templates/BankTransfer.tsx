import type { Brand, Itinerary } from "@/lib/types";

function brandName(b?: Partial<Brand> | null) {
  return b?.display_name || "Agency";
}

/** Bank transfer instruction sheet shell for client deposits. */
export function BankTransferDocument({
  itinerary,
  brand,
  amount,
  reference,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
  amount?: string;
  reference?: string;
}) {
  const b = brand || itinerary.brand_snapshot;
  const guest = itinerary.client_name || "Guest";

  return (
    <div className="doc-root bank-transfer">
      <section className="page">
        <header className="page-header">
          <div className="brand">{brandName(b)}</div>
          <div className="meta">BANK TRANSFER</div>
        </header>
        <div className="page-body">
          <p className="section-label">Payment instructions</p>
          <h2 className="page-heading">{itinerary.title}</h2>
          <p className="page-sub">Prepared for {guest}</p>
          <dl className="day-meta" style={{ marginTop: "8mm" }}>
            <dt>Amount</dt>
            <dd>{amount || "As quoted in proposal"}</dd>
            <dt>Reference</dt>
            <dd>{reference || itinerary.id.slice(0, 8).toUpperCase()}</dd>
            <dt>Beneficiary</dt>
            <dd>{brandName(b)}</dd>
          </dl>
          <div className="highlight-note" style={{ marginTop: "8mm" }}>
            Template shell — wire agency BoB/BNB account details from settings.
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
