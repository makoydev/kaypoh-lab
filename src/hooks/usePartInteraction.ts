import { useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { PartId } from '../types/simulation'
import { useEngine } from './useEngineSimulation'

/** Click/hover handlers that wire a mesh (or group) to the Part Inspector. */
export function usePartInteraction(part: PartId) {
  const { selectPart, hoverPart, settingsRef } = useEngine()

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      selectPart(settingsRef.current.selectedPart === part ? null : part)
    },
    [part, selectPart, settingsRef],
  )

  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      document.body.style.cursor = 'pointer'
      if (settingsRef.current.hoveredPart !== part) hoverPart(part)
    },
    [part, hoverPart, settingsRef],
  )

  const onPointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
    if (settingsRef.current.hoveredPart === part) hoverPart(null)
  }, [part, hoverPart, settingsRef])

  return { onClick, onPointerOver, onPointerOut }
}
