import type { Bank, CylinderSpec, CylinderState, Stroke, Vec3 } from '../types/simulation'
import { CYLINDERS, DEG_PER_FIRE, FIRING_ORDER, GEOMETRY, PIN_OFFSETS_DEG, bankAngleDeg, cylinderZ } from './engineConfig'

export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI

export const mod = (a: number, n: number) => ((a % n) + n) % n

/** Unit vector pointing up a bank's bore axis (in the XY plane). */
export function bankDirection(bank: Bank) {
  const b = bankAngleDeg(bank) * DEG2RAD
  return { x: -Math.sin(b), y: Math.cos(b) }
}

/** Stroke boundaries measured from firing TDC. */
export const STROKE_PHASE_START: Record<Stroke, number> = {
  power: 0,
  exhaust: 180,
  intake: 360,
  compression: 540,
}

export function strokeAtPhase(phase: number): Stroke {
  if (phase < 180) return 'power'
  if (phase < 360) return 'exhaust'
  if (phase < 540) return 'intake'
  return 'compression'
}

/** Quick rise, exponential decay — reads as a flash rather than a glow. */
export function combustionIntensity(phase: number) {
  if (phase < 0 || phase > 90) return 0
  if (phase < 6) return phase / 6
  return Math.exp(-(phase - 6) / 18)
}

/** 0-1 valve lift for a given stroke, a half-sine over the stroke it belongs to. */
export function valveLift(stroke: Stroke, progress: number, valve: 'intake' | 'exhaust') {
  if (stroke !== valve) return 0
  return Math.sin(progress * Math.PI)
}

/**
 * Slider-crank kinematics. With the crank pin at angle α (from the bore axis at β) the wrist pin
 * distance along the bore is  s = r·cos(α−β) + √(l² − r²·sin²(α−β)).
 */
export function computeCylinderState(spec: CylinderSpec, crankDeg: number): CylinderState {
  const { crankRadius: r, rodLength: l } = GEOMETRY
  const beta = bankAngleDeg(spec.bank) * DEG2RAD
  const alpha = (crankDeg + PIN_OFFSETS_DEG[spec.journal]) * DEG2RAD
  const rel = alpha - beta

  const sinRel = Math.sin(rel)
  const cosRel = Math.cos(rel)
  const root = Math.sqrt(l * l - r * r * sinRel * sinRel)
  const s = r * cosRel + root
  const travel = (s - (l - r)) / (2 * r)
  // ds/dα, per radian, then scaled to per-degree
  const dsdAlpha = -r * sinRel - (r * r * sinRel * cosRel) / root
  const pistonVelocity = dsdAlpha * DEG2RAD

  const z = cylinderZ(spec)
  const pin: Vec3 = { x: -r * Math.sin(alpha), y: r * Math.cos(alpha), z }
  const dir = { x: -Math.sin(beta), y: Math.cos(beta) }
  const piston: Vec3 = { x: dir.x * s, y: dir.y * s, z }

  const dx = piston.x - pin.x
  const dy = piston.y - pin.y
  const rodAngle = Math.atan2(-dx, dy)

  const phase = mod(crankDeg - spec.fireAngle, 720)
  const stroke = strokeAtPhase(phase)
  const strokeProgress = (phase - STROKE_PHASE_START[stroke]) / 180

  return {
    number: spec.number,
    bank: spec.bank,
    journal: spec.journal,
    phase,
    stroke,
    strokeProgress,
    flash: combustionIntensity(phase),
    travel,
    pistonDistance: s,
    pistonVelocity,
    pin,
    piston,
    rodAngle,
    bankAngle: beta,
  }
}

export function computeAllCylinders(crankDeg: number): CylinderState[] {
  return CYLINDERS.map((c) => computeCylinderState(c, crankDeg))
}

/** The cylinder whose power stroke started most recently. */
export function activeCylinderAt(crankDeg: number) {
  const idx = Math.floor(mod(crankDeg, 720) / DEG_PER_FIRE)
  return FIRING_ORDER[idx]
}

/** World-space point in the combustion chamber (just under the deck) for a cylinder. */
export function chamberPosition(spec: CylinderSpec, inset = 0.08): Vec3 {
  const dir = bankDirection(spec.bank)
  const d = GEOMETRY.deckDistance - inset
  return { x: dir.x * d, y: dir.y * d, z: cylinderZ(spec) }
}

/** World-space point somewhere along a bore, `distance` from the crank axis. */
export function borePoint(spec: CylinderSpec, distance: number): Vec3 {
  const dir = bankDirection(spec.bank)
  return { x: dir.x * distance, y: dir.y * distance, z: cylinderZ(spec) }
}

/** Crank angle (0-720) at the middle of a stroke for a given cylinder. */
export function crankAngleForStroke(spec: CylinderSpec, stroke: Stroke, progress = 0.5) {
  return mod(spec.fireAngle + STROKE_PHASE_START[stroke] + progress * 180, 720)
}

export const TDC_DISTANCE = GEOMETRY.rodLength + GEOMETRY.crankRadius
export const BDC_DISTANCE = GEOMETRY.rodLength - GEOMETRY.crankRadius
