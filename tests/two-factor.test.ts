import { beforeAll, describe, expect, it } from "vitest";
import {
  generateCode,
  createTwoFactorToken,
  checkTwoFactorToken,
  readTwoFactorSubject,
  createCodeToken,
  MAX_TWO_FACTOR_ATTEMPTS,
} from "@/lib/email/verification";

const PARENT_ID = "64b7f0a1c2d3e4f5a6b7c8d9";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long!!";
});

describe("two-factor code tokens", () => {
  it("accepts the right code", async () => {
    const token = await createTwoFactorToken(PARENT_ID, "123456");
    const res = await checkTwoFactorToken(token, "123456");
    expect(res).toEqual({ status: "ok", parentId: PARENT_ID });
  });

  it("rejects a wrong code and counts down remaining attempts", async () => {
    const token = await createTwoFactorToken(PARENT_ID, "123456");
    const res = await checkTwoFactorToken(token, "000000");
    expect(res.status).toBe("bad_code");
    if (res.status === "bad_code") {
      expect(res.remaining).toBe(MAX_TWO_FACTOR_ATTEMPTS - 1);
      expect(res.retryToken).toBeTruthy();
    }
  });

  it("exhausts after the attempt budget and never accepts afterwards", async () => {
    let token = await createTwoFactorToken(PARENT_ID, "123456");
    for (let i = 1; i < MAX_TWO_FACTOR_ATTEMPTS; i++) {
      const res = await checkTwoFactorToken(token, "000000");
      if (i < MAX_TWO_FACTOR_ATTEMPTS - 1) {
        expect(res.status).toBe("bad_code");
        if (res.status === "bad_code") token = res.retryToken;
      } else {
        // 5th wrong guess (attempts 0→4 then this one hits the cap)
        expect(["bad_code", "exhausted"]).toContain(res.status);
        if (res.status === "bad_code") token = res.retryToken;
      }
    }
    const final = await checkTwoFactorToken(token, "000000");
    expect(final.status).toBe("exhausted");
  });

  it("still accepts the right code while attempts remain", async () => {
    const token = await createTwoFactorToken(PARENT_ID, "123456");
    const wrong = await checkTwoFactorToken(token, "999999");
    expect(wrong.status).toBe("bad_code");
    if (wrong.status === "bad_code") {
      const right = await checkTwoFactorToken(wrong.retryToken, "123456");
      expect(right.status).toBe("ok");
    }
  });

  it("rejects tokens minted for another purpose (signup codes)", async () => {
    const signupToken = await createCodeToken(PARENT_ID, "123456");
    const res = await checkTwoFactorToken(signupToken, "123456");
    expect(res.status).toBe("invalid");
  });

  it("rejects garbage tokens", async () => {
    expect((await checkTwoFactorToken("not-a-jwt", "123456")).status).toBe("invalid");
    expect(await readTwoFactorSubject("not-a-jwt")).toBeNull();
  });

  it("exposes the subject for resends regardless of attempts", async () => {
    const token = await createTwoFactorToken(PARENT_ID, "123456");
    expect(await readTwoFactorSubject(token)).toBe(PARENT_ID);
  });

  it("generates 6-digit numeric codes", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });
});
