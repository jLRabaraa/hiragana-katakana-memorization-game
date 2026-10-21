import { KANA_ITEMS } from '../data/curated/kana'

/**
 * Kana → rōmaji conversion used by the typing engine, so a word like がっこう
 * can be checked as "gakkou". Only runs over kana-only readings — never across
 * mixed strings (see the kana transform rule in AGENTS.md).
 *
 * The source of truth is the curated kana table (hiragana rows), so Kunrei
 * alternates unlock the same variants the kana levels already teach.
 */

// Digraph-aware alternatives a learner may reasonably type (wapuro IME style).
const SUB_PATTERNS: [RegExp, string][] = [
  [/shi/g, 'si'],
  [/sha/g, 'sya'],
  [/shu/g, 'syu'],
  [/sho/g, 'syo'],
  [/chi/g, 'ti'],
  [/cha/g, 'tya'],
  [/chu/g, 'tyu'],
  [/cho/g, 'tyo'],
  [/tsu/g, 'tu'],
  [/fu/g, 'hu'],
  [/ji/g, 'zi'],
]

const ROMAJI_BY_GLYPH = new Map<string, string>()
for (const item of KANA_ITEMS) {
  if (item.script !== 'hiragana') continue
  if (item.glyph.length > 1) continue // yōon is parsed part by part below
  if (!ROMAJI_BY_GLYPH.has(item.glyph)) {
    ROMAJI_BY_GLYPH.set(item.glyph, item.romaji)
  }
}

function romajiForSlice(chars: readonly string[]): string | null {
  if (chars.length === 0) return ''
  const [head, ...rest] = chars

  if (head === 'っ' || head === 'ッ') {
    if (rest.length === 0) return null
    const restRomaji = romajiForSlice(rest)
    if (restRomaji === null || restRomaji.length === 0) return null
    const first = restRomaji[0]
    if ('aeiou'.includes(first) || first === 'n') return restRomaji
    if (restRomaji.startsWith('ch')) return 't' + restRomaji
    return first + restRomaji
  }

  if (head === 'ん') {
    const restRomaji = romajiForSlice(rest)
    return restRomaji === null ? null : 'n' + restRomaji
  }

  const direct = ROMAJI_BY_GLYPH.get(head)
  if (direct === undefined) return null
  const restRomaji = romajiForSlice(rest)
  return restRomaji === null ? null : direct + restRomaji
}

export function parseKanaRomaji(kana: string): string | null {
  return romajiForSlice(Array.from(kana))
}

function apply(pattern: RegExp, replacement: string, value: string): string {
  return value.replace(pattern, replacement)
}

/** Acceptance set: the canonical reading plus common typing variants. */
export function kanaRomajiVariants(kana: string): string[] {
  const primary = parseKanaRomaji(kana)
  if (primary === null) return []

  const variants = new Set<string>([primary])

  // Kunrei-style spellings via inversion of the Hepburn patterns above.
  let kunrei = primary
  for (const [pattern, replacement] of SUB_PATTERNS) {
    kunrei = apply(pattern, replacement, kunrei)
  }
  variants.add(kunrei)

  // Wapuro long vowels: こう typed as "koo" instead of "kou".
  const ooFix = (value: string) => apply(/ou/g, 'oo', value)
  const uuFix = (value: string) => apply(/uu/g, 'u', value)
  for (const base of [primary, kunrei]) {
    variants.add(ooFix(base))
    variants.add(uuFix(base))
    variants.add(ooFix(uuFix(base)))
  }

  // ん before a consonant is often doubled by IMEs: りんご → "rinngo".
  const nnFix = (value: string) => apply(/n(?=[b-df-hj-np-tv-z])/g, 'nn', value)
  for (const base of [primary, kunrei]) {
    variants.add(nnFix(base))
    variants.add(ooFix(nnFix(base)))
  }

  return [...variants]
}
