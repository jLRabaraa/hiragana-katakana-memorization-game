import { ITEM_BY_ID, KANA_ITEMS, LEVEL_BY_ID, VOCAB_ITEMS } from '../data'
import { learnedItemIds } from './gating'
import { pickReviewIds } from './spiral'
import type { GrammarQuestion, Item, KanaItem, Level, VocabItem } from '../types/domain'
import type { Progress } from '../types/progress'
import type { MatchPair, Question, Round } from './types'
import { kanaRomajiVariants } from '../utils/kanaToRomaji'
import type { Rng } from '../utils/shuffle'
import { shuffle } from '../utils/shuffle'
import { normalizeRomaji } from '../utils/normalizeRomaji'

/**
 * The single factory that owns round construction.
 *
 * `buildRound` refuses locked levels and refuses levels whose lesson has not
 * been completed — this is the enforcement point for "locked content never
 * builds". Kana/vocab rounds are 10 questions (3 ja→X choice, 3 X→ja choice,
 * 2 typing, 2 matching) with ~25% of the item slots carrying spiral review.
 * Grammar rounds are 8 questions (particle fill + sentence assembly).
 */

const ITEM_ROUND_SIZE = 10
const GRAMMAR_ROUND_SIZE = 8
const MATCH_PAIRS = 4
const SPIRAL_SHARE = 0.25

const vocabOptionLabel = (word: VocabItem): string => word.kanji ?? word.kana

interface OptionCandidate {
  label: string
  /** visible label + normalized reading; distractors must be unique on both */
  keys: string[]
}

function romajiKeys(label: string): string[] {
  const normalized = normalizeRomaji(label)
  return normalized.length > 0 ? [label, normalized] : [label]
}

/** Answer plus three distractors, deduplicated by label and reading. */
function assembleOptions(
  entry: OptionCandidate,
  candidates: readonly OptionCandidate[],
  rng: Rng,
): { options: string[]; answerIndex: number } {
  const options: OptionCandidate[] = [entry]
  const seen = new Set(entry.keys)

  for (const cand of candidates) {
    if (options.length >= 4) break
    if (cand.keys.some((key) => seen.has(key))) continue
    for (const key of cand.keys) seen.add(key)
    options.push(cand)
  }

  const shuffled = shuffle(options, rng)
  return {
    options: shuffled.map((option) => option.label),
    answerIndex: shuffled.findIndex((option) => option === entry),
  }
}

/* -------------------------------------------------------------------- kana */

function kanaChoiceCandidates(
  entry: KanaItem,
  pool: KanaItem[],
  direction: 'char2romaji' | 'romaji2char',
): KanaItem[] {
  const sameScriptOnly = direction === 'romaji2char'
  const usable = pool.filter((cand) => {
    if (cand.id === entry.id || cand.romaji === entry.romaji) return false
    if (sameScriptOnly && cand.script !== entry.script) return false
    return true
  })

  const sameGroup = shuffle(usable.filter((cand) => cand.group === entry.group))
  const otherGroup = shuffle(usable.filter((cand) => cand.group !== entry.group))
  return [...sameGroup, ...otherGroup]
}

function buildKanaChoice(
  id: string,
  entry: KanaItem,
  pool: KanaItem[],
  direction: 'char2romaji' | 'romaji2char',
  rng: Rng,
): Question {
  const toOption = (cand: KanaItem): OptionCandidate =>
    direction === 'char2romaji'
      ? { label: cand.romaji, keys: romajiKeys(cand.romaji) }
      : { label: cand.glyph, keys: [cand.glyph, cand.romaji] }

  const answerOption =
    direction === 'char2romaji'
      ? { label: entry.romaji, keys: romajiKeys(entry.romaji) }
      : { label: entry.glyph, keys: [entry.glyph, entry.romaji] }

  const { options, answerIndex } = assembleOptions(
    answerOption,
    kanaChoiceCandidates(entry, pool, direction).map(toOption),
    rng,
  )

  return {
    kind: 'choice',
    id,
    itemId: entry.id,
    item: entry,
    variant: { direction, answerLabel: answerOption.label },
    prompt: entry.glyph,
    promptLang: 'ja',
    promptSub: direction === 'char2romaji' ? 'What is the reading?' : 'Choose the matching character',
    speakText: direction === 'char2romaji' ? entry.glyph : undefined,
    options,
    optionLang: direction === 'char2romaji' ? 'en' : 'ja',
    answerIndex,
  }
}

