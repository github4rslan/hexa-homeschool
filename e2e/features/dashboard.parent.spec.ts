import { test, expect } from "@playwright/test";

/**
 * Example PARENT feature spec — proves the parent auth fixture works.
 * Authenticated as the smoke parent (storageState); read-only here, but parent
 * specs MAY write (the data-silo isolates them to the smoke family). Copy this
 * shape for real parent/child feature tests. See docs/TESTING.md.
 */
const hasParent = Boolean(process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD);

test.describe("parent dashboard (authenticated fixture)", () => {
  test.skip(!hasParent, "SMOKE_EMAIL / SMOKE_PASSWORD not set");

  test("lands on the dashboard already signed in", async ({ page }) => {
    await page.goto("/dashboard");
    // Not bounced to /login → the storageState session is live.
    await expect(page).toHaveURL(/\/dashboard/);
    // The seeded smoke child ("Sam Smoke") is present somewhere on the page.
    await expect(page.getByText(/sam/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
