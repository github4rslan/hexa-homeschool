import { describe, expect, it } from "vitest";
import { parseCspReport } from "@/lib/security/csp-report";

describe("parseCspReport (F3: CSP violation reporting)", () => {
  it("parses the legacy report-uri wrapped payload", () => {
    const summary = parseCspReport({
      "csp-report": {
        "document-uri": "https://edway.uk/dashboard?token=secret",
        "violated-directive": "script-src 'self'",
        "blocked-uri": "https://evil.example.com/x.js?a=1",
        "script-sample": "alert(1)",
        referrer: "https://edway.uk/",
      },
    });
    expect(summary).toEqual({
      documentUri: "https://edway.uk/dashboard",
      violatedDirective: "script-src 'self'",
      blockedUri: "https://evil.example.com/x.js",
    });
  });

  it("accepts a bare (unwrapped) object with the same fields", () => {
    const summary = parseCspReport({
      "document-uri": "https://edway.uk/",
      "violated-directive": "style-src 'self'",
      "blocked-uri": "inline",
    });
    expect(summary).toEqual({
      documentUri: "https://edway.uk/",
      violatedDirective: "style-src 'self'",
      blockedUri: "inline",
    });
  });

  it("strips query strings and fragments even outside the shared Sentry scrubber", () => {
    const summary = parseCspReport({
      "csp-report": {
        "document-uri": "https://edway.uk/settings?email=parent@example.com#top",
        "violated-directive": "img-src 'self'",
        "blocked-uri": "https://cdn.example.com/track.gif?uid=42",
      },
    });
    expect(summary?.documentUri).toBe("https://edway.uk/settings");
    expect(summary?.blockedUri).toBe("https://cdn.example.com/track.gif");
  });

  it("strips fields the report did not ask to keep (e.g. script-sample)", () => {
    const summary = parseCspReport({
      "csp-report": {
        "document-uri": "https://edway.uk/",
        "violated-directive": "script-src 'self'",
        "blocked-uri": "eval",
        "script-sample": "document.cookie",
        "status-code": 200,
      },
    });
    expect(summary).not.toHaveProperty("script-sample");
    expect(summary).not.toHaveProperty("status-code");
    expect(Object.keys(summary ?? {}).sort()).toEqual([
      "blockedUri",
      "documentUri",
      "violatedDirective",
    ]);
  });

  it("returns null for a payload with no recognisable fields", () => {
    expect(parseCspReport({ foo: "bar" })).toBeNull();
    expect(parseCspReport(null)).toBeNull();
    expect(parseCspReport("not an object")).toBeNull();
    expect(parseCspReport(42)).toBeNull();
  });

  it("caps each field's length so a malformed report can't bloat storage", () => {
    const huge = "a".repeat(10_000);
    const summary = parseCspReport({
      "csp-report": { "violated-directive": huge },
    });
    expect(summary?.violatedDirective.length).toBeLessThanOrEqual(500);
  });
});
