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
 * B2 (2026-09-13, live regression): a segment that defines its OWN
 * `openGraph` object (even without an `images` key) does not fall back to
 * an ANCESTOR segment's `opengraph-image.tsx` (that auto-generated image is
 * merged into the metadata of the segment the file lives in, not inherited
 * across a segment that redefines `openGraph`). So dropping `images`
 * entirely here removed the dead `/og-image.png` link, but also silently
 * removed every page's preview image, since only 4 pages have their OWN
 * co-located `opengraph-image.tsx` (F5). Pass `hasOwnOgImage: true` for
 * those 4 (their own file already works and must not be shadowed); every
 * other caller gets an explicit fallback to the sitewide dynamic OG image
 * (`src/app/opengraph-image.tsx`, reachable directly at `/opengraph-image`).
 */
export function buildPageMetadata({
  path,
  title,
  description,
  hasOwnOgImage = false,
}: {
  path: string;
  title: string;
  description: string;
  /** True for the handful of pages with their own `opengraph-image.tsx`
   * (F5) — leaves `images` unset so that co-located file convention is used
   * instead of being shadowed by an explicit array pointing elsewhere. */
  hasOwnOgImage?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} · Edway`;
  // Deliberately spread (not `images: hasOwnOgImage ? undefined : [...]`):
  // an explicit `images` KEY set to `undefined` still counts as "the caller
  // set images" to Next's metadata resolver, which then skips its own
  // file-convention fallback merge just as if a real (dead) URL had been
  // set. Omitting the key entirely is what lets a page with its own
  // `opengraph-image.tsx` (hasOwnOgImage) pick that up.
  const imageOverride = hasOwnOgImage ? {} : { images: ["/opengraph-image"] };
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
      ...imageOverride,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...imageOverride,
    },
  };
}
