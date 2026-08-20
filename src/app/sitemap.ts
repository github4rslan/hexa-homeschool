import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

const ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/agents", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/demo", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/safety", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/compliance", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/for-parents", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/local-authorities", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/why-now", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/roadmap", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/childrens-code", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/gallery", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/resources", priority: 0.6, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
