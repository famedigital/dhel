import type {
  Brand,
  Itinerary,
  ItineraryContent,
  ItineraryOpsBundle,
} from "@/lib/types";
import {
  buildReceiptSummary,
  formatMoney,
  guestNamesOnReceipt,
  receiptNumber,
} from "@/lib/payments/receipt-summary";

function brandName(b?: Partial<Brand> | null) {
  return b?.display_name || "Agency";
}

function websiteHost(b?: Partial<Brand> | null) {
  return b?.website?.replace(/^https?:\/\//, "") || null;
}

/** Official guest-facing payment receipt / invoice (A4, stampable). */
export function ReceiptPackDocument({
  itinerary,
  brand,
  ops,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
  ops: ItineraryOpsBundle;
}) {
  const b = brand || itinerary.brand_snapshot;
  const c = (itinerary.content || {}) as ItineraryContent;
  const zh = itinerary.language === "zh";
  const guest = guestNamesOnReceipt(
    itinerary.client_name,
    c.prepared_for,
    ops.travelers,
  );
  const summary = buildReceiptSummary(c, ops.payments || []);
  const no = receiptNumber(itinerary.client_name || c.prepared_for);
  const site = websiteHost(b);
  const signatory = b?.signatory_names || brandName(b);
  const contact = [site, b?.whatsapp].filter(Boolean).join(" · ");

  const heroLabel =
    summary.heroKind === "balance_due"
      ? zh
        ? "Balance due · 应付尾款"
        : "Balance due"
      : summary.heroKind === "settled"
        ? zh
          ? "Settled · 已结清金额"
          : "Amount settled"
        : zh
          ? "Amount received · 实收"
          : "Amount received";

  const badge =
    summary.settled || (summary.balance != null && summary.balance <= 0.009)
      ? zh
        ? "Paid in full · 已结清"
        : "Paid in full"
      : zh
        ? "Outstanding · 待收"
        : "Outstanding";

  return (
    <div className={zh ? "lang-zh doc-root receipt-pack" : "doc-root receipt-pack"}>
      <section className="page">
        <div className="receipt-sheet">
          <div className="receipt-top">
            <div>
              <div className="receipt-brand">{brandName(b)}</div>
              <p className="receipt-co">
                {brandName(b)}
                {b?.email ? (
                  <>
                    <br />
                    {b.email}
                  </>
                ) : null}
                {b?.whatsapp ? (
                  <>
                    <br />
                    WhatsApp {b.whatsapp}
                  </>
                ) : null}
                {site ? (
                  <>
                    <br />
                    {site}
                  </>
                ) : null}
              </p>
            </div>
            <div className="receipt-doc-meta">
              <p className="receipt-doc-title">
                {zh ? "正式收据" : "Official Receipt"}
              </p>
              {zh ? <p className="receipt-doc-sub">Official Receipt · stamped copy</p> : null}
              <p>
                No. <strong>{no}</strong>
              </p>
              <p>
                {zh ? "日期" : "Date"}{" "}
                <strong>
                  {new Date().toLocaleDateString(zh ? "zh-CN" : "en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </p>
              <span className="receipt-badge">{badge}</span>
            </div>
          </div>

          <h1 className="receipt-h1">
            {summary.heroKind === "balance_due"
              ? zh
                ? "Balance payment"
                : "Balance payment"
              : zh
                ? "Payment received"
                : "Payment received"}
          </h1>
          <p className="receipt-lead">
            {zh
              ? "尾款 / 收款证明 · Guest-facing stamped receipt"
              : "Guest-facing payment receipt · keep with company stamp"}
          </p>

          <div className="receipt-grid">
            <div>
              <label>{zh ? "付款人 · Received from" : "Received from"}</label>
              <p>{guest}</p>
            </div>
            <div>
              <label>{zh ? "预订 · Booking" : "Booking"}</label>
              <p>
                {itinerary.title}
                {c.travel_dates ? (
                  <>
                    <br />
                    {c.travel_dates}
                  </>
                ) : null}
                {c.group ? (
                  <>
                    <br />
                    {c.group}
                  </>
                ) : null}
              </p>
            </div>
            <div>
              <label>{zh ? "币种 · Currency" : "Currency"}</label>
              <p>{summary.currency}</p>
            </div>
            <div>
              <label>{zh ? "状态 · Status" : "Status"}</label>
              <p>{badge}</p>
            </div>
          </div>

          <div className="receipt-hero">
            <div>
              <label>{heroLabel}</label>
              <p className="receipt-sum">
                {formatMoney(summary.currency, summary.heroAmount)}
              </p>
            </div>
            <div className="receipt-hero-side">
              {summary.tripTotal != null ? (
                <p>
                  {zh ? "行程总价" : "Trip total"}{" "}
                  {formatMoney(summary.currency, summary.tripTotal)}
                </p>
              ) : null}
              <p>
                {zh ? "已收合计" : "Paid in"}{" "}
                {formatMoney(summary.currency, summary.paidInSum)}
              </p>
              {summary.balance != null ? (
                <p>
                  {zh ? "余额" : "Balance"}{" "}
                  {formatMoney(summary.currency, Math.max(0, summary.balance))}
                </p>
              ) : null}
            </div>
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>{zh ? "项目 · Item" : "Item"}</th>
                <th>{zh ? "说明 · Detail" : "Detail"}</th>
                <th className="amt">{summary.currency}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="section">
                <td colSpan={3}>
                  {zh ? "行程总价 · Trip total" : "Trip total"}
                </td>
              </tr>
              <tr>
                <td>
                  {zh ? "旅游套餐" : "Tour package"}
                  <span className="en">
                    {c.pricing?.note || itinerary.title}
                  </span>
                </td>
                <td>
                  {c.pricing?.pax
                    ? `${c.pricing.pax} pax`
                    : c.group || "Private tour"}
                </td>
                <td className="amt">
                  {summary.tripTotal != null
                    ? summary.tripTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </td>
              </tr>

              <tr className="section">
                <td colSpan={3}>
                  {zh ? "已收款项 · Payments received" : "Payments received"}
                </td>
              </tr>
              {summary.paidIn.length === 0 ? (
                <tr>
                  <td colSpan={2}>
                    {zh ? "尚无已付入账记录" : "No paid money-in logged yet"}
                  </td>
                  <td className="amt">—</td>
                </tr>
              ) : (
                summary.paidIn.map((line) => (
                  <tr key={line.id}>
                    <td>
                      {line.label}
                      {line.paidAt ? (
                        <span className="en">
                          {new Date(line.paidAt).toLocaleDateString(
                            zh ? "zh-CN" : "en-GB",
                          )}
                        </span>
                      ) : null}
                    </td>
                    <td>{line.detail || "—"}</td>
                    <td className="amt">
                      {line.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
              <tr className="total">
                <td colSpan={2}>
                  {zh ? "已收合计 · Paid in" : "Paid in total"}
                </td>
                <td className="amt">
                  {summary.paidInSum.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>

              <tr className="section">
                <td colSpan={3}>
                  {zh ? "本页 · This receipt" : "This receipt"}
                </td>
              </tr>
              <tr className="highlight">
                <td>
                  {summary.heroKind === "balance_due"
                    ? zh
                      ? "应付尾款"
                      : "Balance due"
                    : zh
                      ? "确认金额"
                      : "Confirmed amount"}
                </td>
                <td>
                  {summary.tripTotal != null
                    ? `${formatMoney(summary.currency, summary.tripTotal)} − ${formatMoney(summary.currency, summary.paidInSum)}`
                    : "From ops ledger"}
                </td>
                <td className="amt">
                  {summary.heroAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr className="total">
                <td colSpan={2}>
                  {zh ? "账款状态 · Account" : "Account status"}
                </td>
                <td className="amt">{badge}</td>
              </tr>
            </tbody>
          </table>

          <p className="receipt-note">
            {zh ? (
              <>
                本收据依据行程报价与办公室已登记的客户入账生成。请在收款后盖公司公章，并由收款人与客人签收。
                保留盖章原件。
              </>
            ) : (
              <>
                This receipt is generated from the trip quote and client money-in
                logged in Ops. After cash is received, apply the company stamp and
                obtain signatures. Keep the stamped original.
              </>
            )}
          </p>

          <div className="receipt-signs">
            <div className="receipt-sign">
              <label>{zh ? "客人签收 · Guest" : "Guest"}</label>
              <p className="hint">{zh ? "签名" : "Signature"}</p>
            </div>
            <div className="receipt-sign">
              <label>{zh ? "收款人 · Received by" : "Received by"}</label>
              <p className="hint">{signatory}</p>
            </div>
            <div className="receipt-sign stamp">
              <label>{zh ? "公司盖章 · Stamp" : "Company stamp"}</label>
              <p className="hint">{zh ? "请盖公章" : "Official seal"}</p>
            </div>
          </div>

          <footer className="receipt-foot">
            <span>
              {no} · {guest}
            </span>
            <span>{contact || brandName(b)}</span>
            <span>1 / 1</span>
          </footer>
        </div>
      </section>
    </div>
  );
}
