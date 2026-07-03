# Testing — live E2E with the smoke accounts

Edway verifies features **live** using two dedicated, isolated accounts that
Playwright logs into. This is how you prove a feature works end-to-end (parent
submits → admin sees it), not just that it builds.

## The accounts

| Account | Env vars | Created by | Use for |
|---|---|---|---|
| **Parent smoke** (`smoke@edway.uk`, child "Sam Smoke") | `SMOKE_EMAIL` / `SMOKE_PASSWORD` | `npm run smoke:setup` | All parent + child feature tests. **Writes are safe** — the data-silo isolates them to the smoke family; they never touch a real family. |
| **Admin** (`admin@edway.uk`) | `SMOKE_ADMIN_EMAIL` / `SMOKE_ADMIN_PASSWORD` | `npm run seed:admin` | Admin console checks — **READ-ONLY only** (it's a full admin against production). |

Both accounts are flagged (smoke: `is_smoke_account`, excluded from
analytics/lifecycle) so they never pollute real metrics.

Creds live in `.env.local` locally and in **GitHub → Settings → Secrets and
variables → Actions** for CI. They are NEVER committed. `/e2e/.auth` (saved
sessions) is gitignored.

## The safety split (important)

- **Parent smoke → may write.** Complete a lesson, submit feedback, change
  settings — all fine; it only affects Sam Smoke's records.
- **Admin → read-only against prod.** Navigate, assert, screenshot. **Never**
  script a destructive action (delete family, grant/revoke role, cancel plan)
  against production.
- **Admin-write / destructive E2E → staging only.** Test those against a preview
  deploy with a staging DB, or with unit tests + mocks — never the live admin
  session.

## How the fixture works

`e2e/auth.setup.ts` logs in once as each account and saves a storageState
(`e2e/.auth/parent.json`, `e2e/.auth/admin.json`). Feature specs then start
already authenticated — no per-test login. Config: `playwright.e2e.config.ts`.

## Writing a feature test (the convention)

Name the spec by the account it needs — the config routes it automatically:

- `e2e/features/<name>.parent.spec.ts` → runs authenticated as the **parent**
  (desktop + mobile projects). Writes allowed.
- `e2e/features/<name>.admin.spec.ts` → runs authenticated as the **admin**
  (read-only).

Each spec `test.skip`s cleanly when its creds are absent (so forks / secret-less
CI don't fail). See the two examples:
- `e2e/features/dashboard.parent.spec.ts`
- `e2e/features/admin-overview.admin.spec.ts`

```ts
// e2e/features/feedback.parent.spec.ts
const hasParent = Boolean(process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD);
test.describe("parent feedback", () => {
  test.skip(!hasParent, "SMOKE_EMAIL / SMOKE_PASSWORD not set");
  test("submit feedback → success", async ({ page }) => {
    await page.goto("/dashboard");
    // … open the widget, submit 5 stars + "[[e2e-<ts>]] great", assert success
  });
});
```

## Data hygiene

- Tag any E2E-created data with a recognisable marker (e.g. `[[e2e-<timestamp>]]`)
  so it can be filtered out of real views or cleaned up.
- Refresh the smoke family anytime with `npm run smoke:setup` (idempotent).

## Running

```bash
npm run test:e2e            # authenticated feature suite (parent + admin)
npm run test:admin-mobile   # admin mobile layout harness (read-only)
npm run smoke               # public post-deploy smoke suite
```

All run against the deployed site (`SMOKE_BASE_URL` or `edway.uk`), never a local
server. In CI they run only when the matching secrets are present.

## The rule of thumb

Every feature task should end by **verifying live with these fixtures**: parent
smoke for the parent/child side (writes OK), admin for read-only admin checks,
staging for anything destructive. That's how a feature is "done".
