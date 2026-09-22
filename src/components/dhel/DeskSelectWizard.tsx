"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { QUESTION_BANK } from "@/lib/desk/question-bank";
import {
  briefIntentFromWizard,
  parseCostOptionNumber,
  type WizardBasics,
  type WizardStaff,
} from "@/lib/desk/wizard-intent";
import { SUGGESTED_TRIP_COSTS, type TripCostLines } from "@/lib/catalog/trip-costs";
import type { BriefIntent, CityHotelChoices } from "@/lib/catalog";
import {
  RouteHotelPicker,
  routeHotelsComplete,
  type HotelSelection,
  type LiveHotelHint,
} from "@/components/dhel/RouteHotelPicker";
import {
  getCatalogGuideOptions,
  getCatalogVehicleOptions,
} from "@/lib/inventory/staff-options";
import { supplyKindLabel } from "@/lib/inventory/supply-kind";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "route", label: "Route" },
  { id: "stays", label: "Stays" },
  { id: "staff", label: "Staff" },
  { id: "cost", label: "Cost" },
  { id: "packs", label: "Packs" },
] as const;

type Audience = "agent" | "traveler";

export type DeskSelectWizardProps = {
  audience?: Audience;
  hotelChoices: CityHotelChoices[];
  hotelSelections: HotelSelection[];
  onHotelSelectionsChange: (next: HotelSelection[]) => void;
  intent: BriefIntent | null;
  onIntentChange: (intent: BriefIntent) => void;
  loading?: boolean;
  generating?: boolean;
  error?: string | null;
  runningTotalHint?: string | null;
  availabilityHints?: string[];
  liveByHotelId?: Record<string, LiveHotelHint>;
  /** Load hotel choices after basics+route */
  onLoadHotels: (intent: BriefIntent) => Promise<void>;
  /** Build template itinerary (no AI) */
  onBuild: (intent: BriefIntent, hotels: HotelSelection[]) => Promise<void>;
  /** Optional AI polish after build */
  onPolish?: () => Promise<void>;
  onOpenPaste?: () => void;
};

