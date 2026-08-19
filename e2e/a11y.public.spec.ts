import { test } from "@playwright/test";
import { auditPage } from "./a11y-audit";

/**
 * F4 — accessibility audit for PUBLIC surfaces (no auth). Marketing + auth
 * pages are always reachable, so this project needs no secrets and runs
 * everywhere. Read-only navigations only. See docs/TESTING.md.
 */
test.describe("a11y — public pages", () => {
  test("marketing home page has no critical violations", async ({ page }) => {
    await page.goto("/");
    await auditPage(page, "marketing /");
  });

  test("login page has no critical violations", async ({ page }) => {
    await page.goto("/login");
    await auditPage(page, "auth /login");
  });

  // F6 — /pricing is one of the highest-traffic marketing pages (the funnel's
  // conversion surface) and wasn't covered by the original public sweep.
  test("pricing page has no critical violations", async ({ page }) => {
    await page.goto("/pricing");
    await auditPage(page, "marketing /pricing");
  });
});
