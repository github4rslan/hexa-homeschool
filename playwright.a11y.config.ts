import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * F4 — dedicated accessibility-audit config (@axe-core/playwright). Dev-only
 * QA tooling: runs against the DEPLOYED site (SMOKE_BASE_URL or edway.uk) with
 * read-only navigations, never a local server and never bundled into the app.
 *
 * Two projects:
 *   - public  : marketing + auth pages, no secrets needed.
 *   - authed  : parent dashboard + child lesson, using the shared auth.setup
 *               storageState; skips cleanly without SMOKE_* creds.
 *
 * Run with `npm run a11y`.
 */

// Load .env.local for LOCAL runs (same convention as playwright.e2e.config.ts).
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

const baseURL = process.env.SMOKE_BASE_URL || "https://edway.uk";
const PARENT_STORAGE = "e2e/.auth/parent.json";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /(auth\.setup|a11y\.(public|authed)\.spec)\.ts$/,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 12_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "public",
      testMatch: /a11y\.public\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authed",
      testMatch: /a11y\.authed\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: PARENT_STORAGE },
    },
  ],
});
