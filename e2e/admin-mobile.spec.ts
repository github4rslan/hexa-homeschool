import { test, expect, type Page } from "@playwright/test";

/**
 * Admin mobile layout harness — READ-ONLY. For every admin route it:
 *   1. navigates (already authenticated via saved storageState),
 *   2. asserts NO horizontal overflow (scrollWidth <= clientWidth),
 *   3. asserts the ≥44px hamburger is present,
 *   4. opens the mobile nav drawer, asserts it, screenshots, closes it.
 *
 * GUARDRAIL: this signs in as a FULL admin against production, so it NEVER
 * clicks a destructive control (delete / suspend / role-change). Only goto,
 * assert, open-drawer, screenshot. Destructive logic is covered by unit tests.
 *
 * Skips cleanly when SMOKE_ADMIN_* creds are absent (no storageState written).
 */
const hasAdmin = Boolean(
  process.env.SMOKE_ADMIN_EMAIL && process.env.SMOKE_ADMIN_PASSWORD,
);

const ADMIN_ROUTES = [
  ["dashboard", "/admin"],
  ["users", "/admin/users"],
  ["finance", "/admin/finance"],
  ["experiments", "/admin/experiments"],
  ["compliance", "/admin/compliance"],
  ["curriculum", "/admin/curriculum"],
  ["escalations", "/admin/escalations"],
  ["tutors", "/admin/tutors"],
  ["agents", "/admin/agents"],
  ["settings", "/admin/settings"],
  ["audit", "/admin/audit"],
  ["staff", "/admin/staff"],
] as const;

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test.describe("admin mobile layout", () => {
  test.skip(!hasAdmin, "SMOKE_ADMIN_* not set");

  for (const [name, route] of ADMIN_ROUTES) {
    test(`${name} — no horizontal overflow + working drawer`, async ({
      page,
    }, testInfo) => {
      await page.goto(route);
      // The role gate must have kept us on the admin surface.
      await expect(page).toHaveURL(/\/admin/);

      // The topbar hamburger (mobile nav trigger) must exist and meet 44px.
      const hamburger = page.getByRole("button", { name: /open menu/i });
      await expect(hamburger).toBeVisible();
      const box = await hamburger.boundingBox();
      expect(box, "hamburger has a bounding box").not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);

      // No horizontal overflow (allow sub-pixel rounding).
      const overflow = await horizontalOverflow(page);
      expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);

      await page.screenshot({
        path: `e2e/screenshots/${testInfo.project.name}/${name}.png`,
        fullPage: true,
      });

      // Open the mobile nav drawer and confirm it renders + traps.
      await hamburger.click();
      const drawer = page.getByRole("dialog", { name: /admin navigation/i });
      await expect(drawer).toBeVisible();
      await expect(
        drawer.getByRole("link", { name: /users/i }).first(),
      ).toBeVisible();
      await page.screenshot({
        path: `e2e/screenshots/${testInfo.project.name}/${name}-drawer.png`,
      });

      // Close via Escape and confirm it dismisses (no destructive taps).
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
    });
  }
});