function OptionGrid({
  options,
  value,
  onPick,
}: {
  options: string[];
  value?: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <Button
          key={opt}
          type="button"
          variant={value === opt ? "default" : "outline"}
          className="h-auto justify-start whitespace-normal py-3 text-left"
          onClick={() => onPick(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}

export function DeskSelectWizard({
  audience = "agent",
  hotelChoices,
  hotelSelections,
  onHotelSelectionsChange,
  intent,
  onIntentChange,
  loading,
  generating,
  error,
  runningTotalHint,
  availabilityHints,
  liveByHotelId = {},
  onLoadHotels,
  onBuild,
  onPolish,
  onOpenPaste,
}: DeskSelectWizardProps) {
  const isB2c = audience === "traveler";
  const guideOptions = useMemo(() => getCatalogGuideOptions(), []);
  const vehicleOptions = useMemo(() => getCatalogVehicleOptions(), []);
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState<WizardBasics>({
    client_name: "",
    travel_dates: "",
    pax_label: QUESTION_BANK.pax.options[0]!,
    nationality: QUESTION_BANK.nationalities.options[0]!,
    entry_point: QUESTION_BANK.entry_point.options[0]!,
    language: "en",
  });
  const [stayPlanLabel, setStayPlanLabel] = useState(QUESTION_BANK.stay_plan.options[0]!);
  const [budgetLabel, setBudgetLabel] = useState(QUESTION_BANK.budget_tier.options[1]!);
  const [guideId, setGuideId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(vehicleOptions[0]?.id ?? null);
  const [costs, setCosts] = useState<Partial<TripCostLines>>({
    room_avg_per_night: SUGGESTED_TRIP_COSTS.room_avg_per_night,
    guide_per_day: SUGGESTED_TRIP_COSTS.guide_per_day,
    car_per_day: SUGGESTED_TRIP_COSTS.car_per_day,
    transfer_per_trip: SUGGESTED_TRIP_COSTS.transfer_per_trip,
    include_sdf: true,
  });

  const selectedGuide = guideOptions.find((g) => g.id === guideId);
  const selectedVehicle = vehicleOptions.find((v) => v.id === vehicleId);
  const staff: WizardStaff = {
    guide_label: selectedGuide?.name ?? "Licensed English guide (assign in Ops)",
    vehicle_label: selectedVehicle?.name ?? "SUV / Santa Fe (chauffeur)",
  };

  const routeComplete = routeHotelsComplete(hotelChoices, hotelSelections);

  const draftIntent = useMemo(
    () =>
      briefIntentFromWizard({
        basics,
        stayPlanLabel,
        budgetLabel,
        tripCosts: costs,
        costsConfirmed: step >= 4,
      }),
    [basics, stayPlanLabel, budgetLabel, costs, step],
  );

  async function goNext() {
    if (step === 0) {
      if (!basics.travel_dates.trim() && !isB2c) {
        /* dates preferred but allow flexible */
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const nextIntent = briefIntentFromWizard({
        basics,
        stayPlanLabel,
        budgetLabel,
        tripCosts: costs,
        costsConfirmed: false,
      });
      onIntentChange(nextIntent);
      await onLoadHotels(nextIntent);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!routeComplete) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    if (step === 4) {
      const nextIntent = briefIntentFromWizard({
        basics,
        stayPlanLabel,
        budgetLabel,
        tripCosts: {
          ...costs,
          confirmed: true,
        },
        costsConfirmed: true,
      });
      // Encode staff picks into brief for ops notes
      nextIntent.raw_brief = `${nextIntent.raw_brief}. Guide: ${staff.guide_label}. Vehicle: ${staff.vehicle_label}.`;
      onIntentChange(nextIntent);
      setStep(5);
      return;
    }
  }

  async function buildPacks() {
    const nextIntent =
      intent ??
      briefIntentFromWizard({
        basics,
        stayPlanLabel,
        budgetLabel,
        tripCosts: { ...costs, confirmed: true },
        costsConfirmed: true,
      });
    nextIntent.raw_brief = `${nextIntent.raw_brief}. Guide: ${staff.guide_label}. Vehicle: ${staff.vehicle_label}.`;
    onIntentChange(nextIntent);
    await onBuild(nextIntent, hotelSelections);
  }

  const busy = Boolean(loading || generating);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {isB2c ? "Plan your trip" : "Luma Trips desk"}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
          {isB2c ? "Build your Bhutan itinerary" : "Create a trip — select, then Next"}
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted-foreground)]">
          Live catalog hotels and locked costs. AI is optional polish after the draft is ready.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            disabled={i > step}
            onClick={() => i <= step && setStep(i)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              i === step
                ? "border-foreground bg-foreground text-background"
                : i < step
                  ? "border-border text-foreground"
                  : "border-border/60 text-muted-foreground opacity-60",
            )}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0 space-y-4 rounded-2xl border border-border bg-card/40 p-4 sm:p-6">
          {step === 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Trip basics</h2>
              {!isB2c ? (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Client name</label>
                  <Input
                    value={basics.client_name}
                    onChange={(e) => setBasics({ ...basics, client_name: e.target.value })}
                    placeholder="Guest or group name"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Travel dates</label>
                <Input
                  value={basics.travel_dates}
                  onChange={(e) => setBasics({ ...basics, travel_dates: e.target.value })}
                  placeholder="e.g. 12–18 Oct 2026"
                />
                <div className="pt-1">
                  <OptionGrid
                    options={QUESTION_BANK.travel_dates.options}
                    value={basics.travel_dates}
                    onPick={(v) => setBasics({ ...basics, travel_dates: v })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{QUESTION_BANK.pax.prompt}</label>
                <OptionGrid
                  options={QUESTION_BANK.pax.options}
                  value={basics.pax_label}
                  onPick={(v) => setBasics({ ...basics, pax_label: v })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {QUESTION_BANK.nationalities.prompt}
                </label>
                <OptionGrid
                  options={QUESTION_BANK.nationalities.options}
                  value={basics.nationality}
                  onPick={(v) => setBasics({ ...basics, nationality: v })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {QUESTION_BANK.entry_point.prompt}
                </label>
                <OptionGrid
                  options={QUESTION_BANK.entry_point.options}
                  value={basics.entry_point}
                  onPick={(v) => setBasics({ ...basics, entry_point: v })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Proposal language</label>
                <OptionGrid
                  options={QUESTION_BANK.language.options}
                  value={basics.language === "zh" ? "Chinese (中文)" : "English"}
                  onPick={(v) =>
                    setBasics({
                      ...basics,
                      language: /chinese|中文/i.test(v) ? "zh" : "en",
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Route template</h2>
              <OptionGrid
                options={QUESTION_BANK.stay_plan.options}
                value={stayPlanLabel}
                onPick={setStayPlanLabel}
              />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {QUESTION_BANK.budget_tier.prompt}
                </label>
                <OptionGrid
                  options={QUESTION_BANK.budget_tier.options}
                  value={budgetLabel}
                  onPick={setBudgetLabel}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Stays</h2>
              {hotelChoices.length ? (
                <RouteHotelPicker
                  choices={hotelChoices}
                  selections={hotelSelections}
                  onChange={onHotelSelectionsChange}
                  liveByHotelId={liveByHotelId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {busy ? "Loading hotels…" : "No hotel choices yet — go back and load route."}
                </p>
              )}
              {availabilityHints?.length ? (
                <Alert>{availabilityHints.join(" · ")}</Alert>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Staff</h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Live inventory</span> = linked guide /
                Chhu fleet calendar.{" "}
                <span className="font-medium text-foreground">Catalog</span> = select a name or hire
                category (confirm offline).
              </p>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Guide</label>
                <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                  {guideOptions.slice(0, 40).map((g) => (
                    <Button
                      key={g.id}
                      type="button"
                      variant={guideId === g.id ? "default" : "outline"}
                      className="h-auto justify-start whitespace-normal py-3 text-left"
                      onClick={() => {
                        setGuideId(g.id);
                        if (g.day_rate_usd) {
                          setCosts((c) => ({
                            ...c,
                            guide_per_day: Math.round(g.day_rate_usd! * 84),
                          }));
                        }
                      }}
                    >
                      <span className="flex w-full flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{g.name}</span>
                          <Badge variant="outline" className="shrink-0">
                            {supplyKindLabel(g.kind)}
                          </Badge>
                        </span>
                        <span className="text-xs opacity-80">{g.subtitle}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Vehicle</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {vehicleOptions.map((v) => (
                    <Button
                      key={v.id}
                      type="button"
                      variant={vehicleId === v.id ? "default" : "outline"}
                      className="h-auto justify-start whitespace-normal py-3 text-left"
                      onClick={() => {
                        setVehicleId(v.id);
                        if (v.day_rate_usd) {
                          setCosts((c) => ({
                            ...c,
                            car_per_day: Math.round(v.day_rate_usd! * 84),
                          }));
                        }
                      }}
                    >
                      <span className="flex w-full flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{v.name}</span>
                          <Badge variant="outline" className="shrink-0">
                            {supplyKindLabel(v.kind)}
                          </Badge>
                        </span>
                        <span className="text-xs opacity-80">{v.subtitle}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Cost lines</h2>
              <p className="text-sm text-muted-foreground">
                Ops currency defaults (INR). Confirm before building the draft PDF.
              </p>
              {(
                [
                  ["room_avg", "Room avg / night", "room_avg_per_night"],
                  ["guide_day", "Guide / day", "guide_per_day"],
                  ["car_day", "Car / day", "car_per_day"],
                  ["transfer_trip", "Pickup + drop", "transfer_per_trip"],
                ] as const
              ).map(([bankKey, label, costKey]) => (
                <div key={bankKey} className="space-y-2">
                  <label className="text-sm text-muted-foreground">{label}</label>
                  <OptionGrid
                    options={QUESTION_BANK[bankKey].options}
                    value={String(costs[costKey] ?? "")}
                    onPick={(v) =>
                      setCosts({
                        ...costs,
                        [costKey]: parseCostOptionNumber(
                          v,
                          SUGGESTED_TRIP_COSTS[costKey],
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">SDF</label>
                <OptionGrid
                  options={QUESTION_BANK.sdf.options}
                  value={
                    costs.include_sdf === false
                      ? "No SDF"
                      : "Include SDF (nationality rules)"
                  }
                  onPick={(v) =>
                    setCosts({
                      ...costs,
                      include_sdf: !/no sdf/i.test(v),
                      sdf_per_person_per_day: /100/.test(v) ? 100 : undefined,
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Build packs</h2>
              <p className="text-sm text-muted-foreground">
                Creates a deterministic draft itinerary from your selects. No AI required.
              </p>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                <li>
                  {draftIntent.days} days · {draftIntent.pax} pax ·{" "}
                  {draftIntent.nationalities.join(", ")}
                </li>
                <li>
                  Route:{" "}
                  {draftIntent.stay_plan
                    ?.map((s) => `${s.nights}n ${s.city}`)
                    .join(", ") || stayPlanLabel}
                </li>
                <li>
                  Hotels selected: {hotelSelections.length}/{hotelChoices.length || "—"}
                </li>
                <li>
                  {staff.guide_label} · {staff.vehicle_label}
                </li>
              </ul>
            </div>
          ) : null}

          {error ? <Alert variant="destructive">{error}</Alert> : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {step > 0 ? (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : null}
            {step < 5 ? (
              <Button
                type="button"
                disabled={busy || (step === 2 && !routeComplete)}
                onClick={() => void goNext()}
              >
                {busy && step === 1 ? "Loading hotels…" : "Next"}
              </Button>
            ) : (
              <>
                <Button type="button" disabled={busy || !routeComplete} onClick={() => void buildPacks()}>
                  {generating ? "Building…" : "Build itinerary"}
                </Button>
                {onPolish ? (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => void onPolish()}>
                    Polish prose with AI
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Running quote
          </p>
          <p className="text-lg font-medium">{runningTotalHint || "Complete stays to price"}</p>
          <p className="text-muted-foreground">
            {draftIntent.days} days · SDF{" "}
            {costs.include_sdf === false ? "off" : "on"} ·{" "}
            {basics.nationality}
          </p>
          {onOpenPaste ? (
            <button
              type="button"
              className="text-xs underline-offset-2 hover:underline"
              onClick={onOpenPaste}
            >
              Prefer paste WhatsApp instead?
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