function buildKanaTyping(id: string, entry: KanaItem): Question {
  return {
    kind: 'typing',
    id,
    itemId: entry.id,
    item: entry,
    prompt: entry.glyph,
    promptLang: 'ja',
    promptSub: 'Type the rōmaji reading below',
    speakText: entry.glyph,
    reading: entry.romaji,
    accepts: Array.from(new Set([entry.romaji, ...entry.alts].map(normalizeRomaji))),
  }
}

/* ------------------------------------------------------------------- vocab */

function vocabChoiceCandidates(entry: VocabItem, pool: VocabItem[], rng: Rng): VocabItem[] {
  const usable = pool.filter((cand) => cand.id !== entry.id)
  if (usable.length >= 3) return shuffle(usable, rng)
  const extra = VOCAB_ITEMS.filter((cand) => cand.id !== entry.id && !pool.includes(cand))
  return [...shuffle(usable, rng), ...shuffle(extra, rng)]
}

function buildVocabChoice(
  id: string,
  entry: VocabItem,
  pool: VocabItem[],
  direction: 'jp2en' | 'en2jp',
  rng: Rng,
): Question {
  const toOption = (cand: VocabItem): OptionCandidate =>
    direction === 'jp2en'
      ? { label: cand.gloss, keys: [cand.gloss, cand.gloss.toLowerCase()] }
      : { label: vocabOptionLabel(cand), keys: [vocabOptionLabel(cand), cand.kana] }

  const answerLabel = direction === 'jp2en' ? entry.gloss : vocabOptionLabel(entry)
  const { options, answerIndex } = assembleOptions(
    toOption(entry),
    vocabChoiceCandidates(entry, pool, rng).map(toOption),
    rng,
  )

  return {
    kind: 'choice',
    id,
    itemId: entry.id,
    item: entry,
    variant: { direction, answerLabel },
    prompt: direction === 'jp2en' ? vocabOptionLabel(entry) : entry.gloss,
    promptLang: direction === 'jp2en' ? 'ja' : 'en',
    promptSub: direction === 'jp2en' ? 'Choose the meaning' : 'Choose the matching word',
    promptNote: direction === 'jp2en' && entry.kanji ? entry.kana : undefined,
    speakText: direction === 'jp2en' ? entry.kana : undefined,
    options,
    optionLang: direction === 'jp2en' ? 'en' : 'ja',
    answerIndex,
  }
}

function buildVocabTyping(id: string, entry: VocabItem): Question {
  const accepts = kanaRomajiVariants(entry.kana).map(normalizeRomaji)
  if (accepts.length === 0) throw new Error(`questionBuilder: unparseable reading for ${entry.id}`)
  return {
    kind: 'typing',
    id,
    itemId: entry.id,
    item: entry,
    prompt: vocabOptionLabel(entry),
    promptLang: 'ja',
    promptSub: 'Type the reading in rōmaji',
    reading: entry.kana,
    accepts: Array.from(new Set(accepts)),
  }
}

/* ---------------------------------------------------------------- builders */

type ItemKindSlot = 0 | 1 | 2

function buildItemQuestion(
  id: string,
  item: Item,
  kindSlot: ItemKindSlot,
  kanaPool: KanaItem[],
  vocabPool: VocabItem[],
  rng: Rng,
): Question {
  if (item.type === 'kana') {
    if (kindSlot === 2) return buildKanaTyping(id, item)
    const direction = kindSlot === 0 ? 'char2romaji' : 'romaji2char'
    return buildKanaChoice(id, item, kanaPool, direction, rng)
  }
  if (kindSlot === 2) return buildVocabTyping(id, item)
  const direction = kindSlot === 0 ? 'jp2en' : 'en2jp'
  return buildVocabChoice(id, item, vocabPool, direction, rng)
}

