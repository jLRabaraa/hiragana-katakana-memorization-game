import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { Question } from '../../../engine/types'
import { sfxClick, sfxWrong } from '../../../utils/audio'
import { shuffle } from '../../../utils/shuffle'
import type { QuizApi } from '../api'
import { useTileDrag } from '../useTileDrag'
import type { RegisterKeys } from './ChoiceQuestion'

type MatchData = Extract<Question, { kind: 'match' }>

interface MatchQuestionProps {
  q: MatchData
  locked: boolean
  api: QuizApi
  registerKeys: RegisterKeys
}

/**
 * Drag & drop matching, ported from the legacy game:
 * - Pointer Events drag with a ghost clone (`touch-action` handled by CSS);
 * - tap-tile-then-tap-zone fallback, guarded by `suppressClicksUntil` so the
 *   click that ends a drag never selects a tile;
 * - a wrong drop shakes the tile, resets the streak, and marks the pair so the
 *   question finishes as a "warn" instead of a perfect match.
 */
export default function MatchQuestion({ q, locked, api, registerKeys }: MatchQuestionProps): ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [placed, setPlaced] = useState<Record<number, number>>({})
  const placedRef = useRef<Record<number, number>>({})
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const slippedRef = useRef<Set<number>>(new Set())
  const doneRef = useRef(false)
  const suppressUntil = useRef(0)
  const answerTimer = useRef<number | null>(null)

  const [trayOrder] = useState(() => shuffle(q.pairs.map((_, i) => i)))

  useEffect(
    () => () => {
      if (answerTimer.current !== null) window.clearTimeout(answerTimer.current)
    },
    [],
  )

  useEffect(() => {
    registerKeys(null)
    return undefined
  }, [registerKeys])

  const clearDragOver = useCallback((): void => {
    rootRef.current?.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'))
  }, [])

  const attempt = useCallback((tileIndex: number, zoneIndex: number): void => {
    if (doneRef.current) return
    const current = placedRef.current
    if (current[zoneIndex] !== undefined) return

    if (tileIndex === zoneIndex) {
      const next = { ...current, [zoneIndex]: tileIndex }
      placedRef.current = next
      setPlaced(next)
      api.placed()
      if (Object.keys(next).length === q.pairs.length) {
        doneRef.current = true
        answerTimer.current = window.setTimeout(() => {
          answerTimer.current = null
          const slipped = slippedRef.current.size
          api.answer({
            correct: slipped === 0,
            base: 40,
            pairResults: q.pairs.map((pair, i) => ({ itemId: pair.itemId, correct: !slippedRef.current.has(i) })),
            correctText: 'Every tile found its slot.',
            wrongText:
              slipped === 1
                ? 'One tile slipped before settling — that reading gets extra review weight.'
                : `${slipped} tiles slipped before settling — those readings get extra review weight.`,
            warn: slipped > 0,
          })
        }, 420)
      }
      setSelectedTile(null)
      return
    }

    // Wrong slot: the tile does not stick. Shake, reset streak, record the slip.
    slippedRef.current.add(tileIndex)
    api.resetStreak()
    sfxWrong()
    const zoneEl = rootRef.current?.querySelector(`[data-zone="${zoneIndex}"]`)
    const tileEl = rootRef.current?.querySelector(`[data-tile="${tileIndex}"]`)
    zoneEl?.classList.add('wrong')
    tileEl?.classList.add('shake')
    window.setTimeout(() => {
      zoneEl?.classList.remove('wrong')
      tileEl?.classList.remove('shake')
    }, 460)
    setSelectedTile(null)
  }, [api, q.pairs])

  const attachDrag = useTileDrag({
    canDrag: (tile) => !doneRef.current && tile.getAttribute('data-tile') !== null,
    resolveDrop: (x, y) => {
      const under = document.elementFromPoint(x, y)
      return under?.closest('[data-zone]') ?? null
    },
    onDragMove: (_tile, target) => {
      rootRef.current?.querySelectorAll('[data-zone]').forEach((zone) => {
        const filled = zone.classList.contains('is-filled')
        zone.classList.toggle('drag-over', zone === target && !filled)
      })
    },
    onDragEnd: (tile, target, moved) => {
      suppressUntil.current = Date.now() + 400
      clearDragOver()
      if (!moved || !target) return
      const tileIndex = Number(tile.getAttribute('data-tile'))
      const zoneIndex = Number(target.getAttribute('data-zone'))
      if (Number.isNaN(tileIndex) || Number.isNaN(zoneIndex)) return
      attempt(tileIndex, zoneIndex)
    },
    onDragCancel: clearDragOver,
  })

  const onTileClick = (tileIndex: number): void => {
    // oxlint-disable-next-line react/purity -- intentional: drag suppress window
    if (Date.now() < suppressUntil.current || doneRef.current) return
    sfxClick()
    setSelectedTile((prev) => (prev === tileIndex ? null : tileIndex))
  }

  const onZoneClick = (zoneIndex: number): void => {
    // oxlint-disable-next-line react/purity -- intentional: drag suppress window
    if (Date.now() < suppressUntil.current || doneRef.current || placed[zoneIndex] !== undefined) return
    if (selectedTile === null) {
      // gentle hint that a zone is a drop target
      const zoneEl = rootRef.current?.querySelector(`[data-zone="${zoneIndex}"]`)
      zoneEl?.classList.add('drag-over')
      window.setTimeout(() => zoneEl?.classList.remove('drag-over'), 260)
      return
    }
    attempt(selectedTile, zoneIndex)
  }

  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      attachDrag(node)
      rootRef.current = node
    },
    [attachDrag],
  )

  const placedTiles = new Set(Object.values(placed))
  const matchedCount = placedTiles.size

  return (
    <div className="prompt drag-card" ref={setRoot}>
      <div className={`drag-tray${matchedCount === q.pairs.length ? ' is-complete' : ''}`}>
        {trayOrder.map((tileIndex) =>
          placedTiles.has(tileIndex) ? null : (
            <button
              key={q.pairs[tileIndex].slot}
              type="button"
              className={`tile${q.pairs[tileIndex].long ? ' is-combo' : ''}${selectedTile === tileIndex ? ' selected' : ''}`}
              data-drag-tile=""
              data-tile={tileIndex}
              lang="ja"
              aria-pressed={selectedTile === tileIndex}
              onClick={() => onTileClick(tileIndex)}
            >
              {q.pairs[tileIndex].tile}
            </button>
          ),
        )}
      </div>

      <p className="drag-instruction">{q.instruction}</p>

      <div className="drop-grid">
        {q.pairs.map((pair, zoneIndex) => (
          <button
            key={pair.slot}
            type="button"
            className="drop-zone"
            data-zone={zoneIndex}
            disabled={locked || placed[zoneIndex] !== undefined}
            onClick={() => onZoneClick(zoneIndex)}
          >
            <span className="zone-label">{pair.slot}</span>
            <span className={`zone-slot${placed[zoneIndex] !== undefined ? ' is-filled' : ''}`} lang="ja">
              {placed[zoneIndex] !== undefined ? q.pairs[placed[zoneIndex]].tile : ''}
            </span>
          </button>
        ))}
      </div>

      <p className="match-count">{matchedCount} / {q.pairs.length} matched</p>
    </div>
  )
}
