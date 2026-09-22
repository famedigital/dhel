import type { MetadataRoute } from "next";
import { BRAND_URL } from "@/lib/brand";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/build", "/terms", "/privacy", "/cookies", "/agent-agreement"],
        disallow: ["/desk/", "/platform/", "/portal/", "/api/", "/dashboard/", "/settings/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
