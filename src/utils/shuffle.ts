export type Rng = () => number

/** Fisher–Yates copy, deterministic when an rng is injected. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

export function pickRandom<T>(items: readonly T[], rng: Rng = Math.random): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(rng() * items.length)]
}
