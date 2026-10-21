import { useCallback, useMemo, useState } from 'react'
import { loadProgress, saveProgress } from '../engine/progress'
import type { DojoConfig, Progress } from '../types/progress'

export interface UseProgressResult {
  progress: Progress
  /** Replace + persist (round end, level pass, lesson seen). */
  apply: (next: Progress) => void
  /** Patch the legacy Dojo settings block (already a transition, saved at once). */
  patchDojoConfig: (patch: Partial<DojoConfig>) => void
}

export function useProgress(): UseProgressResult {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  const apply = useCallback((next: Progress) => {
    setProgress(next)
    saveProgress(next)
  }, [])

  const patchDojoConfig = useCallback((patch: Partial<DojoConfig>) => {
    setProgress((previous) => {
      const next: Progress = {
        ...previous,
        practice: {
          config: { ...previous.practice.config, ...patch },
          best: previous.practice.best,
        },
      }
      saveProgress(next)
      return next
    })
  }, [])

  return useMemo(
    () => ({ progress, apply, patchDojoConfig }),
    [progress, apply, patchDojoConfig],
  )
}
