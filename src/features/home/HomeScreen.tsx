import type { ReactElement } from 'react'
import { LEVELS } from '../../data'
import { levelStatus, nextPlayableLevel } from '../../engine/gating'
import type { Level } from '../../types/domain'
import type { LevelStatus } from '../../engine/gating'
import type { Progress } from '../../types/progress'
import { sfxClick } from '../../utils/audio'

/**
 * Level map. Locked levels render as stubs only — number, title, lock state —
 * and are never clickable. Unlocked levels route to the lesson (first visit) or
 * straight into the quiz round (retries and replays).
 */

const STAGE_LABEL: Record<Level['stage'], string> = {
  kana: 'Kana',
  vocab: 'Words',
  grammar: 'Sentences',
}

function LockIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function LevelRow({ level, status, bestScore, onStart }: {
  level: Level
  status: LevelStatus
  bestScore: number
  onStart: (levelId: string) => void
}): ReactElement {
  const locked = status === 'locked'
  const statusCopy: Record<LevelStatus, string> = {
    locked: 'Locked — finish the previous level',
    lesson: 'New lesson ready',
    quiz: 'Quiz round',
    completed: `Passed · best ${bestScore.toLocaleString()} pts`,
  }

  return (
    <li className={`level-row is-${status}`}>
      <button
        type="button"
        className="level-row-btn"
        disabled={locked}
        onClick={() => {
          if (locked) return
          sfxClick()
          onStart(level.id)
        }}
      >
        <span className="level-num">{String(level.order).padStart(2, '0')}</span>
        <span className="level-copy">
          <span className="level-title">{level.title}</span>
          <span className="level-meta">
            <span className={`stage-tag stage-${level.stage}`}>{STAGE_LABEL[level.stage]}</span>
            <span className="level-status">{statusCopy[status]}</span>
          </span>
        </span>
        <span className="level-side" aria-hidden="true">
          {locked ? <LockIcon /> : status === 'completed' ? <span className="level-tick">✓</span> : <span className="level-go">→</span>}
        </span>
      </button>
    </li>
  )
}

export default function HomeScreen({ progress, soundOn, onStartLevel, onToggleSound, onOpenReview }: {
  progress: Progress
  soundOn: boolean
  onStartLevel: (levelId: string) => void
  onToggleSound: () => void
  onOpenReview: () => void
}): ReactElement {
  const passedCount = LEVELS.filter((level) => progress.levels[level.id]?.passed).length
  const next = nextPlayableLevel(progress)
  const nextCta = next
    ? next === LEVELS[0] ? 'Begin your training' : 'Continue training'
    : 'All levels passed — replay any level'

  return (
    <section id="screen-home" className="screen is-active">
      <div className="home-inner map-inner">
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

        <div className="panel map-summary">
          <p className="label">Your path</p>
          <p className="build-note map-note">
            Learn hiragana first, then katakana, your first words, and finally how sentences fit
            together. Pass a level at 80% to unlock the next.
          </p>
          <div className="map-progress">
            <div className="hud-track map-track" aria-hidden="true">
              <i style={{ width: `${Math.round((passedCount / LEVELS.length) * 100)}%` }} />
            </div>
            <span className="map-count">
              {passedCount} / {LEVELS.length} levels
            </span>
          </div>
          {next && (
            <button className="start-btn" type="button" onClick={() => onStartLevel(next.id)}>
              <span>{nextCta}</span>
              <span className="start-meta">Level {String(next.order).padStart(2, '0')} · {next.title}</span>
            </button>
          )}
        </div>

        <ol className="map-list">
          {LEVELS.map((level) => (
            <LevelRow
              key={level.id}
              level={level}
              status={levelStatus(level, progress)}
              bestScore={progress.levels[level.id]?.bestScore ?? 0}
              onStart={onStartLevel}
            />
          ))}
        </ol>

        <div className="map-tools">
          <label className="switch">
            <input type="checkbox" checked={soundOn} onChange={onToggleSound} />
            <span className="switch-track"><span className="switch-thumb" /></span>
            <span className="switch-text">
              <strong>Sound</strong>
              <small>Effects &amp; kana audio</small>
            </span>
          </label>
          {import.meta.env.DEV && (
            <button className="ghost-btn" type="button" onClick={onOpenReview}>
              Curriculum review
            </button>
          )}
        </div>

        <p className="foot">Progress is stored locally in your browser · Rōmaji follows Hepburn style</p>
      </div>
    </section>
  )
}
