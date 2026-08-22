import imageMap from "./image-map.json";

export function resolveReferenceImage(src: string): string {
  const normalized = src.replace(/^\.\//, "").trim();
  const mapped = (imageMap as Record<string, string>)[normalized];
  if (mapped) return mapped;
  if (normalized.startsWith("http")) return normalized;
  return src;
}

export function listReferenceImageKeys(): string[] {
  return Object.keys(imageMap as Record<string, string>);
}
