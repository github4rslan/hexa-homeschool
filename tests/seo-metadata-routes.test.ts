import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("robots.ts", () => {
  const rules = robots().rules;
  const rule = Array.isArray(rules) ? rules[0] : rules;
  const disallow = Array.isArray(rule?.disallow)
    ? rule.disallow
    : rule?.disallow
      ? [rule.disallow]
      : [];

  it("disallows every authenticated route group", () => {
    for (const path of [
      "/learn",
      "/learn/*",
      "/admin",
      "/admin/*",
      "/tutor",
      "/tutor/*",
      "/schedule",
      "/schedule/*",
      "/portfolio",
      "/portfolio/*",
      "/settings",
      "/settings/*",
      "/tutoring",
      "/tutoring/*",
      "/compliance/cnis",
    ]) {
      expect(disallow).toContain(path);
    }
  });

  it("leaves the public /compliance marketing page allowed", () => {
    expect(disallow).not.toContain("/compliance");
    expect(disallow).not.toContain("/compliance/*");
  });
});

describe("sitemap.ts", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("includes the real published /gallery and /resources pages", () => {
    expect(urls.some((u) => u.endsWith("/gallery"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/resources"))).toBe(true);
  });
});
