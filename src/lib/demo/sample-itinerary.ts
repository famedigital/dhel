import type { Brand, Itinerary, ItineraryContent } from "@/lib/types";

/** Fixed demo content for marketing hero + presentation — not live inventory. */
export const SAMPLE_BRIEF =
  "Couple, mid-40s, first Bhutan. 7 days west circuit, comfortable 3-star hotels, include Tiger’s Nest, avoid extreme hikes, EN.";

export const SAMPLE_CONTENT: ItineraryContent = {
  eyebrow: "Kingdom of Bhutan · 7 Days · 6 Nights",
  trip_title: "Western Bhutan — Temples, Valleys & Tiger’s Nest",
  prepared_for: "Prepared for the Mehra family",
  departing_from: "Delhi / Kathmandu",
  gateway: "Paro International (PBH)",
  group: "2 Adults",
  travel_dates: "Sample · adjust to guest dates",
  vehicle: "Private car",
  guide: "Licensed English-speaking guide",
  letter: {
    date: "10 August 2026",
    greeting: "Dear Mehra family,",
    paragraphs: [
      "Thank you for trusting us with your first journey to Bhutan. This private west-circuit programme balances dzongs, valleys, and one iconic hike at an unhurried pace.",
      "Hotels remain comfortable three-star properties with private transfers and a licensed guide throughout. International air and SDF settle as confirmed closer to departure.",
      "We can refine any day, meal, or overnight before you share this with your guests.",
    ],
  },
  pricing: {
    currency: "USD",
    total: 3360,
    per_person: 1680,
    pax: 2,
    note: "Indicative land package · subject to confirmation",
    inclusions: [
      "Sustainable Development Fee (SDF) as applicable",
      "Visa facilitation",
      "3-star hotels · twin/double",
      "Private car with driver",
      "Licensed guide",
      "Monument fees as per itinerary",
      "Airport transfers",
    ],
    exclusions:
      "International flights, insurance, personal expenses, tips, beverages, and meals not specified.",
    flight_extra_note: "Flights extra · indicative range only",
  },
  flights: {
    summary: "Indicative access · confirm live schedules with airlines (not a live GDS search)",
    legs: [
      {
        direction: "inbound",
        airline: "Drukair",
        flight_number: "KB401",
        from: "KTM",
        to: "PBH",
        notes: "Indicative morning arrival",
      },
      {
        direction: "outbound",
        airline: "Drukair",
        flight_number: "KB400",
        from: "PBH",
        to: "KTM",
        notes: "Indicative early departure",
      },
    ],
    booking_notes: [
      "Airfares are not included in the land package",
      "Paro is a visual-flight airport; weather can affect operations",
    ],
  },
  days: [
    {
      day: 1,
      title: "Arrival & welcome",
      route: "Paro · Thimphu",
      description:
        "Arrive PBH, meet guide and driver, scenic transfer to Thimphu with acclimatisation and a gentle valley orientation.",
      activities: ["Airport meet & greet", "Thimphu valley drive", "Evening at leisure"],
      overnight: "Thimphu · comfortable 3-star",
      meals: "L / D",
    },
    {
      day: 2,
      title: "Capital culture",
      route: "Thimphu",
      description:
        "Buddha Dordenma, Memorial Chorten, and craft markets — a full day of capital landmarks without long transfers.",
      activities: ["Buddha Dordenma", "Memorial Chorten", "Craft bazaar"],
      overnight: "Thimphu · comfortable 3-star",
      meals: "B / L / D",
    },
    {
      day: 3,
      title: "Passes & valleys",
      route: "Thimphu · Punakha via Dochu La",
      description:
        "Cross Dochu La when clear, descend into subtropical Punakha for riverside evening.",
      activities: ["Dochu La pass", "Valley viewpoints", "Punakha arrival"],
      overnight: "Punakha · comfortable 3-star",
      meals: "B / L / D",
    },
    {
      day: 4,
      title: "Dzong & bridges",
      route: "Punakha",
      description:
        "Punakha Dzong at the river confluence and the iconic cantilever bridge walk at an easy pace.",
      activities: ["Punakha Dzong", "Suspension / cantilever bridge", "Riverside pause"],
      overnight: "Punakha · comfortable 3-star",
      meals: "B / L / D",
    },
    {
      day: 5,
      title: "Return west",
      route: "Punakha · Paro",
      description:
        "Drive back toward Paro valley with optional farmhouse lunch; settle for two Paro nights.",
      activities: ["Scenic return drive", "Paro valley orientation"],
      overnight: "Paro · comfortable 3-star",
      meals: "B / L / D",
    },
    {
      day: 6,
      title: "Tiger’s Nest",
      route: "Paro · Taktsang",
      description:
        "Hike to Tiger’s Nest at a measured pace (optional pony to base of final climb). Afternoon rest or spa.",
      activities: ["Taktsang hike", "Photo pauses", "Recovery afternoon"],
      overnight: "Paro · comfortable 3-star",
      meals: "B / L / D",
    },
    {
      day: 7,
      title: "Departure",
      route: "Paro · PBH",
      description: "Airport transfer for outbound flight. Safe travels home.",
      activities: ["Airport transfer"],
      overnight: "—",
      meals: "B",
    },
  ],
  closing: {
    includes_fit: ["Private programme", "Licensed guide", "SDF handling support"],
    notes: [
      "Sample for demos and pitches — replace with guest brief before client send.",
      "Flights and hotels are narrative only, not live inventory.",
    ],
  },
};

export const SAMPLE_BRAND: Partial<Brand> = {
  display_name: "Silverpine Journeys",
  website: "https://example.com",
  email: "concierge@example.com",
  whatsapp: "+975 17 000 000",
  voice: "Warm, precise, unhurried.",
  signatory_names: "Tashi Dorji",
  signatory_title: "Destination Specialist",
  since_year: 2014,
  default_template_id: "classic-luxury",
};

/** Minimal Itinerary shape for Classic Luxury render (no DB row). */
export function sampleItinerary(): Itinerary {
  return {
    id: "demo-sample",
    agency_id: "demo",
    title: SAMPLE_CONTENT.trip_title || "Sample Bhutan itinerary",
    client_name: "Mehra family",
    language: "en",
    template_id: "classic-luxury",
    status: "ready",
    brief: SAMPLE_BRIEF,
    content: SAMPLE_CONTENT,
    brand_snapshot: SAMPLE_BRAND,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
