"use client";

import { Building2, Trash2 } from "lucide-react";
import {
  deleteHotel,
  deleteRoom,
  importCatalogHotels,
  saveHotel,
  saveRoom,
  seedAgencyResources,
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
import type { Hotel, Room } from "@/lib/types";

export function HotelsRosterPanel({
  hotels,
  rooms,
}: {
  hotels: Hotel[];
  rooms: Room[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Agency hotels</h2>
          <p className="text-xs text-muted-foreground">
            Same roster trip Stays uses for select / assign
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{hotels.length} hotels</Badge>
          <form action={importCatalogHotels}>
            <Button type="submit" variant="outline" size="sm">
              Import from catalog
            </Button>
          </form>
          <form action={seedAgencyResources}>
            <Button type="submit" variant="ghost" size="sm">
              Seed sample
            </Button>
          </form>
        </div>
      </div>

      {hotels.length === 0 ? (
        <EmptyState
          title="No hotels in roster"
          description="Add a hotel below, import from the master catalog, or seed a sample."
          className="py-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {hotels.map((h) => {
            const hotelRooms = rooms.filter((r) => r.hotel_id === h.id);
            return (
              <Card key={h.id} className="flex min-h-0 flex-col overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
                  <CardTitle className="flex items-center gap-1.5 truncate text-sm">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{h.name}</span>
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                    {h.active ? "active" : "off"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2.5 p-3 pt-0">
                  <form action={saveHotel} className="grid gap-2">
                    <input type="hidden" name="id" value={h.id} />
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input className="h-8 px-2.5 text-xs" name="name" defaultValue={h.name} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">City</Label>
                        <Input className="h-8 px-2.5 text-xs" name="city" defaultValue={h.city || ""} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input className="h-8 px-2.5 text-xs" name="phone" defaultValue={h.phone || ""} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input className="h-8 px-2.5 text-xs" name="email" defaultValue={h.email || ""} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Input className="h-8 px-2.5 text-xs" name="notes" defaultValue={h.notes || ""} />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" name="active" value="1" defaultChecked={h.active} />
                      Active (show in trip select)
                    </label>
                    <Button type="submit" size="sm" variant="outline" className="w-full">
                      Save
                    </Button>
                  </form>

                  <div className="rounded-md border border-border bg-muted/40 p-2">
                    <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                      Rooms ({hotelRooms.length})
                    </p>
                    <ul className="mb-2 space-y-1">
                      {hotelRooms.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span>
                            #{r.room_number} · {r.room_type}
                          </span>
                          <form action={deleteRoom}>
                            <input type="hidden" name="id" value={r.id} />
                            <Button type="submit" variant="ghost" size="sm" className="h-6 px-1.5">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                    <form action={saveRoom} className="grid grid-cols-2 gap-1.5">
                      <input type="hidden" name="hotel_id" value={h.id} />
                      <Input
                        className="h-7 px-2 text-xs"
                        name="room_number"
                        placeholder="#"
                        required
                      />
                      <Input
                        className="h-7 px-2 text-xs"
                        name="room_type"
                        placeholder="Type"
                        defaultValue="Standard"
                      />
                      <Button type="submit" size="sm" className="col-span-2 h-7">
                        Add room
                      </Button>
                    </form>
                  </div>

                  <form action={deleteHotel} className="mt-auto">
                    <input type="hidden" name="id" value={h.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete hotel
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
          <CardTitle className="text-sm">Add hotel</CardTitle>
          <CardDescription className="text-xs">Appears in trip Stays hotel select</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form action={saveHotel} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input className="h-8 px-2.5 text-xs" name="name" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City / dzongkhag</Label>
              <Input className="h-8 px-2.5 text-xs" name="city" placeholder="Thimphu" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 px-2.5 text-xs" name="phone" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input className="h-8 px-2.5 text-xs" name="email" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input className="h-8 px-2.5 text-xs" name="notes" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm">
                Add hotel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
