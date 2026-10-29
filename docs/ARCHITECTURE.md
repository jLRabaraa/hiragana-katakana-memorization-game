# Architecture

Status: **existing Phase 3 campaign; beginner pilot planned on 2026-10-29**. The progress store,
question builder, spiral review, lesson cards, five exercise types, mnemonic feedback, best scores,
and map → lesson → quiz → results flow exist. Guided teaching, per-kana readiness, daily review,
and habit tracking are planned in [BEGINNER-PILOT.md](BEGINNER-PILOT.md). Public Google sign-in,
Spark Firestore sync, account-scoped IndexedDB, offline reopen, and required guided tracing are
also planned, not built; [CLOUD-SYNC.md](CLOUD-SYNC.md) is their canonical specification.

The current campaign and v2 schema are described below. Section 12 describes the pilot changes;
they must not be mistaken for implemented behavior. Free-practice Dojo and broader campaign
expansion follow pilot evaluation. Grammar content review remains open as Checkpoint 3.

## 1. Goals and non-goals

**Goals**

- Take an absolute beginner from no Japanese knowledge to reading kana and building first sentences.
- Teach before testing: the pilot introduces one or two kana at a time, practices them with help,
  then checks unaided recall and introduces a word using taught kana in the first session.
- Evaluate recall after an actual next-day return before extending the pilot across the campaign.
- Support regular practice with short daily review, weekly activity, and a daily streak, alongside
  the existing spiral mix.
- Require Google sign-in before first learning; allow public registration and device switching.
- Reopen offline after initial online sign-in/cache setup; save locally and merge completed work.
- Require guided tracing once per newly taught kana without tracing scores or reading penalties.
- Keep cloud usage strictly $0: Spark without billing; accept quota-related cloud unavailability.

**Non-goals (for this slice)**

- Leaderboards, social feeds, additional sign-in providers, and a deployed custom backend API.
- Full N5 coverage or converting the entire campaign before evaluating the five-kana pilot.
- Freehand recognition, isolated kanji writing exercises, or a general-purpose review scheduler.

## 2. Stack

| Concern | Implemented baseline |
| --- | --- |
| UI | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Lint | oxlint (template default) |
| Styling | One global stylesheet (`src/styles/global.css`) with the original CSS custom-property design system |
| State | React state + a typed progress store persisted to `localStorage` |
| Hosting | Vercel (primary), GitHub Pages (alternative) |
| Backend | None |

Target additions: Firebase Authentication (Google), Firestore Standard/Spark with ownership and
schema Security Rules, IndexedDB for per-account records/outbox, and a service worker for offline
startup. No billing account or Cloud Run/Functions. Storage operations move out of the pure learning
engine. See [CLOUD-SYNC.md](CLOUD-SYNC.md) and [diagrams](diagrams/README.md) for the proposed structure.

No router library is required. The app switches between the level map, lesson, quiz, results, and
curriculum review using state. Dojo is planned. If deep-linking becomes necessary later, add a
router then.

## 3. Directory layout

```
.
├── docs/                      # These documents
├── legacy/
│   └── kana-dojo-legacy.html  # Original single-file game, kept as a working reference
├── public/                    # Static files copied to the build
├── scripts/
│   └── convert-datasets.ts    # Dataset enrichment
├── src/
│   ├── app/App.tsx            # Application shell and screen switch
│   ├── components/            # Shared UI (buttons, cards, attribution footer)
│   ├── data/
│   │   ├── curated/           # Hand-authored levels, items, mnemonics, sentences
│   │   └── generated/         # Enriched output committed for the slice
│   ├── engine/                # Pure logic: question builder, spiral weights, gating
│   ├── features/
│   │   ├── home/              # Level map
│   │   ├── learn/             # Lesson phase
│   │   ├── quiz/              # Quiz engines
│   │   └── results/           # Results and retry flow
│   ├── hooks/                 # Persistence and shared React hooks
│   ├── styles/global.css      # Design system (ported from the legacy game)
│   ├── types/                 # Shared domain types
│   └── utils/                 # Romaji normalisation, escaping, shuffle, audio
├── index.html                 # Vite entry
├── vercel.json                # Vercel static config with SPA fallback
└── THIRD_PARTY_LICENSES.md
```

Create new folders only as their implementation lands; do not pre-create empty directories.

## 4. Current campaign screen flow

