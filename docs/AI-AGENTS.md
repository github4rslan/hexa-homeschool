# AI Agents

[← README](../README.md)

Edway's AI is deliberately **bounded**: OpenAI explains and parses telemetry — it
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

### Mastery Remediation

The child lesson uses the Teaching Agent only to reteach after a missed mastery
check. Certification remains deterministic: the engine scores the human-authored
mastery questions, and only a perfect 3-question check calls
`upsertCompetence(..., "certified")`. The AI never marks competence.

On a non-perfect mastery attempt, the flow asks `/api/tutor` for a clearer,
age-banded explanation of the first missed concept. That response follows the
same generate -> Checker -> fallback pipeline above; if AI is unavailable or the
Checker rejects it, the child sees the human-authored explanation instead. The
client caches the checked reteach per question+band for the current lesson, and
retakes pull fresh human-authored `kind: "mastery"` questions where the bank
allows. If the bank only contains one 3-question check, the retake rotates order
rather than inventing questions.

The loop is capped at five mastery attempts. After that, the **five-attempt human
handoff** (Wave 7, Phase 4) fires — the AI stops guessing and a human is brought
in. The trigger and its idempotency are pure and unit-tested
(`lib/engine/remediation.ts`): `decideRemediation()` returns `"handoff"` at the
cap (`isHandoff()`), and `shouldQueueHandoff()` guarantees **one request per
child+topic per active struggle** (an existing `requested`/`scheduled` request
suppresses a duplicate). On trigger the server:

