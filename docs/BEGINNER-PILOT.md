# Beginner pilot plan

Agreed direction: **2026-10-29**, including the cloud/tracing interview. Status: **planned; not
implemented or evaluated**. [CLOUD-SYNC.md](CLOUD-SYNC.md) defines the account, offline, sync, and
tracing requirements; account-free plans and importing old browser saves are superseded.

The next milestone is one complete beginner unit, evaluated during a first session and an actual
next-day return. Its purpose is to find out whether someone with no Japanese knowledge can learn
and retain a small amount independently. Expand the design across the campaign after evaluating
and improving this unit.

This plan replaces the immediate priority of finishing the original Phase 4 feature list. The
existing 16-level campaign remains the implementation baseline. Product decisions are recorded in
[DECISIONS.md](DECISIONS.md); engineering constraints are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Learner and scope

Assume the learner does not know what hiragana or rōmaji are. Explain the terms and interactions
inside the lesson. Familiarity from having memorized kana before is useful for reviewing the app,
but evaluation needs a complete beginner.

The pilot covers five hiragana and one word made entirely from taught kana. The proposed content
is **あ・い・う・え・お**, with **いえ (house)** introduced after い and え. Exact teaching copy,
pronunciation guidance, exercises, and feedback go through the kana and vocabulary checkpoints in
[DATA-PIPELINE.md](DATA-PIPELINE.md) before being wired into the playable unit.

Kana-only words now belong in the first session. Kanji remains a later step taught inside words.
The first milestone does not include converting every hiragana level, adding katakana or grammar
lessons, restoring the free-practice Dojo, or expanding dictionary data. Those remain later work.

## First session

1. **Orient:** briefly explain kana, rōmaji, pronunciation controls, and how to answer.
2. **Introduce:** present one or two kana at a time with their readings and optional audio.
3. **Practice:** immediately exercise what was introduced, initially with help, then without hints.
   Use only taught material in both prompts and distractors. A small taught pool may need fewer
   choices; never fill an option set with locked content.
4. **Read a word:** combine taught kana into the first meaningful word during this session.
5. **Check readiness:** require at least one unaided correct recall for every new kana, followed
   by a checkpoint passed at 80% accuracy.

Before the first lesson, require Google sign-in (public registration). Within the quiz, require
guided tracing once per newly taught kana without a committed tracing completion. Highlight the
next guide and capture movement invisibly; reveal only a correct stroke after pointer release.
Require every stroke in reviewed order/direction, allow retries, and award no tracing points.
Exclude tracing from reading accuracy and unaided recall. Review stroke data and instructions at
kana Checkpoint 1. Tracing coverage is required, not a random sample of new kana.

Unaided recall means producing the reading without a visible answer, answer choices, or an audio
hint that supplies it. Recognition choices and assisted answers are useful practice, but are
recorded separately. A mistake receives a brief explanation and another recall attempt after
intervening questions. Retry does not force a replay of the entire lesson.

The per-kana requirement and the checkpoint are both necessary for initial completion. Passed
units stay passed. A later miss changes review priorities rather than revoking access. One correct
recall establishes readiness during this session; next-day performance is measured separately.

## Daily review and habit

On a return visit, **Today's review** is the main action before new material. Check recall before
showing reminders, then provide a targeted refresher for forgotten items. For the pilot's next-day
evaluation, capture first attempts on all five kana before the refresher.

- Choose a small set targeting **3–5 minutes**, prioritizing weak or overdue taught items. This is
  a session-size target, not a countdown or a requirement to clear the whole backlog.
- Carry remaining items forward. Offer additional practice and optional new material after the
  daily set. Returning after several missed days should still offer a small session.
- Completing the assigned review, including corrections, earns daily credit. Opening the app
  alone does not. Review accuracy is feedback, not an 80% requirement for daily credit.
- Show daily completion, a weekly activity tracker, and a consecutive-day streak. A missed day
  resets the streak; completed lessons remain unlocked. The daily streak is distinct from the
  existing within-round correct-answer streak.
- Record credit once per local calendar day. Repeating a set on the same day must not add another
  streak day or overwrite the first-attempt evidence used to evaluate retention.

Define the exact set size, review intervals, checkpoint composition, and first-day credit behavior
when authoring the unit. These details must preserve the agreed recall gate, daily completion rule,
and short-session target. The pilot does not require a general-purpose spaced-repetition system.

## Compatibility and persistence

The current `kana-h01` level contains ten kana (あ–こ). The five-kana pilot needs its own stable
unit identity and completion record; finishing it must not mark `kana-h01` passed or its remaining
items learned. Reuse existing kana item IDs and preserve campaign IDs. New accounts start fresh;
preserve passes once earned within an account, including across devices.

The early word must render in kana throughout the pilot. Reusing the existing house vocabulary
entry must not expose 家 or mark its later vocabulary level completed. Represent what was actually
taught rather than unlocking every written form of a word at once.

