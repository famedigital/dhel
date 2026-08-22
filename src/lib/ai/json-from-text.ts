/** Pull JSON object from agent text (plain or fenced). */
export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty response");

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }

  const arrStart = candidate.indexOf("[");
  const arrEnd = candidate.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) {
    return JSON.parse(candidate.slice(arrStart, arrEnd + 1));
  }

  return JSON.parse(candidate);
}
