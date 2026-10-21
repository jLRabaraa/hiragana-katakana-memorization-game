import { useCallback, useEffect, useRef } from 'react'

/**
 * Pointer Events drag engine, ported from the legacy game.
 *
 * - Not HTML5 DnD: pointerdown/move/up with pointer capture, a cloned ghost
 *   element, and CSS `touch-action: none` on the tiles.
 * - The tap-tile-then-tap-slot fallback is component state (click handlers);
 *   this hook only reports a finished drag so the component can set its
 *   `suppressClicksUntil` guard and prevent the post-drag click from selecting.
 */

export interface TileDragHandlers {
  /** Whether this tile may currently be dragged. */
  canDrag(tile: Element): boolean
  /** Element under the pointer that accepts a drop, or null. */
  resolveDrop(x: number, y: number): Element | null
  /** Drag surpassed the slop threshold and lifted off. */
  onDragStart?(tile: Element): void
  onDragMove(tile: Element, target: Element | null): void
  /** moved=false means the gesture never became a drag (pure tap). */
  onDragEnd(tile: Element, target: Element | null, moved: boolean): void
  onDragCancel?(tile: Element): void
}

interface DragSession {
  tile: Element
  pointerId: number
  startX: number
  startY: number
  moved: boolean
  ghost: HTMLElement | null
}

const DRAG_SLOP = 6

export function useTileDrag(handlers: TileDragHandlers): (node: HTMLElement | null) => void {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  const detachRef = useRef<(() => void) | null>(null)

  const attach = useCallback((node: HTMLElement | null) => {
    detachRef.current?.()
    detachRef.current = null
    if (!node) return

    let session: DragSession | null = null

    const endSession = (): Element | null => {
      const current = session
      session = null
      if (!current) return null
      if (current.ghost) current.ghost.remove()
      current.tile.classList.remove('is-dragging')
      return current.tile
    }

    const onPointerDown = (ev: PointerEvent): void => {
      if (session || ev.button !== 0) return
      const tile = (ev.target instanceof Element ? ev.target : null)?.closest('[data-drag-tile]')
      if (!tile || !handlersRef.current.canDrag(tile)) return
      session = { tile, pointerId: ev.pointerId, startX: ev.clientX, startY: ev.clientY, moved: false, ghost: null }
      try {
        ;(tile as HTMLElement).setPointerCapture(ev.pointerId)
      } catch {
        /* capture may fail on stale pointers; drag still works without it */
      }
    }

    const onPointerMove = (ev: PointerEvent): void => {
      if (!session || ev.pointerId !== session.pointerId) return
      const dist = Math.hypot(ev.clientX - session.startX, ev.clientY - session.startY)
      if (!session.moved && dist > DRAG_SLOP) {
        session.moved = true
        const tileRect = session.tile.getBoundingClientRect()
        const ghost = session.tile.cloneNode(true) as HTMLElement
        ghost.classList.add('drag-ghost')
        ghost.classList.remove('selected')
        ghost.setAttribute('aria-hidden', 'true')
        ghost.style.width = `${tileRect.width}px`
        ghost.style.height = `${tileRect.height}px`
        ghost.style.left = `${ev.clientX}px`
        ghost.style.top = `${ev.clientY}px`
        document.body.appendChild(ghost)
        session.ghost = ghost
        session.tile.classList.add('is-dragging')
        handlersRef.current.onDragStart?.(session.tile)
      }
      if (session.moved && session.ghost) {
        session.ghost.style.left = `${ev.clientX}px`
        session.ghost.style.top = `${ev.clientY}px`
        const target = handlersRef.current.resolveDrop(ev.clientX, ev.clientY)
        handlersRef.current.onDragMove(session.tile, target)
      }
    }

    const onPointerUp = (ev: PointerEvent): void => {
      if (!session || ev.pointerId !== session.pointerId) return
      const { moved } = session
      const target = moved ? handlersRef.current.resolveDrop(ev.clientX, ev.clientY) : null
      // Capture the tile before endSession() clears the session.
      const tile = endSession()
      if (tile) handlersRef.current.onDragEnd(tile, target, moved)
    }

    const onPointerCancel = (): void => {
      if (!session) return
      const { tile } = session
      endSession()
      handlersRef.current.onDragCancel?.(tile)
    }

    node.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)

    detachRef.current = () => {
      node.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [])

  useEffect(() => () => {
    detachRef.current?.()
    detachRef.current = null
  }, [])

  return attach
}
