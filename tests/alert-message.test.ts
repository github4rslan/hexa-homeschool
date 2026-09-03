import { describe, it, expect } from "vitest";
import { formatAlertMessage } from "@/lib/monitoring/alert-message";

const AT = new Date("2026-09-03T14:22:31.000Z");

describe("formatAlertMessage", () => {
  it("leads with the service and the exact failure detail", () => {
    const msg = formatAlertMessage({
      service: "stripe",
      message: "Balance retrieve failed (401): Invalid API Key provided.",
      severity: "error",
      at: AT,
    });
    expect(msg.split("\n")[0]).toBe(
      "Alert: [stripe] Balance retrieve failed (401): Invalid API Key provided.",
    );
    expect(msg).toContain("Time: 2026-09-03 14:22 UTC");
  });

  it("uses the warning prefix for a warning", () => {
    const msg = formatAlertMessage({
      service: "twilio",
      message: 'Account status is "suspended", not active.',
      severity: "warning",
      at: AT,
    });
    expect(msg.startsWith("Warning: [twilio]")).toBe(true);
  });

  it("shows one thing broke: the rest of the run passed", () => {
    const msg = formatAlertMessage({
      service: "openai",
      message: "Models list returned 429: rate limited.",
      severity: "error",
      at: AT,
      context: {
        alsoFailing: [],
        healthy: ["cloudinary", "stripe", "elevenlabs"],
        unconfigured: ["twilio"],
      },
    });
    expect(msg).toContain("Checked and healthy: cloudinary, stripe, elevenlabs");
    expect(msg).toContain("Not configured, so not checked: twilio");
    expect(msg).not.toContain("Also failing");
  });

  it("shows everything broke, which reads as an outage rather than one service", () => {
    const msg = formatAlertMessage({
      service: "openai",
      message: "Models list returned 0: fetch failed.",
      severity: "error",
      at: AT,
      context: {
        alsoFailing: ["cloudinary", "stripe"],
        healthy: [],
        unconfigured: [],
      },
    });
    expect(msg).toContain("Also failing in this run: cloudinary, stripe");
    expect(msg).toContain("Checked and healthy: none, every checked service is failing");
  });

  it("stays a clean two-line message when no run context is supplied", () => {
    const msg = formatAlertMessage({
      service: "email",
      message: "Delivery health degraded.",
      severity: "error",
      at: AT,
    });
    expect(msg.split("\n")).toHaveLength(2);
  });

  it("never invents a timestamp for a missing date", () => {
    const msg = formatAlertMessage({
      service: "stripe",
      message: "down",
      severity: "error",
    });
    expect(msg).toMatch(/Time: \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC/);
  });
});
