"use client";

import { useMemo, useState } from "react";
import { MediaField } from "@/components/media/MediaField";
import { MediaGallery } from "@/components/media/MediaGallery";
import {
  DayCellTabs,
  DayCellTabsContent,
} from "@/components/ui/tabs-in-cell-for-navigation";
import {
  MEDIA_LIMITS,
  clampActivityImages,
  clampUrls,
} from "@/lib/media/limits";
import type { DayContent, HotelOptionRow, ItineraryContent } from "@/lib/types";
import { cn } from "@/lib/utils";

function linesToList(text: string): string[] {
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(items?: string[]): string {
  return (items ?? []).join("\n");
}

function asContent(raw: unknown): ItineraryContent {
  if (raw && typeof raw === "object") return clampContentMedia(raw as ItineraryContent);
  return {} as ItineraryContent;
}

function clampContentMedia(content: ItineraryContent): ItineraryContent {
  return {
    ...content,
    hotel_options: content.hotel_options?.map((opt) => ({
      ...opt,
      image_urls: clampUrls(opt.image_urls, MEDIA_LIMITS.hotelOptionImages),
    })),
    days: content.days?.map((day) => ({
      ...day,
      activity_images: clampActivityImages(day.activity_images),
    })),
  };
}

type Tab = "trip" | "letter" | "pricing" | "days";

/**
 * Agent-facing itinerary editor — plain fields, not JSON.
 * Still posts `content_json` for the existing server action.
 */
export function ContentEditor({
  initialJson,
  name = "content_json",
  itineraryId,
}: {
  initialJson: unknown;
  name?: string;
  /** Enables per-day AI assist when set */
  itineraryId?: string;
}) {
  const [content, setContent] = useState<ItineraryContent>(() => asContent(initialJson));
  const [tab, setTab] = useState<Tab>("trip");
  const [dayTab, setDayTab] = useState(() => {
    const first = asContent(initialJson).days?.[0]?.day;
    return first != null ? `day-${first}` : "day-0";
  });
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(asContent(initialJson), null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const dayCount = content.days?.length ?? 0;
  const payload = useMemo(() => JSON.stringify(content), [content]);

  function patch(partial: Partial<ItineraryContent>) {
    setContent((prev) => {
      const next = clampContentMedia({ ...prev, ...partial });
      setJsonDraft(JSON.stringify(next, null, 2));
      setJsonError(null);
      return next;
    });
  }

  function patchDay(index: number, partial: Partial<DayContent>) {
    const days = [...(content.days ?? [])];
    days[index] = {
      ...days[index]!,
      ...partial,
      activity_images: clampActivityImages(
        partial.activity_images !== undefined
          ? partial.activity_images
          : days[index]!.activity_images,
      ),
    };
    patch({ days });
  }

  function patchHotelOption(index: number, partial: Partial<HotelOptionRow>) {
    const hotel_options = [...(content.hotel_options ?? [])];
    const merged = { ...hotel_options[index]!, ...partial };
    hotel_options[index] = {
      ...merged,
      image_urls: clampUrls(merged.image_urls, MEDIA_LIMITS.hotelOptionImages),
    };
    patch({ hotel_options });
  }

  function applyJsonDraft() {
    try {
      const parsed = clampContentMedia(JSON.parse(jsonDraft) as ItineraryContent);
      setContent(parsed);
      setJsonDraft(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setJsonError("That JSON isn’t valid — fix it or close Advanced and keep using the form.");
    }
  }

  function renumberDays(days: DayContent[]): DayContent[] {
    return days.map((d, i) => ({ ...d, day: i + 1 }));
  }

  function addDay() {
    const days = [...(content.days ?? [])];
    const nextNum = days.length + 1;
    days.push({
      day: nextNum,
      title: `Day ${nextNum}`,
      route: "",
      description: "",
      activities: [],
      overnight: "",
      meals: "",
    });
    patch({ days });
    setDayTab(`day-${nextNum}`);
    setTab("days");
  }

  function removeDay(index: number) {
    const days = [...(content.days ?? [])];
    if (days.length <= 1) return;
    days.splice(index, 1);
    const next = renumberDays(days);
    patch({ days: next });
    const focus = next[Math.min(index, next.length - 1)]!;
    setDayTab(`day-${focus.day}`);
  }

  async function assistDay(
    index: number,
    mode: "polish" | "expand_activities" | "shorten" | "custom",
    instruction?: string,
  ) {
    if (!itineraryId) return;
    setAiError(null);
    setAiBusy(`${index}:${mode}`);
    try {
      const res = await fetch("/api/itineraries/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId,
          dayIndex: index,
          mode,
          instruction,
          day: content.days?.[index],
        }),
      });
      const data = (await res.json()) as { day?: DayContent; error?: string };
      if (!res.ok || !data.day) throw new Error(data.error || "AI assist failed");
      patchDay(index, data.day);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI assist failed");
    } finally {
      setAiBusy(null);
    }
  }

  const tabs: Array<[Tab, string]> = [
    ["trip", "Trip & cover"],
    ["letter", "Welcome letter"],
    ["pricing", "Pricing"],
    ["days", `Days (${dayCount})`],
  ];

  return (
    <div className="content-editor space-y-4">
      <input type="hidden" name={name} value={payload} />

      <p className="field-hint" style={{ marginTop: 0 }}>
        Edit in plain English. Guests only see <strong>Guest PDF</strong> — never this screen.
      </p>

      <div className="editor-tabs" role="tablist" aria-label="Narrative sections">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn("editor-tab", tab === id && "is-active")}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "trip" ? (
        <div className="form-stack">
          <div className="form-block">
            <p className="form-block__title">Cover</p>
            <div className="grid-2">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Trip title</label>
                <input
                  className="input"
                  value={content.trip_title ?? ""}
                  onChange={(e) => patch({ trip_title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Prepared for</label>
                <input
                  className="input"
                  value={content.prepared_for ?? ""}
                  onChange={(e) => patch({ prepared_for: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Travel dates</label>
                <input
                  className="input"
                  value={content.travel_dates ?? ""}
                  onChange={(e) => patch({ travel_dates: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Group</label>
                <input
                  className="input"
                  value={content.group ?? ""}
                  onChange={(e) => patch({ group: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Gateway</label>
                <input
                  className="input"
                  value={content.gateway ?? ""}
                  onChange={(e) => patch({ gateway: e.target.value })}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <MediaField
                  label="Cover photo"
                  hint="1 photo — Guest PDF cover hero"
                  folder="covers"
                  value={content.cover_image}
                  onChange={(url) => patch({ cover_image: url })}
                />
              </div>
            </div>
          </div>

          <div className="form-block">
            <p className="form-block__title">Guide & vehicle</p>
            <div className="grid-2">
              <div className="field">
                <label>Guide (cover line)</label>
                <input
                  className="input"
                  value={content.guide ?? ""}
                  onChange={(e) => patch({ guide: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Vehicle (cover line)</label>
                <input
                  className="input"
                  value={content.vehicle_type ?? content.vehicle ?? ""}
                  onChange={(e) => patch({ vehicle_type: e.target.value, vehicle: e.target.value })}
                />
              </div>
              <div className="field">
                <MediaField
                  label="Guide photo"
                  folder="guides"
                  value={content.guide_image}
                  onChange={(url) => patch({ guide_image: url })}
                />
              </div>
              <div className="field">
                <MediaField
                  label="Vehicle photo"
                  folder="vehicles"
                  value={content.vehicle_image}
                  onChange={(url) => patch({ vehicle_image: url })}
                />
              </div>
            </div>
          </div>

          {(content.hotel_options?.length ?? 0) > 0 ? (
            <div className="form-block">
              <p className="form-block__title">Hotel option photos</p>
              <p className="field-hint" style={{ marginBottom: "0.75rem" }}>
                Photos shown on the Guest PDF hotel comparison page.
              </p>
              <div className="form-stack">
                {content.hotel_options!.map((opt, i) => (
                  <div key={opt.id ?? i} className="hotel-option-photos">
                    <p className="hotel-option-photos__name">
                      {opt.label || opt.hotel}
                      {opt.city ? ` · ${opt.city}` : ""}
                      {opt.recommended ? " · recommended" : ""}
                    </p>
                    <MediaGallery
                      label="Hotel photos"
                      hint={`Guest PDF shows up to ${MEDIA_LIMITS.hotelOptionImages}`}
                      folder="hotels"
                      max={MEDIA_LIMITS.hotelOptionImages}
                      values={(opt.image_urls ?? []).map((url) => ({ url }))}
                      onChange={(items) =>
                        patchHotelOption(i, {
                          image_urls: clampUrls(
                            items.map((item) => item.url),
                            MEDIA_LIMITS.hotelOptionImages,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "letter" ? (
        <div className="form-block form-stack">
          <p className="form-block__title">Welcome letter</p>
          <div className="field">
            <label>Date line</label>
            <input
              className="input"
              value={content.letter?.date ?? ""}
              onChange={(e) => patch({ letter: { ...content.letter, date: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>Greeting</label>
            <input
              className="input"
              value={content.letter?.greeting ?? ""}
              onChange={(e) => patch({ letter: { ...content.letter, greeting: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>Letter body</label>
            <p className="field-hint">Blank line between paragraphs.</p>
            <textarea
              className="textarea"
              rows={10}
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
          </div>
        </div>
      ) : null}

      {tab === "pricing" ? (
        <div className="form-block">
          <p className="form-block__title">Pricing</p>
          <div className="grid-2">
            <div className="field">
              <label>Currency</label>
              <input
                className="input"
                value={content.pricing?.currency ?? "USD"}
                onChange={(e) =>
                  patch({ pricing: { ...content.pricing, currency: e.target.value } })
                }
              />
            </div>
            <div className="field">
              <label>Pax</label>
              <input
                className="input"
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
            </div>
            <div className="field">
              <label>Per person</label>
              <input
                className="input"
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
            </div>
            <div className="field">
              <label>Group total</label>
              <input
                className="input"
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
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Inclusions (one per line)</label>
              <textarea
                className="textarea"
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
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Exclusions note</label>
              <textarea
                className="textarea"
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
            </div>
          </div>
        </div>
      ) : null}

      {tab === "days" ? (
        content.days?.length ? (
          <div className="form-stack">
            <div className="split-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={addDay}>
                Add day
              </button>
              {aiError ? <span className="form-error">{aiError}</span> : null}
            </div>

            <DayCellTabs
              days={(content.days ?? []).map((day, i) => ({
                value: `day-${day.day ?? i}`,
                label: `Day ${day.day ?? i + 1}`,
                sublabel: day.route || undefined,
              }))}
              value={
                (content.days ?? []).some(
                  (day, i) => `day-${day.day ?? i}` === dayTab,
                )
                  ? dayTab
                  : `day-${content.days![0]!.day ?? 0}`
              }
              onValueChange={setDayTab}
            >
              {(content.days ?? []).map((day, i) => {
                const value = `day-${day.day ?? i}`;
                const busy = aiBusy?.startsWith(`${i}:`);
                return (
                  <DayCellTabsContent key={value} value={value} className="mt-0">
                    <div className="form-block form-stack">
                      <div className="docs-pack__topline">
                        <p className="form-block__title" style={{ margin: 0 }}>
                          Day {day.day}
                          {day.route ? ` · ${day.route}` : ""}
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={(content.days?.length ?? 0) <= 1}
                          onClick={() => removeDay(i)}
                        >
                          Delete day
                        </button>
                      </div>

                      {itineraryId ? (
                        <div className="ai-assist-bar">
                          <span className="field-hint">AI assist</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={Boolean(busy)}
                            onClick={() => void assistDay(i, "polish")}
                          >
                            {aiBusy === `${i}:polish` ? "…" : "Polish prose"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={Boolean(busy)}
                            onClick={() => void assistDay(i, "expand_activities")}
                          >
                            {aiBusy === `${i}:expand_activities` ? "…" : "Expand activities"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={Boolean(busy)}
                            onClick={() => void assistDay(i, "shorten")}
                          >
                            {aiBusy === `${i}:shorten` ? "…" : "Shorten"}
                          </button>
                        </div>
                      ) : null}

                      <div className="field">
                        <label>Route headline</label>
                        <input
                          className="input"
                          value={day.route ?? ""}
                          onChange={(e) =>
                            patchDay(i, { route: e.target.value, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Description</label>
                        <textarea
                          className="textarea"
                          rows={3}
                          value={day.description ?? ""}
                          onChange={(e) => patchDay(i, { description: e.target.value })}
                        />
                      </div>

                      <div className="form-block form-block--inset">
                        <p className="form-block__title">Activities</p>
                        <p className="field-hint" style={{ marginBottom: "0.5rem" }}>
                          One activity per line — Guest PDF bullets. Use AI “Expand activities” if empty.
                        </p>
                        <textarea
                          className="textarea"
                          rows={5}
                          placeholder={"Border/airport transfer\nCheck-in & rest\nBriefing"}
                          value={listToLines(day.activities)}
                          onChange={(e) =>
                            patchDay(i, { activities: linesToList(e.target.value) })
                          }
                        />
                      </div>

                      <div className="grid-2">
                        <div className="field">
                          <label>Overnight city / hotel line</label>
                          <input
                            className="input"
                            placeholder="Thimphu"
                            value={day.overnight ?? ""}
                            onChange={(e) => patchDay(i, { overnight: e.target.value })}
                          />
                          <p className="field-hint">Drives Stays tab (Paro, Thimphu, Punakha…)</p>
                        </div>
                        <div className="field">
                          <label>Meals</label>
                          <input
                            className="input"
                            value={day.meals ?? ""}
                            onChange={(e) => patchDay(i, { meals: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-block form-block--inset">
                        <p className="form-block__title">Day photos</p>
                        <MediaField
                          label="Day hero"
                          hint="One main photo for this day page"
                          folder="days"
                          value={day.hero_image ?? day.image}
                          onChange={(url) =>
                            patchDay(i, { hero_image: url, image: url })
                          }
                        />
                        <MediaGallery
                          label="Activity / side photos"
                          hint={`A4 layout fits up to ${MEDIA_LIMITS.activityImagesPerDay} beside the hero`}
                          folder="activities"
                          max={MEDIA_LIMITS.activityImagesPerDay}
                          captions
                          values={(day.activity_images ?? []).map((img) => ({
                            url: img.url,
                            caption: img.caption,
                          }))}
                          onChange={(items) =>
                            patchDay(i, {
                              activity_images: clampActivityImages(
                                items.map((item) => ({
                                  url: item.url,
                                  caption: item.caption ?? "",
                                })),
                              ),
                            })
                          }
                        />
                        <div className="field">
                          <label>Photo notes (optional)</label>
                          <textarea
                            className="textarea"
                            rows={3}
                            value={day.photo_notes ?? ""}
                            onChange={(e) =>
                              patchDay(i, { photo_notes: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </DayCellTabsContent>
                );
              })}
            </DayCellTabs>
          </div>
        ) : (
          <div className="form-stack">
            <p className="field-hint">No day pages yet.</p>
            <button type="button" className="btn btn-primary" onClick={addDay}>
              Add Day 1
            </button>
          </div>
        )
      ) : null}

      <details
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="field-hint" style={{ cursor: "pointer" }}>
          Advanced — raw JSON (devs only)
        </summary>
        <div className="field-label-row" style={{ marginTop: "0.75rem" }}>
          <span className="field-hint">Only if you know what you’re doing</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={applyJsonDraft}>
            Apply JSON
          </button>
        </div>
        <textarea
          className="textarea mono"
          rows={12}
          value={jsonDraft}
          onChange={(e) => {
            setJsonDraft(e.target.value);
            setJsonError(null);
          }}
          spellCheck={false}
        />
        {jsonError ? <p className="form-error">{jsonError}</p> : null}
      </details>
    </div>
  );
}
