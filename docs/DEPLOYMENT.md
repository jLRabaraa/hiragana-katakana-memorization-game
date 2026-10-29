# Deployment

The app is a static Vite build (`dist/`). No server, database, or environment variables are needed.

The next milestone is the planned [beginner pilot](BEGINNER-PILOT.md). Hosting remains the same;
guided lessons and daily review must be implemented and checked before they can be evaluated in a
preview deployment. The existing campaign build does not yet provide those features.

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
- No secrets or environment variables are used. Do not add `.env` files to the repo.

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
- [ ] Existing v2 saves migrate without losing passes, scores, statistics, or settings; malformed
  saves recover safely, and new progress persists after reload
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
