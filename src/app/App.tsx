import { useState } from 'react'
import AttributionFooter from '../components/AttributionFooter.tsx'
import CurriculumReview from '../features/review/CurriculumReview.tsx'

type Screen = 'home' | 'review'

/**
 * Application shell.
 *
 * Phase 1 renders the scaffold confirmation; Phase 2 adds the dev-only
 * curriculum review used for the content checkpoint. The campaign screens
 * (level map → lesson → quiz → results) land in Phase 4.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'review') {
    return (
      <>
        <div className="bg-mark" aria-hidden="true">あ</div>
        <main className="app">
          <CurriculumReview onBack={() => setScreen('home')} />
        </main>
      </>
    )
  }

  return (
    <>
      <div className="bg-mark" aria-hidden="true">あ</div>

      <main className="app">
        <section id="screen-home" className="screen is-active">
          <div className="home-inner">
            <header className="hero">
              <div className="seal" aria-hidden="true">かな</div>
              <div>
                <p className="eyebrow">Hiragana · Katakana · Kanji</p>
                <h1>Kana Dōjō</h1>
                <p className="tagline">
                  A level-based training hall for Japanese.{' '}
                  <span className="jp" lang="ja">はじめましょう。</span>
                </p>
              </div>
            </header>

            <div className="panel">
              <p className="label">Phase 2 · Curriculum</p>
              <p className="build-note">
                All kana, the first vocabulary block, and the first grammar sentences are authored.
                Use the review below to check readings, glosses, and sentence naturalness before the
                engines are wired in Phase 3.
              </p>

              <ul className="build-list">
                <li className="is-done">Vite + React + TypeScript scaffold</li>
                <li className="is-done">Design system ported to <code>src/styles/global.css</code></li>
                <li className="is-done">Curated curriculum + dataset enrichment pipeline</li>
                <li>Progress store, spiral review, level gating</li>
                <li>Lesson phase and five quiz engines</li>
                <li>Level map, results, and free-practice Dojo</li>
              </ul>

              {import.meta.env.DEV && (
                <button className="start-btn" type="button" onClick={() => setScreen('review')}>
                  <span>Review curriculum</span>
                  <span className="start-meta">Checkpoint 1</span>
                </button>
              )}

              <p className="build-next">
                Next: checkpoint sign-off, then Phase 3 — progress store and quiz engines.
              </p>
            </div>

            <p className="foot">
              Rōmaji follows Hepburn style · Progress will be stored locally in your browser
            </p>

            <AttributionFooter />
          </div>
        </section>
      </main>
    </>
  )
}
