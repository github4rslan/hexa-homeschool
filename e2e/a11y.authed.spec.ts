import { test } from "@playwright/test";
import { auditPage } from "./a11y-audit";

/**
 * F4 — accessibility audit for AUTHENTICATED surfaces (parent dashboard + a
 * child lesson). Runs as the smoke parent (storageState from auth.setup), and
 * skips cleanly when SMOKE_* creds are absent. Read-only navigations only; the
 * child lesson is reached via the parent's active-child cookie. See docs/TESTING.md.
 */
const hasParent = Boolean(process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD);

test.describe("a11y — authenticated pages", () => {
  test.skip(!hasParent, "SMOKE_EMAIL / SMOKE_PASSWORD not set");

  test("parent dashboard has no critical violations", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await auditPage(page, "dashboard /dashboard");
  });

  test("child hub has no critical violations", async ({ page }) => {
    // Child mode resolves the active child from the parent session cookie.
    await page.goto("/learn");
    // If there's no active child yet, /learn bounces to the dashboard — don't
    // fail the a11y pass on a data precondition, just skip this navigation.
    if (!/\/learn/.test(page.url())) {
      test.skip(true, "no active child for the smoke parent");
      return;
    }
    await auditPage(page, "child /learn");
  });

  // F6 — the actual lesson surface (the deepest, most animation-heavy child
  // page) wasn't covered by the original authed sweep; the hub alone doesn't
  // exercise the interactive question renderer.
  test("a real lesson page has no critical violations", async ({ page }) => {
    await page.goto("/learn");
    if (!/\/learn/.test(page.url())) {
      test.skip(true, "no active child for the smoke parent");
      return;
    }
    const lessonLink = page.locator('a[href^="/learn/lesson"]').first();
    if ((await lessonLink.count()) === 0) {
      test.skip(true, "no playable quest for the smoke child today");
      return;
    }
    await lessonLink.click();
    await page.waitForURL(/\/learn\/lesson/, { timeout: 15_000 });
    await auditPage(page, "child /learn/lesson");
  });
});
