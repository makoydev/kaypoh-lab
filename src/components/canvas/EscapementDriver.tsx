import { useFrame } from '@react-three/fiber'
import { stepEscapement } from '../../lib/escapementModel'
import { useEscapement } from '../../hooks/useEscapementSimulation'
import { applyEscapementGlow, energyPathKeys, useEscapementMaterials } from '../3d/escapement/materials'
import { playTick } from './tickSound'

/**
 * Steps the escapement once per frame (oscillator phase, amplitude, every derived angle, the tick
 * counter), plays the tick when asked, and eases the hover / selection / impulse glow. Runs before
 * any mesh reads the store.
 */
export function EscapementDriver() {
  const { sim, settingsRef } = useEscapement()
  const materials = useEscapementMaterials()

  useFrame((_, dt) => {
    const s = settingsRef.current
    const step = Math.min(dt, 0.1)
    const events = stepEscapement(sim, { beatRate: s.beatRate, wind: s.wind, regulator: s.regulator, speed: s.speed, playing: s.playing }, step)
    // Only bump the version: snapshot hooks poll it at their own fps. Listeners are for discrete
    // jumps (a paused step), and notifying them here re-rendered the HUD at the display rate.
    if (s.playing) sim.version++
    if (events.tick && s.sound) playTick(events.tick)
    applyEscapementGlow(materials, { selected: s.selectedPart, hovered: s.hoveredPart, path: energyPathKeys(sim.escPhase, sim.pallet) }, step)
  }, -10)

  return null
}
