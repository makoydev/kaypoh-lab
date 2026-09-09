import type { FreewheelGearId, GearId, GearboxStep, HubId, SpeedGearId } from '../types/gearbox'

/**
 * Procedural geometry for a five-speed, three-shaft, constant-mesh gearbox, in scene units (roughly
 * decimetres). Shafts run along +X with the engine at −X. The input and output shafts share the main
 * axis (y = 0, z = 0); the countershaft sits directly below it. Meshes and maths read the same numbers.
 */
export const GB = {
  /** Main axis to countershaft axis. Every gear pair's pitch radii sum to this. */
  centreDistance: 1.0,
  faceWidth: 0.26,
  /** Sleeve gap / synchro pack between a hub face and the gear face it serves. */
  synchroGap: 0.16,
  hub: { width: 0.3, radius: 0.3, innerRadius: 0.15 },
  sleeve: { width: 0.3, innerRadius: 0.3, outerRadius: 0.38, grooveWidth: 0.08, grooveDepth: 0.03 },
  ring: { width: 0.07, outerRadius: 0.285, innerRadius: 0.235 },
  cone: { length: 0.03, radius: 0.28 },
  dog: { count: 24, innerRadius: 0.245, outerRadius: 0.29, length: 0.065 },
  shafts: {
    input: { radius: 0.14, xStart: -3.3, xEnd: -1.11 },
    output: { radius: 0.14, xStart: -1.05, xEnd: 3.5 },
    counter: { radius: 0.13, xStart: -1.5, xEnd: 3.35 },
  },
  clutch: {
    x: -2.85,
    flywheelRadius: 0.9,
    flywheelWidth: 0.12,
    discRadius: 0.78,
    discWidth: 0.05,
    plateRadius: 0.84,
    plateWidth: 0.08,
    /** How far the disc and plate back off when the pedal is down. */
    travel: 0.06,
  },
  case: { xStart: -1.7, xEnd: 3.5, top: 1.0, bottom: -1.85, halfWidth: 1.15, wall: 0.07, cornerRadius: 0.3 },
  bell: { xStart: -3.45, xEnd: -1.7, radiusStart: 1.12, radiusEnd: 1.3, wall: 0.07 },
  forks: { railY: 0.8, railZ: -0.25, railRadius: 0.035, armRadius: 0.03 },
  idlerStubLength: 0.5,
  /** Tip clearance so mating teeth never quite touch on screen. */
  backlash: 0.004,
} as const

/** Axial position of each synchro hub along the output shaft. */
export const HUB_X: Record<HubId, number> = { '34': -0.8, '12': 1.0, '5R': 2.65 }

export const HUB_ORDER: HubId[] = ['34', '12', '5R']

/** Which hub serves a gear and which way its sleeve slides (+1 = toward +X). */
export const HUB_OF: Record<SpeedGearId, { hub: HubId; side: -1 | 1 }> = {
  '4': { hub: '34', side: -1 },
  '3': { hub: '34', side: 1 },
  '2': { hub: '12', side: -1 },
  '1': { hub: '12', side: 1 },
  '5': { hub: '5R', side: -1 },
  R: { hub: '5R', side: 1 },
}

export const hubOf = (gear: GearId): HubId | null => (gear === 'N' ? null : HUB_OF[gear].hub)

/** Gear-face centre: one sleeve half, one synchro gap and one gear half away from the hub centre. */
const GEAR_OFFSET = GB.sleeve.width / 2 + GB.synchroGap + GB.faceWidth / 2

export const gearX = (gear: SpeedGearId) => HUB_X[HUB_OF[gear].hub] + HUB_OF[gear].side * GEAR_OFFSET

/** Tooth counts. The input gear and counter-drive gear are one permanent pair; the rest are one pair per speed. */
export const TEETH = {
  input: 21,
  counterDrive: 32,
  pairs: {
    '1': { counter: 14, output: 29 },
    '2': { counter: 20, output: 25 },
    '3': { counter: 26, output: 23 },
    '5': { counter: 31, output: 17 },
    R: { counter: 13, output: 31, idler: 19 },
  },
} as const

export const GEAR_ORDER: GearId[] = ['R', 'N', '1', '2', '3', '4', '5']
export const SPEED_GEARS: SpeedGearId[] = ['1', '2', '3', '4', '5', 'R']
export const FREEWHEEL_GEARS: FreewheelGearId[] = ['1', '2', '3', '5', 'R']

/** Overall ratio (input turns per output turn) of the permanent input → countershaft mesh. */
export const DRIVE_RATIO = TEETH.counterDrive / TEETH.input

/** Overall gear ratio, always positive. Reverse turns the other way; see `directionOf`. */
export function ratioOf(gear: GearId): number {
  if (gear === 'N') return 0
  if (gear === '4') return 1
  const p = TEETH.pairs[gear]
  return DRIVE_RATIO * (p.output / p.counter)
}

