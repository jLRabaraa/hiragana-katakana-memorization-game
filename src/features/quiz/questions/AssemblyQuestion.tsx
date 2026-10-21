import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { Question } from '../../../engine/types'
import { sfxClick, sfxPlace } from '../../../utils/audio'
import type { QuizApi } from '../api'
import { useTileDrag } from '../useTileDrag'
import type { RegisterKeys } from './ChoiceQuestion'

type AssemblyData = Extract<Question, { kind: 'assembly' }>

interface AssemblyQuestionProps {
  q: AssemblyData
  locked: boolean
  api: QuizApi
  registerKeys: RegisterKeys
}

/**
 * Sentence assembly: tiles may go into any open slot (drag or tap-tile-then-
 * tap-slot). Filling every slot judges the order against the canonical answer;
 * a wrong order is revealed rather than re-hinted, since placement is free.
 */
export default function AssemblyQuestion({ q, locked, api, registerKeys }: AssemblyQuestionProps): ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [placed, setPlaced] = useState<(number | null)[]>(() => q.tiles.map(() => null))
  const placedRef = useRef<(number | null)[]>(placed)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const doneRef = useRef(false)
  const suppressUntil = useRef(0)
  const answerTimer = useRef<number | null>(null)

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

  const judge = useCallback((): void => {
    doneRef.current = true
    setDone(true)
    answerTimer.current = window.setTimeout(() => {
      answerTimer.current = null
      const built = placedRef.current
        .filter((entry): entry is number => entry !== null)
        .map((tileIndex) => q.tiles[tileIndex])
      const correct = built.every((tile, i) => tile === q.answer[i])
      const sentence = `${q.answer.join('')}。`
      api.answer({
        correct,
        base: 100,
        correctText: sentence,
        wrongText: `The correct order is ${sentence}`,
        grammarMiss: !correct ? { id: q.sourceId, sentence, translation: q.translation } : undefined,
      })
    }, 380)
  }, [api, q.answer, q.sourceId, q.tiles, q.translation])

  const attemptPlace = useCallback((tileIndex: number, slotIndex: number): void => {
    if (doneRef.current) return
    const current = placedRef.current
    if (current[slotIndex] !== null) return
    if (current.includes(tileIndex)) return

    const next = current.slice()
    next[slotIndex] = tileIndex
    placedRef.current = next
    setPlaced(next)
    sfxPlace()
    setSelectedTile(null)

    if (next.every((entry) => entry !== null)) judge()
  }, [judge])

  const returnTile = useCallback((slotIndex: number): void => {
    if (doneRef.current) return
    const current = placedRef.current
    if (current[slotIndex] === null) return
    const next = current.slice()
    next[slotIndex] = null
    placedRef.current = next
    setPlaced(next)
    sfxClick()
  }, [])

  const attachDrag = useTileDrag({
    canDrag: (tile) => !doneRef.current && !placed.includes(Number(tile.getAttribute('data-tile'))) && tile.getAttribute('data-tile') !== null,
    resolveDrop: (x, y) => {
      const under = document.elementFromPoint(x, y)
      return under?.closest('[data-slot]') ?? null
    },
    onDragMove: (_tile, target) => {
      rootRef.current?.querySelectorAll('[data-slot]').forEach((slot) => {
        const empty = slot.getAttribute('data-empty') === 'true'
        slot.classList.toggle('drag-over', slot === target && empty)
      })
    },
    onDragEnd: (tile, target, moved) => {
      suppressUntil.current = Date.now() + 400
      clearDragOver()
      if (!moved || !target) return
      const tileIndex = Number(tile.getAttribute('data-tile'))
      const slotIndex = Number(target.getAttribute('data-slot'))
      if (Number.isNaN(tileIndex) || Number.isNaN(slotIndex)) return
      attemptPlace(tileIndex, slotIndex)
    },
    onDragCancel: clearDragOver,
  })

  const onTileClick = (tileIndex: number): void => {
    // oxlint-disable-next-line react/purity -- intentional: drag suppress window
    if (Date.now() < suppressUntil.current || doneRef.current) return
    if (placed.includes(tileIndex)) return
    sfxClick()
    setSelectedTile((prev) => (prev === tileIndex ? null : tileIndex))
  }

  const onSlotClick = (slotIndex: number): void => {
    // oxlint-disable-next-line react/purity -- intentional: drag suppress window
    if (Date.now() < suppressUntil.current || doneRef.current) return
    const occupant = placed[slotIndex]
    if (occupant !== null) {
      returnTile(slotIndex)
      return
    }
    if (selectedTile === null) {
      const slotEl = rootRef.current?.querySelector(`[data-slot="${slotIndex}"]`)
      slotEl?.classList.add('drag-over')
      window.setTimeout(() => slotEl?.classList.remove('drag-over'), 260)
      return
    }
    attemptPlace(selectedTile, slotIndex)
  }

  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      attachDrag(node)
      rootRef.current = node
    },
    [attachDrag],
  )

  const full = placed.every((entry) => entry !== null)

  return (
    <div className="prompt drag-card" ref={setRoot}>
      <div className={`drag-tray assembly-tray${full || done ? ' is-complete' : ''}`}>
        {q.tiles.map((tile, tileIndex) =>
          placed.includes(tileIndex) ? null : (
            <button
              key={`${tile}-${tileIndex}`}
              type="button"
              className={`tile${tile.length > 1 ? ' is-combo' : ''}${selectedTile === tileIndex ? ' selected' : ''}`}
              data-drag-tile=""
              data-tile={tileIndex}
              lang="ja"
              aria-pressed={selectedTile === tileIndex}
              onClick={() => onTileClick(tileIndex)}
            >
              {tile}
            </button>
          ),
        )}
      </div>

      <p className="drag-instruction">Drag a tile into a slot — or tap a tile, then tap a slot.</p>

      <div className="assembly-slots" role="group" aria-label="Sentence slots">
        {q.tiles.map((_, slotIndex) => {
          const occupant = placed[slotIndex]
          const tile = occupant !== null ? q.tiles[occupant] : ''
          return (
            <button
              key={slotIndex}
              type="button"
              className={`assembly-slot${occupant !== null ? ' is-filled' : ''}`}
              data-slot={slotIndex}
              data-empty={occupant === null ? 'true' : 'false'}
              lang="ja"
              disabled={locked}
              onClick={() => onSlotClick(slotIndex)}
            >
              {tile}
            </button>
          )
        })}
      </div>

      <p className="g-translation">{q.translation}</p>
    </div>
  )
}
