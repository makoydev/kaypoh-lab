import type { FlowPhase, Spool, StageId, StationId, Stream } from '../types/turbofan'

/**
 * Procedural geometry for a mid-size high-bypass turbofan, in scene units (roughly metres).
 * The engine axis is +X; air enters at −X and leaves at +X. Every mesh, particle path, and
 * camera framing reads these numbers so the picture and the maths cannot drift apart.
 */
export const TF = {
  fan: {
    x: -2.5,
    tipRadius: 1.9,
    hubRadius: 0.62,
    blades: 22,
    chord: 0.62,
    /** Blade stagger from the axial direction, root → tip, degrees. Tips lean over further. */
    staggerRoot: 24,
    staggerTip: 58,
  },
  spinner: { length: 1.0, radius: 0.62 },
  nacelle: {
    xStart: -3.6,
    xEnd: 0.9,
    innerRadius: 2.02,
    thickness: 0.2,
  },
  /** Splitter that divides fan air into the bypass duct and the core intake. */
  splitter: { x: -2.05, radius: 1.06 },
  booster: {
    stages: 3,
    xStart: -1.9,
    pitch: 0.28,
    tipRadiusStart: 1.02,
    tipRadiusEnd: 0.9,
    hubRadius: 0.6,
    blades: 40,
    chord: 0.12,
    stagger: 34,
  },
  hpCompressor: {
    stages: 8,
    xStart: -0.9,
    pitch: 0.21,
    tipRadiusStart: 0.8,
    tipRadiusEnd: 0.6,
    hubRadiusStart: 0.46,
    hubRadiusEnd: 0.48,
    blades: 48,
    chord: 0.09,
    stagger: 38,
  },
  combustor: { xStart: 0.95, xEnd: 1.75, outerRadius: 0.98, innerRadius: 0.5, casingRadius: 1.06 },
  hpTurbine: {
    stages: 2,
    xStart: 1.9,
    pitch: 0.27,
    tipRadiusStart: 0.78,
    tipRadiusEnd: 0.86,
    hubRadius: 0.5,
    blades: 56,
    chord: 0.12,
    stagger: -40,
  },
  lpTurbine: {
    stages: 4,
    xStart: 2.6,
    pitch: 0.26,
    tipRadiusStart: 0.95,
    tipRadiusEnd: 1.15,
    hubRadius: 0.5,
    blades: 64,
    chord: 0.12,
    stagger: -36,
  },
  nozzle: { xStart: 3.75, xEnd: 4.25, radiusStart: 1.18, radiusEnd: 0.95 },
  exhaustCone: { xStart: 3.7, xEnd: 5.0, radius: 0.5 },
  shaft: { lpRadius: 0.16, hpRadius: 0.3 },
  /** Clearance between blade tips and the casing wall that wraps them. */
  tipClearance: 0.03,
  /** Core casing wall thickness. */
  casingThickness: 0.06,
} as const

/** Spool speed limits in % of rated. N1 is the throttle the learner drives. */
export const N1 = { idle: 20, max: 100, cruise: 85, default: 60 } as const
export const BPR = { min: 2, max: 12, default: 8 } as const

/** Rated (100 %) shaft speeds. */
export const SPOOL_RPM = { lp: 3300, hp: 11500 } as const

/**
 * At 100 % N1 the fan turns 55 times a second and reads as a grey disc. Dividing by 60 puts it at
 * roughly one turn a second — a ceiling fan on medium — so individual blades stay readable.
 */
export const TURBOFAN_VISUAL_TIME_SCALE = 60

/**
 * Cycle constants. Ideal gas, polytropic component efficiencies, sea-level static ISA day.
 * Honest and teachable, not a performance deck.
 */
export const CYCLE = {
  ambient: { pressureKPa: 101.325, temperatureK: 288.15 },
  gammaAir: 1.4,
  gammaGas: 1.33,
  /** J/(kg·K) */
  cpAir: 1005,
  cpGas: 1150,
  polytropicEfficiency: 0.9,
  /** Fan pressure ratio at 100 % N1 falls as bypass ratio rises: FPR = base − slope·BPR. */
  fan: { pressureRatioBase: 1.85, pressureRatioPerBpr: 0.04 },
  booster: { maxPressureRatio: 1.7 },
  hpCompressor: { maxPressureRatio: 11 },
  /** Combustor: fractional total-pressure loss and temperature rise at idle / takeoff. */
  combustor: { pressureLoss: 0.04, maxTemperatureRise: 900, idleFraction: 0.3 },
  /** Fractional total-pressure loss in the bypass duct and the core jet pipe at 100 % N1 (scales with speed²). */
  duct: { bypassLoss: 0.02, coreLoss: 0.02 },
  /** Total mass flow through the fan at 100 % N1, kg/s. */
  maxMassFlow: 500,
  /** Lower heating value of jet fuel, J/kg. */
  fuelLHV: 43e6,
} as const

