import { useFrame } from '@react-three/fiber'
import { advanceSpools, computeTurbofan } from '../../lib/turbofanModel'
import { useTurbofan } from '../../hooks/useTurbofanSimulation'
import { applyHighlight } from '../3d/materials'
import { TURBOFAN_PART_MATERIALS, useTurbofanMaterials } from '../3d/turbofan/materials'

/**
 * Refreshes the cycle state when the throttle or bypass ratio moved, spins both spools, and eases
 * the hover / selection highlight. Runs before any mesh reads the store.
 */
export function TurbofanDriver() {
  const { sim, settingsRef } = useTurbofan()
  const materials = useTurbofanMaterials()

  useFrame((_, dt) => {
    const s = settingsRef.current
    const step = Math.min(dt, 0.1)
    let changed = false
    if (sim.state.n1 !== s.n1 || sim.state.bpr !== s.bpr) {
      sim.state = computeTurbofan(s.n1, s.bpr)
      changed = true
    }
    if (s.playing) {
      const next = advanceSpools(sim.lpAngle, sim.hpAngle, sim.state, step, s.speed)
      sim.lpAngle = next.lpAngle
      sim.hpAngle = next.hpAngle
      changed = true
    }
    if (changed) sim.version++
    applyHighlight(materials, TURBOFAN_PART_MATERIALS, s.selectedPart, s.hoveredPart, step)
  }, -10)

  return null
}
