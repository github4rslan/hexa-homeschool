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
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/og-image.png"],
    },
  };
}
