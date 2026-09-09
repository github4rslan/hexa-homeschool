import { NextResponse } from "next/server";
import { listFeaturedTestimonials } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, read-only feed of staff-curated, parent-consented testimonials
 * (F5). Deliberately minimal: star rating, comment, first name only, never
 * email, full name, or any other account/child data. Backed by
 * `listFeaturedTestimonials`, which itself refuses any row without the
 * parent's own submission-time `share_consent`. Unauthenticated by design
 * (the marketing homepage renders it for anonymous visitors); there is
 * nothing here to rate-limit meaningfully harder than any other static
 * marketing content, so no per-caller limiter is applied.
 */
export async function GET() {
  try {
    const testimonials = await listFeaturedTestimonials(6);
    return NextResponse.json(
      { testimonials },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/testimonials] failed:", err);
    // Graceful degradation: an empty list lets the marketing component fall
    // back to its curated copy rather than surfacing an error to a visitor.
    return NextResponse.json(
      { testimonials: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
