/**
 * Marketing testimonials, curated-fallback decision (F5). PURE, deterministic,
 * unit-tested (tests/testimonials.test.ts). No DB, no network.
 *
 * The public homepage always has SOMETHING to show in its trust section, even
 * on day one with zero opted-in feedback: real, staff-featured, parent-consented
 * quotes replace the curated placeholder copy only once there are enough of
 * them to avoid ever mixing one real first-name-only quote next to fabricated
 * full names, which would look inconsistent side by side.
 */

export interface Testimonial {
  quote: string;
  name: string;
  meta: string;
  /** Set only for a real, parent-consented quote, drives the star row. */
  stars?: number;
}

/** Shape returned by GET /api/testimonials. */
export interface RealTestimonial {
  id: string;
  stars: number;
  comment: string;
  firstName: string | null;
}

// Once there are at least this many real, staff-featured, parent-consented
// quotes, they replace the curated placeholder list entirely. Below that
// count the curated list stays as-is.
export const MIN_REAL_TESTIMONIALS = 2;

/** null → caller should render its curated fallback list instead. */
export function toDisplayTestimonials(
  real: RealTestimonial[],
): Testimonial[] | null {
  if (real.length < MIN_REAL_TESTIMONIALS) return null;
  return real.map((r) => ({
    quote: r.comment,
    name: r.firstName ? `${r.firstName}.` : "An Edway parent",
    meta: "Edway family",
    stars: r.stars,
  }));
}
