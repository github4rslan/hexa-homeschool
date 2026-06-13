# AI Agents

[← README](../README.md)

HEXA's AI is deliberately **bounded**: OpenAI explains and parses telemetry — it
never invents curriculum. All questions and canonical answers are human-authored
("vetted matrices"). Design principle from the Technical Brief: *Safety over
Pacing Velocity* — every generative payload faces automated validation before it
can reach a child's interface.

## Teaching Agent + Checker Pipeline

Implementation: [src/lib/ai/teaching-agent.ts](../src/lib/ai/teaching-agent.ts) ·
Config: [src/lib/ai/config.ts](../src/lib/ai/config.ts) ·
Route: `POST /api/tutor`

```
child answer ──► safety gate (checkDistress)            ◄── runs FIRST, short-circuits
                     │ no distress
                     ▼
            Teaching Agent (gpt-4o-mini)
            grounded in human-authored question + canonical answer
                     │
                     ▼
            Teaching Checker (independent call)
            validates: factual accuracy vs canonical answer + tone (zero condescension)
                     │
        confidence ≥ 95% ──► serve AI explanation (aiVerified: true)
        confidence < 95% ──► REJECT → serve human-authored fallback (usedFallback: true)
```

**Invariant: no model output reaches the child until the checker has passed it.**
Do not bypass the checker, lower the threshold, or serve raw completions in
`(child)` routes.

**Mock exams use AI only for post-exam explanations.** A mock paper is scored
**deterministically** against the human-authored canonical answers
(`lib/engine/mock-exam.ts`) — AI is never involved in producing a score or
grade. After submission, explanations for wrong answers are fetched through the
same `POST /api/tutor` pipeline above (distress gate → Teaching Agent →
Checker), so they carry the identical safety guarantees; if the call is
rate-limited, tier-gated, or unconfigured, the child sees the canonical
human-authored explanation instead.

### Thresholds

| Agent | Threshold | Constant |
|---|---|---|
| Teaching Checker | 95% | `TEACHING_CONFIDENCE_THRESHOLD` |
| Diagnostic Agent | 90% | (per Technical Brief v2.0) |

### Telemetry

Every real agent invocation is logged to the `ai_invocations` collection via
`logInvocation()` (tokens, latency) — this powers the `(admin)/agents` console.

## Safety Gate (Escalation Matrix)

Implementation: [src/lib/safety/escalation.ts](../src/lib/safety/escalation.ts)

`checkDistress()` scans child-entered text against a fixed distress-phrase matrix
(e.g. "i give up" → critical, "i hate myself" / "hurt myself" → immediate) with
five severity levels. On a match, `/api/tutor`:

1. **Freezes** the child session (calm pause screen — no AI call is made)
2. **Records** an escalation against the active child (audit log keeps the phrase)
3. **Surfaces** it to the parent

The matcher is intentionally simple and auditable. **Over-triggering is acceptable;
missing real distress is not.** Strict scope: educational safeguarding only — no
clinical or behavioural profiling.

## Lesson Narration (TTS)

Route: `POST /api/tts` · Provider: ElevenLabs (`eleven_multilingual_v2`,
default voice "Sarah — Mature, Reassuring, Confident")

- Input capped at 1,200 characters (ElevenLabs bills per character)
- Generated audio is cached in Cloudinary, deduplicated by a hash of text + voice
  (`content_hash` on MediaDoc); without Cloudinary it streams bytes uncached

## Speak Your Answer (STT)

Route: `POST /api/stt` · Provider: ElevenLabs Scribe (`scribe_v1`)

- The child records a short answer (≤ 15 s client-side, ≤ 2 MB server-side);
  the transcript auto-selects the matching option in the practice player and
  replaces the option label as `studentAnswer` in the `/api/tutor` call — so
  the distress gate scans the child's **actual words**.
- **Privacy (Children's Code): audio is transient.** It is forwarded to
  ElevenLabs in memory and never written to disk, Cloudinary, or MongoDB.
  Only the text transcript survives the request.
- Defence in depth: `checkDistress()` also runs on the transcript inside
  `/api/stt` (freeze + escalate), because `/api/tutor` only fires on wrong
  answers — a spoken "I give up" followed by a correct tap must still escalate.
- Telemetry: logged to `ai_invocations` as agent `"STT"` (latency + freeze
  outcome only — never the transcript).

## Configuration & Failure Modes

- Keys: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` — missing keys throw
  `AiConfigError`, surfaced as a clean 503 (feature off, app up)
- Model: `TEACHING_MODEL = "gpt-4o-mini"` (central constant — change in one place)

## Known Gaps

- The Diagnostic Agent (90% threshold) is specified in the brief; the teaching
  pipeline is the Phase-1 implementation
