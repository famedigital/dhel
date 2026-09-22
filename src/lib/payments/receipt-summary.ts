import type { ItineraryContent, Payment, TripTraveler } from "@/lib/types";

export type ReceiptLine = {
  id: string;
  label: string;
  detail: string;
  amount: number;
  paidAt: string | null;
  method: string | null;
};

export type ReceiptSummary = {
  currency: string;
  tripTotal: number | null;
  paidIn: ReceiptLine[];
  paidInSum: number;
  balance: number | null;
  settled: boolean;
  heroAmount: number;
  heroKind: "balance_due" | "received" | "settled";
};

export function moneyInPaid(payments: Payment[]): Payment[] {
  return (payments || [])
    .filter((p) => p.direction === "in" && (p.status === "paid" || p.status === "partial"))
    .slice()
    .sort((a, b) => {
      const da = a.paid_at || a.created_at || "";
      const db = b.paid_at || b.created_at || "";
      return da.localeCompare(db);
    });
}

export function buildReceiptSummary(
  content: ItineraryContent | null | undefined,
  payments: Payment[],
): ReceiptSummary {
  const pricing = content?.pricing;
  const currency = pricing?.currency || payments[0]?.currency || "USD";
  const tripTotal =
    pricing?.total != null && Number.isFinite(Number(pricing.total))
      ? Number(pricing.total)
      : null;

  const paidRows = moneyInPaid(payments);
  const paidIn: ReceiptLine[] = paidRows.map((p) => ({
    id: p.id,
    label: p.party_label || (p.party_type === "client" ? "Client payment" : "Payment in"),
    detail: [p.method, p.note, p.status === "partial" ? "partial" : null]
      .filter(Boolean)
      .join(" · "),
    amount: Number(p.amount) || 0,
    paidAt: p.paid_at,
    method: p.method,
  }));
  const paidInSum = paidIn.reduce((a, l) => a + l.amount, 0);

  const balance =
    tripTotal != null ? Math.round((tripTotal - paidInSum) * 100) / 100 : null;
  const settled = balance != null ? balance <= 0.009 : paidInSum > 0 && tripTotal == null;

  let heroAmount = 0;
  let heroKind: ReceiptSummary["heroKind"] = "balance_due";
  if (balance != null && balance > 0.009) {
    heroAmount = balance;
    heroKind = "balance_due";
  } else if (paidIn.length) {
    heroAmount = paidIn[paidIn.length - 1].amount;
    heroKind = settled ? "settled" : "received";
  } else if (tripTotal != null) {
    heroAmount = tripTotal;
    heroKind = "balance_due";
  }

  return {
    currency,
    tripTotal,
    paidIn,
    paidInSum,
    balance,
    settled,
    heroAmount,
    heroKind,
  };
}

export function guestNamesOnReceipt(
  clientName: string | null | undefined,
  preparedFor: string | null | undefined,
  travelers: TripTraveler[] | undefined,
): string {
  if (travelers?.length) {
    return travelers.map((t) => t.name).filter(Boolean).join(" · ");
  }
  return preparedFor || clientName || "Guest";
}

export function receiptNumber(clientName: string | null | undefined, when = new Date()): string {
  const slug = (clientName || "GUEST")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16)
    .toUpperCase() || "GUEST";
  const y = when.getFullYear();
  const m = String(when.getMonth() + 1).padStart(2, "0");
  const d = String(when.getDate()).padStart(2, "0");
  return `SP-${slug}-${y}${m}${d}`;
}

export function formatMoney(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
