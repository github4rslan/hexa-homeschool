# API Routes

[← README](../README.md)

All routes are App Router route handlers under `src/app/api/`, `runtime = "nodejs"`,
`dynamic = "force-dynamic"`. Auth is the `hexa_session` JWT cookie (see
`lib/auth/session.ts`); "Parent" below means a valid session is required.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/tutor` | POST | Parent | Teaching Agent + Checker explanation for a question. Distress gate runs first (see [AI-AGENTS.md](AI-AGENTS.md)); escalations attribute to the active child. Rate-limited: 20 req/min per user. |
| `/api/tts` | POST | Parent | ElevenLabs narration for lesson text (≤ 1,200 chars). Caches audio in Cloudinary keyed by text+voice hash. Rate-limited: 30 req/min per user. |
| `/api/stt` | POST | Parent | ElevenLabs Scribe transcription of a spoken answer (multipart `audio`, ≤ 2 MB). **Transient**: audio is never stored. Runs the distress matcher on the transcript (freeze + escalate, like `/api/tutor`). Rate-limited: 20 req/min per user. |
| `/api/media/sign` | POST | Parent | Signs a direct client → Cloudinary upload (use-case folder derived server-side). |
| `/api/media` | POST | Parent | Registers a MediaDoc after successful Cloudinary upload. Re-validates ownership; trusts only server-verifiable fields. |
| `/api/portfolio` | POST | Optional | Generates a verified portfolio for `{ childName, term }`. Persists a dossier best-effort when a session + matching child exist. |
| `/api/newsletter` | POST | Public | Newsletter signup. Idempotent on email (unique index). |
| `/api/billing/checkout` | GET | Parent* | Redirects to Stripe Checkout for `?tier=standard\|family` (14-day trial). Signed-out visitors → `/signup`. Writes nothing — the webhook syncs state. |
| `/api/billing/portal` | GET | Parent | Redirects to the Stripe customer portal (plan change, card, cancel, invoices). No Stripe customer yet → `/pricing`. |
| `/api/billing/webhook` | POST | Stripe signature | Event sink and **only writer** of `subscription_tier` / `billing_status` / Stripe ids. Handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`. |
| `/api/digest/weekly` | GET | Cron | Weekly parent progress digest (lessons completed, topics certified, escalation count per child). Requires `Authorization: Bearer $CRON_SECRET`; scheduled Mondays 07:00 UTC via `vercel.json`. Skips opted-out parents (`weekly_digest_opt_out`) and fully-quiet weeks. 503 when `CRON_SECRET` or `BREVO_API_KEY` is unset. |
| `/api/account/export` | GET | Parent | UK GDPR data access: downloads the family's documents as JSON (parent-scoped in the repo layer; password/PIN hashes stripped). |
| `/api/health` | GET | Public | Liveness + MongoDB readiness probe for an external uptime monitor. 200 `{ ok, db: "up" }` on a successful db ping, 503 on failure. No auth, no data exposure, rate-limited 60/min per IP. |

## Conventions

- **Validation first**: malformed JSON → 400; missing required fields → 400;
  oversized input → 413 (`/api/tutor` caps fields at 2,000 chars, `/api/tts` at
  1,200 chars). Validate before touching the database or any paid API.
- **Auth failures** → 401 with `{ error: "Not signed in." }`.
- **Missing provider keys** → typed config errors (`AiConfigError`,
  `MediaConfigError`, `BillingConfigError`) surfaced as 503, never a crash.
  The billing redirect routes (checkout/portal) are the exception: they are
  user-facing navigations, so they redirect to `/settings?error=…` instead.
- **Ownership**: any route handling a `childId` re-checks ownership via repo
  functions (`parentOwnsChild`) — never trust client-sent ids.
- **Responses** are `NextResponse.json({ ... })`; errors always carry an `error`
  string.

## Entitlement (paid AI features)

`/api/tutor`, `/api/tts` and `/api/stt` are tier-gated via
`lib/billing/entitlement.ts` (`canUseAiFeatures`): while Stripe is **not**
configured (`STRIPE_SECRET_KEY` unset) every signed-in account is entitled
(pilot mode — there is no upgrade path to demand). Once billing is live, the
free `diagnostic` tier gets 403, and paid tiers lose access on
`canceled`/`paused` (`past_due` keeps a dunning grace window). The distress
gate in `/api/tutor` runs **before** the entitlement check, so a distress
message from an unpaid account still freezes and escalates.

## Rate limiting

`/api/tutor`, `/api/tts` and `/api/stt` require a session and apply a per-user
fixed-window limit via `lib/rate-limit.ts`; `/api/newsletter` applies a per-IP
limit (5/min) since it is public. Over-limit requests get 429 with a
`Retry-After` header. When `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
are set, limits are enforced in Upstash Redis and shared across all serverless
instances; when unset (or if Upstash errors), the limiter falls back to the
original in-memory per-instance buckets — degraded scope, never a crash. On
`/api/tutor` the limit is checked **after** the distress gate so a distress
message is never blocked.

## Billing flow (Stripe)

```
/pricing button ─► GET /api/billing/checkout?tier=… ─► Stripe Checkout
                                                        │ success → /settings?checkout=success
                                                        └ cancel  → /pricing
Stripe ─► POST /api/billing/webhook ─► repo.updateParentBilling…  (tier + status sync)
/settings "Manage billing" ─► GET /api/billing/portal ─► Stripe customer portal
```

- Tier ↔ price mapping and status mapping live in `lib/billing/stripe.ts`
  (`STRIPE_PRICE_STANDARD` / `STRIPE_PRICE_FAMILY` env vars).
- The webhook derives the tier from the subscribed **price id**, never from
  client-influenced data, and is idempotent under Stripe retries.
- Checkout always grants the advertised 14-day trial (`TRIAL_PERIOD_DAYS`).

## Known Gaps (fix before public launch)

1. ~~`/api/newsletter` has no rate limit~~ — closed: 5/min per IP via
   `lib/rate-limit.ts`.
