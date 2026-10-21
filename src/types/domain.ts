/** Domain types shared by the curriculum data, engines, and UI. */

export type Script = 'hiragana' | 'katakana'
export type KanaGroup = 'basic' | 'dakuten' | 'yoon'
export type Stage = 'kana' | 'vocab' | 'grammar'

export interface KanaItem {
  id: string
  type: 'kana'
  glyph: string
  romaji: string
  alts: string[]
  script: Script
  group: KanaGroup
  /** Shown only in wrong-answer feedback (on-miss policy). */
  mnemonic?: string
}

export interface VocabItem {
  id: string
  type: 'vocab'
  /** Reading in kana, e.g. みず. */
  kana: string
  /** Written form when the word uses kanji, e.g. 水. Omitted for kana-only words. */
  kanji?: string
  /** Short English gloss, e.g. "water". */
  gloss: string
  readings?: { on: string[]; kun: string[] }
  example?: { ja: string; en: string }
  mnemonic?: string
}

export type Item = KanaItem | VocabItem

/** Kanji metadata emitted by the enrichment script. */
export interface KanjiInfo {
  literal: string
  meanings: string[]
  on: string[]
  kun: string[]
  grade?: number
}


export interface ParticleBlank {
  /** Index into the question's tokens that is replaced by a blank. */
  index: number
  answer: string
  choices: string[]
}

export type GrammarQuestion =
  | {
      kind: 'particle-fill'
      id: string
      tokens: string[]
      blanks: ParticleBlank[]
      translation: string
    }
  | {
      kind: 'assembly'
      id: string
      /** Tiles in their authored (shuffled) order. */
      tokens: string[]
      /** Canonical sentence order. */
      answer: string[]
      translation: string
    }

export interface Level {
  id: string
  order: number
  title: string
  stage: Stage
  /** Level ids that must be passed before this one unlocks. */
  requires: string[]
  /** Item ids introduced by the level's lesson. */
  learn: string[]
  /** Item ids this level's quizzes may draw from. */
  pool: string[]
  grammar?: GrammarQuestion[]
  /** Short explanation cards for grammar levels. */
  lessonNotes?: string[]
  passAccuracy: number
}
