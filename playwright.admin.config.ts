import { defineConfig, devices } from "@playwright/test";

/**
 * Authenticated ADMIN mobile harness — separate from the public smoke config so
 * the two never cross-run. Runs against the DEPLOYED site (SMOKE_BASE_URL or
 * NEXT_PUBLIC_APP_URL), never a local server.
 *
 * A `setup` project logs in once as the seeded admin (SMOKE_ADMIN_EMAIL /
 * SMOKE_ADMIN_PASSWORD) and saves `storageState`; the mobile projects reuse it
 * so every spec starts already authenticated. When the creds are absent (forks,
 * PRs) the setup + specs SKIP cleanly — same discipline as e2e/smoke.spec.ts.
 *
 * GUARDRAIL: because this is a FULL-ADMIN session against production, the specs
 * are strictly READ-ONLY — goto / assert-no-overflow / open the drawer /
 * screenshot only. They must NEVER click a destructive admin action.
 */
const baseURL =
  process.env.SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://edway.uk";

const ADMIN_STORAGE = "e2e/.auth/admin.json";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /admin-mobile\.(setup|spec)\.ts/,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 12_000,
  },
  projects: [
    { name: "setup", testMatch: /admin-mobile\.setup\.ts/ },
    {
      name: "mobile-360",
      testMatch: /admin-mobile\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 780 },
        storageState: ADMIN_STORAGE,
      },
    },
    {
      name: "mobile-393",
      testMatch: /admin-mobile\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 5"], storageState: ADMIN_STORAGE }, // ~393px
    },
    {
      name: "tablet-768",
      testMatch: /admin-mobile\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["iPad Mini"], storageState: ADMIN_STORAGE }, // 768px
    },
  ],
});
