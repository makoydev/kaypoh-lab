import { useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { PartId } from '../types/simulation'
import type { TurbofanPartId } from '../types/turbofan'
import type { GearboxPartId } from '../types/gearbox'
import { useEngine } from './useEngineSimulation'
import { useTurbofan } from './useTurbofanSimulation'
import { useGearbox } from './useGearboxSimulation'

interface PartSelectionApi<P extends string> {
  selectPart: (part: P | null) => void
  hoverPart: (part: P | null) => void
  current: () => { selected: P | null; hovered: P | null }
}

/** Click toggles selection, hover sets the pointer cursor and the hovered part. Shared by every module. */
function usePartHandlers<P extends string>(part: P, api: PartSelectionApi<P>) {
  const { selectPart, hoverPart, current } = api

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      selectPart(current().selected === part ? null : part)
    },
    [part, selectPart, current],
  )

  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      document.body.style.cursor = 'pointer'
      if (current().hovered !== part) hoverPart(part)
    },
    [part, hoverPart, current],
  )

  const onPointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
    if (current().hovered === part) hoverPart(null)
  }, [part, hoverPart, current])

  return { onClick, onPointerOver, onPointerOut }
}

/** Click/hover handlers that wire a V8 mesh (or group) to the Part Inspector. */
export function usePartInteraction(part: PartId) {
  const { selectPart, hoverPart, settingsRef } = useEngine()
  const current = useCallback(() => ({ selected: settingsRef.current.selectedPart, hovered: settingsRef.current.hoveredPart }), [settingsRef])
  return usePartHandlers(part, { selectPart, hoverPart, current })
}

/** Same, for the turbofan. */
export function useTurbofanPartInteraction(part: TurbofanPartId) {
  const { selectPart, hoverPart, settingsRef } = useTurbofan()
  const current = useCallback(() => ({ selected: settingsRef.current.selectedPart, hovered: settingsRef.current.hoveredPart }), [settingsRef])
  return usePartHandlers(part, { selectPart, hoverPart, current })
}

/** Same, for the gearbox. */
export function useGearboxPartInteraction(part: GearboxPartId) {
  const { selectPart, hoverPart, settingsRef } = useGearbox()
  const current = useCallback(() => ({ selected: settingsRef.current.selectedPart, hovered: settingsRef.current.hoveredPart }), [settingsRef])
  return usePartHandlers(part, { selectPart, hoverPart, current })
}
