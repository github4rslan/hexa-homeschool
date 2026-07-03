# METRICS.md — Edway metric dictionary (Phase 0)

The single source of truth for every metric shown in the admin dashboards: its
definition, its data source, and whether it is **real** (computed from a live
source) or **illustrative** (labelled "Illustrative — not live" in the UI
because the source doesn't exist yet).

**Phase 0 rule:** no admin screen shows a fabricated figure without an
illustrative label. Deleting a fake number is always better than keeping it.

Related: [`.claude/tasks/prove-and-grow.md`](../.claude/tasks/prove-and-grow.md)
(the full program), [`ARCHITECTURE.md`](./ARCHITECTURE.md),
[`COMPLIANCE.md`](./COMPLIANCE.md).

## Computation layer

- **Pure logic:** [`src/lib/metrics/finance.ts`](../src/lib/metrics/finance.ts)
  (`summarizeBilling`, `rowMrr`, `parentMonthlyMrr`, formatters) — no DB/network,
  unit-tested in [`tests/metrics-finance.test.ts`](../tests/metrics-finance.test.ts).
- **Aggregate reads (repo.ts, ownership-safe):** `adminBillingBreakdown`,
  `adminListParents`, `adminListDossiers` — each a single Mongo `$group`/bounded
  read, never loading full collections.
- **Cached server wrappers:** [`src/lib/metrics/server.ts`](../src/lib/metrics/server.ts)
  wraps every heavy read in `unstable_cache` (5-minute revalidate) so admin
  views stay off the request hot path.

## Guardrails honoured

- No analytics or per-child identity anywhere in this layer. Child-derived data
  is aggregate (counts) or minimal-PII (compliance dossiers show a child's first
  name only — staff compliance ops must identify the child; no learning detail).
- All data access goes through `repo.ts`. No `getCollection` in route handlers.
- Missing Stripe keys degrade gracefully: recent payments show a "not live"
  state, never a fabricated feed.

---

## Inventory (metric → mock source → real source → status)

### Overview (`/admin`) — already real before Phase 0
| Metric | Real source | Status |
|---|---|---|
| Parent accounts, Children, Lessons this week, Open escalations | `getAdminStats()` counts | ✅ Real |
| Recent learning activity, Platform totals | `adminRecentLogs`, `getAdminStats` | ✅ Real |

### Finance (`/admin/finance`)
| Metric | Was (mock) | Real source | Status |
|---|---|---|---|
| MRR | `£113,476` hardcoded | `summarizeBilling(adminBillingBreakdown())` — Σ active accounts × tier list price | ✅ Real |
| ARR | `£1.36M` hardcoded | MRR × 12 | ✅ Real |
| Active subscribers | — | `billing_status = active` count | ✅ Real |
| In trial | — | `billing_status = trialing` count | ✅ Real |
| Subscription mix (per tier accounts + MRR + %) | `TIER_BREAKDOWN` hardcoded | per-tier aggregate | ✅ Real |
| Recent payments | `RECENT_PAYMENTS` hardcoded | Stripe `charges.list` (cached); no customer PII shown | ✅ Real when Stripe configured; else **Illustrative** ("not live") |
| Churn (30d) | `2.1%` hardcoded | needs billing-state history (cancellation timestamps) | ⚠️ **Illustrative** |
| LTV : CAC | `4.8 : 1` hardcoded | needs CAC (owner spend input) + LTV model | ⚠️ **Illustrative** |
| Trial → paid, Revenue churn | — | needs event history | ⚠️ **Illustrative** |
| Stripe health (webhook success, refunds, disputes) | hardcoded panel | removed — needs webhook/event monitoring | ⚠️ Removed (replaced by real retention/economics illustrative panel) |

### Users (`/admin/users`)
| Metric | Was (mock) | Real source | Status |
|---|---|---|---|
| Total accounts | `1,284` hardcoded | `summarizeBilling().totalAccounts` | ✅ Real |
| Active subscribers | `1,127` hardcoded | active count | ✅ Real |
| In trial | `142` hardcoded | trialing count | ✅ Real |
| Past due | `15` hardcoded | past_due count | ✅ Real |
| Parent list (name, email, joined, child count, tier, status, £/mo) | `PARENTS` hardcoded (fake names, locations, child names/ages) | `adminListParents()` — real accounts, **child COUNT only** | ✅ Real |
| Location column | hardcoded | not stored on `ParentDoc` | ✅ Removed |
| Child names/ages | hardcoded | intentionally NOT shown (cross-family PII minimisation) | ✅ Removed |

### Compliance (`/admin/compliance`)
| Metric | Was (mock) | Real source | Status |
|---|---|---|---|
| Dossiers generated | `1,127` hardcoded | `getAdminStats().dossiers` | ✅ Real |
| Recent signed (SHA-256) | `100%` hardcoded | count of recent dossiers with `secure_hash` | ✅ Real |
| Recent dossiers list | `DOSSIERS` hardcoded (fake children/LA/access) | `adminListDossiers()` — child first name, period, hash, generated date | ✅ Real |
| LA access this month / access log | `48` + `LA_ACCESS` hardcoded | LA views not logged as discrete events | ⚠️ **Illustrative** |
| DSARs open / DSAR queue | `2` + `DSARS` hardcoded | no DSAR-tracking collection (handled by email today) | ⚠️ **Illustrative** |

### Experiments (`/admin/experiments`)
| Metric | Was (mock) | Real source | Status |
|---|---|---|---|
| All experiments, variants, conversions, significance, lift | `EXPERIMENTS` hardcoded | no A/B framework — no exposure/conversion events recorded | ⚠️ **Illustrative** (fabricated cards removed; honest empty state) |

### Settings — feature flags (`/admin/settings`)
| Item | Was (mock) | Real source | Status |
|---|---|---|---|
| Feature flags + toggles | `INITIAL_FLAGS` hardcoded, client-only toggles that persist nothing | persisted `app_settings.feature_flags` doc + audited admin toggles; `ai_visuals` override is wired into the per-question visual gate (env `AI_VISUALS_ENABLED` remains the default) | ✅ **Real** — only registered/wired flags are shown; every toggle writes a `staff_audit_log` row with reason |

---

## MRR/ARR definition (as implemented)

- **MRR** = Σ over accounts with `billing_status = "active"` of the tier's
  monthly **list** price. Trialing (£0, not yet paying), `past_due`
  (uncollected), `paused` and `canceled` contribute £0.
- **ARR** = MRR × 12.
- **Tier list prices** (`TIER_MONTHLY_GBP`, mirrors `/pricing` and the Stripe
  recurring prices): Diagnostic £0 (free), Standard/Edway Complete £49/mo,
  Family/Edway Partner £99/mo.
- **Known approximation:** uses list price, not each customer's actual Stripe
  amount, so per-customer discounts, annual plans and proration are **not**
  reflected. A Stripe-exact MRR (from active subscription items) is a candidate
  upgrade — see owner decisions.
- **Pre-revenue is honest:** with no active subscribers the figure is a real
  £0, never a fabricated number.

---

## OWNER DECISIONS NEEDED

These are business calls — surfaced here rather than guessed in code.

1. **MRR basis.** Keep list-price MRR (simple, no Stripe dependency), or move to
   Stripe-exact MRR that honours discounts/annual/proration? (Latter needs a
   Stripe subscription-items read + a normalised-to-monthly helper.)
2. **Does `past_due` count toward MRR?** Currently excluded (conservative —
   revenue at risk / uncollected). Some dashboards include it as "billed but
   unpaid". Confirm the convention.
3. **Churn definition + window.** Logo churn vs revenue churn; needs a
   `billing_status` change history (or Stripe events) we don't persist yet.
   Decide: capture cancellation timestamps on `ParentDoc`, or read from Stripe?
4. **CAC input.** LTV:CAC needs acquisition spend per period (owner-provided,
   e.g. a monthly figure) before it can be shown.
5. **Activation definition** (candidate: first child completes first lesson).
   Needed for Pillar C time-to-activation. Confirm the exact moment.
6. **Trial length** for trial→paid conversion — advertised 14 days
   (`TRIAL_PERIOD_DAYS`); confirm this is the measurement window.
7. **North Star metric** (Pillar D) — candidates to choose from later:
   "weekly active learning families", "topics mastered per active child per
   week", "activated paying families". Owner picks one.
8. **Efficacy bar** (Pillar A) — what retention/mastery % counts as "working".
9. **DSAR + LA-access instrumentation** — do we build a DSAR-tracking collection
   and an LA-access audit event, or keep these off the admin dashboard?

_Last updated: Phase 0 (2026-07)._
