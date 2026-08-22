/** Classic Luxury A4 layout caps — keep UI + saves within these. */
export const MEDIA_LIMITS = {
  cover: 1,
  guide: 1,
  vehicle: 1,
  dayHero: 1,
  /** Day page secondary grid in ClassicLuxury */
  activityImagesPerDay: 4,
  /** Hotel option strip on PDF */
  hotelOptionImages: 5,
} as const;

export function clampUrls(urls: string[] | undefined, max: number): string[] | undefined {
  const next = (urls ?? []).map((u) => u.trim()).filter(Boolean).slice(0, max);
  return next.length ? next : undefined;
}

export function clampActivityImages(
  images: { url: string; caption: string }[] | undefined,
  max = MEDIA_LIMITS.activityImagesPerDay,
): { url: string; caption: string }[] | undefined {
  const next = (images ?? [])
    .filter((img) => img.url?.trim())
    .slice(0, max)
    .map((img) => ({ url: img.url.trim(), caption: (img.caption ?? "").trim() }));
  return next.length ? next : undefined;
}
