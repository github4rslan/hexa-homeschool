import { describe, expect, it } from "vitest";
import {
  NEWSLETTER_COUNT_TRUST_THRESHOLD,
  newsletterHeadline,
} from "@/lib/engine/newsletter-copy";

describe("B3 (newsletterHeadline never states a false subscriber count)", () => {
  it("stays non-numeric below the trust threshold", () => {
    expect(newsletterHeadline(0)).not.toMatch(/\d/);
    expect(newsletterHeadline(1)).not.toMatch(/\d/);
    expect(newsletterHeadline(NEWSLETTER_COUNT_TRUST_THRESHOLD - 1)).not.toMatch(/\d/);
  });

  it("names the real count once it clears the trust threshold", () => {
    expect(newsletterHeadline(NEWSLETTER_COUNT_TRUST_THRESHOLD)).toContain(
      `${NEWSLETTER_COUNT_TRUST_THRESHOLD}+`,
    );
    expect(newsletterHeadline(2500)).toContain("2,500+");
  });

  it("never hardcodes a specific claimed number regardless of the real count", () => {
    // The bug this guards against: a fixed "2,000+" claim regardless of the
    // real live count. Any number shown must equal the input, not a constant.
    expect(newsletterHeadline(1)).not.toContain("2,000");
    expect(newsletterHeadline(150)).toContain("150+");
  });
});