/** HP spool follows the fan through a simple monotonic map. */
export const n2FromN1 = (n1: number) => 60 + 0.4 * n1

export const STAGE_ORDER: StageId[] = ['fan', 'booster', 'hpCompressor', 'combustor', 'hpTurbine', 'lpTurbine', 'nozzle']

export const STAGE_META: Record<StageId, { label: string; short: string; spool: Spool | null; phase: FlowPhase; color: string }> = {
  fan: { label: 'Fan', short: 'Fan', spool: 'lp', phase: 'suck', color: '#38bdf8' },
  booster: { label: 'Booster', short: 'Boost', spool: 'lp', phase: 'squeeze', color: '#818cf8' },
  hpCompressor: { label: 'HP compressor', short: 'HPC', spool: 'hp', phase: 'squeeze', color: '#a78bfa' },
  combustor: { label: 'Combustor', short: 'Burn', spool: null, phase: 'bang', color: '#fb923c' },
  hpTurbine: { label: 'HP turbine', short: 'HPT', spool: 'hp', phase: 'blow', color: '#fbbf24' },
  lpTurbine: { label: 'LP turbine', short: 'LPT', spool: 'lp', phase: 'blow', color: '#e2b04a' },
  nozzle: { label: 'Nozzle', short: 'Nozzle', spool: null, phase: 'blow', color: '#94a3b8' },
}

export const PHASE_ORDER: FlowPhase[] = ['suck', 'squeeze', 'bang', 'blow']

export const PHASE_META: Record<FlowPhase, { label: string; nick: string; color: string; stages: StageId[] }> = {
  suck: { label: 'Intake', nick: 'Suck', color: '#38bdf8', stages: ['fan'] },
  squeeze: { label: 'Compression', nick: 'Squeeze', color: '#a78bfa', stages: ['booster', 'hpCompressor'] },
  bang: { label: 'Combustion', nick: 'Bang', color: '#fb923c', stages: ['combustor'] },
  blow: { label: 'Expansion', nick: 'Blow', color: '#94a3b8', stages: ['hpTurbine', 'lpTurbine', 'nozzle'] },
}

export interface StationSpec {
  id: StationId
  label: string
  x: number
  stream: Stream
  strip: boolean
}

/** Stations in flow order along the core, with the bypass exit (13) branching off after the fan. */
export const STATIONS: StationSpec[] = [
  { id: '0', label: 'Ambient', x: -4.0, stream: 'both', strip: true },
  { id: '2', label: 'Fan face', x: TF.fan.x - 0.2, stream: 'both', strip: true },
  { id: '13', label: 'Bypass exit', x: TF.nacelle.xEnd, stream: 'bypass', strip: true },
  { id: '21', label: 'Fan exit', x: TF.splitter.x, stream: 'core', strip: false },
  { id: '25', label: 'Booster exit', x: TF.booster.xStart + TF.booster.stages * TF.booster.pitch + 0.05, stream: 'core', strip: true },
  { id: '3', label: 'HPC exit', x: TF.hpCompressor.xStart + TF.hpCompressor.stages * TF.hpCompressor.pitch + 0.05, stream: 'core', strip: true },
  { id: '4', label: 'Combustor exit', x: TF.combustor.xEnd + 0.05, stream: 'core', strip: true },
  { id: '45', label: 'HPT exit', x: TF.hpTurbine.xStart + TF.hpTurbine.stages * TF.hpTurbine.pitch + 0.03, stream: 'core', strip: true },
  { id: '5', label: 'LPT exit', x: TF.lpTurbine.xStart + TF.lpTurbine.stages * TF.lpTurbine.pitch + 0.03, stream: 'core', strip: true },
  { id: '8', label: 'Nozzle exit', x: TF.nozzle.xEnd, stream: 'core', strip: true },
]

export const stationById = (id: StationId) => STATIONS.find((s) => s.id === id)!

/** Which stations bound each stage, for the stage-focus readout. */
export const STAGE_STATIONS: Record<StageId, { inlet: StationId; outlet: StationId }> = {
  fan: { inlet: '2', outlet: '21' },
  booster: { inlet: '21', outlet: '25' },
  hpCompressor: { inlet: '25', outlet: '3' },
  combustor: { inlet: '3', outlet: '4' },
  hpTurbine: { inlet: '4', outlet: '45' },
  lpTurbine: { inlet: '45', outlet: '5' },
  nozzle: { inlet: '5', outlet: '8' },
}

