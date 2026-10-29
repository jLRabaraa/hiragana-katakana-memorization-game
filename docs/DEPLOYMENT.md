# Deployment

The **current implementation** is a static Vite build (`dist/`) requiring no database or environment
variables. The **planned target** adds Firebase Google sign-in, Spark Firestore, offline caching,
and account synchronization. [CLOUD-SYNC.md](CLOUD-SYNC.md) is authoritative for that target.

The next milestone is the planned [beginner pilot](BEGINNER-PILOT.md). Hosting remains the same;
guided lessons and daily review must be implemented and checked before they can be evaluated in a
preview deployment. The existing campaign build does not yet provide those features or cloud/tracing.

## Vercel (primary)

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project → Import** the repository.
3. Confirm the detected settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy. Every branch/PR gets a preview URL; `main` deploys to production.

`vercel.json` already pins the framework, build command, output directory, and an SPA fallback
(`/(.*)` → `/index.html`). No further configuration is required. If you use the Vercel CLI instead:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

### Notes

- Vite's default `base: '/'` is correct for Vercel. Do not change it for Vercel deploys.
- Static assets in `public/` are copied to `dist/` automatically.
- Current code uses no environment variables. Target Firebase client configuration may use public
  `VITE_` build variables and an example config, but real `.env` files stay uncommitted. Every Vite
  client variable is public: never place Admin SDK credentials, private keys, or secrets in it.

## Planned Firebase setup and offline delivery

These are implementation requirements, not completed setup:

1. Create/configure a **Spark** project with **no Cloud Billing account linked**. Do not upgrade to
   Blaze or provision Cloud Run/Functions. Configure Firebase Authentication's Google provider for
   public registration and approve the actual frontend domains/redirect configuration.
2. Create one Firestore **Standard edition** database eligible for the free quota. Deploy restrictive
   Security Rules before connecting the public app. Rules must check authenticated UID ownership,
   allowed fields/types/sizes, immutable completion IDs, and permitted operations; deny other access.
3. Keep the static frontend on its configured host. Publish public Firebase client configuration
   through build settings; enforce access using authentication and rules, not hidden client config.
4. Add service-worker build integration. Cache the app shell and reviewed curriculum together;
   scope its URL correctly for the host/base path. Serve worker files with appropriate update/cache
   headers and keep navigation fallback from returning HTML for worker/asset requests.
5. Verify offline readiness after an online sign-in/cache fill. Show local versus cloud save status,
   retain the account's upload outbox on network/quota errors, and pause sync on expired sessions.
6. Check Firebase quotas during the pilot. Public registration can exhaust free capacity; accept
   interrupted cloud access, preserve local work, and never enable billing to repair an outage.

Provider plan details can change; verify the official references in [CLOUD-SYNC.md](CLOUD-SYNC.md)
before setup. Rules and emulator verification are required when implemented; no new test framework
is requested. Do not mark this checklist complete based on the existing static build.

## GitHub Pages (alternative)

1. Ensure the repository's Pages source is **GitHub Actions**.
2. Add a workflow that installs, builds, and publishes `dist/` (e.g. `actions/configure-pages`,
   `actions/upload-pages-artifact`, `actions/deploy-pages`).
3. Because project sites are served from `/<repo>/`, set the base path at build time:

   ```ts
   // vite.config.ts
   export default defineConfig({
     base: process.env.GITHUB_ACTIONS ? '/<repo-name>/' : '/',
     plugins: [react()],
   })
   ```

   Alternatively build with `vite build --base=/<repo-name>/`.

4. The SPA fallback on Pages requires a `404.html` copy of `index.html` **only if** client-side
   routing is added. The current screen-state app does not need it.

## Previewing a production build locally

```bash
npm run build
npm run preview
```

## Smoke-test checklist after deploying

- [ ] Level map renders; locked levels show no content previews
- [ ] A lesson opens on a fresh browser profile and can be completed
- [ ] Quiz answers (choice, typing, drag) register on touch and mouse
- [ ] Failing a level shows results and offers a retry without re-showing the lesson
- [ ] Passing a level unlocks the next one and persists after reload
- [ ] Audio degrades silently when speech synthesis is unavailable
- [ ] Attribution footer is visible

## Pilot checks before learner evaluation

Apply these checks when the pilot is implemented, in addition to the campaign checks above:

- [ ] Reviewed five-kana content and the first word match the recorded kana/vocabulary sign-off
- [ ] Only introduced items/forms appear in prompts, choices, feedback, and review
- [ ] Reverse-choice prompts show the reading; ordinary taps select tiles, and drag completion
  still suppresses its following click
- [ ] Below 470 px, guided steps, typing, drag, and tap fallback work; keyboard focus and feedback
  announcements remain usable, including with reduced motion and sound disabled
- [ ] Every new kana requires unaided correct recall before the 80% checkpoint; hints cannot
  satisfy that requirement
- [ ] Completing the pilot does not pass the ten-kana `kana-h01` level or reveal later kanji
- [ ] Google accounts start fresh without importing v2/legacy progress or settings; old keys remain
  untouched, malformed account records recover safely, and new progress persists after reload
- [ ] Anyone can sign in with Google; users cannot read/write another UID's records; no Admin
  credentials reach the client; invalid/oversized/mutated completion documents are rejected
- [ ] Spark has no billing account attached; quota/network failures preserve pending work and
  accurately distinguish local saves from synchronized progress
- [ ] After initial online setup, close/reopen offline works; account changes isolate local data,
  subscriptions, and uploads; expired sessions pause uploads until online reauthentication
- [ ] Two offline devices' completed work merges without losing passes/bests or counting an event
  twice; repeated upload acknowledgments do not duplicate round tallies or daily credit
- [ ] Unfinished quizzes restart, including uncommitted tracing; finished rounds persist tracing
  even below the reading pass threshold
- [ ] Required tracing covers each newly taught kana once per account; only correct strokes become
  visible after release; order/direction/path matter; no tracing points, accuracy effect, or recall credit
- [ ] Stroke guides/licences and finger/mouse/stylus tolerances are reviewed; cancelled input never
  accepts a stroke, raw paths are not uploaded, and accessible retry feedback is available
- [ ] Service-worker updates keep curriculum/schema/code compatible and do not interrupt a quiz
- [ ] Next-day review captures first attempts before the refresher and offers a small daily set
  after a multi-day absence
- [ ] Completing review with corrections earns daily credit without an accuracy gate; repeat
  completions on the same local day do not increase the daily streak
- [ ] Weekly activity and the daily streak agree with completion dates; a missed day resets the
  daily streak without re-locking completed lessons
- [ ] Review ends with a clear daily completion state and optional extra practice
- [ ] Attribution remains visible, and development curriculum-review content is excluded from
  the production build as intended

Run typecheck, lint, and build before browser verification. A clock-controlled scheduling check
does not replace the complete beginner's actual next-day return. Record that learner's first
attempts and observations against the targets in [BEGINNER-PILOT.md](BEGINNER-PILOT.md) before
extending the curriculum.
