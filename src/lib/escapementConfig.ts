import type { BeatRate, EscapementStep, Pallet } from '../types/escapement'

/**
 * Procedural geometry for a straight-line Swiss lever escapement, in scene units (the balance rim
 * radius is 1). The movement lies flat: the plane of motion is XZ, every arbor is vertical (+Y), and
 * the line of centres runs along X with the escape wheel at −X, the pallet fork pivot at the origin
 * and the balance at +X. Angles are degrees, positive counter-clockwise seen from above, which is
 * Three's `rotation.y`. Meshes and maths read the same numbers.
 */
export const ESC = {
  balance: {
    x: 1.85,
    rimRadius: 1.0,
    rimWidth: 0.11,
    rimHeight: 0.09,
    /** Height of the rim centre line. */
    y: 0.5,
    arms: 3,
    armWidth: 0.07,
    armHeight: 0.05,
    staffRadius: 0.035,
    staffBottom: -0.1,
    staffTop: 0.98,
    /** Decorative timing weights on the rim. */
    weights: 6,
  },
  hairspring: {
    y: 0.76,
    innerRadius: 0.13,
    outerRadius: 0.74,
    turns: 9,
    /** Ribbon height along the arbor and radial thickness. */
    height: 0.06,
    /** Absolute angle of the fixed outer end (the stud). */
    studAngle: 90,
    segments: 420,
  },
  roller: {
    y: 0.24,
    radius: 0.27,
    thickness: 0.04,
    /** Impulse pin centre radius from the balance axis. */
    pinRadius: 0.3,
    /** Pin is a D-shaped jewel; this is its half-width. */
    pinHalfWidth: 0.032,
    pinHeight: 0.17,
    /** Crescent cut in the safety roller for the guard pin. */
    crescentRadius: 0.07,
  },
  fork: {
    /** Height of the lever body centre. */
    y: 0.1,
    thickness: 0.05,
    armWidth: 0.075,
    /** Radius (from the pivot) where the notch floor sits. */
    notchRadius: 1.5,
    notchWidth: 0.115,
    /** How far the horns reach past the notch floor. */
    hornLength: 0.18,
    hornWidth: 0.055,
    /** Guard pin: a slim pin under the notch, pointing at the safety roller. */
    guardPinRadius: 0.012,
    guardPinLength: 0.12,
    palletArmWidth: 0.085,
    arborRadius: 0.03,
  },
  stones: {
    /** Jewel thickness measured away from the escape wheel. */
    thickness: 0.085,
    height: 0.15,
    /** How far the locking face continues inward past the lock point (lock depth plus safety). */
    toe: 0.05,
  },
  escapeWheel: {
    x: -1.5,
    y: 0,
    teeth: 15,
    tipRadius: 0.8,
    rootRadius: 0.62,
    thickness: 0.05,
    rimInnerRadius: 0.54,
    hubRadius: 0.13,
    spokes: 5,
    spokeWidth: 0.05,
    arborRadius: 0.03,
  },
  banking: {
    /** Distance from the fork pivot to where the pins meet the lever. */
    radius: 0.95,
    pinRadius: 0.035,
    height: 0.2,
    /** Clearance between the lever flank and the pin at rest, scene units. */
    clearance: 0.004,
  },
  plate: {
    xStart: -2.5,
    xEnd: 3.0,
    halfWidth: 1.35,
    yTop: -0.2,
    thickness: 0.12,
    cornerRadius: 0.35,
  },
  bridges: {
    width: 0.2,
    thickness: 0.06,
    /** Balance cock: spans from the plate edge at −Z over the balance staff. */
    balanceCockY: 1.02,
    palletCockY: 0.32,
    escapeCockY: 0.32,
    jewelRadius: 0.07,
  },
} as const

/** Lever travel between the banking pins, degrees (the lever's "lift"). */
export const LEVER_SWING = 10
export const BANKING_HALF_ANGLE = LEVER_SWING / 2

/** How many tooth pitches the two pallets straddle. Swiss convention. */
export const EMBRACE_TEETH = 2.5
export const TOOTH_PITCH = 360 / ESC.escapeWheel.teeth
/** Angle, at the wheel centre, from the line of centres to each pallet's lock point. */
export const PALLET_HALF_ANGLE = (EMBRACE_TEETH * TOOTH_PITCH) / 2
/** Escape wheel advance per beat: half a tooth pitch, because the pallets alternate. */
export const ADVANCE_PER_BEAT = TOOTH_PITCH / 2

/** Wheel angle of the tooth tip each pallet locks. Teeth travel counter-clockwise, entry → exit. */
export const LOCK_ANGLE: Record<Pallet, number> = { entry: -PALLET_HALF_ANGLE, exit: PALLET_HALF_ANGLE }

/** Fork angle at which each pallet is locked (the fork is against that side's banking pin). */
export const BANKED_FORK_ANGLE: Record<Pallet, number> = { entry: -BANKING_HALF_ANGLE, exit: BANKING_HALF_ANGLE }

/**
 * How one beat divides the lever's travel (0 = banked on the releasing pallet, 1 = banked on the
 * other). The escape wheel recoils by `recoil` while unlocking, advances `impulse` along the
 * impulse face, runs free for `drop`, and is drawn forward `recoil` again as the fork runs to the
 * banking pin. recoil − recoil + impulse + drop = half a pitch.
 */
