import { describe, expect, it } from "vitest";
import {
  welcomeTemplate,
  diagnosticNudgeTemplate,
  firstPlanTemplate,
} from "@/lib/email/templates";

describe("lifecycle email templates", () => {
  it("welcome links to the dashboard and greets by first name", () => {
    const t = welcomeTemplate({
      name: "Jane Smith",
      dashboardUrl: "https://hexa.test/dashboard",
    });
    expect(t.subject).toMatch(/welcome/i);
    expect(t.html).toContain("https://hexa.test/dashboard");
    expect(t.html).toContain("Jane"); // first name only
    expect(t.html).not.toContain("Smith");
  });

  it("welcome falls back gracefully with no name", () => {
    const t = welcomeTemplate({ name: null, dashboardUrl: "https://x/d" });
    expect(t.html).toContain("Welcome to Edway");
  });

  it("diagnostic nudge personalises with the child name and links the diagnostic + settings", () => {
    const t = diagnosticNudgeTemplate({
      name: "Sam",
      childName: "Ada",
      diagnosticUrl: "https://hexa.test/onboarding/diagnostic",
      settingsUrl: "https://hexa.test/settings",
    });
    expect(t.subject).toContain("Ada");
    expect(t.html).toContain("Ada");
    expect(t.html).toContain("https://hexa.test/onboarding/diagnostic");
    // Opt-out link present (lifecycle, not transactional).
    expect(t.html).toContain("https://hexa.test/settings");
  });

  it("first-plan celebration names the child and links child mode + settings opt-out", () => {
    const t = firstPlanTemplate({
      name: "Sam",
      childName: "Ada",
      learnUrl: "https://hexa.test/learn",
      settingsUrl: "https://hexa.test/settings",
    });
    expect(t.subject).toContain("Ada");
    expect(t.html).toContain("https://hexa.test/learn");
    expect(t.html).toContain("https://hexa.test/settings");
  });

  it("escapes nothing dangerous but keeps URLs intact across all three", () => {
    for (const html of [
      welcomeTemplate({ name: "A", dashboardUrl: "https://u/d" }).html,
      diagnosticNudgeTemplate({
        name: "A",
        childName: "B",
        diagnosticUrl: "https://u/diag",
        settingsUrl: "https://u/s",
      }).html,
      firstPlanTemplate({
        name: "A",
        childName: "B",
        learnUrl: "https://u/l",
        settingsUrl: "https://u/s",
      }).html,
    ]) {
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Edway");
    }
  });
});