/** +1 forward, −1 reverse, 0 neutral. */
export const directionOf = (gear: GearId) => (gear === 'N' ? 0 : gear === 'R' ? -1 : 1)

/** Signed ratio: output rpm = input rpm / signedRatio. */
export const signedRatio = (gear: GearId) => ratioOf(gear) * directionOf(gear)

/** Pitch radius of a gear in a pair, given the centre distance the pair has to span. */
export const pitchRadius = (teeth: number, partnerTeeth: number, centreDistance: number) => (centreDistance * teeth) / (teeth + partnerTeeth)

/** Module (tooth size) of a pair spanning `centreDistance`. */
export const moduleOf = (teeth: number, partnerTeeth: number, centreDistance: number) => (2 * centreDistance) / (teeth + partnerTeeth)

/**
 * Reverse idler sits on its own stub shaft between the countershaft and the output shaft, off to +Z.
 * Its module is chosen so the idler-to-output distance equals the main centre distance.
 */
export const REVERSE_MODULE = (2 * GB.centreDistance) / (TEETH.pairs.R.idler + TEETH.pairs.R.output)
const idlerToCounter = (REVERSE_MODULE * (TEETH.pairs.R.counter + TEETH.pairs.R.idler)) / 2
const idlerToOutput = (REVERSE_MODULE * (TEETH.pairs.R.idler + TEETH.pairs.R.output)) / 2

/** Position of the idler axis in the YZ plane: `centreDistance` from the main axis, `idlerToCounter` from the countershaft. */
export const IDLER_CENTRE = (() => {
  const c = GB.centreDistance
  // Countershaft at (y = −c, z = 0), output at (0, 0). Solve |p| = idlerToOutput, |p − counter| = idlerToCounter.
  const y = (idlerToCounter ** 2 - idlerToOutput ** 2 - c * c) / (2 * c)
  const z = Math.sqrt(Math.max(0, idlerToOutput ** 2 - y * y))
  return { y, z }
})()

export const COUNTER_CENTRE = { y: -GB.centreDistance, z: 0 }
export const MAIN_CENTRE = { y: 0, z: 0 }

/** Polar angle (degrees) of the direction from one axis to another, measured from +Y toward +Z (right-hand about +X). */
export const bearingDeg = (from: { y: number; z: number }, to: { y: number; z: number }) => (Math.atan2(to.z - from.z, to.y - from.y) * 180) / Math.PI

export interface GearSpec {
  id: string
  teeth: number
  /** Pitch radius, scene units. */
  radius: number
  module: number
  x: number
  centre: { y: number; z: number }
  /** Which shaft the wheel sits on / spins with. */
  shaft: 'input' | 'counter' | 'output' | 'idler'
  /** Bore radius for the extruded profile. */
  bore: number
}

const counterBore = GB.shafts.counter.radius + 0.005
const mainBore = GB.shafts.output.radius + 0.005

/** Every gear wheel in the box, by id. */
export const GEARS: Record<string, GearSpec> = {
  input: {
    id: 'input',
    teeth: TEETH.input,
    radius: pitchRadius(TEETH.input, TEETH.counterDrive, GB.centreDistance),
    module: moduleOf(TEETH.input, TEETH.counterDrive, GB.centreDistance),
    x: gearX('4'),
    centre: MAIN_CENTRE,
    shaft: 'input',
    bore: mainBore,
  },
  counterDrive: {
    id: 'counterDrive',
    teeth: TEETH.counterDrive,
    radius: pitchRadius(TEETH.counterDrive, TEETH.input, GB.centreDistance),
    module: moduleOf(TEETH.input, TEETH.counterDrive, GB.centreDistance),
    x: gearX('4'),
    centre: COUNTER_CENTRE,
    shaft: 'counter',
    bore: counterBore,
  },
  ...Object.fromEntries(
    (['1', '2', '3', '5'] as const).flatMap((g): [string, GearSpec][] => {
      const p = TEETH.pairs[g]
      const m = moduleOf(p.counter, p.output, GB.centreDistance)
      return [
        [`counter${g}`, { id: `counter${g}`, teeth: p.counter, radius: pitchRadius(p.counter, p.output, GB.centreDistance), module: m, x: gearX(g), centre: COUNTER_CENTRE, shaft: 'counter', bore: counterBore }],
        [`output${g}`, { id: `output${g}`, teeth: p.output, radius: pitchRadius(p.output, p.counter, GB.centreDistance), module: m, x: gearX(g), centre: MAIN_CENTRE, shaft: 'output', bore: mainBore }],
      ]
    }),
  ),
  counterR: { id: 'counterR', teeth: TEETH.pairs.R.counter, radius: (REVERSE_MODULE * TEETH.pairs.R.counter) / 2, module: REVERSE_MODULE, x: gearX('R'), centre: COUNTER_CENTRE, shaft: 'counter', bore: counterBore },
  idler: { id: 'idler', teeth: TEETH.pairs.R.idler, radius: (REVERSE_MODULE * TEETH.pairs.R.idler) / 2, module: REVERSE_MODULE, x: gearX('R'), centre: IDLER_CENTRE, shaft: 'idler', bore: 0.1 },
  outputR: { id: 'outputR', teeth: TEETH.pairs.R.output, radius: (REVERSE_MODULE * TEETH.pairs.R.output) / 2, module: REVERSE_MODULE, x: gearX('R'), centre: MAIN_CENTRE, shaft: 'output', bore: mainBore },
}

