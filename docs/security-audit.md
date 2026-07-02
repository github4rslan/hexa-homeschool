# Security & Compliance Audit — Edway (HEXA)

Weekly read-only security sweep. No code was changed. Scope: authorization /
IDOR & data-silo, authentication & sessions, payments (Stripe), secrets &
config, PII / analytics (Children's Code / UK GDPR), input validation & abuse,
transport / CSP hardening, dependencies (CVEs), and static checks. A violation
of a documented invariant (CLAUDE.md, .claude/rules/child-safety.md,
docs/COMPLIANCE.md) is CRITICAL by definition.

- Run date: 2026-07-01
- Static checks: type-check clean; lint clean
- Dependencies: npm audit --production -> 0 critical / 0 high
- Critical child-safety / data-silo / auth-bypass findings: NONE

> **Step 3 fix pass (2026-07-02).** All Highs and Mediums fixed, verified
> (type-check + test + lint + build green), committed and pushed to `main`.
> Fix commits: H1 `72f3cec` · H2 `214096f` · M1 `0b522cc` · M2 `5e76929` ·
> M3 `46bae25` · M4 `155cb77` · L1 `0ec3c95`.
> **L2, L3, L4 deliberately NOT changed** — each is an accepted trade-off whose
> "fix" would cause a regression, not close a bug (details inline). After H2 the
> full `npm audit` shows 0 high / 0 critical (was many High via the vercel CLI).

## Summary table

| Severity | Count | IDs | Outcome |
|---|---|---|---|
| CRITICAL | 0 | none | — |
| HIGH | 2 | H1, H2 | both FIXED (`72f3cec`, `214096f`) |
| MEDIUM | 4 | M1, M2, M3, M4 | all FIXED (`0b522cc`, `5e76929`, `46bae25`, `155cb77`) |
| LOW | 4 | L1, L2, L3, L4 | L1 FIXED (`0ec3c95`); L2/L3/L4 skipped-with-reason |

The authentication core, data-silo ownership layer, Stripe webhook, distress
gate, AI checker, Sentry scrubbing, analytics segregation, and security headers
are all sound. No exploitable auth-bypass, IDOR, cross-family data leak, unsigned
webhook, or secret exposure was found. The findings below are hardening items.

## HIGH

### H1 - HIGH - Auth/session - No rate limiting or throttling on login and signup
- Where: src/app/(auth)/login/actions.ts:17-89 (login), src/app/(auth)/signup/actions.ts:14-75 (signup)
- Attack scenario / impact: login() runs findParentByEmail + verifyPassword on every POST with no attempt cap, no per-IP/per-account throttle, and no captcha. An attacker can mount unbounded credential-stuffing / password brute-force against parent accounts (which hold children's PII, safeguarding data, and billing). Each attempt also triggers a bcrypt(12) compare, a CPU-amplification DoS vector. signup() is likewise unthrottled: it enables email enumeration (the existing-email branch returns a distinct error) and lets an attacker mass-create accounts / spam verification emails through Brevo (cost + reputation). The paid API routes and /api/newsletter are rate-limited via lib/rate-limit.ts, but the auth entry points, the highest-value target, are not.
- Root cause: Rate limiting was added to spend/child-facing/public API routes but the credential-verification server actions were never wired to rateLimit(). COMPLIANCE.md Open Item 2 tracked rate-limiting for tutor/tts but not auth.
- Remediation: Wrap both actions in a per-IP (and, for login, per-email) fixed-window limit via the existing rateLimit() helper (e.g. 5-10/min), returning the generic error on trip. Keep the login error message uniform across branches (already uniform) and consider equalising timing.
- Compliance ref: UK GDPR Art. 32 (security of processing) - protecting accounts that gate children's data.

### H2 - HIGH - Dependencies - Large High CVE surface in the vercel dev CLI
- Where: package.json devDependencies -> vercel@54.5.1 (pulls undici, path-to-regexp, minimatch, tar, form-data, @vercel/*)
- Attack scenario / impact: npm audit (full tree) reports many High advisories: undici (request smuggling, TLS bypass, header injection, DoS), form-data (CRLF injection), tar (path traversal / arbitrary write), path-to-regexp and minimatch (ReDoS). Mitigating fact: every one of these transits ONLY the vercel CLI, which is a devDependency and is NOT part of the deployed Vercel runtime; npm audit --production returns 0 high / 0 critical. Real-world exposure is limited to a developer machine running the CLI. Still, hostile input to the local CLI is a supply-chain foothold, and the advisory count masks genuine runtime issues in future audits.
- Root cause: vercel is installed locally though deploys are automatic on push; its transitive tree is stale. The fix is a semver-major CLI bump (vercel@50.41.0+ per audit metadata - read-only note, not applied).
- Remediation: Either remove the vercel CLI from devDependencies (deploys are push-triggered and do not need it) or bump it to the fixed major. Do NOT run npm audit fix blindly (major bump). dependabot.yml is present (.github/dependabot.yml).
- Compliance ref: UK GDPR Art. 32; supply-chain due diligence.

## MEDIUM

### M1 - MEDIUM - Input validation / abuse - /api/portfolio is unauthenticated and unthrottled
- Where: src/app/api/portfolio/route.ts:43-101
- Attack scenario / impact: POST /api/portfolio requires no session for the generation path (auth is only checked inside persistDossier). Anyone can POST an arbitrary childName/term and receive a fully-rendered verified portfolio carrying a real SHA-256 verification hash. generateVerifiedPortfolio (src/lib/compliance/portfolio.ts:108) reflects the free-text childName into the document body with no DB read, so there is NO cross-family data leak, but the endpoint is an unauthenticated, unrated compute/echo surface abusable to (a) mass-mint hash-bearing documents that look authoritative to a Local Authority, and (b) burn CPU. There is no rateLimit() on it.
- Root cause: Generation was deliberately decoupled from persistence so legacy callers work signed-out; the trade-off is an open endpoint.
- Remediation: Require currentParentId() before generation, or at minimum apply a per-IP rate limit. Only issue a verification hash for a child the caller owns.
- Compliance ref: EHE/CNIS evidence integrity (COMPLIANCE.md Portfolio/Dossier section).

### M2 - MEDIUM - Auth/session - JWT verification does not pin the algorithm allowlist
- Where: src/lib/auth/session.ts:63,90 (getSession, verifyToken); src/lib/email/verification.ts:29,74,123,163 (verify/code/2FA tokens)
- Attack scenario / impact: Every jwtVerify(token, getSecret()) call omits the algorithms HS256 allowlist option. With a symmetric key, jose restricts acceptance to HMAC algorithms and rejects alg none by default, so this is NOT currently exploitable, but the defence-in-depth is missing. If the key type ever changes or a jose default shifts, an algorithm-confusion path could open. Tokens are correctly HS256-signed, expiry-checked, and AUTH_SECRET length is enforced (min 16; note CLAUDE.md advertises 32+ but the code floor is 16 - see L4).
- Root cause: Relying on library defaults rather than an explicit allowlist.
- Remediation: Pass an algorithms HS256 allowlist to every jwtVerify in session.ts and verification.ts.
- Compliance ref: UK GDPR Art. 32.

### M3 - MEDIUM - Auth/session - Email-verification link is replayable within its 48h window
- Where: src/app/(auth)/verify/route.ts:13-43; token in src/lib/email/verification.ts:16-23
- Attack scenario / impact: GET /verify?token=... marks the email verified AND mints a session (createSession) on every hit. The token is a stateless 48h JWT never invalidated after first use, so a leaked verification URL (referrer leakage, shared inbox, browser history, email-scanner prefetch) can be replayed to obtain a fresh authenticated session for up to 48 hours. Contrast the 6-digit signup/2FA codes, which are attempt-capped and single-use via cookie deletion.
- Root cause: Verification tokens are purely stateless with no server-side single-use marker.
- Remediation: Make the link single-use - only createSession when markEmailVerified actually flips email_verified false->true (return the modified count), and no-op the session mint on replay; or bind the token to a nonce stored on the parent doc.
- Compliance ref: UK GDPR Art. 32.

### M4 - MEDIUM - Auth - Cron endpoints use non-constant-time secret comparison
- Where: src/app/api/digest/weekly/route.ts:31, src/app/api/notify/inactivity/route.ts:35, and the other cron routes (lifecycle/daily)
- Attack scenario / impact: Cron auth is a plain string inequality against a Bearer + CRON_SECRET header. A non-constant-time compare on the full secret is theoretically timing-observable; combined with no rate limit on these GET endpoints, a determined attacker could attempt secret recovery. Impact is bounded (these routes send emails/SMS and read aggregates; they are NOT writers of billing or child data), but a leaked CRON_SECRET would allow triggering mass parent emails/SMS (Brevo/Twilio cost + spam).
- Root cause: Direct string comparison instead of a constant-time compare.
- Remediation: Compare with crypto.timingSafeEqual over fixed-length buffers, rejecting early on length mismatch.
- Compliance ref: operational hardening.

## LOW

### L1 - LOW - Transport - User first-name reflected into a same-origin SVG response
- Where: src/app/api/week-review/image/route.ts:50,76-92
- Impact: The Week-in-Review share image echoes the child's first name into an image/svg+xml body served from the app origin. The value IS XML-escaped via esc() (covers ampersand, lt, gt, double-quote), the route is ownership-checked (own child only), and the global CSP is default-src self with object-src none, so script execution is well contained. Residual risk exists only if esc() regresses (it does not escape single quotes, which matters only inside attribute values; here the name lands in text nodes). Low.
- Remediation: Optionally serve with Content-Disposition attachment / CSP sandbox, or raster server-side. Keep esc() covering the single-quote too.

### L2 - LOW - Auth/session - Logout does not invalidate the JWT server-side
- Where: src/app/(auth)/logout/route.ts:7-10 (destroySession clears the cookie only)
- Impact: Logout deletes the httpOnly hexa_session cookie but does not bump token_version, so a token captured before logout stays cryptographically valid until its 7-day expiry. Standard stateless-JWT trade-off; the cookie is httpOnly+secure+sameSite so capture is hard, and sign-out-everywhere (bumpTokenVersion) exists for true revocation. Low.
- Remediation: Acceptable as-is; document that true revocation is sign-out-everywhere. Consider shorter session TTL or rotating on sensitive actions.
- **Fix-pass decision (2026-07-02): SKIPPED — not a bug.** The only stateless way to invalidate one JWT is bumping token_version, which would turn every normal logout into a global sign-out-of-all-devices (a product/UX change), and a per-session jti blocklist is new infrastructure, not a smallest-correct change. The correct revocation path (sign-out-everywhere) already exists. Left unchanged by design.

### L3 - LOW - Session cookie - sameSite lax (not strict)
- Where: src/lib/auth/session.ts:47-53
- Impact: hexa_session is httpOnly + secure (prod) + sameSite lax. Lax is a deliberate choice (top-level GET navigations from email links must carry the session), and all state-changing routes are POST/JSON (Stripe redirects are server-driven; form-action self is set). No concrete CSRF vector found. Noted for completeness.
- Remediation: None required; watch any future state-changing GET route.
- **Fix-pass decision (2026-07-02): SKIPPED — not a bug.** Tightening to sameSite=strict would break session-carrying on the top-level GET navigations from email links (e.g. /verify), a functional regression, with no concrete CSRF vector to justify it. Left as the deliberate `lax`.

### L4 - LOW - Config - AUTH_SECRET minimum length (16) is weaker than documented (32+)
- Where: src/lib/auth/session.ts:18 and src/lib/email/verification.ts:12 enforce a minimum of 16; CLAUDE.md / .env.example state 32+.
- Impact: A 16-char secret would pass the runtime guard while violating the documented policy, weakening HMAC entropy. Production likely uses a long secret, so live risk is low.
- Remediation: Raise the guard to 32 to match the documented requirement.
- **Fix-pass decision (2026-07-02): SKIPPED — needs owner confirmation (prod-outage risk).** getSecret() throws on every auth operation if the guard trips, so raising the floor to 32 would take authentication down entirely on the next deploy IF the live AUTH_SECRET is 16–31 chars — which cannot be verified from code. Gambling a live children's-platform auth outage to close a Low is the wrong trade. **Owner action: confirm the production AUTH_SECRET is ≥32 chars, then raise the floor to 32** in session.ts:18 and verification.ts:12 (trivial one-liners).

## Domain results

1. Data-silo and authorization - checked, clean. Every child-scoped query in lib/db/repo.ts is gated by assertOwnsChild / parentOwnsChild. getCollection outside mongodb.ts/repo.ts appears only in api/newsletter (allowed public), settings/actions.ts (parent self-scoped by session id), and admin escalations/tutors actions (RBAC-gated). No IDOR: client-sent ids (childId, child, questionId) are re-validated against the session or coerced via toObjectId; the hexa_active_child cookie is httpOnly and every consumer re-checks ownership through getActiveChild.
2. Admin authorization - checked, clean. The (admin) layout enforces resolveRole (staff-only, redirect non-staff to /dashboard); admin server actions enforce per-permission RBAC. Roles are set manually in Atlas, default-deny. Not reachable with a parent-only session.
3. Authentication and sessions - see H1, M2, M3, L2, L3, L4. HS256 via jose, expiry validated, alg none not accepted, hexa_session httpOnly+secure+sameSite, bcrypt(12), token_version session-kill, 2FA codes attempt-capped (5) + expiring + single-use. Gaps: brute-force throttling and algorithm pinning.
4. Payments and money - checked, clean. /api/billing/webhook verifies the Stripe signature via constructEventAsync BEFORE parsing, is idempotent, derives tier ONLY from the subscribed price id (tierForPriceId), and is the sole writer of billing state. Paid routes require auth + entitlement + rate limit; tier gating cannot be bypassed. Checkout/portal write nothing.
5. Secrets and config - checked, clean. No hardcoded secrets in src/ or scripts/. .env* gitignored except .env.example (placeholders only). Missing keys throw typed config errors -> clean 503 / friendly redirect, never leaking the key name. (Minor: L4.)
6. PII, analytics and telemetry - checked, clean. All three Sentry runtimes use scrubAndTag; sendDefaultPii false, tracesSampleRate 0, no replay, no per-config beforeSend override. PostHog is mounted only in marketing/auth/dashboard layouts, never in (child)/learn or a shared child component; server capture keys on parent Mongo id only; consent-gated. STT audio is transient (never persisted); the distress matcher is non-clinical. Escalation email/SMS carry first-name + severity only, never child-written text.
7. Input validation and abuse - mostly clean; see M1. Routes validate and size-cap input (2000/1200 chars, 2 MB audio), reject malformed JSON (400) and oversize (413), coerce types. Rate limits on all spend/child-facing and public routes; Upstash to in-memory fallback is crash-safe. No where/expr operators; the one regex query (findChildByName) is escaped via escapeRegex; ids coerced via toObjectId (blocks NoSQL operator injection). No user-controlled value flows into an SSRF-able URL.
8. Transport and browser hardening - checked, clean. next.config.ts sets HSTS (2y, preload), X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options DENY, a real CSP (default-src self; Cloudinary/Sentry/PostHog scoped; frame-ancestors none, object-src none, base-uri self, form-action self, upgrade-insecure-requests), and Permissions-Policy (camera off everywhere; microphone self only under /learn). dangerouslySetInnerHTML uses are static JSON-LD / theme-noflash constants, no user input. No open redirects. CSP allows unsafe-inline scripts (Next.js hydration requirement) - accepted trade-off; L1 is the only reflected-output surface.
9. AI child-safety invariants - checked, clean. The distress gate runs before any AI call and before entitlement/rate-limit in /api/tutor, /api/stt, /api/safety-check; the Teaching Checker fails closed (unparseable verdict -> reject) and enforces at least 95% confidence + factual + tone before any output reaches a child; questions and answers are human-authored.

## Dependencies (npm audit)

- npm audit --production: 0 critical, 0 high, 3 moderate.
- Full-tree High advisories all originate from the vercel dev CLI (not deployed) - see H2.
- Runtime-relevant moderate: dompurify@3.4.10 (ALLOWED_ATTR pollution) via posthog-js - fix available (non-major); low impact since PostHog is parents-only and consent-gated. next reports a moderate via postcss (build-time).
- .github/dependabot.yml is present.

## Top 3 to remediate first — all DONE this pass

1. H1 - DONE (`72f3cec`): login rate-limited per-IP + per-email, signup per-IP.
2. H2 - DONE (`214096f`): vercel dev-CLI removed; full npm audit now 0 high / 0 critical.
3. M1 - DONE (`0b522cc`): /api/portfolio now requires auth + a per-parent rate limit.

Read-only audit. No files other than this report were modified; no commands mutated state, touched the live DB, or started a server.
