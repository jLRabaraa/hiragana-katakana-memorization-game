import type { Script } from '../types/domain'

/** Convert hiragana (U+3041–U+3096) to katakana via the standard +0x60 offset. */
export function toKatakana(value: string): string {
  return Array.from(value)
    .map((ch) => {
      const code = ch.charCodeAt(0)
      return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch
    })
    .join('')
}

/** Stable item id used in localStorage and level definitions. */
export function kanaId(script: Script, glyph: string): string {
  return `${script === 'hiragana' ? 'hira' : 'kata'}:${glyph}`
}
