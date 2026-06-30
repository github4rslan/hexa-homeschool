import { describe, expect, it } from "vitest";
import {
  MAX_REMEDIATION_ATTEMPTS,
  decideRemediation,
  masteryScore,
  selectMasteryAttempt,
} from "@/lib/engine/remediation";

const bank = ["a", "b", "c", "d", "e"].map((id) => ({ id }));

describe("mastery remediation", () => {
  it("certifies only on a perfect mastery score", () => {
    expect(masteryScore(3, 3)).toBe(100);
    expect(decideRemediation({ score: 3, total: 3, attempt: 1 })).toBe(
      "certified",
    );
    expect(decideRemediation({ score: 2, total: 3, attempt: 1 })).toBe(
      "remediate",
    );
  });

  it("hands off after the capped fifth attempt", () => {
    expect(
      decideRemediation({
        score: 2,
        total: 3,
        attempt: MAX_REMEDIATION_ATTEMPTS,
      }),
    ).toBe("handoff");
  });

  it("uses fresh mastery items where the bank allows", () => {
    const first = selectMasteryAttempt(bank, 1);
    const second = selectMasteryAttempt(
      bank,
      2,
      first.map((q) => q.id),
    );
    expect(first.map((q) => q.id)).toEqual(["a", "b", "c"]);
    expect(second.map((q) => q.id)).toEqual(["d", "e", "a"]);
  });

  it("varies order when the bank is exactly one mastery check", () => {
    const small = bank.slice(0, 3);
    expect(selectMasteryAttempt(small, 1).map((q) => q.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(selectMasteryAttempt(small, 2).map((q) => q.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });
});
