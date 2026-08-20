import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/onboarding",
          "/onboarding/*",
          "/lesson",
          "/lesson/*",
          "/learn",
          "/learn/*",
          "/admin",
          "/admin/*",
          "/tutor",
          "/tutor/*",
          "/schedule",
          "/schedule/*",
          "/portfolio",
          "/portfolio/*",
          "/settings",
          "/settings/*",
          "/tutoring",
          "/tutoring/*",
          "/compliance/cnis",
          "/api/*",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