export const ACTION = {
  unlockEnd: 0.15,
  impulseEnd: 0.8,
  dropEnd: 0.85,
  /** Degrees of escape wheel. */
  recoil: 0.75,
  drop: 1.5,
  impulse: ADVANCE_PER_BEAT - 1.5,
} as const

/** Escape wheel angle at which the simulation starts: the exit pallet holds a tooth. */
export const ESCAPE_ANGLE_0 = LOCK_ANGLE.exit - TOOTH_PITCH

export const BEAT_RATES: BeatRate[] = [18000, 21600, 28800, 36000]
export const DEFAULT_BEAT_RATE: BeatRate = 28800

/** Frequency of the balance, Hz: two vibrations per full swing. */
export const frequencyHz = (rate: BeatRate) => rate / 7200

/** Seconds per beat (per vibration). */
export const beatPeriod = (rate: BeatRate) => 3600 / rate

/** Escape wheel rpm for a beat rate: one tooth per two beats. */
export const escapeRpm = (rate: BeatRate) => rate / 2 / ESC.escapeWheel.teeth / 60

/** Whole-number ratio between the escape wheel and the seconds hand (1 rpm). Always an integer for real rates. */
export const secondsRatio = (rate: BeatRate) => escapeRpm(rate)

export const MAINSPRING = {
  minWind: 10,
  maxWind: 100,
  defaultWind: 80,
  /** Amplitude of the balance at min and max wind, degrees. */
  minAmplitude: 150,
  maxAmplitude: 310,
  /** Power reserve when fully wound, hours. */
  reserveHours: 42,
} as const

/** Balance amplitude for a mainspring wind, percent. Linear is honest enough for a lesson. */
export const amplitudeFor = (wind: number) => {
  const t = (Math.min(MAINSPRING.maxWind, Math.max(MAINSPRING.minWind, wind)) - MAINSPRING.minWind) / (MAINSPRING.maxWind - MAINSPRING.minWind)
  return MAINSPRING.minAmplitude + (MAINSPRING.maxAmplitude - MAINSPRING.minAmplitude) * t
}

export const REGULATOR = {
  /** Seconds per day, either way. */
  range: 240,
  /**
   * Fine enough to land inside the chronometer band (−4 to +6 s/day), which a step of 10 skipped
   * straight over: every setting but dead-centre was already worse than chronometer grade.
   */
  step: 4,
} as const

/** Fractional rate error for a regulator setting in seconds per day. */
export const rateErrorFor = (secondsPerDay: number) => secondsPerDay / 86400

/**
 * Effective hairspring length change for a rate error: f ∝ 1/√L, so L′ = L/(1+δ)². Returns the
 * change in the spring's wound angle, degrees, positive = curb pins moved to shorten the spring.
 */
export const curbPinShift = (secondsPerDay: number) => {
  const delta = rateErrorFor(secondsPerDay)
  const total = ESC.hairspring.turns * 360
  return total * (1 - 1 / ((1 + delta) * (1 + delta)))
}

/** Real time divided by this is what moves on screen: 8 beats a second becomes about one. */
export const ESCAPEMENT_VISUAL_TIME_SCALE = 8

/** How quickly the amplitude follows the mainspring slider, seconds (scene time). */
export const AMPLITUDE_TAU = 0.6
/** Tick flash decay, seconds (scene time). */
export const TICK_FLASH_TAU = 0.16

export const STEP_ORDER: EscapementStep[] = ['swing', 'unlock', 'impulse', 'lock']

export const STEP_META: Record<EscapementStep, { label: string; nick: string; color: string }> = {
  swing: { label: 'Free swing', nick: 'Swing', color: '#38bdf8' },
  unlock: { label: 'Unlock', nick: 'Unlock', color: '#fbbf24' },
  impulse: { label: 'Impulse', nick: 'Impulse', color: '#fb923c' },
  lock: { label: 'Drop & lock', nick: 'Lock', color: '#34d399' },
}

export const PHASE_META: Record<'free' | 'unlock' | 'impulse' | 'drop' | 'lock', { label: string; color: string; step: EscapementStep }> = {
  free: { label: 'Free swing', color: '#38bdf8', step: 'swing' },
  unlock: { label: 'Unlocking', color: '#fbbf24', step: 'unlock' },
  impulse: { label: 'Impulse', color: '#fb923c', step: 'impulse' },
  drop: { label: 'Drop', color: '#a78bfa', step: 'lock' },
  lock: { label: 'Locked', color: '#34d399', step: 'lock' },
}

export const PALLET_META: Record<Pallet, { label: string }> = {
  entry: { label: 'Entry pallet' },
  exit: { label: 'Exit pallet' },
}

export const BEAT_RATE_META: Record<BeatRate, { label: string; note: string }> = {
  18000: { label: '18,000', note: 'Vintage pace, 2.5 Hz. Pocket watches and old dress watches.' },
  21600: { label: '21,600', note: '3 Hz. A gentle modern rate, easy on the oil.' },
  28800: { label: '28,800', note: '4 Hz. The standard “hi-beat” of most mechanical watches today.' },
  36000: { label: '36,000', note: '5 Hz. True hi-beat: steadier against knocks, thirstier for oil.' },
}
