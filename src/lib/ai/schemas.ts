import { z } from "zod";

export const briefIntentSchema = z.object({
  pax: z.number().int().min(1).max(30),
  adults: z.number().int().min(1).max(30),
  children: z.number().int().min(0).max(20).default(0),
  days: z.number().int().min(3).max(21),
  nationalities: z.array(z.string()).min(1),
  entry_point: z.string(),
  budget_tier: z.enum(["economy", "mid", "comfort", "luxury", "unknown"]),
  currency: z.enum(["USD", "INR", "BTN"]).default("USD"),
  meal_plan: z.enum(["MAP", "BB", "CP", "EP"]).optional(),
  hotel_star_rating: z.number().int().min(2).max(5).optional(),
  language: z.enum(["en", "zh"]).default("en"),
  travel_dates: z.string().optional(),
  client_name: z.string().optional(),
});

export type BriefIntentOutput = z.infer<typeof briefIntentSchema>;

export const itineraryContentSchema = z.object({
  eyebrow: z.string().optional(),
  trip_title: z.string().optional(),
  prepared_for: z.string().optional(),
  departing_from: z.string().optional(),
  gateway: z.string().optional(),
  group: z.string().optional(),
  travel_dates: z.string().optional(),
  vehicle: z.string().optional(),
  guide: z.string().optional(),
  letter: z
    .object({
      date: z.string().optional(),
      greeting: z.string().optional(),
      paragraphs: z.array(z.string()).optional(),
    })
    .optional(),
  pricing: z
    .object({
      currency: z.string(),
      total: z.number().optional(),
      per_person: z.number().optional(),
      pax: z.number().optional(),
      note: z.string().optional(),
      inclusions: z.array(z.string()).optional(),
      exclusions: z.string().optional(),
      flight_extra_note: z.string().optional(),
    })
    .optional(),
  flights: z
    .object({
      summary: z.string().optional(),
      legs: z
        .array(
          z.object({
            direction: z.enum(["inbound", "outbound", "other"]),
            date: z.string().optional(),
            airline: z.string().optional(),
            flight_number: z.string().optional(),
            from: z.string().optional(),
            to: z.string().optional(),
            depart: z.string().optional(),
            arrive: z.string().optional(),
            notes: z.string().optional(),
          }),
        )
        .optional(),
      booking_notes: z.array(z.string()).optional(),
    })
    .optional(),
  days: z
    .array(
      z.object({
        day: z.number(),
        title: z.string(),
        route: z.string(),
        description: z.string(),
        activities: z.array(z.string()),
        overnight: z.string().optional(),
        meals: z.string().optional(),
        image: z.string().optional(),
        journal: z
          .array(z.object({ heading: z.string(), text: z.string() }))
          .optional(),
      }),
    )
    .optional(),
  closing: z
    .object({
      includes_fit: z.array(z.string()).optional(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
});
