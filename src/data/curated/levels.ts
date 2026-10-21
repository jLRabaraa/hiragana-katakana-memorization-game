import type { Level } from '../../types/domain'
import { kanaId } from '../../utils/kana'
import { GRAMMAR_NOTES, GRAMMAR_QUESTIONS } from './grammar'
import { CURATED_VOCAB } from './vocab'

/**
 * Ordered campaign path for the vertical slice.
 *
 * Full kana first (hiragana → katakana, basic → voiced → combos), then the first
 * vocabulary block, then one grammar level that exercises both particle fill-in
 * and word-order assembly. `requires` is auto-chained: each level unlocks after
 * the previous one is passed.
 */

const hira = (glyphs: string) =>
  glyphs.trim().split(/\s+/).map((glyph) => kanaId('hiragana', glyph))

const kata = (glyphs: string) =>
  glyphs.trim().split(/\s+/).map((glyph) => kanaId('katakana', glyph))

const vocabIds = CURATED_VOCAB.map((item) => item.id)

type LevelDef = Omit<Level, 'order' | 'requires' | 'passAccuracy'> & { passAccuracy?: number }

const DEFS: LevelDef[] = [
  {
    id: 'kana-h01',
    title: 'Hiragana · あ–こ',
    stage: 'kana',
    learn: hira('あ い う え お か き く け こ'),
    pool: hira('あ い う え お か き く け こ'),
  },
  {
    id: 'kana-h02',
    title: 'Hiragana · さ–と',
    stage: 'kana',
    learn: hira('さ し す せ そ た ち つ て と'),
    pool: hira('さ し す せ そ た ち つ て と'),
  },
  {
    id: 'kana-h03',
    title: 'Hiragana · な–ほ',
    stage: 'kana',
    learn: hira('な に ぬ ね の は ひ ふ へ ほ'),
    pool: hira('な に ぬ ね の は ひ ふ へ ほ'),
  },
  {
    id: 'kana-h04',
    title: 'Hiragana · ま–ん',
    stage: 'kana',
    learn: hira('ま み む め も や ゆ よ ら り る れ ろ わ を ん'),
    pool: hira('ま み む め も や ゆ よ ら り る れ ろ わ を ん'),
  },
  {
    id: 'kana-h05',
    title: 'Hiragana · Voiced 濁音',
    stage: 'kana',
    learn: hira('が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ'),
    pool: hira('が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ'),
  },
  {
    id: 'kana-h06',
    title: 'Hiragana · Combos I 拗音',
    stage: 'kana',
    learn: hira('きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ'),
    pool: hira('きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ'),
  },
  {
    id: 'kana-h07',
    title: 'Hiragana · Combos II 拗音',
    stage: 'kana',
    learn: hira('りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ'),
    pool: hira('りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ'),
  },
  {
    id: 'kana-k01',
    title: 'Katakana · ア–ソ',
    stage: 'kana',
    learn: kata('ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ'),
    pool: kata('ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ'),
  },
  {
    id: 'kana-k02',
    title: 'Katakana · タ–ホ',
    stage: 'kana',
    learn: kata('タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ'),
    pool: kata('タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ'),
  },
  {
    id: 'kana-k03',
    title: 'Katakana · マ–ン',
    stage: 'kana',
    learn: kata('マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヲ ン'),
    pool: kata('マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヲ ン'),
  },
  {
    id: 'kana-k04',
    title: 'Katakana · Voiced 濁音',
    stage: 'kana',
    learn: kata('ガ ギ グ ゲ ゴ ザ ジ ズ ゼ ゾ ダ ヂ ヅ デ ド バ ビ ブ ベ ボ パ ピ プ ペ ポ'),
    pool: kata('ガ ギ グ ゲ ゴ ザ ジ ズ ゼ ゾ ダ ヂ ヅ デ ド バ ビ ブ ベ ボ パ ピ プ ペ ポ'),
  },
  {
    id: 'kana-k05',
    title: 'Katakana · Combos I 拗音',
    stage: 'kana',
    learn: kata('キャ キュ キョ シャ シュ ショ チャ チュ チョ ニャ ニュ ニョ ヒャ ヒュ ヒョ ミャ ミュ ミョ'),
    pool: kata('キャ キュ キョ シャ シュ ショ チャ チュ チョ ニャ ニュ ニョ ヒャ ヒュ ヒョ ミャ ミュ ミョ'),
  },
  {
    id: 'kana-k06',
    title: 'Katakana · Combos II 拗音',
    stage: 'kana',
    learn: kata('リャ リュ リョ ギャ ギュ ギョ ジャ ジュ ジョ ビャ ビュ ビョ ピャ ピュ ピョ'),
    pool: kata('リャ リュ リョ ギャ ギュ ギョ ジャ ジュ ジョ ビャ ビュ ビョ ピャ ピュ ピョ'),
  },
  {
    id: 'vocab-01',
    title: 'Words · Nature & everyday',
    stage: 'vocab',
    learn: vocabIds.slice(0, 7),
    pool: vocabIds.slice(0, 7),
  },
  {
    id: 'vocab-02',
    title: 'Words · First actions',
    stage: 'vocab',
    learn: vocabIds.slice(7),
    pool: vocabIds.slice(7),
  },
  {
    id: 'grammar-01',
    title: 'First sentences',
    stage: 'grammar',
    learn: [],
    pool: [],
    grammar: GRAMMAR_QUESTIONS,
    lessonNotes: GRAMMAR_NOTES,
  },
]

export const LEVELS: Level[] = DEFS.map((def, index) => ({
  ...def,
  order: index + 1,
  requires: index === 0 ? [] : [DEFS[index - 1].id],
  passAccuracy: def.passAccuracy ?? 0.8,
}))

export const LEVEL_BY_ID = new Map(LEVELS.map((level) => [level.id, level]))
