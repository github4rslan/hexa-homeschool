import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * F4 — a real, repeatable accessibility audit (axe-core) for the QA pass.
 *
 * A children's platform treats a11y as a compliance obligation, not polish, so
 * this turns the previously-heuristic manual probing into an automated tripwire
 * that catches regressions (e.g. missing labels, low contrast, small targets).
 *
 * Dev-only tooling: runs against the DEPLOYED site via read-only navigations,
 * never bundled into the app and never run against a child's real data.
 *
 * The audit prints every violation grouped by impact (critical / serious /
 * moderate / minor) so a human can triage, and FAILS the run on any `critical`
 * violation — the highest bar, so it never goes red on a pre-existing lesser
 * issue while still tripwiring the worst regressions.
 */
export async function auditPage(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const byImpact: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  for (const v of results.violations) {
    const impact = v.impact ?? "minor";
    byImpact[impact] = (byImpact[impact] ?? 0) + 1;
  }

  // Human-readable summary for the QA log (visible in `list`/`github` reporter).
  console.log(
    `\n[a11y] ${label}: ` +
      `critical=${byImpact.critical} serious=${byImpact.serious} ` +
      `moderate=${byImpact.moderate} minor=${byImpact.minor}`,
  );
  for (const v of results.violations) {
    console.log(
      `  [${v.impact ?? "minor"}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`,
    );
  }

  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(
    critical,
    `${label} has ${critical.length} critical a11y violation(s): ` +
      critical.map((v) => v.id).join(", "),
  ).toEqual([]);
}
