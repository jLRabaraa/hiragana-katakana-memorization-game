export type DojoScript = 'hiragana' | 'katakana' | 'both'
export type DojoMode = 'mixed' | 'drag' | 'read' | 'recall' | 'type'

export interface DojoConfig {
  script: DojoScript
  sets: string[]
  mode: DojoMode
  timer: boolean
  sound: boolean
}

export interface LevelRecord {
  passed: boolean
  learnedAt?: number
  bestAccuracy: number
  bestScore: number
}

export interface ItemRecord {
  seen: number
  correct: number
  wrong: number
  lastMissAt?: number
}

export interface Progress {
  version: 2
  levels: Record<string, LevelRecord>
  items: Record<string, ItemRecord>
  practice: {
    config: DojoConfig
    best: Record<string, number>
  }
}

export const PROGRESS_KEY = 'kanaDojo.progress.v2'
export const LEGACY_CONFIG_KEY = 'kanaDojo.config.v1'
export const LEGACY_BEST_KEY = 'kanaDojo.best.v1'

export const DEFAULT_DOJO_CONFIG: DojoConfig = {
  script: 'hiragana',
  sets: ['basic'],
  mode: 'mixed',
  timer: false,
  sound: true,
}

export interface ItemTally {
  itemId: string
  correct: number
  wrong: number
}

export interface MissedGrammar {
  id: string
  sentence: string
  translation: string
}

export interface RoundSummary {
  levelId: string
  score: number
  correct: number
  total: number
  bestStreak: number
  elapsedMs: number
  tallies: ItemTally[]
  missedItemIds: string[]
  missedGrammar: MissedGrammar[]
}
