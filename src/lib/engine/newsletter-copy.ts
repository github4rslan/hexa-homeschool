/**
 * B3: honest, live-count-aware footer newsletter headline. Pure and
 * deterministic so it can be unit-tested without a database.
 *
 * Below the trust threshold, naming a specific subscriber count reads as a
 * false claim rather than a genuine trust signal (the previous hardcoded
 * "2,000+" against a real count of 1 was exactly this failure), so the copy
 * stays warm but non-numeric until real growth clears the bar.
 */

/** Minimum live subscriber count before the footer names a specific number. */
export const NEWSLETTER_COUNT_TRUST_THRESHOLD = 100;

export function newsletterHeadline(count: number): string {
  return count >= NEWSLETTER_COUNT_TRUST_THRESHOLD
    ? `Join ${count.toLocaleString()}+ UK homeschooling parents for weekly tips and early access.`
    : "Join UK homeschooling parents getting weekly tips and early access.";
}