```
Level map
  ├─ locked level ──────────────► disabled stub, no lesson content
  ├─ unlocked level, unseen ────► Lesson (cards for level.learn)
  └─ unlocked level, seen ──────► Quiz round
        Quiz round ──► Results
                         ├─ ≥ passAccuracy ──► mark level passed, unlock next, back to map
                         └─ below ───────────► Retry (fresh selection from the eligible pools)
```

The current campaign shows its lesson cards once per level. Retries rebuild the round from the
eligible pools rather than preserving the exact sampled items. The future Dojo is intended to be
always available and independent of campaign gating.

## 5. Domain model

All ids are stable strings; never derive ids from array positions. The shared definitions live in
[`src/types/domain.ts`](../src/types/domain.ts); the main shapes are shown below.

```ts
type Script = 'hiragana' | 'katakana';
type KanaGroup = 'basic' | 'dakuten' | 'yoon';

interface KanaItem {
  id: string;                 // "hira:あ"
  type: 'kana';
  glyph: string;              // あ or ア
  romaji: string;
  alts: string[];             // Kunrei/alternate spellings accepted in typing
  script: Script;
  group: KanaGroup;
  mnemonic?: string;          // shown only on miss / retry feedback
}

interface VocabItem {
  id: string;                 // "vocab:水"
  type: 'vocab';
  kana: string;               // reading, e.g. みず
  kanji?: string;             // written form, e.g. 水
  gloss: string;              // short English gloss
  readings?: { on: string[]; kun: string[] };
  example?: { ja: string; en: string };
  mnemonic?: string;
}

interface ParticleBlank {
  index: number;              // token index that is blanked
  answer: string;             // は / を / に / で / も
  choices: string[];          // including the answer
}

type GrammarQuestion =
  | { kind: 'particle-fill'; id: string; tokens: string[]; blanks: ParticleBlank[]; translation: string }
  | { kind: 'assembly'; id: string; tokens: string[]; answer: string[]; translation: string };
// assembly: `tokens` are shuffled tiles, `answer` is the canonical order.

interface Level {
  id: string;                 // "kana-h01"
  order: number;
  title: string;
  stage: 'kana' | 'vocab' | 'grammar';
  requires: string[];         // level ids that must be passed first
  learn: string[];            // item ids introduced in the lesson
  pool: string[];             // item ids this level's quizzes may draw from
  grammar?: GrammarQuestion[];
  lessonNotes?: string[];
  passAccuracy: number;       // 0.8
}
```

### Item type ↔ exercise mapping

| Item type | Exercises |
| --- | --- |
| `kana` | `char2romaji`, `romaji2char`, `type`, `drag` (4-pair matching) |
| `vocab` | `jp2en` (choice), `en2jp` (choice), reading in rōmaji (typing), word-to-meaning matching |
| `grammar` | `particle-fill` (choice UI), `assembly` (drag/tap tile ordering) |

Typing a kanji reading in rōmaji removes the IME problem and the multi-reading ambiguity: the item
is a word, and accepted rōmaji variants are derived from its kana reading.

## 6. Current progress model and persistence

Current storage key: **`kanaDojo.progress.v2`**. This describes the existing code, not an instruction
to import old progress into accounts. Section 12 describes the fresh account schema. This v2 shape
does not contain unit steps, unaided recall evidence, tracing completion, or daily review dates.

```ts
interface Progress {
  version: 2;
  levels: Record<string, {
    passed: boolean;
    learnedAt?: number;
    bestAccuracy: number;
    bestScore: number;
  }>;
  items: Record<string, {
    seen: number;
    correct: number;
    wrong: number;
    lastMissAt?: number;
  }>;
  practice: {
    config: DojoConfig;                    // the legacy settings object
    best: Record<string, number>;          // keyed by script|sets|mode
  };
}
```

- **Save on transition, not on keystroke.** Write after a round ends and when a level is passed.
- **Validate on read, field by field.** Unknown level ids or malformed values are dropped with
  defaults restored; a corrupted store must never break the app.
- **Existing v2 behavior.** On first load, if no v2 key exists, read the legacy `kanaDojo.config.v1` and
  `kanaDojo.best.v1` and seed `practice`. Never delete legacy keys automatically.
- **Target versioning.** New accounts start fresh in v3 IndexedDB/Firestore records. Do not import
  v2/legacy data or delete its keys. Future account-schema changes require versioned migrations.

