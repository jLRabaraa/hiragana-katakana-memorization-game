# Decision Log

This log records the design interview that defined the project. Each decision lists the choice made,
the alternatives considered, and why. Revisit a decision here before changing it in code.

## Product

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 1 | **Learn phase before every level** | The legacy game only quizzes; an absolute beginner cannot answer questions about symbols they have never seen. A lesson screen (glyph, reading, meaning, example) teaches first, then drills. | Quiz-only campaigns put the burden of teaching on external resources and break the "complete beginner" promise. |
| 2 | **Kanji taught through vocabulary** | A kanji has 2–6 readings; isolated drills and rōmaji typing become ambiguous. Words give context, resolve the reading, and are what a learner actually needs. | Isolated kanji meaning drills (simpler data, weak reading skills); layered both-models (more data, deferred). |
| 3 | **Full kana before kanji** | Frontload the writing systems. Hiragana (46 basic, by gojūon row), then katakana, then vocabulary, then grammar. | Interleaving kana/kanji; compressed kana to reach grammar sooner (weaker retention). |
| 4 | **Vertical slice, not full N5** | ~12 levels prove every mechanic end-to-end (lessons, gating, spiral review, both grammar engines) with small data. Breadth is a later content problem. | Kana-only campaign (grammar/kanji engines stay unproven); full N5 arc (large authoring burden before any feedback). |
| 5 | **Free practice (Dojo) survives** | The legacy settings screen remains as an always-unlocked practice mode, using the same engines. Power users keep their familiar flow. | Campaign-only (removes a beloved feature for no gain). |

## Progression and retention

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 6 | **Accuracy gate at 80%** | Passing a level requires ≥ 80% in its round. Announces "you know this well enough to continue" without punishing exploration. Retry is immediate and cheap. | Completion gate (any score unlocks; weak retention signal); per-item mastery gates (best model, too much state for the slice). |
| 7 | **Lenient retries** | Fail → results with misses → retry the same item set, reshuffled, with spiral mix. Lessons are shown once. Passed levels never re-lock; replays still update weak-item weights. | Forced study interstitial (extra screens); attempt limits (frustrating without a teacher). |
| 8 | **Spiral weak-item mix** | Later rounds draw ~25% of questions from previously learned items weighted by miss count. The engine enforces this; no separate review button to forget to press. | Strict per-level scope (forgetting epidemic); explicit review rounds (extra UI, opt-in retention). |
| 9 | **On-miss mnemonics only** | Mnemonics anchor glyphs and kanji for beginners, but showing one per lesson card adds clutter. Show them in the feedback for a wrong answer or failed-level retry. | Full mnemonics on every card (visual noise); no mnemonics (weaker encoding for look-alike kana). |

## Engineering

| # | Decision | Rationale | Alternatives rejected |
| --- | --- | --- | --- |
| 10 | **React + TypeScript + Vite** | Chosen partly for employability (React is the market default) and partly for the screen count: level map, lessons, five quiz engines, results. Types catch data-model bugs as kanji/vocab/grammar schemas grow. | Svelte (best fit for this app, weakest hiring signal); Vue (middle ground); vanilla TS (no framework résumé line); strict single-file (unmaintainable at this scope). |
| 11 | **Multi-file project, GitHub repo** | The single-file constraint from the legacy project is retired. Code is organised by concern (`engine/`, `features/`, `data/`, `types/`). | Keeping one HTML file (file size, merge pain, no type safety). |
| 12 | **Curated curriculum + dataset enrichment** | Hand-pick ~60 words and 8 sentences; enrich readings/glosses/examples from JMdict, KANJIDIC2, Tatoeba. Keeps the curriculum intentional and avoids dictionary noise. | Bulk-converting dictionaries into the app; hand-authoring everything (deferred breadth). |
| 13 | **Engine-enforced locks and lazy rendering** | Data may sit in memory, but locked levels render as stubs and the question builder refuses to draw from unlearned stages. The lock is a logic guarantee, not a CSS trick. | Hiding locked content visually only (content leaks); lazy-loading data from day one (premature for a small slice). |
| 14 | **Vercel as primary host** | Zero-config static deploy for Vite, preview deployments per branch, no `gh-pages` branch. GitHub Pages documented as an alternative. | GitHub Pages only (base-path friction, branch ceremony). |
| 15 | **`localStorage` progress, no accounts** | The slice is single-user and offline-friendly. Progress is disposable if the browser is cleared; documented. | Backend + accounts (months of work irrelevant to proving the learning loop). |

## Open questions (revisit later)

- **Content breadth after the slice.** Which N5 kanji list, and how much vocabulary per level?
- **Kanji reading display.** Furigana above kanji in lessons, or reading underneath? Decide with the
  first vocab lesson screen.
- **Dojo scoring vs campaign scoring.** Should free practice feed weak-item weights? Current plan:
  practice results are stored separately and do not affect campaign weights.
- **Round length for grammar.** 8 questions is the starting assumption; measure against lesson
  length and adjust.
- **PWA / installability.** Nice-to-have; not in the slice.
- **Localisation of the interface.** English-only for now.
