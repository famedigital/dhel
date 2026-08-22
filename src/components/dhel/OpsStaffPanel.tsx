"use client";

import { Car, Phone, Trash2, UserRound } from "lucide-react";
import { addStaff, deleteStaff } from "@/app/actions/ops";
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
import type { Driver, Guide, ItineraryStaff } from "@/lib/types";

const fieldControl = cn(
  "flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-1",
);

export function OpsStaffPanel({
  itineraryId,
  staff,
  guides,
  drivers,
}: {
  itineraryId: string;
  staff: ItineraryStaff[];
  guides: Guide[];
  drivers: Driver[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Guide & driver</h2>
          <p className="text-xs text-muted-foreground">Live roster for this trip</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {staff.length} assigned
        </Badge>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff assigned"
          description="Assign a guide and driver from your roster."
          className="py-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => {
            const guide = s.guides || guides.find((g) => g.id === s.guide_id);
            const driver = s.drivers || drivers.find((d) => d.id === s.driver_id);
            const person = s.role === "guide" ? guide : driver;
            const isGuide = s.role === "guide";

            return (
              <Card
                key={s.id}
                className="flex aspect-[4/5] min-h-0 flex-col overflow-hidden shadow-sm"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
                  <div className="min-w-0 space-y-0.5">
                    <CardTitle className="flex items-center gap-1.5 truncate text-sm">
                      {isGuide ? (
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{person?.name || "—"}</span>
                    </CardTitle>
                    <CardDescription className="text-[11px] capitalize">{s.role}</CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                    {s.day_from != null
                      ? `D${s.day_from}${s.day_to != null ? `–${s.day_to}` : ""}`
                      : "Full"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3 pt-0">
                  <div className="rounded-md border border-border bg-muted/40 px-2.5 py-2 text-xs">
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {person?.phone || "No phone"}
                    </p>
                    {isGuide && guide?.languages ? (
                      <p className="mt-1.5 text-muted-foreground">{guide.languages}</p>
                    ) : null}
                    {!isGuide && driver ? (
                      <p className="mt-1.5 text-muted-foreground">
                        {[driver.vehicle_type, driver.plate].filter(Boolean).join(" · ") || "—"}
                      </p>
                    ) : null}
                  </div>
                  <form action={deleteStaff} className="mt-auto">
                    <input type="hidden" name="id" value={s.id} />
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
            );
          })}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Assign staff</CardTitle>
          <CardDescription className="text-xs">Pick role, person, and day range</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form action={addStaff} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="itinerary_id" value={itineraryId} />
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <select className={fieldControl} name="role" defaultValue="guide">
                <option value="guide">Guide</option>
                <option value="driver">Driver</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Guide</Label>
              <select className={fieldControl} name="guide_id" defaultValue="">
                <option value="">—</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} · {g.phone || "no phone"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Driver</Label>
              <select className={fieldControl} name="driver_id" defaultValue="">
                <option value="">—</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.vehicle_type || "vehicle"} · {d.plate || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Day from</Label>
              <Input className="h-8 px-2.5 text-xs" name="day_from" type="number" min={1} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Day to</Label>
              <Input className="h-8 px-2.5 text-xs" name="day_to" type="number" min={1} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                Assign
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
