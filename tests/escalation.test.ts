import { describe, expect, it } from "vitest";
import { checkDistress } from "@/lib/safety/escalation";

describe("checkDistress matches", () => {
  it("matches every severity tier present in the matrix", () => {
    expect(checkDistress("i hate myself").severity).toBe("immediate");
    expect(checkDistress("i give up").severity).toBe("critical");
    expect(checkDistress("i hate this").severity).toBe("high");
  });

  it("matches regardless of case", () => {
    const m = checkDistress("I GIVE UP!");
    expect(m.matched).toBe(true);
    expect(m.severity).toBe("critical");
  });

  it("matches with punctuation attached", () => {
    expect(checkDistress("i'm stupid.").matched).toBe(true);
    expect(checkDistress("I CAN'T DO THIS!!!").matched).toBe(true);
    expect(checkDistress("giving up...").matched).toBe(true);
  });

  it("matches inside a longer sentence", () => {
    const m = checkDistress("this question is too hard and i give up now");
    expect(m.matched).toBe(true);
    expect(m.severity).toBe("critical");
  });

  it("returns the HIGHEST severity when several phrases match", () => {
    const m = checkDistress("i'm stupid and i want to die");
    expect(m.matched).toBe(true);
    expect(m.severity).toBe("immediate");
    expect(m.phrase).toBe("i want to die");
  });

  it("reports the matched phrase and a trigger label for the audit log", () => {
    const m = checkDistress("I hate myself");
    expect(m.phrase).toBe("i hate myself");
    expect(m.trigger).toBeTruthy();
  });
});

describe("checkDistress clean text (no false positives)", () => {
  it("does not match ordinary text", () => {
    expect(checkDistress("photosynthesis happens in the leaf").matched).toBe(false);
    expect(checkDistress("I love this lesson").matched).toBe(false);
  });

  it("does not match 'give up' in an unrelated sense", () => {
    expect(checkDistress("the defender had to give up the ball").matched).toBe(false);
  });

  it("does not match the empty string", () => {
    expect(checkDistress("").matched).toBe(false);
  });
});
