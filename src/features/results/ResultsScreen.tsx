import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { ITEM_BY_ID } from '../../data'
import type { Level } from '../../types/domain'
import type { RoundSummary } from '../../types/progress'
import { sfxFinish } from '../../utils/audio'

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 52 // r=52 viewBox

function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function verdictCopy(accuracy: number, passed: boolean): { title: string; sub: string } {
  if (passed && accuracy >= 1) return { title: 'Perfect run', sub: 'Every question right — the next lesson is open.' }
  if (passed) return { title: 'Level passed', sub: 'Solid work — the next lesson is open.' }
  if (accuracy >= 0.6) return { title: 'So close', sub: 'Replay the round — retries skip straight to the quiz.' }
  return { title: 'Round complete', sub: 'Take another pass at it — the lesson you saw still applies.' }
}

function confettiPiece(index: number): ReactElement {
  const palette = ['var(--red)', 'var(--gold)', 'var(--indigo)', 'var(--green)']
  const left = Math.round((index * 37 + 13) % 100)
  const duration = 2.4 + ((index * 7) % 18) / 10
  const delay = (index % 9) * 0.12
  return (
    <span
      key={index}
      className="confetti"
      aria-hidden="true"
      style={{
        left: `${left}%`,
        width: index % 2 ? '8px' : '6px',
        height: index % 3 ? '13px' : '18px',
        background: palette[index % palette.length],
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        transform: `rotate(${(index * 53) % 360}deg)`,
      }}
    />
  )
}

export default function ResultsScreen({ level, summary, passed, isNewBest, hasNext, onRetry, onNext, onHome }: {
  level: Level
  summary: RoundSummary
  passed: boolean
  isNewBest: boolean
  hasNext: boolean
  onRetry: () => void
  onNext: () => void
  onHome: () => void
}): ReactElement {
  const accuracy = summary.total > 0 ? summary.correct / summary.total : 0
  const percent = Math.round(accuracy * 100)
  const verdict = verdictCopy(accuracy, passed)
  const stroke = passed ? 'var(--green)' : accuracy >= 0.5 ? 'var(--gold)' : 'var(--red)'

  const [offset, setOffset] = useState(GAUGE_CIRCUMFERENCE)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    sfxFinish()
    const doubleFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffset(GAUGE_CIRCUMFERENCE * (1 - accuracy))
      })
    })
    return () => cancelAnimationFrame(doubleFrame)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accuracy is fixed per mount
  }, [])

  useEffect(() => {
    if (!passed) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(() => setConfetti(true), 250)
    return () => window.clearTimeout(timer)
  }, [passed])

  const reviewItems = useMemo(() => {
    const items = summary.missedItemIds
      .map((id) => ITEM_BY_ID.get(id))
      .filter((item) => item !== undefined)
      .map((item) =>
        item.type === 'kana' ? (
          <div className="review-item" key={item.id}>
            <span className="rg" lang="ja">{item.glyph}</span>
            <span className="rr">{item.romaji}</span>
            <span className="rs">{item.script === 'hiragana' ? 'Hiragana' : 'Katakana'}</span>
            {item.mnemonic && <span className="rm">💡 {item.mnemonic}</span>}
          </div>
        ) : (
          <div className="review-item" key={item.id}>
            <span className="rg" lang="ja">{item.kanji ?? item.kana}</span>
            <span className="rr">{item.kanji ? item.kana : item.gloss}</span>
            <span className="rs">{item.gloss}</span>
            {item.mnemonic && <span className="rm">💡 {item.mnemonic}</span>}
          </div>
        ),
      )
    const grammar = summary.missedGrammar.map((miss) => (
      <div className="review-item" key={miss.id}>
        <span className="rg rg-sentence" lang="ja">{miss.sentence}。</span>
        <span className="rr">{miss.translation}</span>
        <span className="rs">Sentences</span>
      </div>
    ))
    return [...items, ...grammar]
  }, [summary])

  return (
    <section id="screen-results" className="screen is-active">
      <div className="results-inner">
        <p className="eyebrow">Level {String(level.order).padStart(2, '0')} · {passed ? 'Passed' : 'Attempt'}</p>
        <h2 className="result-title">{verdict.title}</h2>
        <p className="result-sub">{verdict.sub}</p>

        <div className="gauge-wrap">
          <svg className="gauge" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="gauge-track" cx="60" cy="60" r="52" />
            <circle className="gauge-fill" style={{ stroke }} cx="60" cy="60" r="52" strokeDasharray={GAUGE_CIRCUMFERENCE} strokeDashoffset={offset} />
          </svg>
          <div className="gauge-label">
            <strong>{percent}%</strong>
            <span>accuracy</span>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">Score</span>
            <strong>{summary.score.toLocaleString()}</strong>
            <span className="stat-note">{isNewBest ? 'NEW BEST' : ''}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Correct</span>
            <strong>{summary.correct}/{summary.total}</strong>
            <span className="stat-note">pass at {Math.round(level.passAccuracy * 100)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Best streak</span>
            <strong>{summary.bestStreak}</strong>
            <span className="stat-note" />
          </div>
          <div className="stat">
            <span className="stat-label">Time</span>
            <strong>{formatTime(summary.elapsedMs)}</strong>
            <span className="stat-note" />
          </div>
        </div>

        <div className="review-head"><span>Review</span><span>{reviewItems.length} to revisit</span></div>
        <div className="review-list">
          {reviewItems.length > 0 ? reviewItems : (
            <p className="review-empty">
              <span className="tick-big" aria-hidden="true">✓</span>
              Nothing missed — keep the streak going.
            </p>
          )}
        </div>

        <div className="result-actions">
          {passed && hasNext && (
            <button className="start-btn" type="button" onClick={onNext}>
              <span>Continue</span>
              <span className="start-meta">Next level</span>
            </button>
          )}
          {!passed && (
            <button className="start-btn" type="button" onClick={onRetry}>
              <span>Try the round again</span>
              <span className="start-meta">Skips the lesson</span>
            </button>
          )}
          {passed && (
            <button className="ghost-btn" type="button" onClick={onRetry}>Replay this round</button>
          )}
          <button className="ghost-btn" type="button" onClick={onHome}>Back to the map</button>
        </div>
      </div>

      {confetti && (
        <div aria-hidden="true">{Array.from({ length: 18 }, (_, i) => confettiPiece(i))}</div>
      )}
    </section>
  )
}
