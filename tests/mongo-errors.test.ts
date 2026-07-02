import { describe, it, expect } from "vitest";
import { isDuplicateKeyError } from "@/lib/db/mongo-errors";

describe("isDuplicateKeyError", () => {
  it("detects a MongoDB E11000 by code", () => {
    expect(isDuplicateKeyError({ code: 11000, message: "E11000 dup key" })).toBe(
      true,
    );
    // A real MongoServerError-shaped object.
    const err = Object.assign(new Error("E11000 duplicate key error"), {
      code: 11000,
    });
    expect(isDuplicateKeyError(err)).toBe(true);
  });

  it("does not misfire on other errors", () => {
    expect(isDuplicateKeyError({ code: 121 })).toBe(false);
    expect(isDuplicateKeyError(new Error("boom"))).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError(undefined)).toBe(false);
    expect(isDuplicateKeyError("11000")).toBe(false);
  });
});
