import type { ItemTally, MissedGrammar } from '../../types/progress'

/**
 * Contract between the quiz controller (QuizScreen) and the per-question
 * engines. Engines react to the player, then either slip, place, or answer.
 */

export interface MatchResult {
  itemId: string
  correct: boolean
}

export interface AnswerInput {
  correct: boolean
  /** legacy scoring base: 100 choice, 120 typing, 40 match finish, 100 grammar */
  base: number
  /** item-producing question: exactly one itemId. Grammar questions omit it. */
  itemId?: string
  /** match questions resolve per pair. */
  pairResults?: MatchResult[]
  correctText: string
  wrongText: string
  /** on-miss anchor; rendered only in wrong-answer feedback. */
  mnemonic?: string
  /** warn variant (matched with slips) instead of a hard miss. */
  warn?: boolean
  grammarMiss?: MissedGrammar
}

export interface QuizApi {
  /** Non-terminal miss: streak resets (drag slip, wrong particle chip). */
  resetStreak(): void
  /** A drag tile settled correctly: +40 legacy scoring. */
  placed(): void
  /** Terminal answer for the question. */
  answer(input: AnswerInput): void
}

export type { ItemTally, MissedGrammar }
