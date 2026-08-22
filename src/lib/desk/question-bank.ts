/** Shared tap options for desk clarification + TripWizard */

export type QuestionBankKey =
  | "pax"
  | "nationalities"
  | "days"
  | "stay_plan"
  | "entry_point"
  | "travel_dates"
  | "budget_tier"
  | "language";

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
};

export type ClarifyingQuestion = {
  id: QuestionBankKey;
  prompt: string;
  options: string[];
  allowFreeText?: boolean;
};
