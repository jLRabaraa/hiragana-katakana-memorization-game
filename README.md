# Kana Dōjō

A level-based Japanese learning game that takes a complete beginner from zero kana to reading
vocabulary and building first sentences.

This project began life as a single-file kana quiz (preserved at
[`legacy/kana-dojo-legacy.html`](legacy/kana-dojo-legacy.html) as a working reference). It is
being rebuilt as a React + TypeScript application with a campaign structure, lesson phases,
spiral review, particle exercises, and sentence assembly.

![Kana Dōjō home screen](screenshot.png)

## Project status

**Next milestone: one beginner learning pilot, planned on 2026-10-29.** Teach five hiragana in
guided steps, introduce a word using taught kana during the first session, and evaluate recall on
the next day. Daily review will target 3–5 minutes, with a daily goal, weekly activity, and a streak.
See [the agreed pilot plan](docs/BEGINNER-PILOT.md) for scope, progression, and evaluation targets.

The existing implementation has 16 campaign levels, lesson cards, five exercise types, spiral
review, mnemonic feedback, saved progress and best scores, and the map → lesson → quiz → results
flow. Guided teaching, per-kana recall requirements, daily review, and habit tracking are **not yet
implemented**. Reverse-choice prompts and tap interactions need correction. Grammar content awaits
Checkpoint 3 review; the development home screen links to curriculum review. Free-practice Dojo
remains later work.

## Quick start

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build        # typecheck + production build into dist/
npm run preview      # serve the production build locally
npm run typecheck    # tsc -b only
npm run lint         # oxlint
npm run data:convert # regenerate enriched vocab/kanji data from curated + datasets
```

## Deploy

The app is a static Vite site; **Vercel is the primary target** (zero-config, connect the repo and
deploy). GitHub Pages is also supported with a build workflow. See
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for exact steps, including the SPA rewrite rule.

## Current campaign

- **Campaign path.** Levels unlock sequentially after scoring at least 80% on the previous level.
- **Learn first, then drill.** Each level opens with lesson cards for its new items, then quizzes them.
- **Kanji through vocabulary.** Kanji are introduced inside words (水 → みず), never as isolated
  symbol/reading pairs, so typing answers stay unambiguous.
- **Spiral review.** Kana and vocabulary rounds draw roughly 25% of questions from previously
  taught items, weighted by miss count. Grammar rounds currently have no spiral mix.
- **Free practice is planned.** The original Dojo remains available in the legacy HTML reference;
  its React screen has not been built.
- **Local progress.** Levels, miss weights, and best scores live in `localStorage`; there are no
  accounts or servers.

The full mechanics, schemas, and engine design are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap

| Milestone | Scope |
| --- | --- |
| **Existing foundation** | React + TypeScript + Vite, curated data and conversion script, 16-level campaign, five exercise types, local progress |
| **Next — Beginner pilot** | Review the unit content; correct supporting exercises; build guided teaching, recall gate, daily review, and persistence migration; evaluate with a complete beginner |
| **After evaluation** | Improve the pilot, then extend the approach across more kana and words |
| **Later campaign work** | Grammar teaching and content review, free-practice Dojo, broader mobile verification, deployment readiness |

The pilot replaces the immediate priority of completing the old Phase 4 list. Its proposed content
is あ・い・う・え・お and いえ (house), subject to content review. Completion requires an unaided
correct recall for every new kana, followed by an 80% checkpoint. A separate pilot record will
preserve existing campaign progress; completing five kana must not pass the current ten-kana
first level. Kanji stays a later step taught through words.

## Content and licensing

Vocabulary and kanji data will be enriched from **JMdict** and **KANJIDIC2** (CC BY-SA 3.0,
© Electronic Dictionary Research and Development Group) and example sentences from **Tatoeba**
(CC BY 2.0 FR). Attribution is rendered in the app footer and documented in
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).

The game's own source code currently has no license (all rights reserved) unless one is added.

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/BEGINNER-PILOT.md`](docs/BEGINNER-PILOT.md) | Agreed next milestone, daily review, implementation order, and learner evaluation |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data model, engines, progress and locking design |
| [`docs/DATA-PIPELINE.md`](docs/DATA-PIPELINE.md) | Curriculum authoring, dataset conversion, licences |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel and GitHub Pages deployment |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log from the design interview |
| [`docs/SESSION-2026-10-21.md`](docs/SESSION-2026-10-21.md) | Historical scaffold and curriculum handoff |
| [`docs/SESSION-2026-10-22.md`](docs/SESSION-2026-10-22.md) | Historical campaign engine build log |
| [`AGENTS.md`](AGENTS.md) | Project conventions for contributors and coding agents |