function buildMatchQuestion(
  id: string,
  pool: Item[],
  usedIds: Set<string>,
  stage: Level['stage'],
  rng: Rng,
): Question | null {
  const notYetUsed = pool.filter((item) => !usedIds.has(item.id))
  const from = notYetUsed.length >= MATCH_PAIRS ? notYetUsed : pool

  const byKey = new Map<string, Item>()
  for (const item of shuffle(from, rng)) {
    const key = item.type === 'kana' ? item.romaji : item.gloss
    if (!byKey.has(key)) byKey.set(key, item)
  }
  const list = [...byKey.values()]
  if (list.length < MATCH_PAIRS) return null

  const chosen = shuffle(list, rng).slice(0, MATCH_PAIRS)
  for (const item of chosen) usedIds.add(item.id)

  const pairs: MatchPair[] = chosen.map((item) =>
    item.type === 'kana'
      ? { itemId: item.id, tile: item.glyph, slot: item.romaji, long: item.glyph.length > 1 }
      : { itemId: item.id, tile: vocabOptionLabel(item), slot: item.gloss, long: vocabOptionLabel(item).length > 1 },
  )

  return {
    kind: 'match',
    id,
    title: stage === 'kana' ? 'Match each kana to its reading' : 'Match each word to its meaning',
    instruction:
      stage === 'kana'
        ? 'Drag a tile into a slot — or tap a tile, then tap a reading.'
        : 'Drag a tile into a slot — or tap a tile, then tap a meaning.',
    pairs,
  }
}

/* Legacy pickEntry port: unused items first, repeats once the pool runs dry. */
function nextItem(pool: Item[], usedIds: Set<string>, rng: Rng): Item {
  const unused = pool.filter((item) => !usedIds.has(item.id))
  const source = unused.length > 0 ? unused : pool
  const chosen = source[Math.floor(rng() * source.length)]
  usedIds.add(chosen.id)
  return chosen
}

function resolvePool(level: Level): {
  kanaPool: KanaItem[]
  vocabPool: VocabItem[]
  allPool: Item[]
  /** Distractor pools: a level whose pool lacks a type (e.g. a vocab level
   *  reviewing kana items) still needs same-type choice options. */
  kanaFallback: KanaItem[]
  vocabFallback: VocabItem[]
} {
  const kanaPool: KanaItem[] = []
  const vocabPool: VocabItem[] = []
  const allPool: Item[] = []
  for (const id of level.pool) {
    const item = ITEM_BY_ID.get(id)
    if (!item) continue
    allPool.push(item)
    if (item.type === 'kana') kanaPool.push(item)
    else vocabPool.push(item)
  }
  return {
    kanaPool,
    vocabPool,
    allPool,
    kanaFallback: kanaPool.length > 0 ? kanaPool : KANA_ITEMS,
    vocabFallback: vocabPool.length > 0 ? vocabPool : VOCAB_ITEMS,
  }
}

/* -------------------------------------------------------------- main entry */

