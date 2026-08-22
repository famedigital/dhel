import type { BriefIntent } from "./types";
import { formatStayRoute } from "./stay-plan";

/** Canonical brief string for Gemini narrative — only confirmed facts. */
export function composeFinalBrief(intent: BriefIntent, overrides?: Partial<BriefIntent>): string {
  const b = { ...intent, ...overrides };
  const lines: string[] = [];

  if (b.client_name?.trim()) lines.push(`Client: ${b.client_name.trim()}`);
  lines.push(`Pax: ${b.pax} (${b.adults} adults${b.children ? `, ${b.children} children` : ""})`);
  lines.push(`Nationality: ${b.nationalities.join(", ")}`);
  lines.push(`Trip length: ${b.days} days`);
  if (b.travel_dates?.trim()) lines.push(`Travel dates: ${b.travel_dates.trim()}`);
  lines.push(`Entry: ${b.entry_point}`);
  lines.push(`Budget: ${b.budget_tier}${b.hotel_star_rating ? ` (${b.hotel_star_rating}-star)` : ""}`);
  lines.push(`Currency: ${b.currency}`);
  if (b.meal_plan) lines.push(`Meal plan: ${b.meal_plan}`);
  if (b.stay_plan?.length) lines.push(`Stay plan: ${formatStayRoute(b.stay_plan)}`);
  lines.push(`Language: ${b.language === "zh" ? "Chinese" : "English"}`);

  const raw = b.raw_brief?.trim();
  if (raw) {
    lines.push("");
    lines.push("Original enquiry:");
    lines.push(raw);
  }

  return lines.join("\n");
}
