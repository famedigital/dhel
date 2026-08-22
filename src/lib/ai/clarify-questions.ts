import type { BriefIntent } from "@/lib/catalog";
import type { GapField } from "@/lib/catalog/gap-checker";
import {
  QUESTION_BANK,
  type ClarifyingQuestion,
  type QuestionBankKey,
} from "@/lib/desk/question-bank";

const GAP_TO_QUESTION: Partial<Record<GapField, QuestionBankKey>> = {
  pax: "pax",
  days: "days",
  stay_plan: "stay_plan",
  nationalities: "nationalities",
  entry_point: "entry_point",
  travel_dates: "travel_dates",
  budget_tier: "budget_tier",
};

function summarizeIntent(intent: Partial<BriefIntent>): string {
  const bits: string[] = [];
  if (intent.client_name) bits.push(intent.client_name);
  if (intent.pax && intent.pax !== 2) bits.push(`${intent.pax} pax`);
  if (intent.days && intent.days !== 7) bits.push(`${intent.days} days`);
  if (intent.stay_plan?.length) {
    bits.push(intent.stay_plan.map((s) => `${s.city} ${s.nights}N`).join(" → "));
  }
  if (intent.entry_point && intent.entry_point !== "Paro") bits.push(`${intent.entry_point} entry`);
  if (intent.nationalities?.length && !intent.nationalities.every((n) => /international/i.test(n))) {
    bits.push(intent.nationalities.join(", "));
  }
  if (intent.travel_dates) bits.push(intent.travel_dates);
  return bits.length ? bits.join(" · ") : "Bhutan private tour enquiry";
}

/** Max 2 questions per turn (Gemini-style). */
export function buildClarifyingQuestions(gaps: GapField[]): ClarifyingQuestion[] {
  const seen = new Set<QuestionBankKey>();
  const questions: ClarifyingQuestion[] = [];

  for (const gap of gaps) {
    const key = GAP_TO_QUESTION[gap];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const bank = QUESTION_BANK[key];
    questions.push({
      id: key,
      prompt: bank.prompt,
      options: bank.options,
      allowFreeText: bank.allowFreeText,
    });
    if (questions.length >= 2) break;
  }

  return questions;
}

export function buildAssistantMessage(
  intent: Partial<BriefIntent>,
  gaps: GapField[],
  questions: ClarifyingQuestion[],
): string {
  const summary = summarizeIntent(intent);
  if (!questions.length) {
    return `Got it — ${summary}. Building hotel options now.`;
  }

  const needLabels = questions.map((q) => q.prompt.replace(/\?$/, "")).join(" and ");
  return `Thanks — I picked up: ${summary}. Before I price this, I still need ${needLabels.toLowerCase()}.`;
}

export function buildBriefFromMessages(messages: Array<{ role: string; content: string }>): string {
  return messages
    .filter((m) => m.role === "user" && m.content.trim())
    .map((m) => m.content.trim())
    .join("\n\n");
}
