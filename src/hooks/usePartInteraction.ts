import { useCallback, useEffect } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { PartId } from '../types/simulation'
import type { TurbofanPartId } from '../types/turbofan'
import type { GearboxPartId } from '../types/gearbox'
import type { EscapementPartId } from '../types/escapement'
import { useEngine } from './useEngineSimulation'
import { useTurbofan } from './useTurbofanSimulation'
import { useGearbox } from './useGearboxSimulation'
import { useEscapement } from './useEscapementSimulation'

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

  /**
   * A mesh can vanish from under the pointer — switching view mode or cycling the casing unmounts
   * parts — and R3F fires no pointer-out for a mesh that is no longer there. Without this the cursor
   * stays a hand over the whole app and the part keeps its hover highlight in the HUD.
   */
  useEffect(
    () => () => {
      if (current().hovered !== part) return
      document.body.style.cursor = 'auto'
      hoverPart(null)
    },
    [part, hoverPart, current],
  )

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

/** Same, for the escapement. */
export function useEscapementPartInteraction(part: EscapementPartId) {
  const { selectPart, hoverPart, settingsRef } = useEscapement()
  const current = useCallback(() => ({ selected: settingsRef.current.selectedPart, hovered: settingsRef.current.hoveredPart }), [settingsRef])
  return usePartHandlers(part, { selectPart, hoverPart, current })
}
