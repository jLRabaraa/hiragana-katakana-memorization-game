import type { Rng } from '../utils/shuffle'

/**
 * Spiral-review weighting: ~25% of a round's questions come from previously
 * learned items, weighted by `1 + wrong` (capped). Items missed more often
 * appear more often. Sampling is without replacement and stays inside the
 * learned pool — the engine enforces it, not the UI.
 */

const MAX_LEVEL_CAP = 4

export function spiralWeight(wrong: number): number {
  return 1 + Math.min(Math.max(0, wrong), MAX_LEVEL_CAP)
}

export function pickReviewIds(
  candidateIds: readonly string[],
  count: number,
  wrongOf: ReadonlyMap<string, number>,
  rng: Rng = Math.random,
): string[] {
  if (count <= 0 || candidateIds.length === 0) return []
  const pool = [...candidateIds]
  const picked: string[] = []

  while (picked.length < count && pool.length > 0) {
    const weights = pool.map((id) => spiralWeight(wrongOf.get(id) ?? 0))
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let threshold = rng() * total
    let index = 0
    for (; index < pool.length - 1; index++) {
      threshold -= weights[index]
      if (threshold <= 0) break
    }
    picked.push(pool[index])
    pool.splice(index, 1)
  }
  return picked
}
