# Operations Runbook

[← README](../README.md) · see also [ARCHITECTURE](ARCHITECTURE.md), [API](API.md), [COMPLIANCE](COMPLIANCE.md)

What to do when something breaks. HEXA deploys via **push-to-`main` → Vercel**;
there is no staging, so the fastest fix for most incidents is a **rollback on
Vercel** (instant, no rebuild) followed by a proper revert commit.

Quick probe: **`GET /api/health`** returns `{ ok, db }` — `ok:true` + `db:"up"`
means the app and MongoDB are both reachable.

---

## 1. Site is down (5xx / blank / not loading)

1. **Check Vercel** → the project's **Deployments** tab. Is the latest deploy
   `Ready`, `Error`, or `Building`?
2. Open **`https://<prod-domain>/api/health`**:
   - 200 `{ ok:true, db:"up" }` → app + DB fine; suspect a specific route or the
     CDN/edge — check Vercel **Logs** and Sentry.
   - 503 / `db:"down"` → go to **§2 (DB unreachable)**.
   - No response at all → platform/deploy issue; continue below.
3. **If the latest deploy is broken → roll back immediately** (see **§4**).
4. Check the **Vercel status page** (status.vercel.com) for a platform incident.
5. Once stable, capture the Sentry errors and the bad commit for the postmortem.

## 2. Database unreachable (`/api/health` shows `db:"down"`, 503s on data pages)

1. **MongoDB Atlas** → cluster **Metrics / Alerts**. Is the cluster up, paused,
   or over connection limit?
2. **IP allowlist**: Atlas → Network Access. Vercel's egress IPs (or `0.0.0.0/0`
   if that's the chosen posture) must be allowed. A recent Atlas change is a
   common cause.
3. **Credentials**: confirm `MONGODB_URI` / `MONGODB_DB` in Vercel → Settings →
   Environment Variables haven't been rotated/cleared.
4. Re-probe `/api/health` after each change. The app degrades to clean 503s by
   design — feature keys are optional — so a DB outage shouldn't crash the
   process, only the data routes.

## 3. Stripe webhook failing (billing state stuck)

`/api/billing/webhook` is the **only** writer of billing state. If a parent paid
but their tier didn't change:

1. **Stripe Dashboard → Developers → Webhooks →** the endpoint → **Attempts**.
   Look for non-2xx deliveries.
2. Common causes:
   - **Signature mismatch** → `STRIPE_WEBHOOK_SECRET` in Vercel doesn't match the
     endpoint's signing secret. Copy it from the Stripe endpoint and redeploy.
   - **Endpoint 404/405** → the webhook URL is wrong; it must point at
     `https://<prod-domain>/api/billing/webhook`.
   - **5xx** → check Vercel logs for that route; often a missing env var.
3. After fixing, use Stripe's **"Resend"** on the failed events to replay them.
4. Price/tier mapping lives in `lib/billing/stripe.ts` — a new price id needs the
   matching `STRIPE_PRICE_*` env var.

## 4. Bad deploy shipped — instant rollback

The push that broke `main` is already live. Restore the previous good build
**without** waiting for a rebuild:

1. **Vercel → Deployments →** find the last `Ready` deploy from before the break.
2. **⋯ menu → Promote to Production** (a.k.a. "Rollback"). It's live in seconds.
3. Now fix `main` properly:
   ```bash
   git revert <bad-commit-sha>     # creates a clean inverse commit
   # verify locally:
   npm run type-check && npm test && npm run build
   git push origin main            # this redeploys the fixed main
   ```
4. If several commits are involved, revert the range or `git revert --no-commit`
   each then commit once. Never force-push `main`.

## 5. Sentry error spike

1. **Sentry → Issues**, sort by **events** and by **users affected**. Triage by
   *users-affected first* — a single error hitting many families outranks a noisy
   one hitting nobody.
2. Events are tagged `route_group` (marketing / auth / dashboard / child / admin /
   api) — **child** and **api** (tutor/tts/stt) are highest priority.
3. Privacy invariant: events carry **no PII** (stack traces + route names only),
   so reproduce from the route + stack, not from user data. Do not add PII to
   debug (`lib/monitoring/sentry-shared.ts` must keep scrubbing).
4. If the spike is from a deploy, roll back (**§4**) then fix forward.

## 6. MongoDB Atlas backups

- **What's enabled:** Atlas cloud backups (continuous / scheduled snapshots)
  depend on the cluster tier. **Owner action:** verify in **Atlas → Cluster →
  Backup** that snapshots are ON and note the schedule + retention. Free/shared
  tiers (M0/M2/M5) have limited or no backup — if production is on one, plan an
  upgrade or a scheduled `mongodump`.
- **Restore steps:** Atlas → Cluster → **Backup → Restore** → choose a snapshot →
  restore to the same or a new cluster. If restoring to a new cluster, update
  `MONGODB_URI` in Vercel and redeploy. Test `/api/health` after.
- **Data residency:** children's data residency follows the Atlas cluster region
  (see the compliance note in `lib/mongodb.ts`) — keep restores in-region.

---

## Owner checklist (verify these in the live dashboards)

- [ ] Atlas backup schedule + retention confirmed (§6).
- [ ] Atlas Network Access allowlist matches Vercel egress (§2).
- [ ] Stripe webhook endpoint URL + signing secret match Vercel env (§3).
- [ ] Sentry alert rules route child/api errors to the owner.
