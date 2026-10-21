import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { buildRound } from '../../engine/questionBuilder'
import type { Question, Round } from '../../engine/types'
import type { Level } from '../../types/domain'
import type { ItemTally, MissedGrammar, Progress, RoundSummary } from '../../types/progress'
import { sfxCorrect, sfxPlace, sfxWrong } from '../../utils/audio'
import type { AnswerInput, QuizApi } from './api'
import ChoiceQuestion, { type RegisterKeys } from './questions/ChoiceQuestion'
import TypingQuestion from './questions/TypingQuestion'
import MatchQuestion from './questions/MatchQuestion'
import ParticleQuestion from './questions/ParticleQuestion'
import AssemblyQuestion from './questions/AssemblyQuestion'

type FeedbackState = {
  kind: 'ok' | 'bad' | 'warn'
  title: string
  detail: string
  mnemonic?: string
}

interface QuizScreenProps {
  level: Level
  progress: Progress
  onQuit: () => void
  onComplete: (summary: RoundSummary) => void
}

function questionBadge(q: Question): string {
  switch (q.kind) {
    case 'choice':
      return CHOICE_BADGE[q.variant.direction]
    case 'typing':
      return 'Typing'
    case 'match':
      return 'Drag & Drop'
    case 'particle':
      return 'Particles'
    case 'assembly':
      return 'Word order'
  }
}

const CHOICE_BADGE: Record<string, string> = {
  char2romaji: 'Kana → Rōmaji',
  romaji2char: 'Rōmaji → Kana',
  jp2en: 'Word → Meaning',
  en2jp: 'Meaning → Word',
}

function questionTag(q: Question): string {
  switch (q.kind) {
    case 'choice':
    case 'typing':
      return q.item.type === 'kana' ? (q.item.script === 'hiragana' ? 'Hiragana' : 'Katakana') : 'Vocabulary'
    case 'match':
      return 'Matching'
    case 'particle':
    case 'assembly':
      return 'Sentences'
  }
}

function KbdHint({ q }: { q: Question }): ReactElement {
  if (q.kind === 'typing') {
    return (
      <p className="kbd-hint">Tip: press <kbd>Enter</kbd> to check your answer</p>
    )
  }
  if (q.kind === 'match' || q.kind === 'assembly') {
    return (
      <p className="kbd-hint">Tip: drag a tile — or tap a tile, then tap a slot</p>
    )
  }
  if (q.kind === 'particle') {
    return (
      <p className="kbd-hint">Tip: press <kbd>1</kbd>–<kbd>4</kbd> to fill the blank</p>
    )
  }
  return (
    <p className="kbd-hint">Tip: press <kbd>1</kbd>–<kbd>4</kbd> to choose · <kbd>Enter</kbd> to continue</p>
  )
}