/** Axial extent of each stage, used to isolate it and to frame the camera. */
export const STAGE_EXTENT: Record<StageId, { xStart: number; xEnd: number; radius: number }> = {
  fan: { xStart: TF.fan.x - TF.spinner.length, xEnd: TF.fan.x + 0.4, radius: TF.fan.tipRadius },
  booster: { xStart: TF.booster.xStart - 0.1, xEnd: TF.booster.xStart + TF.booster.stages * TF.booster.pitch, radius: TF.booster.tipRadiusStart },
  hpCompressor: {
    xStart: TF.hpCompressor.xStart - 0.1,
    xEnd: TF.hpCompressor.xStart + TF.hpCompressor.stages * TF.hpCompressor.pitch,
    radius: TF.hpCompressor.tipRadiusStart,
  },
  combustor: { xStart: TF.combustor.xStart, xEnd: TF.combustor.xEnd, radius: TF.combustor.outerRadius },
  hpTurbine: { xStart: TF.hpTurbine.xStart - 0.1, xEnd: TF.hpTurbine.xStart + TF.hpTurbine.stages * TF.hpTurbine.pitch, radius: TF.hpTurbine.tipRadiusEnd },
  lpTurbine: { xStart: TF.lpTurbine.xStart - 0.1, xEnd: TF.lpTurbine.xStart + TF.lpTurbine.stages * TF.lpTurbine.pitch, radius: TF.lpTurbine.tipRadiusEnd },
  nozzle: { xStart: TF.nozzle.xStart, xEnd: TF.exhaustCone.xEnd, radius: TF.nozzle.radiusStart },
}

export const stageAtX = (x: number): StageId | null => STAGE_ORDER.find((s) => x >= STAGE_EXTENT[s].xStart && x <= STAGE_EXTENT[s].xEnd) ?? null

/** Linear interpolation through sorted (x, r) control points, clamped at the ends. */
export function piecewise(points: readonly (readonly [number, number])[], x: number) {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [x1, r1] = points[i]
    if (x <= x1) {
      const [x0, r0] = points[i - 1]
      return x1 === x0 ? r1 : r0 + ((r1 - r0) * (x - x0)) / (x1 - x0)
    }
  }
  return points[points.length - 1][1]
}

const hpcEnd = TF.hpCompressor.xStart + TF.hpCompressor.stages * TF.hpCompressor.pitch
const boosterEnd = TF.booster.xStart + TF.booster.stages * TF.booster.pitch
const hptEnd = TF.hpTurbine.xStart + TF.hpTurbine.stages * TF.hpTurbine.pitch
const lptEnd = TF.lpTurbine.xStart + TF.lpTurbine.stages * TF.lpTurbine.pitch

/**
 * Core flow annulus, inner wall (the rotating hub / drum line), as (x, r) control points.
 * Starts at the spinner apex and ends at the tip of the exhaust cone.
 */
export const HUB_LINE: readonly (readonly [number, number])[] = [
  [TF.fan.x - TF.spinner.length, 0],
  [TF.fan.x - 0.25, TF.fan.hubRadius],
  [TF.booster.xStart, TF.booster.hubRadius],
  [boosterEnd, TF.booster.hubRadius],
  [TF.hpCompressor.xStart, TF.hpCompressor.hubRadiusStart],
  [hpcEnd, TF.hpCompressor.hubRadiusEnd],
  [TF.combustor.xStart, TF.combustor.innerRadius],
  [TF.combustor.xEnd, TF.combustor.innerRadius],
  [TF.hpTurbine.xStart, TF.hpTurbine.hubRadius],
  [lptEnd, TF.lpTurbine.hubRadius],
  [TF.exhaustCone.xStart, TF.exhaustCone.radius],
  [TF.exhaustCone.xEnd, 0],
]

/** Core flow annulus, outer wall (inside face of the core casing), from the splitter lip to the nozzle exit. */
export const CORE_CASING_LINE: readonly (readonly [number, number])[] = [
  [TF.splitter.x, TF.splitter.radius],
  [TF.booster.xStart, TF.booster.tipRadiusStart + TF.tipClearance],
  [boosterEnd, TF.booster.tipRadiusEnd + TF.tipClearance],
  [TF.hpCompressor.xStart, TF.hpCompressor.tipRadiusStart + TF.tipClearance],
  [hpcEnd, TF.hpCompressor.tipRadiusEnd + TF.tipClearance],
  [TF.combustor.xStart, TF.combustor.casingRadius],
  [TF.combustor.xEnd, TF.combustor.casingRadius],
  [TF.hpTurbine.xStart, TF.hpTurbine.tipRadiusStart + TF.tipClearance],
  [hptEnd, TF.hpTurbine.tipRadiusEnd + TF.tipClearance],
  [TF.lpTurbine.xStart, TF.lpTurbine.tipRadiusStart + TF.tipClearance],
  [lptEnd, TF.lpTurbine.tipRadiusEnd + TF.tipClearance],
  [TF.nozzle.xStart, TF.nozzle.radiusStart],
  [TF.nozzle.xEnd, TF.nozzle.radiusEnd],
]

