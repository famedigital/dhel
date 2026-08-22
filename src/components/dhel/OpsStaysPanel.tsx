"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarRange,
  ExternalLink,
  MapPin,
  Moon,
  Trash2,
} from "lucide-react";
import { addStay, deleteStay, updateStayVoucher } from "@/app/actions/ops";
import { FileAttachField } from "@/components/media/FileAttachField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cityMatches, staySlotsFromDays, type OvernightStaySlot } from "@/lib/catalog/stay-plan";
import { cn } from "@/lib/utils";
import type { DayContent, Hotel, ItineraryStay, Room } from "@/lib/types";

const fieldControl = cn(
  "flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
);

function StayAssignForm({
  itineraryId,
  slot,
  hotels,
  rooms,
}: {
  itineraryId: string;
  slot: OvernightStaySlot;
  hotels: Hotel[];
  rooms: Room[];
}) {
  const [hotelId, setHotelId] = useState("");
  const [voucherUrl, setVoucherUrl] = useState<string | undefined>();
  const cityHotels = hotels.filter((h) => h.city && cityMatches(h.city, slot.city));
  const pool = cityHotels.length ? cityHotels : hotels;
  const hotelRooms = rooms.filter((r) => !hotelId || r.hotel_id === hotelId);
  const uid = `${slot.city}-${slot.dayFrom}`;

  return (
    <form action={addStay} className="flex h-full flex-col gap-2.5">
      <input type="hidden" name="itinerary_id" value={itineraryId} />
      <input type="hidden" name="day_from" value={slot.dayFrom} />
      <input type="hidden" name="day_to" value={slot.dayTo} />
      <input type="hidden" name="notes" value={`Narrative: ${slot.city} · ${slot.nights}N`} />
      <input type="hidden" name="voucher_url" value={voucherUrl ?? ""} />

      <div className="space-y-1">
        <Label htmlFor={`hotel-${uid}`} className="text-xs">
          Hotel
        </Label>
        <select
          id={`hotel-${uid}`}
          className={fieldControl}
          name="hotel_id"
          required
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
        >
          <option value="" disabled>
            Select hotel
          </option>
          {pool.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
              {h.city ? ` · ${h.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`room-${uid}`} className="text-xs">
            Room
          </Label>
          <select id={`room-${uid}`} className={fieldControl} name="room_id" defaultValue="">
            <option value="">Later</option>
            {hotelRooms.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.room_number} · {r.room_type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`rate-${uid}`} className="text-xs">
            Rate
          </Label>
          <Input
            id={`rate-${uid}`}
            className="h-8 px-2.5 text-xs"
            name="rate"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`checkin-${uid}`} className="text-xs">
            Check-in
          </Label>
          <Input id={`checkin-${uid}`} className="h-8 px-2.5 text-xs" name="check_in" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`checkout-${uid}`} className="text-xs">
            Check-out
          </Label>
          <Input id={`checkout-${uid}`} className="h-8 px-2.5 text-xs" name="check_out" type="date" />
        </div>
      </div>

      <input type="hidden" name="currency" value="USD" />

      <FileAttachField
        label="Voucher"
        hint="PDF / image / doc"
        folder="vouchers"
        value={voucherUrl}
        onChange={(url) => setVoucherUrl(url)}
      />

      <Button type="submit" size="sm" className="mt-auto w-full">
        Assign stay
      </Button>
    </form>
  );
}

function AssignedStayBody({
  stay,
  itineraryId,
  hotels,
  rooms,
}: {
  stay: ItineraryStay;
  itineraryId: string;
  hotels: Hotel[];
  rooms: Room[];
}) {
  const hotel = stay.hotels || hotels.find((h) => h.id === stay.hotel_id);
  const room = stay.rooms || rooms.find((r) => r.id === stay.room_id);
  const [url, setUrl] = useState(stay.voucher_url ?? undefined);

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="rounded-md border border-border bg-muted/40 px-2.5 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{hotel?.name || "Hotel"}</span>
            </p>
            {room ? (
              <p className="mt-0.5 pl-5 text-xs text-muted-foreground">Room #{room.room_number}</p>
            ) : (
              <p className="mt-0.5 pl-5 text-xs text-muted-foreground">Room unassigned</p>
            )}
          </div>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <div>
            <dt className="text-muted-foreground">In</dt>
            <dd className="font-medium">{stay.check_in || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Out</dt>
            <dd className="font-medium">{stay.check_out || "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Rate</dt>
            <dd className="font-medium">
              {stay.rate != null ? `${stay.currency} ${Number(stay.rate).toLocaleString()}` : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <form action={updateStayVoucher} className="space-y-2">
        <input type="hidden" name="id" value={stay.id} />
        <input type="hidden" name="itinerary_id" value={itineraryId} />
        <input type="hidden" name="voucher_url" value={url ?? ""} />
        <FileAttachField
          label="Voucher"
          folder="vouchers"
          value={url}
          onChange={(next) => setUrl(next)}
        />
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Save voucher
        </Button>
      </form>

      <form action={deleteStay} className="mt-auto">
        <input type="hidden" name="id" value={stay.id} />
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
    </div>
  );
}

export function OpsStaysPanel({
  itineraryId,
  days,
  stays,
  hotels,
  rooms,
}: {
  itineraryId: string;
  days: DayContent[];
  stays: ItineraryStay[];
  hotels: Hotel[];
  rooms: Room[];
}) {
  const slots = useMemo(() => staySlotsFromDays(days), [days]);

  function stayForSlot(slot: OvernightStaySlot) {
    return stays.find(
      (s) =>
        s.day_from === slot.dayFrom ||
        (s.day_from != null &&
          s.day_to != null &&
          s.day_from <= slot.dayFrom &&
          s.day_to >= slot.dayTo) ||
        (s.notes && s.notes.toLowerCase().includes(slot.city.toLowerCase())),
    );
  }

  const assignedCount = slots.filter((s) => stayForSlot(s)).length;
  const complete = slots.length > 0 && assignedCount === slots.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Overnight stays</h2>
          <p className="text-xs text-muted-foreground">
            From narrative cities · hotel, room, voucher per stop
          </p>
        </div>
        {slots.length > 0 ? (
          <Badge variant={complete ? "default" : "secondary"} className="shrink-0">
            {assignedCount}/{slots.length}
          </Badge>
        ) : null}
      </div>

      {!slots.length ? (
        <EmptyState
          title="No overnight cities yet"
          description="Set Overnight or route cities on Narrative → Days."
          className="py-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => {
            const existing = stayForSlot(slot);
            const dayLabel =
              slot.dayTo !== slot.dayFrom
                ? `D${slot.dayFrom}–D${slot.dayTo}`
                : `D${slot.dayFrom}`;

            return (
              <Card
                key={`${slot.city}-${slot.dayFrom}`}
                className="flex aspect-[4/5] min-h-0 flex-col overflow-hidden shadow-sm"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
                  <div className="min-w-0 space-y-0.5">
                    <CardTitle className="flex items-center gap-1.5 truncate text-sm">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{slot.city}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-0.5">
                        <Moon className="h-3 w-3" />
                        {slot.nights}N
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <CalendarRange className="h-3 w-3" />
                        {dayLabel}
                      </span>
                    </CardDescription>
                  </div>
                  {existing ? (
                    <Badge variant="default" className="shrink-0 px-1.5 py-0 text-[10px]">
                      Done
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                      Open
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 pt-0">
                  {existing ? (
                    <AssignedStayBody
                      stay={existing}
                      itineraryId={itineraryId}
                      hotels={hotels}
                      rooms={rooms}
                    />
                  ) : (
                    <StayAssignForm
                      itineraryId={itineraryId}
                      slot={slot}
                      hotels={hotels}
                      rooms={rooms}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {stays.length > 0 ? (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">All assignments</CardTitle>
            <CardDescription className="text-xs">Every stay on this trip</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs">Hotel</TableHead>
                  <TableHead className="h-9 text-xs">Days</TableHead>
                  <TableHead className="h-9 text-xs">Voucher</TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stays.map((s) => {
                  const hotel = s.hotels || hotels.find((h) => h.id === s.hotel_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="py-2 pl-4">
                        <div className="text-sm font-medium">{hotel?.name || "—"}</div>
                        {hotel?.city ? (
                          <div className="text-[11px] text-muted-foreground">{hotel.city}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {s.day_from != null
                          ? `D${s.day_from}${s.day_to != null ? `–D${s.day_to}` : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        {s.voucher_url ? (
                          <a
                            href={s.voucher_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 pr-4 text-right">
                        <form action={deleteStay} className="inline">
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="itinerary_id" value={itineraryId} />
                          <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs">
                            Remove
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end border-t border-border py-2 text-[11px] text-muted-foreground">
            {stays.length} stay{stays.length === 1 ? "" : "s"}
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
