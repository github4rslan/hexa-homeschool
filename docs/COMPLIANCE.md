# Compliance

[← README](../README.md)

HEXA serves children's personal data in a UK regulatory context. This document maps
the legal obligations to the code that implements them, so changes don't silently
break a legal requirement.

## Regulatory Map

| Obligation | What it requires | Where it lives in code |
|---|---|---|
| UK GDPR / Data Protection Act 2018 | Lawful processing of children's data, parent as account holder | Parent-owned accounts (`parents` → `children`), ownership checks in `lib/db/repo.ts` |
| ICO Age Appropriate Design Code ("Children's Code") | Age-appropriate design, data minimisation, no profiling beyond service needs | `(marketing)/childrens-code` page; escalation matcher is explicitly non-clinical (`lib/safety/escalation.ts`) |
| Elective Home Education (EHE) guidance / CNIS | Evidence of suitable education for local authorities | `(dashboard)/compliance/cnis`, portfolio generation (`lib/compliance/portfolio.ts`), `compliance_dossiers` collection |
| Safeguarding (KCSIE-adjacent) | Detect and escalate child distress to a responsible adult | Escalation matrix → freeze session, log, notify parent (see [AI-AGENTS.md](AI-AGENTS.md)) |
| Data residency | Children's data kept in-region | ⚠ Depends on MongoDB Atlas cluster region — see note in `lib/mongodb.ts` |

## Portfolio / Dossier System

`POST /api/portfolio` generates a verified portfolio for a child + term:

- Built by `generateVerifiedPortfolio()` in [src/lib/compliance/portfolio.ts](../src/lib/compliance/portfolio.ts)
- Persisted best-effort to `compliance_dossiers` with a **secure verification hash**
  (tamper-evidence for local-authority review); generation still succeeds if
  persistence is skipped (no session / no matching child)
- Cloudinary evidence media can be attached (`evidence_media_ids`)
- Sharing is via Brevo email (`lib/email/`)

## Data-Silo Guarantee

A parent must never be able to read or write another parent's child data. This
was enforced by Postgres Row-Level Security pre-migration; it is now enforced
**in application code** in `lib/db/repo.ts` (`assertOwnsChild` on every
child-scoped query). Treat any code path that touches child collections outside
`repo.ts` as a compliance bug, not just a style issue.

## Audit Trail

- Escalations are logged with the matched phrase and severity (`escalations`)
- AI invocations are logged per call (`ai_invocations`) — supports demonstrating
  that AI output served to children passed validation
- Dossiers carry a verification hash and generation timestamp

## Open Items Before Live Children's Data

1. **Confirm Atlas cluster region** meets UK data-residency requirements
   (deliberate, owner-approved choice to use MongoDB — but region must be verified)
2. **Auth + rate limiting on `/api/tutor` and `/api/tts`** (currently open)
3. Data retention / deletion policy (right to erasure) — no automated deletion
   flow exists yet
4. Privacy policy and cookies pages exist in `(marketing)` — keep them in sync
   with actual processing (Cloudinary, Brevo, OpenAI, ElevenLabs as processors)
