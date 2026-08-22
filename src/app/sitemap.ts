import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dhel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/build`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/agent-agreement`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/desk/login`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}