export const hubRadiusAt = (x: number) => piecewise(HUB_LINE, x)
export const coreCasingRadiusAt = (x: number) => piecewise(CORE_CASING_LINE, x)
/** Outside face of the core casing, which is also the inner wall of the bypass duct. */
export const coreOuterRadiusAt = (x: number) => coreCasingRadiusAt(x) + TF.casingThickness

/** Radial bounds of the two air streams at an axial position. */
export function coreAnnulusAt(x: number) {
  return { inner: hubRadiusAt(x), outer: coreCasingRadiusAt(x) }
}

export function bypassAnnulusAt(x: number) {
  const inner = x < TF.splitter.x ? hubRadiusAt(x) : coreOuterRadiusAt(x)
  return { inner, outer: TF.nacelle.innerRadius }
}

export interface BladeRow {
  stage: StageId
  /** Stage index within its component, 0-based. */
  index: number
  kind: 'rotor' | 'stator'
  spool: Spool | null
  /** Which air stream the row sits in. The fan spans both. */
  stream: Stream
  x: number
  hubRadius: number
  tipRadius: number
  count: number
  chord: number
  /** Stagger angle from axial, degrees. Rotors and stators lean opposite ways. */
  stagger: number
}

function multiStage(
  stage: StageId,
  spool: Spool,
  c: { stages: number; xStart: number; pitch: number; blades: number; chord: number; stagger: number },
): BladeRow[] {
  const rows: BladeRow[] = []
  for (let i = 0; i < c.stages; i++) {
    const x0 = c.xStart + i * c.pitch
    const rotorX = x0 + c.pitch * 0.25
    const statorX = x0 + c.pitch * 0.72
    rows.push({
      stage,
      index: i,
      kind: 'rotor',
      spool,
      stream: 'core',
      x: rotorX,
      hubRadius: hubRadiusAt(rotorX),
      tipRadius: coreCasingRadiusAt(rotorX) - TF.tipClearance,
      count: c.blades,
      chord: c.chord,
      stagger: c.stagger,
    })
    rows.push({
      stage,
      index: i,
      kind: 'stator',
      spool: null,
      stream: 'core',
      x: statorX,
      hubRadius: hubRadiusAt(statorX),
      tipRadius: coreCasingRadiusAt(statorX) - TF.tipClearance,
      count: Math.round(c.blades * 1.15),
      chord: c.chord * 0.9,
      stagger: -c.stagger * 0.8,
    })
  }
  return rows
}

/** Every blade row in the engine, front to back. Rotors belong to a spool; stators are fixed. */
export const BLADE_ROWS: BladeRow[] = [
  {
    stage: 'fan',
    index: 0,
    kind: 'rotor',
    spool: 'lp',
    stream: 'both',
    x: TF.fan.x,
    hubRadius: TF.fan.hubRadius,
    tipRadius: TF.fan.tipRadius,
    count: TF.fan.blades,
    chord: TF.fan.chord,
    stagger: TF.fan.staggerTip,
  },
  // Outlet guide vanes straighten the bypass flow behind the fan.
  {
    stage: 'fan',
    index: 0,
    kind: 'stator',
    spool: null,
    stream: 'bypass',
    x: TF.fan.x + 0.85,
    hubRadius: coreOuterRadiusAt(TF.fan.x + 0.85) + 0.01,
    tipRadius: TF.nacelle.innerRadius - 0.01,
    count: 30,
    chord: 0.3,
    stagger: -18,
  },
  ...multiStage('booster', 'lp', TF.booster),
  ...multiStage('hpCompressor', 'hp', TF.hpCompressor),
  ...multiStage('hpTurbine', 'hp', TF.hpTurbine),
  ...multiStage('lpTurbine', 'lp', TF.lpTurbine),
]

export const rowsForStage = (stage: StageId) => BLADE_ROWS.filter((r) => r.stage === stage)

/** Overall axial span of the model, spinner apex to exhaust cone tip. */
export const ENGINE_X_MIN = TF.fan.x - TF.spinner.length
export const ENGINE_X_MAX = TF.exhaustCone.xEnd
export const ENGINE_LENGTH = ENGINE_X_MAX - ENGINE_X_MIN
