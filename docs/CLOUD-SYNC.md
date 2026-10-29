# Cloud, offline access, and tracing plan

Agreed on **2026-10-29**. Status: **planned; not implemented**. This document is the
canonical plan for account storage, synchronization, offline startup, and guided tracing.
It supersedes account-free product goals, importing old browser progress into v3, and
deferring offline startup. The source still implements the Phase 3 local-only campaign.

## Agreed behavior

- Anyone can register with **Google sign-in**, required before the first lesson. No invitation list.
- Use **Firebase Authentication and Cloud Firestore Standard edition on Spark**, with no billing
  account linked. Do not enable Blaze, Cloud Run, Cloud Functions, or other billing-required services.
- Strict cost requirement: **$0**, accepting interrupted cloud access when free quotas are exhausted.
  This is a service-availability tradeoff, not a promise of unlimited free use.
- After the initial online sign-in and successful app caching, learners can close and reopen the
  app offline, study downloaded content, save locally, and synchronize later.
- Combine completed work from different devices. Preserve passes and highest scores; count each
  completed round once. Never replace all progress with the most recently uploaded snapshot.
- Google accounts start fresh. Do not import v2 browser progress or legacy settings/bests into
  account records. Leave those old keys untouched; they are not inputs to the new account store.
- Closing or leaving an unfinished quiz discards the attempt and restarts it next time. This
  includes tracing completed only within that unfinished round. Completed lessons and rounds survive.
- Guided kana tracing is required once per newly taught kana per account. No tracing points,
  numeric grade, or reading-accuracy penalty. Every required stroke must be accepted to finish.

## Proposed component boundaries

```text
React screens / app shell
  ├── Authentication/session adapter → Firebase Authentication → Google
  ├── Quiz → tracing component → pure local stroke checker ← reviewed stroke guides
  └── useProgress → progress coordinator
                    ├── pure learning reducers / eligibility / merge rules
                    ├── IndexedDB repository: per-account completions + upload outbox
                    └── sync adapter → Firebase client SDK → Firestore Security Rules → Firestore

Service worker → versioned app shell and curriculum cache for offline startup
```

Extract browser storage operations from `src/engine/progress.ts`; learning reducers remain free
of React, storage, and network dependencies. `useProgress` becomes the React bridge to the
coordinator. Authentication changes must stop the previous user's listeners and uploads before
switching repositories. Create the following modules only when implementing them:

| Proposed area | Responsibility |
| --- | --- |
| `src/features/auth/` | Google sign-in, remembered-session state, reauthentication UI |
| `src/storage/` | Typed, validated, account-scoped IndexedDB records and atomic outbox writes |
| `src/sync/` | Firebase adapters, incremental download, retry, acknowledgments, merge coordination |
| `src/engine/` | Pure progress folding, round building, tracing eligibility and stroke checking |
| `src/features/quiz/questions/` | Tracing question using Pointer Events; only accepted ink renders |
| `src/data/curated/` | Reviewed kana stroke paths and tracing instructions with provenance |
| Service worker/build integration | Cache app files and reviewed curriculum; manage version updates |
| `firestore.rules` | Default-deny ownership checks, allowed operations, field and size validation |

No custom API is deployed in this plan. A separately scoped local API exercise can support the
cloud-engineering learning goal; it must not become a production dependency or enable billing.
Keep the existing static frontend hosting configuration until a separate hosting change is agreed.

## Account data and synchronization

The new account schema is **v3**, stored in versioned IndexedDB records and Firestore documents;
it is not an automatic `localStorage` v2-to-v3 migration. Future changes to an account schema need
explicit migrations preserving that account's data. Validate reads and incoming events field by
field. Do not manufacture historical recall or daily-review evidence from aggregate counts.

Use a stable Firebase UID as the account boundary, with stable curriculum and completion IDs.
Proposed records include completed lessons/steps, completed rounds with item tallies and outcomes,
tracing completions, introduced forms, unaided recall, checkpoint outcomes, and review/daily records.
The five-kana pilot retains its own unit ID; it must not pass ten-kana `kana-h01`.

1. On meaningful completion, atomically write the local completion and its upload outbox entry.
2. Give every completion a unique, stable ID before its first upload. Retry using that same ID.
3. Store immutable account-owned completion documents, for example
   `users/{uid}/completions/{completionId}`. An already stored identical completion acknowledges a
   retry; changed content under that ID is rejected. Do not overwrite a different event.
4. Fold each event once: union passes and tracing completions, maximize bests, and sum item tallies
   across unique rounds. Duplicate delivery must not add statistics or daily credit twice.
5. Download missing completions incrementally. Use trusted server timestamps plus stable tie
   breaking for cursors; do not assume device clocks or upload order reflect learning order.
6. Keep materialized progress as a rebuildable local projection. Do not allow an entire cloud
   progress snapshot to erase another device's completed work.

