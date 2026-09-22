import { NextResponse } from "next/server";
import { z } from "zod";
import { innoraConnector } from "@/lib/innora/client";

const bodySchema = z.object({
  hotelChoices: z
    .array(
      z.object({
        city: z.string(),
        nights: z.number(),
        hotels: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            pelbu_property_id: z.string().optional().nullable(),
          }),
        ),
      }),
    )
    .optional(),
  travelDates: z.string().optional(),
});

function dateRangeFromTravelDates(travelDates?: string): { checkIn: string; checkOut: string } {
  const iso = travelDates?.match(/(\d{4}-\d{2}-\d{2})/g);
  if (iso && iso.length >= 2) {
    return { checkIn: iso[0]!, checkOut: iso[1]! };
  }
  const start = new Date();
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  return {
    checkIn: start.toISOString().slice(0, 10),
    checkOut: end.toISOString().slice(0, 10),
  };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dates = dateRangeFromTravelDates(parsed.data.travelDates);
  const hints: string[] = [];
  const byProperty: Record<string, { available: number; source: string }> = {};
  const byHotelId: Record<
    string,
    { propertyId: string; available: number; source: "live" | "mock"; label: string }
  > = {};

  for (const city of parsed.data.hotelChoices ?? []) {
    for (const hotel of city.hotels) {
      const propertyId =
        hotel.pelbu_property_id ||
        (hotel.name.toLowerCase().includes("pelbu") ? "pelbu-olakha" : null);
      if (!propertyId) continue;

      const avail = await innoraConnector.getAvailability(propertyId, dates);
      if (!avail) continue;

      const total = avail.rooms.reduce((n, r) => n + r.available, 0);
      byProperty[propertyId] = { available: total, source: avail.source };
      byHotelId[hotel.id] = {
        propertyId,
        available: total,
        source: avail.source,
        label: avail.propertyName,
      };

      if (total <= 0) {
        hints.push(`${avail.propertyName}: no rooms ${dates.checkIn}→${dates.checkOut}`);
      } else if (avail.source === "mock") {
        hints.push(`${hotel.name}: ${total} rooms (Innora mock)`);
      } else {
        hints.push(`${hotel.name}: ${total} rooms live`);
      }
    }
  }

  if (!hints.length) {
    hints.push("No Innora-linked hotels on this route — pick from catalog as usual.");
  }

  return NextResponse.json({
    dates,
    hints,
    byProperty,
    byHotelId,
  });
}
