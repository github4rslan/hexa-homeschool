import { describe, expect, it } from "vitest";
import {
  MAX_REMEDIATION_ATTEMPTS,
  decideRemediation,
  isHandoff,
  masteryScore,
  selectMasteryAttempt,
  shouldQueueHandoff,
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

describe("five-attempt tutor handoff trigger", () => {
  it("flags the handoff only at the fifth attempt without certifying", () => {
    for (let attempt = 1; attempt < MAX_REMEDIATION_ATTEMPTS; attempt++) {
      expect(isHandoff(decideRemediation({ score: 2, total: 3, attempt }))).toBe(
        false,
      );
    }
    expect(
      isHandoff(
        decideRemediation({
          score: 2,
          total: 3,
          attempt: MAX_REMEDIATION_ATTEMPTS,
        }),
      ),
    ).toBe(true);
  });

  it("never hands off a child who certified, even at the cap", () => {
    expect(
      isHandoff(
        decideRemediation({
          score: 3,
          total: 3,
          attempt: MAX_REMEDIATION_ATTEMPTS,
        }),
      ),
    ).toBe(false);
  });
});

describe("handoff idempotency (no spam)", () => {
  it("queues a handoff when there's no existing request", () => {
    expect(shouldQueueHandoff([])).toBe(true);
  });

  it("does NOT queue when an active request already exists", () => {
    expect(shouldQueueHandoff(["requested"])).toBe(false);
    expect(shouldQueueHandoff(["scheduled"])).toBe(false);
    expect(shouldQueueHandoff(["completed", "requested"])).toBe(false);
  });

  it("queues again once prior requests are completed/cancelled", () => {
    expect(shouldQueueHandoff(["completed"])).toBe(true);
    expect(shouldQueueHandoff(["cancelled", "completed"])).toBe(true);
  });
});