- **Calm child pause** — `components/child/handoff-pause.tsx`: an accent-driven,
  reduced-motion-safe, WCAG-AA pause ("Let's get you some extra help — a real
  teacher is coming"). No "failed", no red, no buzzer. The same component guards
  the lesson page so re-opening a resting topic shows the pause, not the lesson.
- **Parent notification** — `notifyRemediationHandoff()` reuses the existing
  Brevo email + Twilio SMS, warm and specific ("{child} is finding {topic}
  tricky. We've paused it and lined up extra help."), respecting the existing
  opt-outs (`escalation_alert_opt_out`, unverified email, no phone).
- **Tutor-request queue** — `createRemediationTutorHandoff()` inserts an
  ownership-checked `tutor_bookings` row (`source: "remediation"`, topic +
  struggle context), surfaced on the parent `/tutoring` surface and the admin
  Tutor Marketplace.
- **Syllabus pause without shame** — `pauseTopicForTutor()` sets
  `CompetenceDoc.tutor_paused_at` **without demoting state**. The topic is set
  aside: excluded from today's quests (`todayCard`), shown as a calm "resting"
  card on the child hub, and never marked against the child. Other topics carry
  on.
- **Tutor → next-explanation data path** — when staff log the (deferred,
  manually-run) session (`logTutorSessionAsStaff`, audited), the note is written
  to `CompetenceDoc.tutor_note`, the pause lifts (`tutor_paused_at = null`), and
  the next explainer surfaces it as "a tip from your tutor". The **live** tutor
  network / scheduling stays deferred — this is the trigger + notify + queue +
  pause only.

**Mock exams use AI only for post-exam explanations.** A mock paper is scored
**deterministically** against the human-authored canonical answers
(`lib/engine/mock-exam.ts`) — AI is never involved in producing a score or
grade. After submission, explanations for wrong answers are fetched through the
same `POST /api/tutor` pipeline above (distress gate → Teaching Agent →
Checker), so they carry the identical safety guarantees; if the call is
rate-limited, tier-gated, or unconfigured, the child sees the canonical
human-authored explanation instead.

### Specific & Adaptive Feedback (Wave 7, Phase 3)

A wrong answer is never met with a generic "try again". Feedback is driven mostly
by **human-authored content + deterministic signals** (cheap, no API); the AI
reteach is the optional richer layer.

- **Misconception hints (human-authored).** `QuestionDoc.misconceptions` is an
  optional, index-aligned array: `misconceptions[i]` is a short line naming the
  likely mistake behind choosing the wrong option `i` ("looks like you multiplied
  instead of divided — let's see why"). `pickMisconception()`
  (`lib/child/interactions.ts`) looks up the line for the option the child
  actually picked (mcq only) — it never invents text. Legacy-safe (absent ⇒ no
  targeted line). Authored in `curriculum.seed.ts`.
- **Adaptive matrix (deterministic).** `decideFeedback()`
  (`lib/engine/feedback-matrix.ts`) is a pure, unit-tested helper that maps cheap
  local signals — attempts, time-on-question, hints used, prior correct streak,
  session length — to one response: **careless** (fast slip after a correct run →
  "slow down, re-read"), **concept_gap** (tries/hints exhausted → escalate to the
  worked example + optional AI reteach), **language** (slower struggle / wording →
  simpler wording + the concrete hint rung), **attention** (long pause / long
  session → suggest a movement break), or the default **encourage** nudge. No AI,
  identical on every device, builds no psychological profile of the child.
- **Multi-modal delivery.** The chosen line is shown as a calm, accent-tinted,
  reduced-motion-safe slide-in **and** narrated through the existing TTS engine —
  never a silent wall of text, never red/shake/buzzer.
- **Optional AI reteach.** Only on a concept gap, an opt-in "Explain it another
  way" calls the same Checker-gated `/api/tutor` pipeline (AI text served ONLY
  when `aiVerified`), **cached per question+band**, degrading to the
  human-authored explanation when AI is unavailable or the Checker rejects it.

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

The interactive practice player scans free-text (`fill_blank`) answers via
`POST /api/safety-check` **before** scoring or advancing. That client gate
**fails safe**: if the check cannot be confirmed (offline, 5xx, malformed body)
it retries once, and on persistent failure it does **not** advance — it shows a
gentle pause instead of letting an unverified answer through
([src/lib/safety/free-text-gate.ts](../src/lib/safety/free-text-gate.ts)).

## Lesson Narration (TTS)

Route: `POST /api/tts` · Provider: ElevenLabs (`eleven_turbo_v2_5` — high quality
+ low latency for per-step auto-play; default voice "Sarah — Mature, Reassuring,
Confident"; warm `ELEVENLABS_VOICE_SETTINGS` in `lib/ai/config.ts`)

- Input capped at 1,200 characters (ElevenLabs bills per character)
- Child narration uses the central `ELEVENLABS_NARRATION_SPEED` baseline
  (`0.85`), with a small key-stage adjustment so KS2 is calmest while retaining
  the child's chosen voice
- Generated audio is cached in Cloudinary, deduplicated by a hash of
  model + voice + speed + voice settings + text (`content_hash` on MediaDoc);
  without Cloudinary it streams bytes uncached
- **Auto-narration (Wave 4):** the child daily flow auto-plays the prompt when a
  step appears via the `useNarration` hook (one clip at a time; stops when the
  child starts answering; prefetches the next step). Spoken copy is deterministic
  and human-authored: maths symbols become clear words, KS2 gets a short
  encouraging lead, and punctuation creates a thinking beat before the options.
  It reuses this route as-is —
  same rate-limit, tier-gate, cache and 503 fallback — so narration degrades
  silently when ElevenLabs is unconfigured. Controlled by
  `ChildDoc.narration_autoplay` (default on) via the My-stuff toggle and a
  one-tap in-lesson mute. No analytics in `(child)`.

### Worked Examples

Daily child lessons can now carry an optional, human-authored
`worked_example` on the curriculum topic. When present, the explainer phase
uses that authored content before any question: one concrete step at a time,
with pause, back and replay controls over the existing `/api/tts` narration.
Topics without `worked_example` keep the legacy summary-and-points explainer.

Practice and mastery questions may also carry an optional human-authored
`worked_solution`. After a miss, the child can choose "Show me step by step";
after the final try, the same reveal opens before the answer state is shown.
If a question has no `worked_solution`, the reveal is built deterministically
from its human-authored canonical `explanation`, never from AI output.

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

## Visual Agent + Checker

Route: `POST /api/question-visual` · Generation model:
`VISUAL_IMAGE_MODEL` · Checker model: `VISUAL_CHECKER_MODEL`

The Visual Agent is fully automated and generates only candidate images. A
candidate is never cached or returned until the automated Visual Checker passes
both gates:

1. OpenAI image moderation (`omni-moderation-latest`)
2. Vision relevance/safety check against the human-authored question, canonical
   answer, topic and key stage

Failure at any point returns `{ visual: null }`, so the lesson renders the
question alone. Checked images are cached in Cloudinary as `question_visual`
media keyed by question content + prompt version. `AI_VISUALS_ENABLED` is an
opt-in kill switch; unset/false disables all visuals, including cached ones.
`DELETE /api/question-visual` flags cached visuals for a question by setting
`is_public=false` and `meta.flagged=true`; flagged images are never re-served.

## Configuration & Failure Modes

- Keys: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` — missing keys throw
  `AiConfigError`, surfaced as a clean 503 (feature off, app up)
- Model: `TEACHING_MODEL = "gpt-4o-mini"` (central constant — change in one place)

## Known Gaps

- The Diagnostic Agent (90% threshold) is specified in the brief; the teaching
  pipeline is the Phase-1 implementation
