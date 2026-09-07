import type { TurbofanState } from '../types/turbofan'
import { CYCLE, TF, stationById } from './turbofanConfig'
import { stationOf } from './turbofanModel'

/**
 * Pure helpers behind the flow-particle visualisation: how fast a streak should travel at a given
 * axial position, and what colour a given gas temperature should be. Scene units per second, so the
 * meshes only integrate and place.
 */

/** Where particles are born and where they die, in scene x. */
export const FLOW_X_START = TF.nacelle.xStart - 1.6
export const FLOW_X_END_CORE = TF.exhaustCone.xEnd + 2.6
export const FLOW_X_END_BYPASS = TF.nacelle.xEnd + 3.2

/** Reference jet velocities that map to the "fast" end of the visual speed range. */
const V_REF_CORE = 600
const V_REF_BYPASS = 300

/**
 * Visual axial speed of a streak at `x`. Slow-ish and roughly uniform through the machine, then the
 * jets speed up behind their exits in proportion to the real jet velocities. Scales with N1 so idle
 * drifts and takeoff rushes.
 */
export function flowSpeedAt(state: TurbofanState, x: number, stream: 'core' | 'bypass') {
  const n = state.n1 / 100
  const base = 0.6 + 3.2 * n
  if (stream === 'bypass') {
    const exit = stationById('13').x
    if (x <= exit) return base
    const jet = 1 + 1.6 * (state.jetVelocity.bypass / V_REF_BYPASS)
    return base * jet
  }
  // Core: gentle acceleration from the combustor on, then the nozzle jet.
  const t4 = stationById('4').x
  const exit = stationById('8').x
  if (x <= t4) return base
  if (x <= exit) return base * (1 + 0.5 * ((x - t4) / (exit - t4)))
  const jet = 1.5 + 2.2 * (state.jetVelocity.core / V_REF_CORE)
  return base * jet
}

/** Swirl rate (rad/s) imparted by the rotors; the outlet guide vanes and stators take most of it out. */
export function swirlRateAt(state: TurbofanState, x: number, stream: 'core' | 'bypass') {
  const n = state.n1 / 100
  if (stream === 'bypass') return x > TF.fan.x && x < TF.fan.x + 0.85 ? 1.2 * n : 0.15 * n
  if (x < TF.fan.x) return 0
  if (x > TF.exhaustCone.xEnd) return 0.1 * n
  return 0.7 * n
}

const STOPS: { k: number; rgb: [number, number, number] }[] = [
  { k: 260, rgb: [0.22, 0.78, 0.98] }, // cool sky
  { k: 340, rgb: [0.45, 0.72, 0.98] },
  { k: 520, rgb: [0.66, 0.55, 0.98] }, // warming violet
  { k: 800, rgb: [0.98, 0.57, 0.24] }, // ember
  { k: 1200, rgb: [1.0, 0.78, 0.35] },
  { k: 1800, rgb: [1.0, 0.95, 0.78] }, // near white
]

/** Colour for a gas temperature, 0-1 RGB. Cold is blue, hot is ember, very hot goes white. */
export function temperatureColor(kelvin: number): [number, number, number] {
  if (kelvin <= STOPS[0].k) return [...STOPS[0].rgb]
  for (let i = 1; i < STOPS.length; i++) {
    if (kelvin <= STOPS[i].k) {
      const a = STOPS[i - 1]
      const b = STOPS[i]
      const t = (kelvin - a.k) / (b.k - a.k)
      return [a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t, a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t, a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t]
    }
  }
  return [...STOPS[STOPS.length - 1].rgb]
}

/** 0-1 exhaust heat cue for the glow behind the nozzle. */
export function exhaustGlow(state: TurbofanState) {
  const t8 = stationOf(state, '8').temperatureK
  return Math.min(1, Math.max(0, (t8 - CYCLE.ambient.temperatureK - 250) / 700))
}
