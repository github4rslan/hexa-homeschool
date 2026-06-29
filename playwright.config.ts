import { defineConfig, devices } from "@playwright/test";

/**
 * Post-deploy smoke config. Runs against the DEPLOYED production site (or a
 * SMOKE_BASE_URL override) — never a local server. Kept tiny: one Chromium
 * project, short timeouts, a couple of retries to ride out a just-flipped
 * Vercel deploy. Login-gated specs skip themselves when SMOKE_* secrets are
 * absent (see e2e/smoke.spec.ts).
 */
const baseURL =
  process.env.SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://edway.uk";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 2,
  workers: 4,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 10_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
