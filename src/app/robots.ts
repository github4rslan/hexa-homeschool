import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://hexa.education";

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
          "/api/*",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
