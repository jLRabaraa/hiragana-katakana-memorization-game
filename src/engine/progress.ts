import { ITEM_BY_ID, LEVEL_BY_ID } from '../data'
import {
  DEFAULT_DOJO_CONFIG,
  LEGACY_BEST_KEY,
  LEGACY_CONFIG_KEY,
  PROGRESS_KEY,
} from '../types/progress'
import type { DojoConfig, DojoMode, DojoScript, Progress, RoundSummary } from '../types/progress'

/**
 * Persistence for `kanaDojo.progress.v2`.
 *
 * - Validate on read, field by field; malformed values fall back to defaults,
 *   unknown ids are dropped — a corrupted store must never crash the app.
 * - Legacy `kanaDojo.config.v1` / `kanaDojo.best.v1` seed the Dojo practice
 *   settings once. Legacy keys are never deleted.
 * - Saves happen on transitions (round end, level pass, setting change), never
 *   per keystroke.
 */

const DOJO_SCRIPTS: readonly DojoScript[] = ['hiragana', 'katakana', 'both']
const DOJO_MODES: readonly DojoMode[] = ['mixed', 'drag', 'read', 'recall', 'type']
const DOJO_SETS: ReadonlySet<string> = new Set(['basic', 'dakuten', 'yoon'])

export function defaultProgress(): Progress {
  return {
    version: 2,
    levels: {},
    items: {},
    practice: {
      config: { ...DEFAULT_DOJO_CONFIG, sets: [...DEFAULT_DOJO_CONFIG.sets] },
      best: {},
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function readStorage(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore: storage may be unavailable */
  }
}

export function saveProgress(progress: Progress): void {
  writeStorage(PROGRESS_KEY, progress)
}

function sanitizeDojoConfig(raw: unknown): DojoConfig {
  const config: DojoConfig = { ...DEFAULT_DOJO_CONFIG, sets: [...DEFAULT_DOJO_CONFIG.sets] }
  if (!isRecord(raw)) return config

  if (typeof raw.script === 'string' && DOJO_SCRIPTS.includes(raw.script as DojoScript)) {
    config.script = raw.script as DojoScript
  }
  if (Array.isArray(raw.sets)) {
    const valid = [...new Set(raw.sets.filter((set): set is string => typeof set === 'string' && DOJO_SETS.has(set)))]
    if (valid.length > 0) config.sets = valid
  }
  if (typeof raw.mode === 'string' && DOJO_MODES.includes(raw.mode as DojoMode)) {
    config.mode = raw.mode as DojoMode
  }
  if (typeof raw.timer === 'boolean') config.timer = raw.timer
  if (typeof raw.sound === 'boolean') config.sound = raw.sound
  return config
}

function sanitizeLevels(raw: unknown): Record<string, Progress['levels'][string]> {
  const levels: Record<string, Progress['levels'][string]> = {}
  if (!isRecord(raw)) return levels

  for (const [id, value] of Object.entries(raw)) {
    // Unknown level ids are dropped rather than crash or re-lock anything.
    if (!LEVEL_BY_ID.has(id) || !isRecord(value)) continue
    const bestAccuracy = finiteNumber(value.bestAccuracy)
    const bestScore = finiteNumber(value.bestScore)
    const learnedAt = finiteNumber(value.learnedAt)
    levels[id] = {
      passed: value.passed === true,
      bestAccuracy: bestAccuracy === null ? 0 : Math.min(Math.max(bestAccuracy, 0), 1),
      bestScore: bestScore === null ? 0 : Math.max(bestScore, 0),
      ...(learnedAt !== null && learnedAt > 0 ? { learnedAt } : {}),
    }
  }
  return levels
}

function sanitizeItems(raw: unknown): Record<string, Progress['items'][string]> {
  const items: Record<string, Progress['items'][string]> = {}
  if (!isRecord(raw)) return items

  for (const [id, value] of Object.entries(raw)) {
    if (!ITEM_BY_ID.has(id) || !isRecord(value)) continue
    const seen = finiteNumber(value.seen) ?? 0
    const correct = finiteNumber(value.correct) ?? 0
    const wrong = finiteNumber(value.wrong) ?? 0
    const lastMissAt = finiteNumber(value.lastMissAt)
    items[id] = {
      seen: nonNegative(seen),
      correct: nonNegative(correct),
      wrong: nonNegative(wrong),
      ...(lastMissAt !== null && lastMissAt > 0 ? { lastMissAt } : {}),
    }
  }
  return items
}

function nonNegative(value: number): number {
  return Math.max(0, Math.floor(value))
}

function sanitizeBest(raw: unknown): Record<string, number> {
  const best: Record<string, number> = {}
  if (!isRecord(raw)) return best
  for (const [key, value] of Object.entries(raw)) {
    const num = finiteNumber(value)
    if (num !== null && num > 0) best[key] = num
  }
  return best
}

function migrateLegacyPractice(): Progress['practice'] | null {
  const legacyConfig = readStorage(LEGACY_CONFIG_KEY)
  const legacyBest = readStorage(LEGACY_BEST_KEY)
  if (legacyConfig === null && legacyBest === null) return null

  return {
    config: sanitizeDojoConfig(legacyConfig),
    best: sanitizeBest(legacyBest),
  }
}

/** Load + validate + migrate. Never throws, never deletes legacy keys. */
export function loadProgress(): Progress {
  const fallback = defaultProgress()
  const raw = readStorage(PROGRESS_KEY)

  if (isRecord(raw) && raw.version === 2) {
    const practice = isRecord(raw.practice) ? raw.practice : null
    return {
      version: 2,
      levels: sanitizeLevels(raw.levels),
      items: sanitizeItems(raw.items),
      practice: {
        config: practice ? sanitizeDojoConfig(practice.config) : fallback.practice.config,
        best: practice ? sanitizeBest(practice.best) : {},
      },
    }
  }

  // First run (or corrupt v2 blob): seed the Dojo practice section from legacy.
  const legacy = migrateLegacyPractice()
  const migrated: Progress = legacy ? { ...fallback, practice: legacy } : fallback
  saveProgress(migrated)
  return migrated
}

/** Mark the level's lesson as seen. The timestamp is written once. */
export function markLessonSeen(progress: Progress, levelId: string): Progress {
  const level = LEVEL_BY_ID.get(levelId)
  if (!level) return progress
  const existing = progress.levels[levelId]
  if (existing?.learnedAt) return progress

  const record = existing ?? { passed: false, bestAccuracy: 0, bestScore: 0 }
  return {
    ...progress,
    levels: {
      ...progress.levels,
      [levelId]: { ...record, learnedAt: Date.now() },
    },
  }
}

/**
 * Fold a finished round into the progress store. Accuracy gating happens here:
 * `passed` is permanent once reached, and bests are maxed, never lowered.
 */
export function completeRound(
  progress: Progress,
  summary: RoundSummary,
  passAccuracy: number,
): { progress: Progress; passed: boolean; isNewBest: boolean } {
  if (!LEVEL_BY_ID.has(summary.levelId)) return { progress, passed: false, isNewBest: false }

  const items = { ...progress.items }
  for (const tally of summary.tallies) {
    if (!ITEM_BY_ID.has(tally.itemId)) continue
    const previous = items[tally.itemId] ?? { seen: 0, correct: 0, wrong: 0 }
    const deltaCorrect = Math.max(0, Math.floor(tally.correct))
    const deltaWrong = Math.max(0, Math.floor(tally.wrong))
    const wrong = previous.wrong + deltaWrong
    items[tally.itemId] = {
      seen: previous.seen + deltaCorrect + deltaWrong,
      correct: previous.correct + deltaCorrect,
      wrong,
      ...(deltaWrong > 0
        ? { lastMissAt: Date.now() }
        : previous.lastMissAt
          ? { lastMissAt: previous.lastMissAt }
          : {}),
    }
  }

  const accuracy = summary.total > 0 ? summary.correct / summary.total : 0
  const previous = progress.levels[summary.levelId] ?? { passed: false, bestAccuracy: 0, bestScore: 0 }
  const passed = previous.passed || (summary.total > 0 && accuracy >= passAccuracy)
  const isNewBest = summary.score > previous.bestScore && summary.score > 0

  const levels = {
    ...progress.levels,
    [summary.levelId]: {
      ...previous,
      passed,
      bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
      bestScore: Math.max(previous.bestScore, summary.score),
    },
  }

  return { progress: { ...progress, levels, items }, passed, isNewBest }
}
