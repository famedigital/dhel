"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ItineraryContent } from "@/lib/types";
import { CopyButton } from "@/components/dhel/CopyButton";
import { friendlyAiWarning } from "@/lib/ai/friendly-warning";

type ReviewTab = "trip" | "letter" | "pricing" | "days" | "reply";

function linesToList(text: string): string[] {
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(items?: string[]): string {
  return (items ?? []).join("\n");
}

export function ProposalReviewPanel({
  content,
  clientReply,
  source,
  warning,
  saving,
  onChange,
  onSave,
  onBack,
}: {
  content: ItineraryContent;
  clientReply?: string;
  aiProvider?: string;
  source?: string;
  warning?: string;
  saving?: boolean;
  onChange: (next: ItineraryContent) => void;
  onSave: (mode: "editor" | "preview") => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<ReviewTab>("trip");
  const [replyDraft, setReplyDraft] = useState(clientReply ?? "");

  const dayCount = content.days?.length ?? 0;

  const tabs = useMemo(
    () =>
      [
        ["trip", "Trip & cover"],
        ["letter", "Welcome letter"],
        ["pricing", "Pricing"],
        ["days", `Days (${dayCount})`],
        ["reply", "Client reply"],
      ] as const,
    [dayCount],
  );

  function patch(partial: Partial<ItineraryContent>) {
    onChange({ ...content, ...partial });
  }

  function patchDay(index: number, partial: Partial<NonNullable<ItineraryContent["days"]>[number]>) {
    const days = [...(content.days ?? [])];
    days[index] = { ...days[index]!, ...partial };
    patch({ days });
  }

  const friendlyWarning = friendlyAiWarning(warning);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
              Agent review — final touch
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
              Tweak names, tone, days, and pricing. Guests only see Preview / PDF — never this screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {source === "stub" ? (
              <Badge variant="outline">Template draft</Badge>
            ) : source ? (
              <Badge variant="outline">AI draft</Badge>
            ) : null}
            <Badge variant="saffron">Draft — not saved yet</Badge>
          </div>
        </div>
        {friendlyWarning ? (
          <p className="mt-3 text-sm text-[#e8a838]">Note: {friendlyWarning}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "trip" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cover & trip details</CardTitle>
            <CardDescription>What appears on page 1 of the guest PDF.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Trip title</span>
              <Input
                value={content.trip_title ?? ""}
                onChange={(e) => patch({ trip_title: e.target.value })}
                placeholder="12-Day Spiritual Bhutan"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Prepared for</span>
              <Input
                value={content.prepared_for ?? ""}
                onChange={(e) => patch({ prepared_for: e.target.value })}
                placeholder="John · Solo · Spain"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Travel dates</span>
              <Input
                value={content.travel_dates ?? ""}
                onChange={(e) => patch({ travel_dates: e.target.value })}
                placeholder="20 – 31 March 2027"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Group</span>
              <Input
                value={content.group ?? ""}
                onChange={(e) => patch({ group: e.target.value })}
                placeholder="2 adults"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Gateway / route</span>
              <Input
                value={content.gateway ?? ""}
                onChange={(e) => patch({ gateway: e.target.value })}
                placeholder="Paro via Delhi"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Guide (cover line)</span>
              <Input
                value={content.guide ?? ""}
                onChange={(e) => patch({ guide: e.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Vehicle (cover line)</span>
              <Input
                value={content.vehicle_type ?? content.vehicle ?? ""}
                onChange={(e) => patch({ vehicle_type: e.target.value, vehicle: e.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Cover eyebrow</span>
              <Input
                value={content.eyebrow ?? ""}
                onChange={(e) => patch({ eyebrow: e.target.value })}
                placeholder="Private Journey · Kingdom of Bhutan"
              />
            </label>
          </CardContent>
        </Card>
      ) : null}

      {tab === "letter" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Welcome letter</CardTitle>
            <CardDescription>Page 2 — personal tone matters; rewrite freely.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Date line</span>
              <Input
                value={content.letter?.date ?? ""}
                onChange={(e) =>
                  patch({ letter: { ...content.letter, date: e.target.value } })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Greeting</span>
              <Input
                value={content.letter?.greeting ?? ""}
                onChange={(e) =>
                  patch({ letter: { ...content.letter, greeting: e.target.value } })
                }
                placeholder="Dear John,"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Body paragraphs</span>
              <span className="block text-xs text-[var(--muted-foreground)]">
                One paragraph per line block — blank line between paragraphs.
              </span>
              <Textarea
                className="min-h-[200px]"
                value={(content.letter?.paragraphs ?? []).join("\n\n")}
                onChange={(e) =>
                  patch({
                    letter: {
                      ...content.letter,
                      paragraphs: e.target.value
                        .split(/\n\s*\n/)
                        .map((p) => p.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </label>
          </CardContent>
        </Card>
      ) : null}

      {tab === "pricing" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing block</CardTitle>
            <CardDescription>Investment page — confirm totals match your selected hotel option.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Currency</span>
              <Input
                value={content.pricing?.currency ?? "USD"}
                onChange={(e) =>
                  patch({ pricing: { ...content.pricing, currency: e.target.value } })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Pax</span>
              <Input
                type="number"
                min={1}
                value={content.pricing?.pax ?? ""}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...content.pricing,
                      currency: content.pricing?.currency ?? "USD",
                      pax: Number(e.target.value) || undefined,
                    },
                  })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Per person</span>
              <Input
                type="number"
                value={content.pricing?.per_person ?? ""}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...content.pricing,
                      currency: content.pricing?.currency ?? "USD",
                      per_person: Number(e.target.value) || undefined,
                    },
                  })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Group total</span>
              <Input
                type="number"
                value={content.pricing?.total ?? ""}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...content.pricing,
                      currency: content.pricing?.currency ?? "USD",
                      total: Number(e.target.value) || undefined,
                    },
                  })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Pricing note</span>
              <Textarea
                rows={2}
                value={content.pricing?.note ?? ""}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...content.pricing,
                      currency: content.pricing?.currency ?? "USD",
                      note: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Inclusions</span>
              <span className="block text-xs text-[var(--muted-foreground)]">One item per line</span>
              <Textarea
                rows={6}
                value={listToLines(content.pricing?.inclusions)}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...content.pricing,
                      currency: content.pricing?.currency ?? "USD",
                      inclusions: linesToList(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Exclusions note</span>
              <Textarea
                rows={2}
                value={content.pricing?.exclusions ?? ""}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...content.pricing,
                      currency: content.pricing?.currency ?? "USD",
                      exclusions: e.target.value,
                    },
                  })
                }
              />
            </label>
          </CardContent>
        </Card>
      ) : null}

      {tab === "days" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const days = [...(content.days ?? [])];
                const nextDay = (days[days.length - 1]?.day ?? 0) + 1;
                days.push({
                  day: nextDay,
                  title: `Day ${nextDay}`,
                  route: `Day ${nextDay}`,
                  description: "",
                  activities: [],
                  overnight: "TBD overnight — assign in Ops",
                });
                patch({ days });
              }}
            >
              Add day
            </Button>
          </div>
          {(content.days ?? []).map((day, i) => (
            <Card key={`${day.day}-${i}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="text-base">
                  Day {day.day}
                  {day.route ? ` · ${day.route}` : ""}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i === 0}
                    onClick={() => {
                      const days = [...(content.days ?? [])];
                      if (i <= 0) return;
                      [days[i - 1], days[i]] = [days[i]!, days[i - 1]!];
                      patch({
                        days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
                      });
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i >= (content.days?.length ?? 0) - 1}
                    onClick={() => {
                      const days = [...(content.days ?? [])];
                      if (i >= days.length - 1) return;
                      [days[i], days[i + 1]] = [days[i + 1]!, days[i]!];
                      patch({
                        days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
                      });
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      const days = (content.days ?? [])
                        .filter((_, idx) => idx !== i)
                        .map((d, idx) => ({ ...d, day: idx + 1 }));
                      patch({ days });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Route headline</span>
                  <Input
                    value={day.route ?? ""}
                    onChange={(e) => patchDay(i, { route: e.target.value, title: e.target.value })}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Description (italic closing line on PDF)</span>
                  <Textarea
                    rows={3}
                    value={day.description ?? ""}
                    onChange={(e) => patchDay(i, { description: e.target.value })}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Activities</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">One per line</span>
                  <Textarea
                    rows={5}
                    value={listToLines(day.activities)}
                    onChange={(e) => patchDay(i, { activities: linesToList(e.target.value) })}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Overnight</span>
                    <Input
                      value={day.overnight ?? ""}
                      onChange={(e) => patchDay(i, { overnight: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Meals</span>
                    <Input
                      value={day.meals ?? ""}
                      onChange={(e) => patchDay(i, { meals: e.target.value })}
                      placeholder="B / L / D"
                    />
                  </label>
                </div>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Photo notes (optional)</span>
                  <Input
                    value={day.photo_notes ?? ""}
                    onChange={(e) => patchDay(i, { photo_notes: e.target.value })}
                  />
                </label>
              </CardContent>
            </Card>
          ))}
          {!content.days?.length ? (
            <p className="text-sm text-[var(--muted-foreground)]">No day pages in this draft.</p>
          ) : null}
        </div>
      ) : null}

      {tab === "reply" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">WhatsApp / email reply</CardTitle>
            <CardDescription>Edit before sending to the client — then copy or tweak again later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              className="min-h-[180px]"
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
            />
            <CopyButton text={replyDraft} label="Copy reply" />
          </CardContent>
        </Card>
      ) : null}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/95 p-4 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" disabled={saving} onClick={onBack}>
          ← Back to hotel options
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => onSave("editor")}>
            {saving ? "Saving…" : "Save & open full editor"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => onSave("preview")}>
            {saving ? "Saving…" : "Save & preview PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
