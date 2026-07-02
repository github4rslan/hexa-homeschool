import { describe, it, expect } from "vitest";
import { timingSafeEqualStr, cronAuthorized } from "@/lib/auth/cron-auth";

describe("timingSafeEqualStr", () => {
  it("is true for equal strings", () => {
    expect(timingSafeEqualStr("Bearer s3cr3t", "Bearer s3cr3t")).toBe(true);
    expect(timingSafeEqualStr("", "")).toBe(true);
  });

  it("is false for different strings, including length mismatch", () => {
    expect(timingSafeEqualStr("Bearer a", "Bearer b")).toBe(false);
    expect(timingSafeEqualStr("Bearer secret", "Bearer secret-longer")).toBe(
      false,
    );
    expect(timingSafeEqualStr("", "x")).toBe(false);
  });
});

describe("cronAuthorized", () => {
  const req = (auth: string | null) =>
    new Request("https://edway.uk/api/digest/weekly", {
      headers: auth === null ? {} : { authorization: auth },
    });

  it("accepts the correct bearer secret", () => {
    expect(cronAuthorized(req("Bearer topsecret"), "topsecret")).toBe(true);
  });

  it("rejects a wrong, malformed, or missing header", () => {
    expect(cronAuthorized(req("Bearer nope"), "topsecret")).toBe(false);
    expect(cronAuthorized(req("topsecret"), "topsecret")).toBe(false);
    expect(cronAuthorized(req(null), "topsecret")).toBe(false);
  });
});