### Spiral review weighting

The current engine treats a completed lesson (or passed level) as evidence that its items were
taught. Kana/vocab rounds target approximately 25% review questions, weighted by
`1 + min(wrong, 4)` and sampled without replacement from learned items outside the level pool.

With enough candidates, rounding produces three review questions in a ten-question round. Review
items occupy choice/typing slots; the two matching questions use the current level's pool. Items
can repeat when a pool runs short. Grammar rounds currently have no spiral review.

If the review pool is too small, the level pool fills the remainder. Selection belongs in the
engine. Distractor eligibility also needs enforcement: current global fallbacks are a known gap,
documented in the pilot plan.

### Unlocking

```
isUnlocked(level) = level.requires.every(id => progress.levels[id]?.passed === true)
```

A level is marked passed when the round's accuracy meets `level.passAccuracy`. Passed is permanent:
replays update `bestAccuracy`, `bestScore`, and item weights, but never re-lock a level or a stage.

## 7. Question building

A single factory owns round construction:

```ts
buildRound(levelId: string, progress: Progress, rng?: Rng): Round
// Round = { levelId: string; reviewCount: number; questions: Question[] }
```

Current behavior:

- Refuse to build if the level is locked. This is the enforcement point for "locked content never
  renders" — the UI cannot bypass it.
- Refuse a level whose lesson has not been completed; use its pool plus learned spiral items.
- Kana/vocab rounds contain 10 questions: six choices, two typing, and two matching questions.
  Grammar rounds contain eight questions: six particle fills and two assemblies. The React
  campaign has no standalone six-question drag mode yet.
- Every question carries the item (or grammar question) that produced it, so feedback, review, and
  miss-weight updates need no lookups.

The pilot needs eligibility at each teaching step and per-item recall coverage; it cannot simply
reuse a ten-question campaign sample as proof that every introduced kana was recalled. Restrict
distractors to taught material and allow fewer choices when the taught pool is small.

## 8. Quiz engines

Five engines share the response contract `{ correct: boolean }`, plus engine-specific feedback.

| Engine | Interaction | Notes |
| --- | --- | --- |
| `choice` | tap/click or keys `1`–`4` | 4 options; distractors deduplicated by label **and** reading |
| `type` | text input + Enter | normalise rōmaji; accept item alts; escape user input in feedback |
| `drag` | pointer-drag tiles onto slots, with tap-tile-then-tap-slot fallback | Pointer Events, not HTML5 DnD; keep `touch-action: none`, ghost element, and click suppression |
| `particle-fill` | choice chips in sentence blanks | accepts one correct particle per blank; shows the full sentence on check |
| `assembly` | drag/tap tiles into a sentence order | reuses the drag engine; checks the canonical `answer` order, not token equality |

Scoring and within-round answer streaks keep the legacy feel: base 100 for choice, 120 for typing, 40 per placed drag
tile, plus a streak bonus capped at 50. Grammar questions score as choice questions. Accuracy is
`correct / total` and is what gates progression.

Keyboard: one document-level handler for `1`–`4` and `Enter`; ignore events from inputs and
textareas. Per-question handlers are attached in components, not delegated across re-renders.

## 9. Rendering and locking

- **Level map renders stubs only.** Number, title, glyph, lock state. Locked levels are not
  clickable and never preview content.
- **Only the active screen renders.** The quiz card rebuilds per question with that question's data
  only; lesson cards render one level's items.
- **Data is loaded in memory** for the slice. If the dataset grows past a few hundred KB, split
  per-stage data files and load them with dynamic `import()` (supported by Vite), keeping the same
  engine contract.

## 10. Audio, accessibility, and motion

- **Sound**: WebAudio-synthesised tones for correct/wrong/place/finish; `speechSynthesis` with
  `lang: 'ja-JP'` for kana and word pronunciation. Every path degrades silently when unavailable or
  when the sound toggle is off.
- **Reduced motion**: `prefers-reduced-motion` disables animations and confetti.
- **Feedback** uses `aria-live="polite"`; focus outlines remain visible; every icon button has an
  accessible label.
- **Touch**: drag interactions include tap-fallback handlers, but ordinary taps currently trigger
  suppression. Correct this and verify both interactions below 470 px before evaluating the pilot.

## 11. Conventions that must survive the account/offline work

These were hard-won in the legacy game; do not regress them:

