# Beginner pilot plan

Agreed direction: **2026-10-29**. Status: **planned; not implemented or evaluated**.

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
items learned. Reuse existing kana item IDs and preserve all existing campaign IDs and passes.

The early word must render in kana throughout the pilot. Reusing the existing house vocabulary
entry must not expose 家 or mark its later vocabulary level completed. Represent what was actually
taught rather than unlocking every written form of a word at once.

The current store is `kanaDojo.progress.v2`. Guided-unit progress and daily review require a new
schema and migration, planned as `kanaDojo.progress.v3`. Keep these concepts distinct:

- Which items and forms were introduced, and which guided steps were completed.
- Unaided recall evidence for the unit's readiness requirement and its checkpoint result.
- Review eligibility, first-attempt outcomes, and corrections after hints.
- Daily completion dates for weekly activity and the daily streak.

Preserve existing passes, best scores, item statistics, settings, and practice bests during
migration. Do not invent historical unaided recall or review dates from aggregate v2 counts. Read
malformed saves safely, retain legacy keys, and save at meaningful completion transitions rather
than on keystrokes. Keep progression and review selection in the React-free engine layer.

## Implementation order

| Step | Deliverable | Completion evidence |
| --- | --- | --- |
| 1. Author and review | Teaching sequence, first word, pronunciation guidance, exercises, feedback, and exact checkpoint composition | Kana and vocabulary review recorded for the changed material |
| 2. Correct shared interactions | Reverse-choice prompt, tap behavior, taught-only option pools, accessible controls | Focused browser checks with keyboard, mouse, drag, and taps below 470 px |
| 3. Build the guided unit | Introduction, assisted practice, unaided recall, checkpoint, targeted retries, and independent unit completion | Every taught kana is checked; assisted answers cannot satisfy the unaided gate |
| 4. Add review and persistence | Bounded daily set, refresher, daily goal, weekly activity, streak, and v3 migration | Reload, old saves, corrupted saves, repeated same-day review, and missed-day behavior checked |
| 5. Evaluate and revise | First session and actual next-day return with a complete beginner | Observations and first-attempt outcomes recorded before expanding the curriculum |

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
