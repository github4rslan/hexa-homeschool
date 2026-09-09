import { describe, expect, it } from "vitest";
import {
  toDisplayTestimonials,
  MIN_REAL_TESTIMONIALS,
  type RealTestimonial,
} from "@/lib/engine/testimonials";

function real(n: number): RealTestimonial[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    stars: 5,
    comment: `Great! (${i})`,
    firstName: i % 2 === 0 ? "Priya" : null,
  }));
}

describe("toDisplayTestimonials (F5, curated fallback until enough real quotes exist)", () => {
  it("falls back to curated (null) when there are zero real testimonials", () => {
    expect(toDisplayTestimonials([])).toBeNull();
  });

  it("falls back to curated (null) below the MIN_REAL_TESTIMONIALS threshold", () => {
    expect(toDisplayTestimonials(real(MIN_REAL_TESTIMONIALS - 1))).toBeNull();
  });

  it("switches to real testimonials once the threshold is met", () => {
    const result = toDisplayTestimonials(real(MIN_REAL_TESTIMONIALS));
    expect(result).not.toBeNull();
    expect(result).toHaveLength(MIN_REAL_TESTIMONIALS);
  });

  it("never fabricates a full name, uses first-name-only or a generic label", () => {
    const result = toDisplayTestimonials(real(MIN_REAL_TESTIMONIALS))!;
    expect(result[0].name).toBe("Priya.");
    expect(result[1].name).toBe("An Edway parent");
  });

  it("carries the real star rating and comment through untouched", () => {
    const result = toDisplayTestimonials(real(MIN_REAL_TESTIMONIALS))!;
    expect(result[0].stars).toBe(5);
    expect(result[0].quote).toBe("Great! (0)");
  });
});
