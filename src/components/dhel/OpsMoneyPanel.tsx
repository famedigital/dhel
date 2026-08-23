"use client";

import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { addPayment, deletePayment, updatePaymentStatus } from "@/app/actions/ops";
import { EmvQr } from "@/components/pay/emv-qr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDynamicEmv } from "@/lib/payments/emv";
import { cn } from "@/lib/utils";
import type { Driver, Guide, Payment } from "@/lib/types";

const fieldControl = cn(
  "flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-1",
);

function resolveStaffEmv(
  p: Payment,
  guides: Guide[],
  drivers: Driver[],
): string | null {
  if (p.direction !== "out") return null;
  if (p.party_type === "guide") {
    const byId = p.party_id ? guides.find((g) => g.id === p.party_id) : null;
    if (byId?.emv_static) return byId.emv_static;
    const label = (p.party_label || "").toLowerCase();
    const byName = guides.find((g) => label && g.name.toLowerCase().includes(label.slice(0, 6)));
    return byName?.emv_static || null;
  }
  if (p.party_type === "driver") {
    const byId = p.party_id ? drivers.find((d) => d.id === p.party_id) : null;
    if (byId?.emv_static) return byId.emv_static;
    const label = (p.party_label || "").toLowerCase();
    const byName = drivers.find((d) => label && d.name.toLowerCase().includes(label.slice(0, 6)));
    return byName?.emv_static || null;
  }
  return null;
}

export function OpsMoneyPanel({
  itineraryId,
  payments,
  guides = [],
  drivers = [],
}: {
  itineraryId: string;
  payments: Payment[];
  guides?: Guide[];
  drivers?: Driver[];
}) {
  const moneyIn = payments
    .filter((p) => p.direction === "in")
    .reduce((a, p) => a + Number(p.amount), 0);
  const moneyOut = payments
    .filter((p) => p.direction === "out")
    .reduce((a, p) => a + Number(p.amount), 0);
  const paidIn = payments
    .filter((p) => p.direction === "in" && p.status === "paid")
    .reduce((a, p) => a + Number(p.amount), 0);
  const paidOut = payments
    .filter((p) => p.direction === "out" && p.status === "paid")
    .reduce((a, p) => a + Number(p.amount), 0);

  const summary = [
    { label: "Client in", value: moneyIn },
    { label: "Supplier out", value: moneyOut },
    { label: "Paid in / out", valueLabel: `${paidIn.toLocaleString()} / ${paidOut.toLocaleString()}` },
    { label: "Margin", value: moneyIn - moneyOut },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Payments</h2>
          <p className="text-xs text-muted-foreground">Client in · supplier out</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {payments.length} rows
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {"valueLabel" in s && s.valueLabel
                  ? s.valueLabel
                  : `USD ${Number(s.value).toLocaleString()}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState title="No payment rows" description="Add client deposits or supplier pays." className="py-8" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {payments.map((p) => {
            const inbound = p.direction === "in";
            const emvStatic = resolveStaffEmv(p, guides, drivers);
            const amountNu =
              p.currency === "BTN" || p.currency === "Nu" || p.currency === "NU"
                ? Number(p.amount)
                : Number(p.amount);
            const dynamic =
              emvStatic && p.status !== "paid"
                ? buildDynamicEmv(
                    emvStatic,
                    amountNu,
                    (p.party_label || p.note || "Trip pay").slice(0, 25),
                  )
                : "";
            return (
              <Card
                key={p.id}
                className="flex aspect-[4/5] min-h-0 flex-col overflow-hidden shadow-sm"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
                  <div className="min-w-0 space-y-0.5">
                    <CardTitle className="flex items-center gap-1.5 truncate text-sm">
                      {inbound ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                      )}
                      <span className="truncate">{p.party_label || p.party_type}</span>
                    </CardTitle>
                    <CardDescription className="text-[11px] capitalize">
                      {p.direction} · {p.party_type}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={p.status === "paid" ? "default" : "outline"}
                    className="shrink-0 px-1.5 py-0 text-[10px] capitalize"
                  >
                    {p.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3 pt-0">
                  <div className="rounded-md border border-border bg-muted/40 px-2.5 py-2">
                    <p className="text-base font-semibold tabular-nums">
                      {p.currency} {Number(p.amount).toLocaleString()}
                    </p>
                    {p.note ? <p className="mt-1 text-xs text-muted-foreground">{p.note}</p> : null}
                    {p.method ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">{p.method}</p>
                    ) : null}
                  </div>

                  {dynamic ? (
                    <div className="rounded-md border border-border bg-background p-2 text-center">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Scan &amp; pay
                      </p>
                      <EmvQr payload={dynamic} size="sm" />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {p.currency} {Number(p.amount).toLocaleString()}
                      </p>
                    </div>
                  ) : null}

                  <form action={updatePaymentStatus} className="space-y-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="itinerary_id" value={itineraryId} />
                    <Label className="text-xs">Status</Label>
                    <select className={fieldControl} name="status" defaultValue={p.status}>
                      <option value="planned">planned</option>
                      <option value="partial">partial</option>
                      <option value="paid">paid</option>
                    </select>
                    <Button type="submit" variant="outline" size="sm" className="w-full">
                      {p.status === "paid" ? "Update" : "Mark paid / update"}
                    </Button>
                  </form>

                  <form action={deletePayment} className="mt-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="itinerary_id" value={itineraryId} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Add payment</CardTitle>
          <CardDescription className="text-xs">Deposit, hotel, guide, or other</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form action={addPayment} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="itinerary_id" value={itineraryId} />
            <div className="space-y-1">
              <Label className="text-xs">Direction</Label>
              <select className={fieldControl} name="direction" defaultValue="in">
                <option value="in">In (from client)</option>
                <option value="out">Out (to hotel/guide/driver)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Party type</Label>
              <select className={fieldControl} name="party_type" defaultValue="client">
                <option value="client">client</option>
                <option value="hotel">hotel</option>
                <option value="guide">guide</option>
                <option value="driver">driver</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Link guide / driver (for pay QR)</Label>
              <select className={fieldControl} name="party_id" defaultValue="">
                <option value="">— optional —</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    Guide · {g.name}
                    {g.emv_static ? " · QR set" : ""}
                  </option>
                ))}
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    Driver · {d.name}
                    {d.emv_static ? " · QR set" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                className="h-8 px-2.5 text-xs"
                name="party_label"
                placeholder="Deposit / hotel / guide"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input className="h-8 px-2.5 text-xs" name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <select className={fieldControl} name="currency" defaultValue="BTN">
                <option value="BTN">BTN (Nu)</option>
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select className={fieldControl} name="status" defaultValue="planned">
                <option value="planned">planned</option>
                <option value="partial">partial</option>
                <option value="paid">paid</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Method</Label>
              <Input className="h-8 px-2.5 text-xs" name="method" placeholder="Bank / cash" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Note</Label>
              <Input className="h-8 px-2.5 text-xs" name="note" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                Add payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
