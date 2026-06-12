import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

// Sentry build wrapper. Source-map upload is disabled (no SENTRY_AUTH_TOKEN
// needed; builds stay fast) — runtime error capture works regardless. To get
// unminified client stacks later, add SENTRY_AUTH_TOKEN/org/project and
// re-enable sourcemaps.
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
  webpack: { treeshake: { removeDebugLogging: true } },
});
