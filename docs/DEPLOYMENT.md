# Deployment

The app is a static Vite build (`dist/`). No server, database, or environment variables are needed.

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
