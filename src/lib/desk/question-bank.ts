/** Shared tap options for desk clarification + TripWizard */

export type QuestionBankKey =
  | "pax"
  | "nationalities"
  | "days"
  | "stay_plan"
  | "entry_point"
  | "travel_dates"
  | "budget_tier"
  | "language"
  | "client_name"
  | "room_avg"
  | "guide_day"
  | "car_day"
  | "transfer_trip"
  | "sdf"
  | "cost_confirm";

export const QUESTION_BANK: Record<
  QuestionBankKey,
  { prompt: string; options: string[]; allowFreeText?: boolean }
> = {
  pax: {
    prompt: "How many are travelling?",
    options: ["2 adults", "Family (3–4)", "Group 5+", "Solo traveller"],
    allowFreeText: true,
  },
  nationalities: {
    prompt: "Guest nationality?",
    options: ["Indian", "Australian", "Chinese", "European / other", "Mixed group"],
    allowFreeText: true,
  },
  days: {
    prompt: "Trip length?",
    options: ["5 days", "6 days", "7 days", "8 days", "10 days", "12 days"],
    allowFreeText: true,
  },
  stay_plan: {
    prompt: "Route / nights per town?",
    options: [
      "2n Thimphu, 1n Punakha, 2n Paro",
      "1n Thimphu, 1n Punakha, 2n Paro",
      "2n Thimphu, 2n Punakha, 2n Paro",
      "3n Paro only",
      "2n Phuentsholing, 2n Thimphu, 2n Paro",
    ],
    allowFreeText: true,
  },
  entry_point: {
    prompt: "How do they enter Bhutan?",
    options: ["Fly Paro", "Hasimara land", "Bagdogra land", "Phuentsholing land", "Not sure yet"],
    allowFreeText: true,
  },
  travel_dates: {
    prompt: "Travel dates or month?",
    options: ["March 2026", "April 2026", "August 2026", "October 2026", "Flexible — advise best season"],
    allowFreeText: true,
  },
  budget_tier: {
    prompt: "Hotel level?",
    options: ["3-star / economy", "4-star comfort", "5-star luxury", "Agent to recommend"],
    allowFreeText: false,
  },
  language: {
    prompt: "Proposal language?",
    options: ["English", "Chinese (中文)"],
    allowFreeText: false,
  },
  client_name: {
    prompt: "Guest / cover name?",
    options: [],
    allowFreeText: true,
  },
  room_avg: {
    prompt: "Avg room rate per night (ops)?",
    options: ["Use 4500", "3500", "5500", "6500"],
    allowFreeText: true,
  },
  guide_day: {
    prompt: "Guide rate per day?",
    options: ["Use 2500", "2000", "3000"],
    allowFreeText: true,
  },
  car_day: {
    prompt: "Car / vehicle rate per day?",
    options: ["Use 5000", "4000", "6000", "7000"],
    allowFreeText: true,
  },
  transfer_trip: {
    prompt: "Pickup + drop for this gateway (per trip)?",
    options: ["Use 5000", "0 (Paro airport only)", "3500", "8000"],
    allowFreeText: true,
  },
  sdf: {
    prompt: "SDF on this package?",
    options: ["Include SDF (nationality rules)", "No SDF", "SDF 100 USD/pp/night"],
    allowFreeText: true,
  },
  cost_confirm: {
    prompt: "Confirm these cost lines for the guest PDF pricing?",
    options: ["Yes — compute sell from these rates", "I'll type a locked USD total"],
    allowFreeText: true,
  },
};

export type ClarifyingQuestion = {
  id: QuestionBankKey;
  prompt: string;
  options: string[];
  allowFreeText?: boolean;
};
