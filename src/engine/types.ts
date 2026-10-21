import type { Item, ParticleBlank } from '../types/domain'

/**
 * Question model for the quiz engines.
 *
 * Questions are a discriminated union on `kind`; every engine handles kinds in
 * an exhaustive switch. Each question carries the item (or grammar question)
 * that produced it, so feedback and miss-weight updates need no lookups.
 */

export interface MatchPair {
  itemId: string
  /** Tile face, e.g. が or 水. */
  tile: string
  /** Slot label, e.g. ga or water. */
  slot: string
  /** long glyphs render with the combo styling. */
  long: boolean
}

export type ChoiceVariant = {
  direction: 'char2romaji' | 'romaji2char' | 'jp2en' | 'en2jp'
  /** Answer label, for feedback copy. */
  answerLabel: string
}

export type Question =
  | {
      kind: 'choice'
      id: string
      itemId: string
      item: Item
      variant: ChoiceVariant
      prompt: string
      promptLang: 'ja' | 'en'
      promptSub: string
      promptNote?: string
      speakText?: string
      options: string[]
      optionLang: 'ja' | 'en'
      answerIndex: number
    }
  | {
      kind: 'typing'
      id: string
      itemId: string
      item: Item
      prompt: string
      promptLang: 'ja' | 'en'
      promptSub: string
      promptNote?: string
      speakText?: string
      /** canonical reading for feedback, e.g. "a" or "gakkou". */
      reading: string
      accepts: string[]
    }
  | {
      kind: 'match'
      id: string
      title: string
      instruction: string
      pairs: MatchPair[]
    }
  | {
      kind: 'particle'
      id: string
      sourceId: string
      tokens: string[]
      blanks: ParticleBlank[]
      translation: string
    }
  | {
      kind: 'assembly'
      id: string
      sourceId: string
      tiles: string[]
      answer: string[]
      translation: string
    }

export interface Round {
  levelId: string
  questions: Question[]
  /** How many item questions came from spiral review (engine metrics). */
  reviewCount: number
}
