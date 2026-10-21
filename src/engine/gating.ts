import { LEVELS } from '../data'
import type { Level } from '../types/domain'
import type { Progress } from '../types/progress'

/**
 * Locking is logic, not CSS. The level map renders stubs for locked levels, and
 * `buildRound` refuses locked levels outright — the UI cannot bypass this.
 */

export function isLevelUnlocked(level: Level, progress: Progress): boolean {
  return level.requires.every((id) => progress.levels[id]?.passed === true)
}

export type LevelStatus = 'locked' | 'lesson' | 'quiz' | 'completed'

export function levelStatus(level: Level, progress: Progress): LevelStatus {
  if (!isLevelUnlocked(level, progress)) return 'locked'
  const record = progress.levels[level.id]
  if (record?.passed) return 'completed'
  const lessonNotDone = !record?.learnedAt
  const hasLesson = level.learn.length > 0 || (level.lessonNotes?.length ?? 0) > 0
  return lessonNotDone && hasLesson ? 'lesson' : 'quiz'
}

/** Union of items whose lesson has been completed — the review pool. */
export function learnedItemIds(progress: Progress): Set<string> {
  const learned = new Set<string>()
  for (const level of LEVELS) {
    const record = progress.levels[level.id]
    if (record && (record.learnedAt !== undefined || record.passed)) {
      for (const id of level.learn) learned.add(id)
    }
  }
  return learned
}

/** First level that is unlocked but not yet passed — the "continue" target. */
export function nextPlayableLevel(progress: Progress): Level | null {
  for (const level of LEVELS) {
    const status = levelStatus(level, progress)
    if (status !== 'locked' && status !== 'completed') return level
  }
  return null
}