- Rōmaji matching goes through `normalizeRomaji()`: lowercase, strip macrons and non-ASCII, then
  compare against the item's accepted readings.
- Choice distractors are deduplicated by visible label **and** rōmaji.
- Dragging is Pointer Events with a cloned ghost, `touch-action: none`, a tap-to-place fallback, and
  a `suppressClicksUntil` guard set only after an actual drag so ordinary taps can select a tile.
- User-entered text is escaped before interpolation into feedback.
- Katakana can be generated from hiragana by the U+3041–U+3096 + 0x60 offset, but **contents of
  vocab items must be authored explicitly** — do not run the offset over mixed strings.
- Persist settings and bests with explicit schema versions. Current v2 uses localStorage; the
  account target uses UID-scoped IndexedDB and Firestore records without importing those old keys.
- Prefer `performance.now()` for timers; the question timer never applies to drag or grammar
  assembly questions.

## 12. Planned beginner pilot architecture

The pilot introduces one or two kana per step and a kana-only word as soon as its characters have
been taught. Its sequence is orientation → introduction → assisted practice → unaided recall →
word reading → checkpoint. The word may appear during the teaching sequence; it need not wait for
all five kana. Returning learners start with a short review before new material.

### Unit identity and eligibility

Give the five-kana unit a stable identity and its own completion record. Reuse existing kana item
IDs, but do not shrink or silently pass `kana-h01`, which currently covers ten kana. Introducing
one item must not make the rest of that campaign level eligible for questions or review.

An early word's kana presentation must remain distinct from its later kanji teaching. For example,
reusing the house word must not let `kanji ?? kana` display 家 in the pilot or mark `vocab-02`
learned. Define explicit eligibility for the forms shown in prompts, options, and feedback.

Keep the new teaching-step, checkpoint, and review-selection logic free of React. The UI renders
only the active step or question. Existing exercise components can be reused after correcting
reverse-choice prompts, tap suppression, and option eligibility.

### Readiness and retained knowledge

Track introduced items, assisted attempts, and unaided correct recall separately. Every new kana
must have at least one unaided correct recall before the unit checkpoint, which passes at 80%.
Recognition choices and answer-revealing audio do not establish unaided recall. Misses receive
targeted explanations and later attempts without restarting the full lesson.

Store next-day first attempts separately from corrections and repeated practice. A completed unit
stays unlocked after a review miss. Daily completion depends on finishing the assigned review with
corrections, without an accuracy gate; this is distinct from passing a new unit's checkpoint.

### Daily review and calendar state

Select a bounded taught-item set targeting 3–5 minutes, prioritizing weak or overdue items. Carry
unselected items forward and allow extra practice afterward. The first next-day pilot evaluation
checks all five kana before the refresher. Exact set size and intervals are unit-authoring details;
the pilot does not require a general-purpose spaced-repetition scheduler.

Persist completion once per local calendar day and derive daily completion, weekly activity, and
the consecutive-day streak consistently from those records. Repeating review must not award a
second day of credit. A missed day resets the daily streak without revoking completed units. This
calendar streak is separate from the existing quiz answer streak and score bonuses.

### Planned v3 account schema

Define v3 account-scoped IndexedDB and Firestore records; do not create a localStorage import path.
Types must cover guided-unit progress, introduced items/forms, unaided recall, checkpoint results,
review outcomes, daily dates, unique completion IDs, upload acknowledgments, and tracing completion.

Google accounts start fresh; old v2/legacy saves remain untouched and are not imported. Once account
progress exists, preserve passes and bests across devices and future schema migrations. Validate every
field; write unique completions atomically with the local outbox. Unfinished quizzes restart and lose
their uncommitted tracing. Tracing commits with round completion, even below the reading pass gate.

Require all reviewed strokes once per introduced kana, reveal only accepted strokes after pointer
release, and allow unlimited retries. Tracing earns no points, is excluded from reading accuracy,
and cannot satisfy unaided recall. Engine selection must guarantee coverage of required tracing.

Use service-worker caching for offline reopen and Firestore completion merging for device switching.
Security Rules enforce UID ownership and valid shapes. Never upload candidate paths or drawings.
Full account, retry, quota, and offline-session behavior is in [CLOUD-SYNC.md](CLOUD-SYNC.md).

Use the checks and learner evaluation targets in [BEGINNER-PILOT.md](BEGINNER-PILOT.md) before
extending the design to additional units.
