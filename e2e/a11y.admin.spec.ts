import { test } from "@playwright/test";
import { auditPage } from "./a11y-audit";

/**
 * F6 — accessibility audit for the STAFF surface (/admin). Runs as the smoke
 * admin (storageState from auth.setup's "authenticate as admin"), and skips
 * cleanly when SMOKE_ADMIN_* creds are absent. Read-only navigation only.
 * See docs/TESTING.md.
 */
const hasAdmin = Boolean(
  process.env.SMOKE_ADMIN_EMAIL && process.env.SMOKE_ADMIN_PASSWORD,
);

test.describe("a11y — admin pages", () => {
  test.skip(!hasAdmin, "SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD not set");

  test("admin overview has no critical violations", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    await auditPage(page, "admin /admin");
  });
});
