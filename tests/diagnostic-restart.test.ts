import { describe, expect, it } from "vitest";
import { restartConfirmationIsValid } from "@/lib/diagnostic/restart";

describe("diagnostic restart confirmation", () => {
  it("requires the exact explicit replacement confirmation", () => {
    expect(restartConfirmationIsValid("replace-baseline")).toBe(true);
    expect(restartConfirmationIsValid("yes")).toBe(false);
    expect(restartConfirmationIsValid("")).toBe(false);
    expect(restartConfirmationIsValid(undefined)).toBe(false);
  });
});
