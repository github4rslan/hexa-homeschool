import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Content-Security-Policy.
 *
 * Origins map to real client traffic only:
 * - api.cloudinary.com  — signed direct uploads from the browser (upload-button)
 * - res.cloudinary.com  — delivered images / uploaded work
 * - *.ingest.*.sentry.io — client error events (PII-scrubbed)
 * - *.posthog.com / *.i.posthog.com — parents-only product analytics
 *   (never loaded in (child) routes; harmless to allow when the key is unset)
 * Stripe needs nothing: checkout/portal are full-page server redirects, not
 * embedded JS. TTS audio is proxied through /api/tts and played from blob:
 * URLs. `'unsafe-inline'` script-src is required by Next.js hydration inline
 * scripts (a nonce-based policy would force every page dynamic); there are
 * still no foreign script origins.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://meet.jit.si${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.posthog.com https://*.i.posthog.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://meet.jit.si",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
];

// Camera stays off everywhere. The microphone is allowed only under /learn,
// where the child records spoken answers for STT — every other route gets
// microphone=() too.
const permissionsPolicy = (mode: "none" | "learn" | "tutoring") => ({
  key: "Permissions-Policy",
  value:
    mode === "tutoring"
      ? 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), display-capture=(self "https://meet.jit.si"), geolocation=(), payment=(), usb=()'
      : `camera=(), microphone=(${mode === "learn" ? "self" : ""}), display-capture=(), geolocation=(), payment=(), usb=()`,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/((?!learn|tutor|tutoring).*)", headers: [permissionsPolicy("none")] },
      { source: "/learn/:path*", headers: [permissionsPolicy("learn")] },
      { source: "/tutor/:path*", headers: [permissionsPolicy("tutoring")] },
      { source: "/tutoring/:path*", headers: [permissionsPolicy("tutoring")] },
    ];
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
  // Tree-shake the client SDK: drop the debug logger (and other debug-only code
  // paths) we don't use — we run error-capture only. Trims first-load JS.
  webpack: { treeshake: { removeDebugLogging: true } },
});
