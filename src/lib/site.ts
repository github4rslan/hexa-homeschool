/**
 * Canonical site identity — the single source of truth for the public origin
 * and contact address, so the domain never drifts across SEO/OG/sitemap/email.
 *
 * Env-driven: set `NEXT_PUBLIC_APP_URL` in Vercel. Defaults to the production
 * domain `https://edway.uk` when unset.
 */

import type { Metadata } from "next";

/** Public origin, no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://edway.uk"
).replace(/\/$/, "");

/** Hostname only (e.g. for wordmark / footer display). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Primary contact email address. */
export const CONTACT_EMAIL = "hello@edway.uk";

/**
 * Builds page-specific `alternates.canonical`, `openGraph` and `twitter`
 * metadata so a non-home marketing page never inherits the homepage's
 * defaults from the root layout (Next.js metadata merging replaces nested
 * objects like `openGraph`/`twitter` wholesale when a segment defines its
 * own, rather than deep-merging field by field — so every page that sets
 * one must set the full object).
 *
 * B2 (2026-09-13): deliberately omits `images` from both `openGraph` and
 * `twitter`. An explicit `images` array here would take precedence over a
 * route's `opengraph-image.tsx` file-convention image (Next.js only falls
 * back to the file convention when no explicit array is set), so setting it
 * to the nonexistent `/og-image.png` broke the preview on every page that
 * calls this helper even after the root layout's own copy of the same bug
 * was fixed. Leaving `images` unset lets each page fall back to its own
 * `opengraph-image.tsx` (the 4 pages that have one, F5) or the sitewide
 * default (`src/app/opengraph-image.tsx`) otherwise.
 */
export function buildPageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} · Edway`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_GB",
      url,
      siteName: "Edway",
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
