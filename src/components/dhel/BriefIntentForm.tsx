"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { parseStayPlan } from "@/lib/catalog/stay-plan";
import type { BriefIntent, GapField } from "@/lib/catalog";

const ENTRY_OPTIONS = ["Paro", "Hasimara", "Bagdogra", "Phuentsholing"];
const BUDGET_OPTIONS: BriefIntent["budget_tier"][] = ["economy", "mid", "comfort", "luxury", "unknown"];
const GAP_LABELS: Record<GapField, string> = {
  pax: "Group size",
  days: "Trip length",
  stay_plan: "Stay plan (nights per town)",
  nationalities: "Nationality",
  entry_point: "Entry point",
  travel_dates: "Travel dates",
  budget_tier: "Budget",
};

export function BriefIntentForm({
  intent,
  gaps = [],
  onChange,
  onConfirm,
  confirming,
}: {
  intent: BriefIntent;
  gaps?: GapField[];
  onChange: (next: BriefIntent) => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  const gapSet = new Set(gaps);
  const ready = gaps.length === 0;

  function patch(partial: Partial<BriefIntent>) {
    onChange({ ...intent, ...partial });
  }

  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="pb-3">
        <CardTitle className="font-[family-name:var(--font-display)] text-xl tracking-wide">
          Trip details
        </CardTitle>
        <CardDescription>
          Parsed locally from the enquiry — fix anything missing before hotels and draft.
        </CardDescription>
        {gaps.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {gaps.map((g) => (
              <Badge key={g} variant="outline" className="border-amber-600/40 text-amber-800">
                Need: {GAP_LABELS[g]}
              </Badge>
            ))}
          </div>
        ) : (
          <Badge variant="outline" className="mt-2 w-fit">
            Ready for hotel pick
          </Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <label className={`space-y-1.5 text-sm ${gapSet.has("pax") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}>
          <span className="font-medium">Adults</span>
          <Input
            type="number"
            min={1}
            max={30}
            value={intent.adults}
            onChange={(e) => {
              const adults = Math.max(1, parseInt(e.target.value, 10) || 1);
              patch({ adults, pax: adults + intent.children });
            }}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Children</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={intent.children}
            onChange={(e) => {
              const children = Math.max(0, parseInt(e.target.value, 10) || 0);
              patch({ children, pax: intent.adults + children });
            }}
          />
        </label>
        <label className={`space-y-1.5 text-sm ${gapSet.has("days") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}>
          <span className="font-medium">Days</span>
          <Input
            type="number"
            min={3}
            max={21}
            value={intent.days}
            onChange={(e) => patch({ days: Math.min(21, Math.max(3, parseInt(e.target.value, 10) || 7)) })}
          />
        </label>
        <label className={`space-y-1.5 text-sm ${gapSet.has("travel_dates") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}>
          <span className="font-medium">Travel dates</span>
          <Input
            value={intent.travel_dates ?? ""}
            placeholder="e.g. 21–27 Nov 2026 or flexible"
            onChange={(e) => patch({ travel_dates: e.target.value })}
          />
        </label>
        <label className={`space-y-1.5 text-sm sm:col-span-2 ${gapSet.has("nationalities") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}>
          <span className="font-medium">Nationality</span>
          <Input
            value={intent.nationalities.join(", ")}
            placeholder="Indian, Australian…"
            onChange={(e) =>
              patch({
                nationalities: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label className={`space-y-1.5 text-sm ${gapSet.has("entry_point") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}>
          <span className="font-medium">Entry point</span>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={intent.entry_point}
            onChange={(e) => patch({ entry_point: e.target.value })}
          >
            {ENTRY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className={`space-y-1.5 text-sm ${gapSet.has("budget_tier") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}>
          <span className="font-medium">Budget</span>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={intent.budget_tier}
            onChange={(e) => patch({ budget_tier: e.target.value as BriefIntent["budget_tier"] })}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Client name</span>
          <Input
            value={intent.client_name ?? ""}
            onChange={(e) => patch({ client_name: e.target.value })}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Language</span>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={intent.language}
            onChange={(e) => patch({ language: e.target.value as "en" | "zh" })}
          >
            <option value="en">English</option>
            <option value="zh">Chinese</option>
          </select>
        </label>
        <label
          className={`space-y-1.5 text-sm sm:col-span-2 ${gapSet.has("stay_plan") ? "ring-1 ring-amber-500/50 rounded-lg p-2" : ""}`}
        >
          <span className="font-medium">Stay plan (optional under 8 days; required for longer)</span>
          <Input
            value={
              intent.stay_plan?.map((s) => `${s.nights}n ${s.city}`).join(", ") ?? ""
            }
            placeholder="e.g. 2n Thimphu, 2n Punakha, 2n Paro"
            onChange={(e) => {
              const text = e.target.value.trim();
              if (!text) {
                patch({ stay_plan: undefined });
                return;
              }
              patch({ stay_plan: parseStayPlan(text) });
            }}
          />
        </label>
        <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
          <Button type="button" disabled={!ready || confirming} onClick={onConfirm}>
            {confirming ? "Loading hotels…" : ready ? "Confirm & choose hotels" : "Fill highlighted fields first"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
