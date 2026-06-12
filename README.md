# HEXA

AI-powered homeschooling platform preparing UK students for GCSEs by age 14.

Parents get a dashboard for scheduling, progress, compliance evidence, and tutor
escalation. Children get a focused daily learning flow (explainer → practice →
mastery) with AI-generated explanations that are independently fact-checked before
they're ever shown, plus optional voice narration.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion, Geist |
| Database | MongoDB (system of record) |
| Auth | Custom JWT sessions (jose) + bcrypt — no third-party auth provider |
| AI | OpenAI `gpt-4o-mini` (Teaching Agent + Checker), ElevenLabs (narration) |
| Media | Cloudinary (images, lesson audio, work uploads, portfolio PDFs) |
| Email | Brevo (signup verification, portfolio sharing) |
| Hosting | Vercel |

## Deployment

This project is **deployed automatically via GitHub → Vercel**: every push to the
GitHub repository triggers a production deploy. The app is not run locally —
verify changes with `npm run type-check` and `npm run build` before pushing.
Environment variables are configured in the Vercel dashboard (see
[.env.example](.env.example) for the full list).

## Setup Reference

Requires Node >= 20 and a MongoDB connection string (Atlas).

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, MONGODB_DB, AUTH_SECRET
npm run seed                 # create indexes + seed curriculum/question bank — touches the live db
```

Only `MONGODB_URI`, `MONGODB_DB`, and `AUTH_SECRET` are required.
The AI tutor, narration, media uploads, and email features each activate when
their API key is present and degrade gracefully (clean 503 / no-op) when absent —
see [.env.example](.env.example) for the full list.

## Scripts

| Command | Purpose |
|---|---|
| `npm run type-check` | TypeScript check (no emit) — primary verification |
| `npm test` | Vitest unit tests (pure logic: safety matcher, exam engine, rate limit, billing maps, week math) — must pass before pushing |
| `npm run build` | Production build — run before pushing |
| `npm run lint` | ESLint |
| `npm run seed` | Seed MongoDB — owns all collection indexes (live db) |
| `npm run dev` | Dev server — not used; the app deploys via GitHub → Vercel |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — route groups, lib domains, data model
- [docs/API.md](docs/API.md) — API routes, auth requirements, known gaps
- [docs/AI-AGENTS.md](docs/AI-AGENTS.md) — Teaching Agent pipeline, safety gates, TTS
- [docs/COMPLIANCE.md](docs/COMPLIANCE.md) — UK regulatory context (CNIS, Children's Code, safeguarding)
- [CLAUDE.md](CLAUDE.md) — guidance for AI-assisted development
