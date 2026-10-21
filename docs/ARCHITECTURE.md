# Architecture

Status: **Phase 3 — campaign engines and screens built.** The progress store, question builder,
spiral review, lesson phase, the five quiz engines, and the map → lesson → quiz → results flow are
implemented; the free-practice Dojo and final polish are Phase 4. Sections that are still only
target design are marked _(planned)_.

## 1. Goals and non-goals

**Goals**

- Take an absolute beginner from no Japanese knowledge to reading kana and building first sentences.
- Teach before testing: every level introduces its items in a lesson, then drills them.
- Survive forgetting: a spiral weak-item mix keeps old items in circulation.
- Work offline, on a phone, with no account. Progress lives in the browser.
- Stay cheap to host and simple to maintain.

**Non-goals (for this slice)**

- Accounts, cloud sync, leaderboards, social features.
- Full N5 coverage; the slice proves every mechanic with a small, curated curriculum.
- Kanji handwriting input or SRS algorithm tuning beyond the weighted review described below.

## 2. Stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Lint | oxlint (template default) |
| Styling | One global stylesheet (`src/styles/global.css`) with the original CSS custom-property design system |
| State | React state + a typed progress store persisted to `localStorage` |
| Hosting | Vercel (primary), GitHub Pages (alternative) |
| Backend | None |

No router library is required. The app has a fixed set of screens (level map, lesson, quiz, results,
Dojo) and switches between them with state. If deep-linking becomes necessary later, add a router
then.

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

Only `src/app`, `src/components`, `src/styles`, and `src/main.tsx` exist after Phase 1. Create the
remaining folders as their phase lands; do not pre-create empty directories.

## 4. Screen flow

```
Level map
  ├─ locked level ──────────────► nudge, no content rendered
  ├─ unlocked level, unseen ────► Lesson (cards for level.learn)
  ├─ unlocked level, seen ──────► Quiz round
  └─ Dojo (free practice) ──────► Legacy-style config → rounds
        Quiz round ──► Results
                         ├─ ≥ passAccuracy ──► mark level passed, unlock next, back to map
                         └─ below ───────────► Retry (same items, reshuffled, spiral mixed in)
```

The lesson is shown once per level. Retries never re-show it; the Dojo is always available and never
affects level gating.

## 5. Domain model

All ids are stable strings; never derive ids from array positions.

```ts
type Script = 'hiragana' | 'katakana';
type KanaGroup = 'basic' | 'dakuten' | 'yoon';

interface KanaItem {
  id: string;                 // "hira:あ"
  type: 'kana';
  glyph: string;              // あ or ア
  romaji: string;
  alts?: string[];            // Kunrei/alternate spellings accepted in typing
  script: Script;
  group: KanaGroup;
  mnemonic?: string;          // shown only on miss / retry feedback
}

interface VocabItem {
  id: string;                 // "vocab:みず"
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
  id: string;                 // "kana-01"
  order: number;
  title: string;
  stage: 'kana' | 'vocab' | 'grammar';
  requires: string[];         // level ids that must be passed first
  learn: string[];            // item ids introduced in the lesson
  pool: string[];             // item ids this level's quizzes may draw from
  grammar?: GrammarQuestion[];
  passAccuracy: number;       // 0.8
}
```

### Item type ↔ exercise mapping

| Item type | Exercises |
| --- | --- |
| `kana` | `char2romaji`, `romaji2char`, `type`, `drag` (4-pair matching) |
| `vocab` | `jp2en` (choice), `en2jp` (choice), `typeReading` (type the kana reading in rōmaji) |
| `grammar` | `particle-fill` (choice UI), `assembly` (drag/tap tile ordering) |

Typing a kanji reading in rōmaji removes the IME problem and the multi-reading ambiguity: the item
is a word, and only the word's reading is ever accepted (its `alts` if any).

## 6. Progress model and persistence

Storage key: **`kanaDojo.progress.v2`**.

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
- **Migration.** On first load, if no v2 key exists, read the legacy `kanaDojo.config.v1` and
  `kanaDojo.best.v1` and seed `practice`. Never delete legacy keys automatically.
- **Versioning.** Any change to the shape bumps the key (`.v2` → `.v3`) and ships a migration.

### Spiral review weighting

Only items the learner has already completed a lesson for are eligible for review. A round for a
level draws:

1. **75%** from the level's own pool (new items), shuffled and deduplicated.
2. **25%** (rounded, at least one when eligible items exist) from review candidates outside this
   level's new items, weighted by `1 + wrong` (capped). Items missed more often appear more often.

If the review pool is too small, fill the remainder from the level pool. The mix is computed in the
engine, not in the UI, so no screen can accidentally leak unlearned content.

### Unlocking

```
isUnlocked(level) = level.requires.every(id => progress.levels[id]?.passed === true)
```

A level is marked passed when the round's accuracy meets `level.passAccuracy`. Passed is permanent:
replays update `bestAccuracy`, `bestScore`, and item weights, but never re-lock a level or a stage.

## 7. Question building

A single factory owns round construction:

```ts
buildRound(levelId, progress, rng): Question[]
```

Rules:

- Refuse to build if the level is locked. This is the enforcement point for "locked content never
  renders" — the UI cannot bypass it.
- Reject item ids that are not in `progress` as learned and not in `level.learn` for first runs.
- Rounds are 10 questions for choice/typing levels, 6 for drag rounds, and 8 for grammar levels.
- Every question carries the item (or grammar question) that produced it, so feedback, review, and
  miss-weight updates need no lookups.

## 8. Quiz engines

Five engines share the response contract `{ correct: boolean }`, plus engine-specific feedback.

| Engine | Interaction | Notes |
| --- | --- | --- |
| `choice` | tap/click or keys `1`–`4` | 4 options; distractors deduplicated by label **and** reading |
| `type` | text input + Enter | normalise rōmaji; accept item alts; escape user input in feedback |
| `drag` | pointer-drag tiles onto slots, with tap-tile-then-tap-slot fallback | Pointer Events, not HTML5 DnD; keep `touch-action: none`, ghost element, and click suppression |
| `particle-fill` | choice chips in sentence blanks | accepts one correct particle per blank; shows the full sentence on check |
| `assembly` | drag/tap tiles into a sentence order | reuses the drag engine; checks the canonical `answer` order, not token equality |

Scoring and streaks keep the legacy feel: base 100 for choice, 120 for typing, 40 per placed drag
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
- **Touch**: tap fallbacks exist for every drag interaction; the layout is verified at < 470 px.

## 11. Conventions that must survive the migration

These were hard-won in the legacy game; do not regress them:

- Rōmaji matching goes through `normalizeRomaji()`: lowercase, strip macrons and non-ASCII, then
  compare against the item's accepted readings.
- Choice distractors are deduplicated by visible label **and** rōmaji.
- Dragging is Pointer Events with a cloned ghost, `touch-action: none`, a tap-to-place fallback, and
  a `suppressClicksUntil` guard so the post-drag click does not select a tile.
- User-entered text is escaped before interpolation into feedback.
- Katakana can be generated from hiragana by the U+3041–U+3096 + 0x60 offset, but **contents of
  vocab items must be authored explicitly** — do not run the offset over mixed strings.
- Settings and bests use versioned `localStorage` keys.
- Prefer `performance.now()` for timers; the question timer never applies to drag or grammar
  assembly questions.
