import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Content-Security-Policy.
 *
 * Origins map to real client traffic only:
 * - api.cloudinary.com  — signed direct uploads from the browser (upload-button)
 * - res.cloudinary.com  — delivered images / uploaded work
 * - *.ingest.*.sentry.io — client error events (PII-scrubbed)
 * Stripe needs nothing: checkout/portal are full-page server redirects, not
 * embedded JS. TTS audio is proxied through /api/tts and played from blob:
 * URLs. `'unsafe-inline'` script-src is required by Next.js hydration inline
 * scripts (a nonce-based policy would force every page dynamic); there are
 * still no foreign script origins.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
  "worker-src 'self' blob:",
  "frame-src 'none'",
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
const permissionsPolicy = (allowMicrophone: boolean) => ({
  key: "Permissions-Policy",
  value: `camera=(), microphone=(${allowMicrophone ? "self" : ""}), geolocation=(), payment=(), usb=()`,
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
      { source: "/((?!learn).*)", headers: [permissionsPolicy(false)] },
      { source: "/learn/:path*", headers: [permissionsPolicy(true)] },
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
  webpack: { treeshake: { removeDebugLogging: true } },
});
