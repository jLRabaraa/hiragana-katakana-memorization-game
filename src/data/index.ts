import type { Item, Level } from '../types/domain'
import { KANA_ITEMS } from './curated/kana'
import { LEVELS } from './curated/levels'
import { GENERATED_KANJI } from './generated/kanji.generated'
import { GENERATED_VOCAB } from './generated/vocab.generated'
import { GRAMMAR_NOTES, GRAMMAR_QUESTIONS } from './curated/grammar'

/**
 * Single import surface for curriculum data.
 *
 * Vocabulary comes from `generated/` (produced by `npm run data:convert` from
 * the curated source). Kana and grammar are imported directly because they need
 * no dataset enrichment.
 */

export const VOCAB_ITEMS = GENERATED_VOCAB

export const ALL_ITEMS: Item[] = [...KANA_ITEMS, ...VOCAB_ITEMS]

export const ITEM_BY_ID = new Map<string, Item>(ALL_ITEMS.map((item) => [item.id, item]))

export const KANJI_BY_LITERAL = new Map(GENERATED_KANJI.map((entry) => [entry.literal, entry]))

export function getItem(id: string): Item {
  const item = ITEM_BY_ID.get(id)
  if (!item) throw new Error(`Unknown item id: ${id}`)
  return item
}

export function getItems(ids: readonly string[]): Item[] {
  return ids.map(getItem)
}

/** Structural checks used by the content-review screen and during development. */
export function curriculumProblems(levels: Level[] = LEVELS): string[] {
  const problems: string[] = []
  const levelIds = new Set<string>()

  for (const level of levels) {
    if (levelIds.has(level.id)) problems.push(`duplicate level id: ${level.id}`)
    levelIds.add(level.id)
    if (level.passAccuracy <= 0 || level.passAccuracy > 1) {
      problems.push(`invalid passAccuracy on ${level.id}`)
    }
    if (level.stage === 'grammar') {
      if (!level.grammar?.length) problems.push(`grammar level without questions: ${level.id}`)
    } else if (!level.pool.length) {
      problems.push(`level without a question pool: ${level.id}`)
    }
    for (const id of [...level.learn, ...level.pool]) {
      if (!ITEM_BY_ID.has(id)) problems.push(`unknown item id ${id} referenced by ${level.id}`)
    }
    for (const required of level.requires) {
      if (!levelIds.has(required)) {
        problems.push(`level ${level.id} requires an unknown or later level: ${required}`)
      }
    }
  }

  return problems
}

if (import.meta.env.DEV) {
  const problems = curriculumProblems()
  if (problems.length) {
    console.error('[curriculum] problems found:\n' + problems.join('\n'))
  }
}

export { KANA_ITEMS, LEVELS, GENERATED_KANJI, GRAMMAR_NOTES, GRAMMAR_QUESTIONS }
