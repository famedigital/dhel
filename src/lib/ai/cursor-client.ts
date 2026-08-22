import type { z } from "zod";
import { extractJsonFromText } from "./json-from-text";
import { resolveCursorModel } from "./config";

type CursorRunResult = {
  status?: string;
  result?: string;
};

export async function cursorPromptText(apiKey: string, prompt: string): Promise<string> {
  const { Agent } = await import("@cursor/sdk");
  const result = (await Agent.prompt(prompt, {
    apiKey,
    model: { id: resolveCursorModel() },
    local: { cwd: process.cwd() },
  })) as CursorRunResult;

  const status = result.status?.toLowerCase() ?? "";
  if (status && !["completed", "complete", "finished", "success", "succeeded"].includes(status)) {
    throw new Error(`Cursor agent status: ${result.status ?? "unknown"}`);
  }

  const text = result.result?.trim();
  if (!text) throw new Error("Cursor agent returned empty text");
  return text;
}

export async function cursorGenerateObject<T>(
  apiKey: string,
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const text = await cursorPromptText(
    apiKey,
    `${prompt}\n\nReturn ONLY valid JSON matching the requested schema. No markdown fences, no commentary.`,
  );
  return schema.parse(extractJsonFromText(text));
}

export async function cursorGenerateText(apiKey: string, prompt: string): Promise<string> {
  return cursorPromptText(apiKey, prompt);
}
