import { describe, expect, it } from "vitest";
import {
  slaState,
  formatDuration,
  ACK_SLA_MINUTES,
} from "@/lib/engine/escalation-sla";

const NOW = Date.UTC(2026, 5, 14, 12, 0, 0);
function ago(mins: number): Date {
  return new Date(NOW - mins * 60000);
}

describe("slaState", () => {
  it("counts age from created_at", () => {
    const s = slaState(
      { severity: "high", status: "open", created_at: ago(45) },
      NOW,
    );
    expect(s.ageMinutes).toBe(45);
  });

  it("an immediate open escalation past 15m breaches and alarms", () => {
    const s = slaState(
      { severity: "immediate", status: "open", created_at: ago(20) },
      NOW,
    );
    expect(s.breached).toBe(true);
    expect(s.alarm).toBe(true);
    expect(s.minutesToBreach).toBe(ACK_SLA_MINUTES.immediate - 20);
  });

  it("an immediate within 15m has not breached", () => {
    const s = slaState(
      { severity: "immediate", status: "open", created_at: ago(5) },
      NOW,
    );
    expect(s.breached).toBe(false);
    expect(s.alarm).toBe(false);
    expect(s.minutesToBreach).toBe(10);
  });

  it("breach on a non-immediate severity does not alarm", () => {
    const s = slaState(
      { severity: "high", status: "open", created_at: ago(200) },
      NOW,
    );
    expect(s.breached).toBe(true);
    expect(s.alarm).toBe(false);
  });

  it("acknowledged stops the clock — never breached", () => {
    const s = slaState(
      { severity: "immediate", status: "acknowledged", created_at: ago(999) },
      NOW,
    );
    expect(s.breached).toBe(false);
    expect(s.alarm).toBe(false);
    expect(s.minutesToBreach).toBeNull();
  });

  it("resolved also stops the clock", () => {
    const s = slaState(
      { severity: "immediate", status: "resolved", created_at: ago(999) },
      NOW,
    );
    expect(s.breached).toBe(false);
  });
});

describe("formatDuration", () => {
  it("formats minutes, hours and days", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(1440)).toBe("1d");
  });

  it("uses absolute value (for overdue negatives)", () => {
    expect(formatDuration(-30)).toBe("30m");
  });
});