export function buildRound(levelId: string, progress: Progress, rng: Rng = Math.random): Round {
  const level = LEVEL_BY_ID.get(levelId)
  if (!level) throw new Error(`buildRound: unknown level ${levelId}`)

  // Gating: locked levels and unfinished lessons never build.
  if (!level.requires.every((id) => progress.levels[id]?.passed === true)) {
    throw new Error(`buildRound: level ${levelId} is locked`)
  }
  const needsLesson = level.learn.length > 0 || (level.lessonNotes?.length ?? 0) > 0
  if (needsLesson && !progress.levels[levelId]?.learnedAt) {
    throw new Error(`buildRound: lesson of ${levelId} has not been completed`)
  }

  if (level.stage === 'grammar') {
    return { levelId, reviewCount: 0, questions: buildGrammarQuestions(level, rng) }
  }

  const { allPool, kanaFallback, vocabFallback } = resolvePool(level)

  // Spiral candidates: learned pool minus this level's own items.
  const candidates = [...learnedItemIds(progress)]
  for (const id of level.pool) {
    const at = candidates.indexOf(id)
    if (at >= 0) candidates.splice(at, 1)
  }

  const reviewTarget =
    candidates.length > 0
      ? Math.min(candidates.length, Math.max(1, Math.round(ITEM_ROUND_SIZE * SPIRAL_SHARE)))
      : 0
  const wrongOf = new Map<string, number>()
  for (const [id, tally] of Object.entries(progress.items)) wrongOf.set(id, tally.wrong)
  const reviewIds = pickReviewIds(candidates, reviewTarget, wrongOf, rng)

  // 3 + 3 choice slots, 2 typing slots, then two match questions.
  const kindSlots = shuffle<ItemKindSlot>([0, 1, 0, 1, 0, 1, 2, 2], rng)
  const usedIds = new Set<string>(reviewIds)

  const slotItems: Item[] = []
  for (const id of reviewIds) {
    const item = ITEM_BY_ID.get(id)
    if (item) slotItems.push(item)
  }
  while (slotItems.length < kindSlots.length) {
    slotItems.push(nextItem(allPool, usedIds, rng))
  }
  const orderedSlots = shuffle(slotItems, rng)

  const questions: Question[] = orderedSlots.map((item, i) =>
    buildItemQuestion(`${levelId}#${i}`, item, kindSlots[i], kanaFallback, vocabFallback, rng),
  )

  for (let i = 0; i < 2; i++) {
    const match = buildMatchQuestion(`${levelId}#m${i}`, allPool, usedIds, level.stage, rng)
    if (match) questions.push(match)
    else {
      const item = nextItem(allPool, usedIds, rng)
      questions.push(buildItemQuestion(`${levelId}#x${i}`, item, rng() < 0.5 ? 0 : 1, kanaFallback, vocabFallback, rng))
    }
  }

  return { levelId, reviewCount: reviewIds.length, questions: shuffle(questions, rng) }
}

function buildGrammarQuestions(level: Level, rng: Rng): Question[] {
  const grammar = level.grammar ?? []
  type ParticleFill = Extract<GrammarQuestion, { kind: 'particle-fill' }>
  const fill = grammar.filter((q): q is ParticleFill => q.kind === 'particle-fill')
  const assembly = grammar.filter((q): q is Extract<GrammarQuestion, { kind: 'assembly' }> => q.kind === 'assembly')

  const fillWanted = Math.round(GRAMMAR_ROUND_SIZE * 0.75)
  const chosenFill = shuffle(fill, rng).slice(0, fillWanted)
  const assemblyPool = shuffle(assembly, rng)
  const chosenAssembly = assemblyPool.slice(0, Math.max(0, GRAMMAR_ROUND_SIZE - chosenFill.length))

  // Top up with repeats when a source list is thin.
  while (chosenFill.length + chosenAssembly.length < GRAMMAR_ROUND_SIZE && fill.length > 0) {
    chosenFill.push(fill[Math.floor(rng() * fill.length)])
  }

  const questions: Question[] = [
    ...chosenFill.map((source, i) => ({
      kind: 'particle' as const,
      id: `${source.id}#${i}`,
      sourceId: source.id,
      tokens: source.tokens,
      blanks: source.blanks,
      translation: source.translation,
    })),
    ...chosenAssembly.map((source, i) => ({
      kind: 'assembly' as const,
      id: `${source.id}#${i}`,
      sourceId: source.id,
      tiles: source.tokens,
      answer: source.answer,
      translation: source.translation,
    })),
  ]

  return shuffle(questions, rng)
}
