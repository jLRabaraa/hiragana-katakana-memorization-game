# Decision Log

This log records the current design decisions, revised in the **2026-10-29** planning interview.
The immediate goal is independent beginner learning and next-day recall in one small pilot.
See [BEGINNER-PILOT.md](BEGINNER-PILOT.md) for the implementation sequence and evaluation targets.
These decisions describe the intended behavior; the pilot is not implemented yet. The October
21–22 session logs preserve the earlier plan and build history.

## Product

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 1 | **Guided teaching before independent recall** | Introduce one or two kana, practice immediately with help, then remove hints. Explain kana, rōmaji, and the controls for someone with zero Japanese knowledge. | A grid of lesson cards followed by a quiz; unguided exploration as the first beginner experience. |
| 2 | **Kanji taught through vocabulary** | A kanji has 2–6 readings; isolated drills and rōmaji typing become ambiguous. Words give context, resolve the reading, and are what a learner actually needs. | Isolated kanji meaning drills (simpler data, weak reading skills); layered both-models (more data, deferred). |
| 3 | **Read words during the first session** | Combine only kana already taught into a meaningful word. Kanji remains later and appears inside vocabulary. This replaces the old requirement to finish both scripts before any words. | Waiting until basic hiragana is finished; preserving all 13 kana levels before vocabulary. |
| 4 | **Evaluate one five-kana unit first** | Build the complete teaching, checkpoint, and next-day review loop for a complete beginner, then improve it before expanding. | Migrating every hiragana level or the entire 16-level campaign before learner evaluation. |
| 5 | **Free practice (Dojo) remains later work** | Preserve the planned legacy-style practice mode using shared engines, after the beginner pilot. Its React screen is not built. | Dropping the feature; making it a dependency of the pilot. |

## Progression and retention

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 6 | **Per-kana recall plus an 80% checkpoint** | Before the pilot checkpoint, every new kana needs one unaided correct recall. The checkpoint still requires ≥ 80%. Assisted answers are tracked separately. | An 80% average alone, which can hide a consistently missed character; completion without a correctness check. |
| 7 | **Targeted help and lenient retries** | Explain a miss briefly and revisit it after intervening questions. Retry skips a forced replay of the whole lesson. Passed units and levels stay unlocked. | Attempt limits; repeating the full lesson after each failure; re-locking completed work after forgetting. |
| 8 | **Keep engine-computed spiral review** | Campaign kana/vocab rounds target ~25% learned items weighted by miss count. Planned daily review adds a normal returning-user routine alongside this mix. | Restricting practice to each level's new items; relying on an optional review button alone. |
| 9 | **On-miss mnemonics only** | Mnemonics anchor glyphs and kanji for beginners, but showing one per lesson card adds clutter. Show them in the feedback for a wrong answer or failed-level retry. | Full mnemonics on every card (visual noise); no mnemonics (weaker encoding for look-alike kana). |

## Engineering

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 10 | **React + TypeScript + Vite** | Chosen partly for employability (React is the market default) and partly for the screen count: level map, lessons, five quiz engines, results. Types catch data-model bugs as kanji/vocab/grammar schemas grow. | Svelte (best fit for this app, weakest hiring signal); Vue (middle ground); vanilla TS (no framework résumé line); strict single-file (unmaintainable at this scope). |
| 11 | **Multi-file project, GitHub repo** | The single-file constraint from the legacy project is retired. Code is organised by concern (`engine/`, `features/`, `data/`, `types/`). | Keeping one HTML file (file size, merge pain, no type safety). |
| 12 | **Curated curriculum + dataset enrichment** | Author the pilot's five-kana sequence and first word intentionally. The existing campaign has 14 words and 12 grammar questions; dictionaries enrich selected content. | Bulk-converting dictionaries into the app; expanding content before evaluating the learning loop. |
| 13 | **Engine-enforced locks and lazy rendering** | Data may sit in memory, but locked levels render as stubs and the question builder refuses to draw from unlearned stages. The lock is a logic guarantee, not a CSS trick. | Hiding locked content visually only (content leaks); lazy-loading data from day one (premature for a small slice). |
| 14 | **Vercel as primary host** | Zero-config static deploy for Vite, preview deployments per branch, no `gh-pages` branch. GitHub Pages documented as an alternative. | GitHub Pages only (base-path friction, branch ceremony). |
| 15 | **`localStorage` progress, no accounts** | The slice is single-user and offline-friendly. Progress is disposable if the browser is cleared; documented. | Backend + accounts (months of work irrelevant to proving the learning loop). |

## Daily practice and pilot compatibility

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 16 | **Review before new material on return** | Check recall before reminders, then refresh forgotten items. Measure actual next-day first attempts separately from practice corrections. | Leaving review optional as the only daily routine; treating immediate practice success as delayed retention. |
| 17 | **A small daily set targeting 3–5 minutes** | Prioritize weak or overdue taught items and carry the remainder forward. Extra practice and new material are optional after the set. | A default ten-minute review; requiring the entire due backlog to be cleared. |
| 18 | **Daily completion, weekly activity, and a daily streak** | Encourage regular practice through all three views. Finishing review with corrections earns credit, even without a new lesson. | Opening the app as sufficient credit; choosing only a streak or only a weekly tracker. |
| 19 | **Daily credit measures participation** | Credit completion once per local day without an accuracy threshold. A missed day resets the daily streak but never re-locks completed lessons. | Requiring 80% to earn daily credit; counting repeated same-day sets as extra streak days. |
| 20 | **Separate pilot completion and migrate progress** | Five kana must not pass the existing ten-kana `kana-h01` level. Reuse stable item IDs and migrate v2 when adding guided learning and review state. | Renumbering levels, overwriting old passes, or treating old aggregate scores as evidence of unaided recall. |

The proposed content is あ・い・う・え・お and いえ (house), subject to the kana/vocabulary
checkpoints. Initial evaluation targets include unaided first-session completion and at least
four of five kana recalled before hints on the next day, plus reading the word. These are pilot
targets rather than an additional gate on daily credit or a claim of proven effectiveness.

## Open questions (revisit later)

- **Unit authoring details.** Exact checkpoint composition, daily set size, review intervals, and
  first-day credit behavior must be specified during the pilot storyboard, within the rules above.
- **Beginner evaluation.** Arrange a first session and a real next-day return with a complete
  beginner. Someone who previously memorized kana cannot substitute for that evaluation.
- **Content breadth after the slice.** Which N5 kanji list, and how much vocabulary per level?
- **Kanji reading display.** Furigana above kanji in lessons, or reading underneath? Decide with the
  first vocab lesson screen.
- **Dojo scoring vs campaign scoring.** Should free practice feed weak-item weights? Current plan:
  practice results are stored separately and do not affect campaign weights.
- **Round length for grammar.** 8 questions is the starting assumption; measure against lesson
  length and adjust.
- **PWA / installability.** Nice-to-have; not in the slice.
- **Localisation of the interface.** English-only for now.
