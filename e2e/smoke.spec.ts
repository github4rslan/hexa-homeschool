import { test, expect, type Page } from "@playwright/test";

/**
 * Post-deploy smoke suite — a tripwire, not coverage. Read-only against
 * production except the login flow, which uses the dedicated smoke account.
 * Selectors are role/label-based so copy tweaks don't break them.
 *
 * Login-gated tests SKIP cleanly (not fail) when SMOKE_EMAIL / SMOKE_PASSWORD
 * are absent (forks, PRs).
 */

const SMOKE_EMAIL = process.env.SMOKE_EMAIL;
const SMOKE_PASSWORD = process.env.SMOKE_PASSWORD;
const hasSmokeAccount = Boolean(SMOKE_EMAIL && SMOKE_PASSWORD);

/** Fail the test if the page logged any console error. */
function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(SMOKE_EMAIL!);
  await page.getByLabel(/password/i).first().fill(SMOKE_PASSWORD!);
  await page.getByRole("button", { name: /sign in|log ?in/i }).click();
  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15_000 });
}

test.describe("public pages", () => {
  test("home renders with a visible primary CTA and no console errors", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/HEXA/i);
    // At least one prominent call-to-action link is visible.
    await expect(page.getByRole("link", { name: /get started|start|sign up/i }).first()).toBeVisible();
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("pricing shows three tiers", async ({ page }) => {
    await page.goto("/pricing");
    // Three plan names appear somewhere on the page.
    await expect(page.getByText(/diagnostic/i).first()).toBeVisible();
    await expect(page.getByText(/complete/i).first()).toBeVisible();
    await expect(page.getByText(/partner/i).first()).toBeVisible();
  });

  test("sitemap and robots respond 200", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect((await request.get("/robots.txt")).status()).toBe(200);
  });

  test("/api/health returns 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
  });
});

test.describe("auth gating", () => {
  test("a protected page redirects anonymous users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("smoke account (login-gated)", () => {
  test.skip(!hasSmokeAccount, "SMOKE_EMAIL / SMOKE_PASSWORD not set");

  test("login lands on the dashboard showing the child's name", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");
    await expect(page.getByText(/Sam/i).first()).toBeVisible();
  });

  test("/schedule renders the week with plan items", async ({ page }) => {
    await login(page);
    await page.goto("/schedule");
    // A known seeded topic title from the smoke plan.
    await expect(page.getByText(/Fractions|Inference|Cells/i).first()).toBeVisible();
  });

  test("child-mode progress map renders nodes", async ({ page }) => {
    await login(page);
    await page.goto("/learn/map");
    await expect(page.getByRole("heading", { name: /journey/i }).first()).toBeVisible();
  });

  test("/admin is blocked for the non-staff smoke account", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    // Non-staff are redirected to the dashboard.
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("dashboard has no horizontal overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await login(page);
    await page.goto("/dashboard");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1); // allow sub-pixel rounding
  });
});
