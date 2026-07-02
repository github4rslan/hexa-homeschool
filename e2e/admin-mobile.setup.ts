import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Auth setup for the admin mobile harness. Logs in ONCE as the seeded admin and
 * saves storageState so the mobile specs start authenticated. Creds come from
 * env only (SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD) — never committed. Skips
 * cleanly when they're absent.
 *
 * Read-only discipline: this only performs the login the harness needs; it never
 * touches an admin mutation.
 */
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;
const STORAGE = "e2e/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  setup.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD not set",
  );

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL!);
  await page.getByLabel(/password/i).first().fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in|log ?in/i }).click();
  // A staff account may land on /dashboard first; wait for any signed-in target.
  await page.waitForURL(/\/dashboard|\/onboarding|\/admin/, { timeout: 20_000 });

  // Confirm the session actually reaches the admin surface (role gate passes).
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });

  mkdirSync("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: STORAGE });
});