The current code uses `kanaDojo.progress.v2`. The target is a fresh v3 account schema in IndexedDB
and Firestore on Spark without billing, not a v2 import or a `kanaDojo.progress.v3` localStorage
key. Keep these concepts distinct:

- Which items and forms were introduced, and which guided steps were completed.
- Unaided recall evidence for the unit's readiness requirement and its checkpoint result.
- Review eligibility, first-attempt outcomes, and corrections after hints.
- Daily completion dates for weekly activity and the daily streak.
- Per-kana tracing completions, unique completed-round IDs, and pending upload acknowledgments.

Do not import v2 progress or legacy settings/bests into Google accounts; leave those keys untouched.
Preserve new account data through future migrations. Read malformed records safely and save at
meaningful completion transitions, not keystrokes. Keep progression, merging, and stroke checking
in the pure engine. Completed work merges across devices without double-counting rounds.

An unfinished quiz restarts. Tracing within it is uncommitted until round completion, even when
the completed round fails the reading gate. Save completed first-attempt daily-review evidence
separately from unfinished quiz state. Service-worker caching allows offline reopen after initial
online sign-in; account-specific local work queues until authenticated synchronization succeeds.

## Implementation order

| Step | Deliverable | Completion evidence |
| --- | --- | --- |
| 1. Account persistence | Typed v3 completions, pure merge rules, account-scoped IndexedDB and atomic outbox | Fresh accounts; malformed data recovery; duplicate events counted once |
| 2. Authentication and sync | Public Google sign-in, Spark Firestore, restrictive Security Rules | Cross-account denial; offline conflicts preserve completed work; no billing attached |
| 3. Offline startup | Service worker, compatible curriculum cache, pending-save status | Close/reopen offline; expired session; quota failure; account switching; unfinished quiz restarts |
| 4. Author and review | Teaching sequence, first word, stroke guides, feedback, checkpoint composition | Kana/vocabulary review includes tracing order, direction, licensing, and input tolerances |
| 5. Build guided learning and tracing | Correct existing interactions; introduction, practice, unaided recall, required tracing, checkpoint | Every new kana covered; tracing adds no points or recall credit; mobile and keyboard checked |
| 6. Daily review and habit | Bounded set, refresher, daily credit, weekly activity, streak | First attempts preserved; same-day repeats and missed days handled; calendar policy defined |
| 7. Evaluate and revise | First session and actual next-day return with a complete beginner | Observations and first-attempt outcomes recorded before expanding the curriculum |

## Existing implementation gaps

These findings come from the 2026-10-29 code review and need verification during implementation:

- `questionBuilder.ts` uses the kana glyph as the prompt for both choice directions, revealing the
  answer in rōmaji-to-kana questions.
- Matching and assembly set click suppression on ordinary pointer taps as well as drags, blocking
  the intended tap-selection fallback.
- Global distractor fallbacks are not filtered to the learned pool. The pilot needs explicit
  eligibility checks for options as well as question targets.
- `learnedAt` currently marks an entire level's lesson seen. It cannot represent partial teaching
  or independent recall within the five-kana unit.
- Mnemonic feedback and best-score persistence already exist; they need verification, not a new
  implementation merely because older roadmap text lists them as remaining work.

Grammar review remains open as **Checkpoint 3**. Its existing use of 私 without a preceding word
lesson and unexplained transitions to polite verb forms belong to later curriculum repair. The
grammar level is already wired into the campaign; that does not establish content sign-off.

## Evaluation targets

These are initial pilot targets to evaluate, not evidence that the current app achieves them:

- A complete beginner finishes without another person explaining the interface or lesson.
- Every new kana receives an unaided correct recall, and the checkpoint reaches at least 80%.
- Every newly taught kana receives required guided tracing; only correct strokes appear, all
  strokes are required, and completion is separate from points, reading accuracy, and recall.
- Public Google sign-in and device switching work; accounts start fresh. Offline reopen works
  after caching, duplicate uploads preserve totals, and unfinished quizzes restart.
- After a real next-day return, the learner recalls at least **four of five kana on first attempts
  before hints** and reads the taught word. Keep this measure separate from daily completion credit.
- The daily review fits roughly within 3–5 minutes and offers a clear stopping point.
- Touch and keyboard interactions work, progress survives reload, and audio can be unavailable
  without blocking the lesson. Verify focus visibility, feedback announcements, and reduced motion.

Use the first learner's results to revise the unit. They do not establish broad effectiveness.
Clock-controlled checks can verify scheduling, but do not replace the actual next-day learner visit.

Run `npm run typecheck`, `npm run lint`, and `npm run build`, followed by the relevant browser
checks in [DEPLOYMENT.md](DEPLOYMENT.md). The repository has no test framework; do not introduce
one solely for this pilot without a separate request.
