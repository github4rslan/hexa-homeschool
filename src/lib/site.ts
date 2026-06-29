/**
 * Canonical site identity — the single source of truth for the public origin
 * and contact address, so the domain never drifts across SEO/OG/sitemap/email.
 *
 * Env-driven: set `NEXT_PUBLIC_APP_URL` in Vercel. Defaults to the production
 * domain `https://edway.uk` when unset.
 */

/** Public origin, no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://edway.uk"
).replace(/\/$/, "");

/** Hostname only (e.g. for wordmark / footer display). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Primary contact email address. */
export const CONTACT_EMAIL = "hello@edway.uk";