Tracing and a round's outcome are committed together when the round ends, even if its reading
accuracy is below the pass threshold. Losing an unfinished attempt does not erase earlier committed
completions. Two offline devices may both require the same not-yet-synchronized tracing exercise;
their completions merge into one per-kana completion state.

Daily review is distinct from an unfinished quiz snapshot: preserve completed first-attempt recall
evidence separately from corrections and repeated sets. Daily credit remains once per local
calendar day, without an accuracy gate. Define deterministic first-attempt reconciliation and the
account's calendar/time-zone policy before shipping review across devices; device timestamps alone
cannot establish a reliable order. Settings conflict policy and event retention/compaction also
need definition before implementation. Do not silently compact away deduplication or recall evidence.

## Offline sessions and failure handling

Cache app files and the reviewed learning slice before claiming offline readiness. IndexedDB
stores each account's durable completions, derived progress, and pending uploads. Do not persist
the unfinished quiz's questions, answers, drawn paths, or position for resumption.

Only the previously signed-in account can reopen its local learning state offline. A remembered
session permits local access; it does not bypass cloud token verification. An expired or revoked
session pauses uploads until valid sign-in is restored. Switching accounts requires online sign-in.
Explicit sign-out hides account data, tears down subscriptions, and prevents uploads under another
UID. Pending work stays isolated for that account's later sign-in. Browser storage is not protection
against someone who controls the device; document shared-device behavior in the sign-in UI.

Show honest status: **saved on this device**, **syncing**, **synced**, **sign in to sync**, or
**cloud unavailable**. Keep pending completions on network/quota failures and retry with backoff.
Permission/schema failures need actionable recovery rather than endless retries. A new device may
be unable to load progress while the cloud is unavailable; local work is not a cross-device backup
until upload is acknowledged. Browser clearing can remove unuploaded work.

Service-worker updates must keep app code, curriculum, and schema versions compatible; do not
activate an incompatible update in the middle of a quiz. First-ever offline access is unsupported.

## Guided tracing contract

- Use reviewed guides only for introduced kana; writing is not an isolated kanji exercise.
- Highlight the next guide stroke. Capture the candidate path without rendering attempted ink.
- On pointer release, compare its coverage, shape, order, and direction with reasonable input
  tolerance. Stroke count alone is insufficient. Pointer cancellation does not accept a stroke.
- Reveal an accepted stroke and advance. An incorrect stroke stays invisible; announce a short
  retry instruction. Accepted strokes remain visible for the active exercise.
- Require all strokes, with unlimited retries, before advancing past the tracing exercise.
- Add no tracing points and exclude tracing from the reading-accuracy numerator and denominator.
  It cannot satisfy unaided reading recall or replace the 80% reading checkpoint.
- Require coverage for every newly introduced kana without a committed tracing completion, rather
  than trusting a random round sample. Skip required tracing once completion is synchronized locally.
- Check paths entirely on-device. Synchronize completion metadata, not drawings or pointer samples.
- Review stroke paths, order/direction, teaching copy, provenance/licensing, and tolerance behavior
  under kana Checkpoint 1 before playable integration. Never transform hiragana paths into katakana
  paths with the Unicode glyph offset. Numeric tolerance and accessible input alternatives remain
  implementation/review decisions; verify finger, mouse, stylus, and reduced-motion behavior.

## Delivery and verification

1. Define typed account records and pure folding rules; add account-scoped local persistence.
2. Add Google sign-in, Spark Firestore, restrictive rules, and completion synchronization.
3. Add service-worker caching and offline reopen; verify user switching, token expiry, quota
   failure, restart behavior, duplicate uploads, and conflicting offline completions.
4. Author/review the five-kana unit and stroke guides; fix existing reverse-choice, tap, and
   distractor eligibility gaps; build guided teaching, recall gates, and required tracing.
5. Add reviewed daily practice and habit state; evaluate a complete beginner's real next-day return.

No paid services, billing activation, content expansion, or new test framework is authorized by
this plan. Use local Firebase tooling for rules/sync verification when implemented. Run the
repository checks and the deployment checklist before declaring implementation complete.

## Service references

Checked during the 2026-10-29 design discussion; recheck before setup because plans can change:

- [Firebase pricing](https://firebase.google.com/pricing): Spark needs no payment method; Google
  sign-in and Firestore have no-cost availability/allowances.
- [Pricing plans and quota behavior](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).
- [Firestore pricing](https://firebase.google.com/docs/firestore/pricing): Standard free quota
  includes one database, 1 GiB stored data, 50,000 reads/day, and 20,000 writes/day.
- [Firestore offline behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline):
  SDK synchronization alone uses last-write-wins for competing changes to a document; it is not
  the completion-merging algorithm required here.

See [the planned UML diagrams](diagrams/README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and
[BEGINNER-PILOT.md](BEGINNER-PILOT.md) for the implementation baseline and learner requirements.
