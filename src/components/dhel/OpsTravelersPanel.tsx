"use client";

import Link from "next/link";
import { IdCard, Trash2, User } from "lucide-react";
import {
  addTraveler,
  deleteTraveler,
  seedTravelersFromPax,
  updateTraveler,
} from "@/app/actions/ops";
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
import { cn } from "@/lib/utils";
import type { TripFlight, TripTraveler } from "@/lib/types";

const fieldControl = cn(
  "flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-1",
);

export function OpsTravelersPanel({
  itineraryId,
  travelers,
  expectedPax,
}: {
  itineraryId: string;
  travelers: TripTraveler[];
  expectedPax: number;
}) {
  const count = travelers.length;
  const shortfall = Math.max(0, expectedPax - count);
  const complete = expectedPax > 0 && count >= expectedPax;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Travelers & SDF</h2>
          <p className="text-xs text-muted-foreground">
            One card per guest · passport / SDF
          </p>
        </div>
        <Badge variant={complete ? "default" : "secondary"} className="shrink-0">
          {count}/{expectedPax || "?"}
        </Badge>
      </div>

      {shortfall > 0 ? (
        <form action={seedTravelersFromPax}>
          <input type="hidden" name="itinerary_id" value={itineraryId} />
          <input type="hidden" name="pax" value={expectedPax} />
          <Button type="submit" variant="outline" size="sm">
            Create {shortfall} empty slot{shortfall === 1 ? "" : "s"} for {expectedPax} pax
          </Button>
        </form>
      ) : null}

      {count === 0 ? (
        <EmptyState
          title="No travelers yet"
          description="Add below or create slots from pax count."
          className="py-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {travelers.map((t, i) => (
            <Card
              key={t.id}
              className="flex aspect-[4/5] min-h-0 flex-col overflow-hidden shadow-sm"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
                <div className="min-w-0 space-y-0.5">
                  <CardTitle className="flex items-center gap-1.5 truncate text-sm">
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">Guest {i + 1}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-[11px]">
                    <IdCard className="h-3 w-3" />
                    {t.sdf_category || "other"}
                    {t.sdf_paid ? " · paid" : ""}
                  </CardDescription>
                </div>
                <Badge
                  variant={t.sdf_paid ? "default" : "outline"}
                  className="shrink-0 px-1.5 py-0 text-[10px]"
                >
                  {t.sdf_amount != null ? Number(t.sdf_amount).toLocaleString() : "SDF"}
                </Badge>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 pt-0">
                <form action={updateTraveler} className="flex h-full flex-col gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="itinerary_id" value={itineraryId} />
                  <input type="hidden" name="id_type" value={t.id_type || "passport"} />

                  <div className="space-y-1">
                    <Label className="text-xs">Full name</Label>
                    <Input
                      className="h-8 px-2.5 text-xs"
                      name="name"
                      defaultValue={t.name}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nationality</Label>
                      <Input
                        className="h-8 px-2.5 text-xs"
                        name="nationality"
                        defaultValue={t.nationality ?? ""}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Passport / ID</Label>
                      <Input
                        className="h-8 px-2.5 text-xs"
                        name="id_number"
                        defaultValue={t.id_number ?? ""}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SDF category</Label>
                      <select
                        className={fieldControl}
                        name="sdf_category"
                        defaultValue={t.sdf_category || "other"}
                      >
                        <option value="other">International</option>
                        <option value="indian">Indian</option>
                        <option value="saarc">SAARC</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SDF amount</Label>
                      <Input
                        className="h-8 px-2.5 text-xs"
                        name="sdf_amount"
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={t.sdf_amount ?? ""}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" name="sdf_paid" defaultChecked={t.sdf_paid} />
                    SDF paid
                  </label>
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    Save
                  </Button>
                </form>
                <form action={deleteTraveler} className="mt-2">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="itinerary_id" value={itineraryId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Add traveler</CardTitle>
          <CardDescription className="text-xs">Extra guest beyond seeded slots</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form action={addTraveler} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="itinerary_id" value={itineraryId} />
            <input type="hidden" name="id_type" value="passport" />
            <div className="space-y-1">
              <Label className="text-xs">Full name</Label>
              <Input className="h-8 px-2.5 text-xs" name="name" placeholder="Mr John Smith" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nationality</Label>
              <Input className="h-8 px-2.5 text-xs" name="nationality" placeholder="Australian" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Passport / voter ID</Label>
              <Input className="h-8 px-2.5 text-xs" name="id_number" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SDF category</Label>
              <select className={fieldControl} name="sdf_category" defaultValue="other">
                <option value="other">International</option>
                <option value="indian">Indian</option>
                <option value="saarc">SAARC</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SDF amount</Label>
              <Input className="h-8 px-2.5 text-xs" name="sdf_amount" type="number" step="0.01" min={0} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-1 text-xs text-muted-foreground">
                <input type="checkbox" name="sdf_paid" />
                Already paid
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                Add traveler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Link href={`/itineraries/${itineraryId}?tab=flights`} className="underline-offset-2 hover:underline">
          Flights →
        </Link>
        {" · "}
        <Link
          href={`/itineraries/${itineraryId}?tab=narrative`}
          className="underline-offset-2 hover:underline"
        >
          Edit pax on Narrative
        </Link>
      </p>
    </div>
  );
}

export function OpsFlightsPanel({
  itineraryId,
  flights,
}: {
  itineraryId: string;
  flights: TripFlight[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Flights</h2>
        <p className="text-xs text-muted-foreground">
          PNR and ticket notes for the desk
          {flights.length ? ` · ${flights.length} row(s)` : ""}
        </p>
      </div>
      <Card className="aspect-[16/10] max-w-xl shadow-sm sm:aspect-[2/1]">
        <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">Flight editor next</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            <code className="text-[11px]">trip_flights</code> is live. UI for PNR rows ships next.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href={`/itineraries/${itineraryId}?tab=travelers`}>← Travelers</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
