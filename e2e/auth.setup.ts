import { test as setup, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

/**
 * Shared auth setup for the authenticated feature-test suite
 * (playwright.e2e.config.ts). Logs in ONCE as each smoke account and saves a
 * storageState, so every feature spec starts already authenticated:
 *
 *   - parent  -> e2e/.auth/parent.json  (smoke@…, isolated to the smoke family)
 *   - admin   -> e2e/.auth/admin.json   (full admin — READ-ONLY specs only)
 *
 * Creds come from env ONLY (SMOKE_EMAIL/SMOKE_PASSWORD, SMOKE_ADMIN_EMAIL/
 * SMOKE_ADMIN_PASSWORD) — never committed; /e2e/.auth is gitignored. When a
 * credential is absent (forks, PRs without secrets) that setup writes an empty
 * state and SKIPS, and the dependent specs skip too — same discipline as
 * e2e/smoke.spec.ts. See docs/TESTING.md.
 */

const PARENT_EMAIL = process.env.SMOKE_EMAIL;
const PARENT_PASSWORD = process.env.SMOKE_PASSWORD;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;

const PARENT_STORAGE = "e2e/.auth/parent.json";
const ADMIN_STORAGE = "e2e/.auth/admin.json";
const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /sign in|log ?in/i }).click();
}

setup("authenticate as parent", async ({ page }) => {
  mkdirSync("e2e/.auth", { recursive: true });
  if (!PARENT_EMAIL || !PARENT_PASSWORD) {
    writeFileSync(PARENT_STORAGE, EMPTY_STATE);
    setup.skip(true, "SMOKE_EMAIL / SMOKE_PASSWORD not set");
    return;
  }
  await signIn(page, PARENT_EMAIL, PARENT_PASSWORD);
  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 20_000 });
  await page.context().storageState({ path: PARENT_STORAGE });
});

setup("authenticate as admin", async ({ page }) => {
  mkdirSync("e2e/.auth", { recursive: true });
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    writeFileSync(ADMIN_STORAGE, EMPTY_STATE);
    setup.skip(true, "SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD not set");
    return;
  }
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.waitForURL(/\/dashboard|\/onboarding|\/admin/, { timeout: 20_000 });
  // Confirm the staff role gate actually passes.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
  await page.context().storageState({ path: ADMIN_STORAGE });
});
