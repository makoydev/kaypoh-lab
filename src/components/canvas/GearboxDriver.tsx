import { useFrame } from '@react-three/fiber'
import { stepGearbox } from '../../lib/gearboxModel'
import { useGearbox } from '../../hooks/useGearboxSimulation'
import { applyGearboxGlow, torquePathKeys, useGearboxMaterials } from '../3d/gearbox/materials'

/**
 * Steps the gearbox model once per frame (shift timeline, clutch, synchro speed-matching, every
 * angle), pushes the rev drop back into the settings when the clutch bites, and eases the hover /
 * selection / torque-path glow. Runs before any mesh reads the store.
 */
export function GearboxDriver() {
  const { sim, settingsRef, update } = useGearbox()
  const materials = useGearboxMaterials()

  useFrame((_, dt) => {
    const s = settingsRef.current
    const step = Math.min(dt, 0.1)
    const events = stepGearbox(sim, { engineRpm: s.engineRpm, gear: s.gear, synchro: s.synchro, speed: s.speed, playing: s.playing }, step)
    // Only bump the version: snapshot hooks poll it at their own fps. Listeners are for discrete
    // jumps (a paused step), and notifying them here re-rendered the HUD at the display rate.
    if (s.playing) sim.version++
    if (events.engineRpm !== undefined) update({ engineRpm: events.engineRpm })
    applyGearboxGlow(materials, { selected: s.selectedPart, hovered: s.hoveredPart, path: s.showTorquePath ? torquePathKeys(sim.engaged, sim.clutch) : [] }, step)
  }, -10)

  return null
}