/** Gear spec of the freewheeling wheel for a speed (4th uses the input gear). */
export const outputGearOf = (gear: SpeedGearId): GearSpec => (gear === '4' ? GEARS.input : GEARS[`output${gear}`])

/** Meshing pairs, driver first. The reverse chain is two pairs through the idler. */
export const MESHES: { driver: string; driven: string }[] = [
  { driver: 'input', driven: 'counterDrive' },
  { driver: 'counter1', driven: 'output1' },
  { driver: 'counter2', driven: 'output2' },
  { driver: 'counter3', driven: 'output3' },
  { driver: 'counter5', driven: 'output5' },
  { driver: 'counterR', driven: 'idler' },
  { driver: 'idler', driven: 'outputR' },
]

/** Engine and driveline constants for the readouts. Nothing here affects geometry. */
export const ENGINE = {
  idle: 800,
  redline: 7000,
  default: 2500,
  /** Peak torque, N·m, at `peakRpm`; a parabola either side, floored at `floor`. */
  torque: { peak: 190, peakRpm: 4200, width: 3600, floor: 0.35 },
} as const

export const DRIVELINE = {
  finalDrive: 3.9,
  /** Rolling circumference of the tyre, metres. */
  tyreCircumference: 1.94,
  /** Below this output speed the car counts as stopped, so reverse can be selected. */
  stoppedRpm: 60,
} as const

/** Real rpm divided by this is what turns on screen. Same trick as the V8. */
export const GEARBOX_VISUAL_TIME_SCALE = 40

/** Scene seconds per shift phase. Grind replaces synchro when the rings are switched off. */
export const SHIFT_DURATIONS = {
  clutchOut: 0.25,
  disengage: 0.3,
  synchro: 0.65,
  grind: 1.3,
  engage: 0.3,
  clutchIn: 0.3,
} as const

/** Sleeve travel that first touches the ring, as a fraction of full travel. */
export const RING_CONTACT_FRACTION = 0.5

/** How quickly the input cluster spins down on its own with the clutch out (time constant, s). */
export const CLUSTER_COAST_TAU = 1.6
/** How quickly the car slows in neutral (time constant, s). Long: a car rolls a while. */
export const CAR_COAST_TAU = 14
/** Synchro ring drags the cluster to speed with this time constant, s. */
export const SYNCHRO_TAU = 0.14
/** Clutch-in drags a mismatched cluster to engine speed with this time constant, s. */
export const CLUTCH_TAU = 0.12

export const STEP_ORDER: GearboxStep[] = ['mesh', 'neutral', 'synchro', 'lock']

export const STEP_META: Record<GearboxStep, { label: string; nick: string; color: string }> = {
  mesh: { label: 'Always meshed', nick: 'Mesh', color: '#38bdf8' },
  neutral: { label: 'Neutral', nick: 'Neutral', color: '#94a3b8' },
  synchro: { label: 'Synchronise', nick: 'Synchro', color: '#fbbf24' },
  lock: { label: 'Lock & drive', nick: 'Lock', color: '#34d399' },
}

export const GEAR_META: Record<GearId, { label: string; short: string }> = {
  R: { label: 'Reverse', short: 'R' },
  N: { label: 'Neutral', short: 'N' },
  '1': { label: '1st', short: '1' },
  '2': { label: '2nd', short: '2' },
  '3': { label: '3rd', short: '3' },
  '4': { label: '4th', short: '4' },
  '5': { label: '5th', short: '5' },
}

export const HUB_META: Record<HubId, { label: string; gears: [SpeedGearId, SpeedGearId] }> = {
  '34': { label: '3-4 hub', gears: ['4', '3'] },
  '12': { label: '1-2 hub', gears: ['2', '1'] },
  '5R': { label: '5-R hub', gears: ['5', 'R'] },
}

/** Axial span of the whole model, flywheel face to case rear. */
export const GEARBOX_X_MIN = GB.bell.xStart
export const GEARBOX_X_MAX = GB.case.xEnd
