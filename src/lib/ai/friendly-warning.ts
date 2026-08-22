/** Turn raw AI SDK / quota errors into short agent-facing copy. Never show stack traces to the desk. */
export function friendlyAiWarning(raw?: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();

  if (/exceeded your current quota|RESOURCE_EXHAUSTED|rate.?limit|free_tier/i.test(t)) {
    return "AI drafting is temporarily limited (daily quota). You’re seeing a solid template draft — edit the wording, then save. Add billing or another API key in Settings for full AI drafts.";
  }
  if (/No .+ API key|GEMINI_API_KEY|CURSOR_API_KEY|AIza/i.test(t) && /not configured|No |Set /i.test(t)) {
    return "AI key not set — using a template draft. Add your key in Settings for richer wording.";
  }
  if (/Fell back to stub|heuristic brief|stub draft/i.test(t)) {
    return "Using a template draft (AI unavailable). Edit freely — Preview/PDF is what the client sees.";
  }
  if (/unavailable; used/i.test(t)) {
    return t.replace(/Gemini|Cursor/gi, (m) => m).slice(0, 160);
  }

  // Strip SDK noise; keep a short line
  const cleaned = t
    .replace(/AI_APICallError:\s*/gi, "")
    .replace(/Failed after \d+ attempts\.?\s*/gi, "")
    .replace(/Last error:\s*/gi, "")
    .replace(/\[?GoogleGenerativeAIError[^\]]*\]?:?\s*/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > 180) {
    return `${cleaned.slice(0, 160)}… Edit the draft below — clients only see Preview/PDF.`;
  }
  return cleaned || "Draft ready for your edits. Clients only see Preview/PDF.";
}
