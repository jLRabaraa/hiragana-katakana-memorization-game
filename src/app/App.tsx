import { useCallback, useEffect, useState } from 'react'
import AttributionFooter from '../components/AttributionFooter.tsx'
import CurriculumReview from '../features/review/CurriculumReview.tsx'
import HomeScreen from '../features/home/HomeScreen'
import LessonScreen from '../features/learn/LessonScreen'
import QuizScreen from '../features/quiz/QuizScreen'
import ResultsScreen from '../features/results/ResultsScreen'
import { LEVELS, LEVEL_BY_ID } from '../data'
import { levelStatus } from '../engine/gating'
import { completeRound, markLessonSeen } from '../engine/progress'
import { useProgress } from '../hooks/useProgress'
import type { Level } from '../types/domain'
import type { RoundSummary } from '../types/progress'
import { setSoundEnabled } from '../utils/audio'

type Screen =
  | { name: 'home' }
  | { name: 'lesson'; levelId: string }
  | { name: 'quiz'; levelId: string }
  | { name: 'results'; levelId: string; summary: RoundSummary; passed: boolean; isNewBest: boolean }
  | { name: 'review' }

/**
 * Campaign shell: home map → lesson (first visit) → quiz → results. Retries
 * skip the lesson and always build a fresh round; a passed level never re-locks.
 */
export default function App() {
  const { progress, apply, patchDojoConfig } = useProgress()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [quizNonce, setQuizNonce] = useState(0)
  const soundOn = progress.practice.config.sound

  useEffect(() => {
    setSoundEnabled(soundOn)
  }, [soundOn])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const startLevel = useCallback(
    (levelId: string) => {
      const level = LEVEL_BY_ID.get(levelId)
      if (!level) return
      const status = levelStatus(level, progress)
      if (status === 'locked') return
      setScreen(status === 'lesson' ? { name: 'lesson', levelId } : { name: 'quiz', levelId })
    },
    [progress],
  )

  const finishLesson = useCallback(
    (levelId: string) => {
      apply(markLessonSeen(progress, levelId))
      setScreen({ name: 'quiz', levelId })
    },
    [apply, progress],
  )

  const handleQuizComplete = useCallback(
    (summary: RoundSummary) => {
      const level = LEVEL_BY_ID.get(summary.levelId)
      if (!level) return
      const { progress: next, passed, isNewBest } = completeRound(progress, summary, level.passAccuracy)
      apply(next)
      setScreen({ name: 'results', levelId: summary.levelId, summary, passed, isNewBest })
    },
    [apply, progress],
  )

  const retryRound = useCallback((levelId: string) => {
    setQuizNonce((n) => n + 1)
    setScreen({ name: 'quiz', levelId })
  }, [])

  let content = null
  let attribution = false

  if (screen.name === 'home') {
    content = (
      <HomeScreen
        progress={progress}
        soundOn={soundOn}
        onStartLevel={startLevel}
        onToggleSound={() => patchDojoConfig({ sound: !soundOn })}
        onOpenReview={() => setScreen({ name: 'review' })}
      />
    )
    attribution = true
  } else if (screen.name === 'review') {
    content = <CurriculumReview onBack={() => setScreen({ name: 'home' })} />
  } else if (screen.name === 'lesson') {
    const level: Level | undefined = LEVEL_BY_ID.get(screen.levelId)
    content = level ? (
      <LessonScreen level={level} onBack={() => setScreen({ name: 'home' })} onStart={() => finishLesson(level.id)} />
    ) : <span />
  } else if (screen.name === 'quiz') {
    const level: Level | undefined = LEVEL_BY_ID.get(screen.levelId)
    content = level ? (
      <QuizScreen
        key={`quiz-${screen.levelId}-${quizNonce}`}
        level={level}
        progress={progress}
        onQuit={() => setScreen({ name: 'home' })}
        onComplete={handleQuizComplete}
      />
    ) : <span />
  } else {
    // results
    const level: Level | undefined = LEVEL_BY_ID.get(screen.levelId)
    const at = LEVELS.findIndex((entry) => entry.id === screen.levelId)
    const next = at >= 0 ? LEVELS[at + 1] : undefined
    content = level ? (
      <ResultsScreen
        level={level}
        summary={screen.summary}
        passed={screen.passed}
        isNewBest={screen.isNewBest}
        hasNext={next !== undefined}
        onRetry={() => retryRound(level.id)}
        onNext={() => (next ? startLevel(next.id) : setScreen({ name: 'home' }))}
        onHome={() => setScreen({ name: 'home' })}
      />
    ) : <span />
  }

  return (
    <>
      <div className="bg-mark" aria-hidden="true">あ</div>
      <main className="app">
        {content}
        {attribution && <AttributionFooter />}
      </main>
    </>
  )
}
