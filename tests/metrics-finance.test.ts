import { describe, expect, it } from "vitest";
import {
  formatGbp,
  formatGbpCompact,
  parentMonthlyMrr,
  rowMrr,
  summarizeBilling,
  TIER_MONTHLY_GBP,
  type BillingRow,
} from "@/lib/metrics/finance";

describe("rowMrr", () => {
  it("counts revenue only for active subscriptions", () => {
    expect(rowMrr({ tier: "standard", status: "active", count: 3 })).toBe(147);
    expect(rowMrr({ tier: "family", status: "active", count: 2 })).toBe(198);
  });

  it("is £0 for trialing, past_due, paused, canceled and free tier", () => {
    expect(rowMrr({ tier: "standard", status: "trialing", count: 10 })).toBe(0);
    expect(rowMrr({ tier: "standard", status: "past_due", count: 10 })).toBe(0);
    expect(rowMrr({ tier: "family", status: "paused", count: 10 })).toBe(0);
    expect(rowMrr({ tier: "family", status: "canceled", count: 10 })).toBe(0);
    expect(rowMrr({ tier: "diagnostic", status: "active", count: 10 })).toBe(0);
  });
});

describe("summarizeBilling", () => {
  it("returns all-zero figures for no accounts (pre-revenue is honest £0)", () => {
    const s = summarizeBilling([]);
    expect(s.totalAccounts).toBe(0);
    expect(s.mrr).toBe(0);
    expect(s.arr).toBe(0);
    expect(s.tiers.every((t) => t.mrr === 0 && t.percent === 0)).toBe(true);
  });

  it("computes MRR and ARR from active accounts only", () => {
    const rows: BillingRow[] = [
      { tier: "standard", status: "active", count: 10 }, // 10 × 49 = 490
      { tier: "family", status: "active", count: 4 }, //     4 × 99 = 396
      { tier: "standard", status: "trialing", count: 5 }, //  £0
      { tier: "family", status: "past_due", count: 2 }, //    £0
      { tier: "standard", status: "canceled", count: 8 }, //  £0
    ];
    const s = summarizeBilling(rows);
    expect(s.mrr).toBe(886);
    expect(s.arr).toBe(886 * 12);
  });

  it("counts every status toward totalAccounts and per-status counts", () => {
    const rows: BillingRow[] = [
      { tier: "standard", status: "active", count: 10 },
      { tier: "standard", status: "trialing", count: 5 },
      { tier: "family", status: "past_due", count: 2 },
      { tier: "standard", status: "canceled", count: 8 },
      { tier: "family", status: "paused", count: 1 },
    ];
    const s = summarizeBilling(rows);
    expect(s.totalAccounts).toBe(26);
    expect(s.counts.active).toBe(10);
    expect(s.counts.trialing).toBe(5);
    expect(s.counts.past_due).toBe(2);
    expect(s.counts.canceled).toBe(8);
    expect(s.counts.paused).toBe(1);
  });

  it("excludes cancelled accounts from a tier's non-cancelled account count", () => {
    const rows: BillingRow[] = [
      { tier: "standard", status: "active", count: 6 },
      { tier: "standard", status: "canceled", count: 4 },
    ];
    const s = summarizeBilling(rows);
    const standard = s.tiers.find((t) => t.tier === "standard")!;
    expect(standard.accounts).toBe(6); // cancelled excluded
    expect(standard.activeAccounts).toBe(6);
    expect(standard.mrr).toBe(6 * 49);
  });

  it("ignores malformed rows so they cannot inflate MRR", () => {
    const rows = [
      { tier: "standard", status: "active", count: 2 },
      { tier: "premium", status: "active", count: 100 }, // unknown tier
      { tier: "standard", status: "vip", count: 100 }, // unknown status
      { tier: "standard", status: "active", count: -5 }, // negative
      { tier: "family", status: "active", count: 1.7 }, // fractional → floored to 1
    ] as unknown as BillingRow[];
    const s = summarizeBilling(rows);
    expect(s.mrr).toBe(2 * 49 + 1 * 99);
    expect(s.totalAccounts).toBe(3);
  });

  it("keeps tiers in a stable display order", () => {
    const s = summarizeBilling([]);
    expect(s.tiers.map((t) => t.tier)).toEqual(["standard", "family", "diagnostic"]);
  });

  it("computes each tier's share of total accounts", () => {
    const rows: BillingRow[] = [
      { tier: "standard", status: "active", count: 3 },
      { tier: "family", status: "active", count: 1 },
    ];
    const s = summarizeBilling(rows);
    expect(s.tiers.find((t) => t.tier === "standard")!.percent).toBe(75);
    expect(s.tiers.find((t) => t.tier === "family")!.percent).toBe(25);
  });
});

describe("parentMonthlyMrr", () => {
  it("is the tier price when active, else £0", () => {
    expect(parentMonthlyMrr("standard", "active")).toBe(49);
    expect(parentMonthlyMrr("family", "active")).toBe(99);
    expect(parentMonthlyMrr("standard", "trialing")).toBe(0);
    expect(parentMonthlyMrr("family", "past_due")).toBe(0);
    expect(parentMonthlyMrr("diagnostic", "active")).toBe(0);
  });
});

describe("formatting", () => {
  it("formats whole-pound GBP with separators", () => {
    expect(formatGbp(0)).toBe("£0");
    expect(formatGbp(1284)).toBe("£1,284");
  });

  it("formats compact GBP for headline figures", () => {
    expect(formatGbpCompact(0)).toBe("£0");
    expect(formatGbpCompact(850)).toBe("£850");
    expect(formatGbpCompact(113_476)).toBe("£113k");
    expect(formatGbpCompact(1_360_000)).toBe("£1.36M");
  });
});

describe("TIER_MONTHLY_GBP", () => {
  it("mirrors the /pricing list prices", () => {
    expect(TIER_MONTHLY_GBP.diagnostic).toBe(0);
    expect(TIER_MONTHLY_GBP.standard).toBe(49);
    expect(TIER_MONTHLY_GBP.family).toBe(99);
  });
});