export default function QuizScreen({ level, progress, onQuit, onComplete }: QuizScreenProps): ReactElement {
  // Round is frozen once per session; retries create a fresh QuizScreen.
  const [round] = useState<Round>(() => buildRound(level.id, progress))
  const total = round.questions.length

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  const answeredRef = useRef(false)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (startedAtRef.current === null) startedAtRef.current = performance.now()
  }, [])
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const bestStreakRef = useRef(0)
  const correctRef = useRef(0)
  const talliesRef = useRef(new Map<string, ItemTally>())
  const missedItemsRef = useRef<string[]>([])
  const missedGrammarRef = useRef<MissedGrammar[]>([])
  const advanceGuardRef = useRef(0)
  const keyHandlerRef = useRef<((ev: KeyboardEvent) => void) | null>(null)

  const q: Question = round.questions[index]

  const registerKeys = useCallback<RegisterKeys>((handler) => {
    keyHandlerRef.current = handler
  }, [])

  const foldTally = useCallback((itemId: string, cameCorrect: boolean): void => {
    const bag = talliesRef.current.get(itemId) ?? { itemId, correct: 0, wrong: 0 }
    if (cameCorrect) bag.correct += 1
    else {
      bag.wrong += 1
      if (!missedItemsRef.current.includes(itemId)) missedItemsRef.current.push(itemId)
    }
    talliesRef.current.set(itemId, bag)
  }, [])

  const answer = useCallback((input: AnswerInput): void => {
    if (answeredRef.current) return
    answeredRef.current = true

    if (input.pairResults) {
      for (const pair of input.pairResults) foldTally(pair.itemId, pair.correct)
    } else if (input.itemId) {
      foldTally(input.itemId, input.correct)
    }

    if (input.correct) {
      streakRef.current += 1
      bestStreakRef.current = Math.max(bestStreakRef.current, streakRef.current)
      correctRef.current += 1
      const gained = input.base + Math.min(streakRef.current * 10, 50)
      scoreRef.current += gained
      sfxCorrect()
      setScore(scoreRef.current)
      setStreak(streakRef.current)
      setFeedback({ kind: 'ok', title: 'Correct', detail: `${input.correctText} · +${gained} points` })
    } else {
      streakRef.current = 0
      setStreak(0)
      sfxWrong()
      if (input.grammarMiss && !missedGrammarRef.current.some((entry) => entry.id === input.grammarMiss?.id)) {
        missedGrammarRef.current.push(input.grammarMiss)
      }
      setFeedback({
        kind: input.warn ? 'warn' : 'bad',
        title: input.warn ? 'Matched, with slips' : 'Not quite',
        detail: input.wrongText,
        mnemonic: input.mnemonic,
      })
    }
    setAnswered(true)
  }, [foldTally])

  const quizApi = useMemo<QuizApi>(
    () => ({
      resetStreak: () => {
        streakRef.current = 0
        setStreak(0)
      },
      placed: () => {
        scoreRef.current += 40
        setScore(scoreRef.current)
        sfxPlace()
      },
      answer,
    }),
    [answer],
  )

  const finish = useCallback((): void => {
    const summary: RoundSummary = {
      levelId: level.id,
      score: scoreRef.current,
      correct: correctRef.current,
      total,
      bestStreak: bestStreakRef.current,
      elapsedMs: Math.round(performance.now() - (startedAtRef.current ?? 0)),
      tallies: Array.from(talliesRef.current, ([itemId, bag]) => ({ itemId, correct: bag.correct, wrong: bag.wrong })),
      missedItemIds: [...missedItemsRef.current],
      missedGrammar: [...missedGrammarRef.current],
    }
    onComplete(summary)
  }, [level.id, onComplete, total])

  const advance = useCallback((): void => {
    const now = Date.now()
    if (now - advanceGuardRef.current < 180) return
    advanceGuardRef.current = now
    if (index + 1 >= total) {
      finish()
      return
    }
    answeredRef.current = false
    setAnswered(false)
    setFeedback(null)
    setIndex(index + 1)
  }, [finish, index, total])

  // One document-level handler for 1–4 / Enter, ignoring INPUT & TEXTAREA.
  // Per-question engines register their own keys via `registerKeys`.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent): void => {
      const target = ev.target
      const tag = target instanceof Element ? target.tagName : null
      const inField = tag === 'INPUT' || tag === 'TEXTAREA'
      if (!answeredRef.current) {
        if (inField) return
        keyHandlerRef.current?.(ev)
        return
      }
      if (ev.key === 'Enter' && !inField) {
        ev.preventDefault()
        advance()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [advance])

  const body = (question: Question): ReactElement => {
    switch (question.kind) {
      case 'choice':
        return <ChoiceQuestion key={question.id} q={question} locked={answered} api={quizApi} registerKeys={registerKeys} />
      case 'typing':
        return <TypingQuestion key={question.id} q={question} locked={answered} api={quizApi} registerKeys={registerKeys} />
      case 'match':
        return <MatchQuestion key={question.id} q={question} locked={answered} api={quizApi} registerKeys={registerKeys} />
      case 'particle':
        return <ParticleQuestion key={question.id} q={question} locked={answered} api={quizApi} registerKeys={registerKeys} />
      case 'assembly':
        return <AssemblyQuestion key={question.id} q={question} locked={answered} api={quizApi} registerKeys={registerKeys} />
    }
  }

  const isLast = index + 1 >= total

  return (
    <section id="screen-quiz" className="screen is-active">
      <div className="game-inner">
        <header className="hud">
          <button className="icon-btn" type="button" onClick={onQuit} aria-label="Quit round">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="hud-progress">
            <div className="hud-track" aria-hidden="true"><i style={{ width: `${(index / total) * 100}%` }} /></div>
            <span className="hud-count">{index + 1} / {total}</span>
          </div>
          <div className="hud-right">
            <span className="streak-pill" hidden={streak < 2}>🔥 {streak}</span>
            <span className="score">{score.toLocaleString()}</span>
          </div>
        </header>

        <div className="quiz-card enter" key={q.id}>
          <div className="quiz-top">
            <span className="badge">{questionBadge(q)}</span>
            <span className="script-tag">{questionTag(q)}</span>
          </div>

          {body(q)}

          <div className={`feedback${feedback ? ` show ${feedback.kind}` : ''}`} aria-live="polite">
            {feedback && (
              <>
                <div className="feedback-copy">
                  <span className="feedback-icon" aria-hidden="true">{feedback.kind === 'ok' ? '✓' : feedback.kind === 'warn' ? '!' : '✕'}</span>
                  <div className="feedback-text">
                    <strong>{feedback.title}</strong>
                    <span>{feedback.detail}</span>
                    {feedback.mnemonic && <span className="fb-mnemonic">💡 {feedback.mnemonic}</span>}
                  </div>
                </div>
                <button className="next-btn" type="button" onClick={advance}>
                  {isLast ? 'Finish round' : 'Next'}
                </button>
              </>
            )}
          </div>
        </div>

        <KbdHint q={q} />
      </div>
    </section>
  )
}
