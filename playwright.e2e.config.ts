import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load .env.local into process.env for LOCAL runs (matches the seed scripts'
 * no-dotenv convention). Never overrides an already-set var, so CI secrets win.
 * Without this, `npm run test:e2e` locally has no SMOKE_* creds and every spec
 * skips. Workers inherit process.env from this (main) process at fork time.
 */
try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  /* no .env.local — rely on real env (CI secrets) */
}

/**
 * Authenticated FEATURE end-to-end suite. Runs against the DEPLOYED site
 * (SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL), never a local server.
 *
 * A `setup` project (e2e/auth.setup.ts) logs in once as each smoke account and
 * saves storageState; feature specs then start already authenticated. Naming
 * convention picks the account + safety posture:
 *
 *   e2e/features/<name>.parent.spec.ts  -> runs as the PARENT smoke account.
 *       Writes are SAFE here: the data-silo isolates them to the smoke family
 *       (child "Sam Smoke"), so they never touch a real family. Runs desktop +
 *       mobile.
 *
 *   e2e/features/<name>.admin.spec.ts   -> runs as the full ADMIN account.
 *       READ-ONLY only (goto / assert / screenshot). NEVER script a destructive
 *       admin action against production — that belongs on a staging DB.
 *
 * Specs skip cleanly when their creds are absent (forks / no secrets).
 * See docs/TESTING.md.
 */
// Always the DEPLOYED site — never a local server. NEXT_PUBLIC_APP_URL is
// deliberately NOT used here: it's localhost in a dev .env.local. Override with
// SMOKE_BASE_URL to point at a preview deploy.
const baseURL = process.env.SMOKE_BASE_URL || "https://edway.uk";

const PARENT_STORAGE = "e2e/.auth/parent.json";
const ADMIN_STORAGE = "e2e/.auth/admin.json";

export default defineConfig({
  testDir: "./e2e",
  // Only this suite's setup + feature specs — never the smoke/admin-mobile files.
  testMatch: /(auth\.setup|features[\\/].*\.spec)\.ts$/,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 12_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "parent",
      testMatch: /features[\\/].*\.parent\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: PARENT_STORAGE },
    },
    {
      name: "parent-mobile",
      testMatch: /features[\\/].*\.parent\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 5"], storageState: PARENT_STORAGE },
    },
    {
      name: "admin",
      testMatch: /features[\\/].*\.admin\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STORAGE },
    },
  ],
});
