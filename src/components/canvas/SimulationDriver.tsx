import { useFrame } from '@react-three/fiber'
import { VISUAL_TIME_SCALE } from '../../lib/engineConfig'
import { computeAllCylinders, mod } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { PART_MATERIALS, applyHighlight, useEngineMaterials } from '../3d/materials'

/**
 * Advances the crank and recomputes every cylinder once per frame, before any mesh reads it.
 * Runs at a negative priority so it is always first in the frame.
 */
export function SimulationDriver() {
  const { sim, settingsRef } = useEngine()
  const materials = useEngineMaterials()

  useFrame((_, dt) => {
    const s = settingsRef.current
    const step = Math.min(dt, 0.1)
    if (s.playing) {
      // rpm → deg/s is ×6; divided by the visual time scale so the eye can keep up.
      const degPerSec = (s.rpm / VISUAL_TIME_SCALE) * 6 * s.speed
      sim.angle = mod(sim.angle + degPerSec * step, 720)
    }
    sim.cylinders = computeAllCylinders(sim.angle)
    applyHighlight(materials, PART_MATERIALS, s.selectedPart, s.hoveredPart, step)
  }, -10)

  return null
}
