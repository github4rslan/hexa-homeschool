import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifySlackCommand } from "@/lib/slack/verify-command";

const SECRET = "8f742231b10e8888abcd99yyyzzz85a5";
const BODY = "command=%2Fedway-stats&text=&user_id=U123&channel_id=C123";
const NOW = 1_788_400_000;

/** Sign a body the way Slack does, so the happy path is a real signature. */
function sign(body: string, ts: number, secret = SECRET): string {
  return (
    "v0=" +
    createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex")
  );
}

describe("verifySlackCommand", () => {
  it("accepts a genuine, current Slack signature", () => {
    const result = verifySlackCommand({
      rawBody: BODY,
      signature: sign(BODY, NOW),
      timestamp: String(NOW),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects a signature made with a different signing secret", () => {
    const result = verifySlackCommand({
      rawBody: BODY,
      signature: sign(BODY, NOW, "an-attackers-guess"),
      timestamp: String(NOW),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a tampered body even when the signature is otherwise valid", () => {
    // Signed the real body, then swapped in a different command.
    const result = verifySlackCommand({
      rawBody: BODY.replace("edway-stats", "delete-everything"),
      signature: sign(BODY, NOW),
      timestamp: String(NOW),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a replayed request older than five minutes", () => {
    const old = NOW - 60 * 6;
    const result = verifySlackCommand({
      rawBody: BODY,
      signature: sign(BODY, old),
      timestamp: String(old),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "stale-timestamp" });
  });

  it("rejects a timestamp too far in the future (clock-skew forgery)", () => {
    const future = NOW + 60 * 6;
    const result = verifySlackCommand({
      rawBody: BODY,
      signature: sign(BODY, future),
      timestamp: String(future),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "stale-timestamp" });
  });

  it("accepts a request just inside the five-minute window", () => {
    const recent = NOW - 60 * 4;
    const result = verifySlackCommand({
      rawBody: BODY,
      signature: sign(BODY, recent),
      timestamp: String(recent),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects missing or malformed headers rather than throwing", () => {
    const base = { rawBody: BODY, signingSecret: SECRET, nowSeconds: NOW };
    expect(
      verifySlackCommand({ ...base, signature: null, timestamp: String(NOW) }),
    ).toEqual({ ok: false, reason: "missing-headers" });
    expect(
      verifySlackCommand({ ...base, signature: sign(BODY, NOW), timestamp: null }),
    ).toEqual({ ok: false, reason: "missing-headers" });
    expect(
      verifySlackCommand({
        ...base,
        signature: sign(BODY, NOW),
        timestamp: "not-a-number",
      }),
    ).toEqual({ ok: false, reason: "missing-headers" });
  });

  it("rejects a short/garbage signature without throwing on length mismatch", () => {
    const result = verifySlackCommand({
      rawBody: BODY,
      signature: "v0=deadbeef",
      timestamp: String(NOW),
      signingSecret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });
});
