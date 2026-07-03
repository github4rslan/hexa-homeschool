import { test, expect } from "@playwright/test";

/**
 * Example ADMIN feature spec — proves the admin auth fixture works.
 * Authenticated as the full admin (storageState). READ-ONLY: navigate + assert
 * only. NEVER click a destructive admin action here (that belongs on a staging
 * DB, not production). Copy this shape for read-only admin checks. See
 * docs/TESTING.md.
 */
const hasAdmin = Boolean(
  process.env.SMOKE_ADMIN_EMAIL && process.env.SMOKE_ADMIN_PASSWORD,
);

test.describe("admin console (authenticated fixture, read-only)", () => {
  test.skip(!hasAdmin, "SMOKE_ADMIN_* not set");

  test("reaches the admin surface (role gate passes)", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    // No horizontal overflow at this width (read-only layout assertion).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBeFalsy();
  });
});
