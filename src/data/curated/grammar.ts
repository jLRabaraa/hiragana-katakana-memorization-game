import type { GrammarQuestion } from '../../types/domain'

/**
 * First grammar block: particles (は, を, に, で, も) and simple sentence order.
 *
 * Every sentence uses only vocabulary taught before the grammar level. Particle
 * choices always include the answer plus three distractors.
 */

const HA = ['は', 'が', 'を', 'に']
const WO = ['を', 'に', 'で', 'が']
const NI = ['に', 'を', 'で', 'も']
const DE = ['で', 'に', 'を', 'は']
const MO = ['も', 'は', 'が', 'を']

export const GRAMMAR_QUESTIONS: GrammarQuestion[] = [
  {
    kind: 'particle-fill',
    id: 'grammar:p01',
    tokens: ['私', 'は', '水', 'を', '飲みます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'を', choices: WO },
    ],
    translation: 'I drink water.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p02',
    tokens: ['私', 'は', 'りんご', 'を', '食べます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'を', choices: WO },
    ],
    translation: 'I eat an apple.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p03',
    tokens: ['私', 'は', '山', 'を', '見ます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'を', choices: WO },
    ],
    translation: 'I look at the mountain.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p04',
    tokens: ['私', 'は', '学校', 'に', '行きます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'に', choices: NI },
    ],
    translation: 'I go to school.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p05',
    tokens: ['私', 'は', '日本', 'に', '行きます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'に', choices: NI },
    ],
    translation: 'I go to Japan.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p06',
    tokens: ['家', 'で', '月', 'を', '見ます'],
    blanks: [
      { index: 1, answer: 'で', choices: DE },
      { index: 3, answer: 'を', choices: WO },
    ],
    translation: 'I see the moon at home.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p07',
    tokens: ['私', 'は', '水', 'も', '飲みます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'も', choices: MO },
    ],
    translation: 'I also drink water.',
  },
  {
    kind: 'particle-fill',
    id: 'grammar:p08',
    tokens: ['人', 'は', '山', 'を', '見ます'],
    blanks: [
      { index: 1, answer: 'は', choices: HA },
      { index: 3, answer: 'を', choices: WO },
    ],
    translation: 'People look at the mountain.',
  },
  {
    kind: 'assembly',
    id: 'grammar:a01',
    tokens: ['に', '日本', '私', '行きます', 'は'],
    answer: ['私', 'は', '日本', 'に', '行きます'],
    translation: 'I go to Japan.',
  },
  {
    kind: 'assembly',
    id: 'grammar:a02',
    tokens: ['見ます', 'で', '月', '家', 'を'],
    answer: ['家', 'で', '月', 'を', '見ます'],
    translation: 'I see the moon at home.',
  },
  {
    kind: 'assembly',
    id: 'grammar:a03',
    tokens: ['も', '水', '私', '飲みます', 'は'],
    answer: ['私', 'は', '水', 'も', '飲みます'],
    translation: 'I also drink water.',
  },
  {
    kind: 'assembly',
    id: 'grammar:a04',
    tokens: ['山', '人', '見ます', 'は', 'を'],
    answer: ['人', 'は', '山', 'を', '見ます'],
    translation: 'People look at the mountain.',
  },
]

/** Explanation cards shown before the grammar drills. */
export const GRAMMAR_NOTES: string[] = [
  'は marks the topic — "as for me…".',
  'を marks the direct object — what the action acts on.',
  'に marks a destination — where something goes.',
  'で marks where an action happens.',
  'も means "also" and replaces は.',
  'Word order is topic は · object を · verb last.',
]
