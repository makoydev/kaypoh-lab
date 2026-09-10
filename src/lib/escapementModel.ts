import type { BeatRate, EscapementControls, EscapementFrame, EscapementPhase, EscapementSimState, EscapementStepEvents, Pallet } from '../types/escapement'
import {
  ACTION,
  ADVANCE_PER_BEAT,
  AMPLITUDE_TAU,
  BANKED_FORK_ANGLE,
  BANKING_HALF_ANGLE,
  ESC,
  ESCAPE_ANGLE_0,
  ESCAPEMENT_VISUAL_TIME_SCALE,
  LEVER_SWING,
  LOCK_ANGLE,
  TICK_FLASH_TAU,
  TOOTH_PITCH,
  amplitudeFor,
  beatPeriod,
  frequencyHz,
  rateErrorFor,
  secondsRatio,
} from './escapementConfig'

const DEG = Math.PI / 180
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const smooth = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

/* ---------------------------------- Plane geometry ---------------------------------- */

/** A point in the plane of the movement (Three's XZ plane). */
export interface P2 {
  x: number
  z: number
}

/** Point at radius `r` and angle `a` (degrees, counter-clockwise from +X seen from above = Three `rotation.y`). */
export const polar = (r: number, a: number): P2 => ({ x: r * Math.cos(a * DEG), z: -r * Math.sin(a * DEG) })
/** Angle (degrees) of a point in the same convention. */
export const angleOf = (p: P2) => Math.atan2(-p.z, p.x) / DEG
/** Rotate a point about the origin by `a` degrees, exactly as Three's `rotation.y = a` would. */
export const rot = (a: number, p: P2): P2 => {
  const c = Math.cos(a * DEG)
  const s = Math.sin(a * DEG)
  return { x: p.x * c + p.z * s, z: -p.x * s + p.z * c }
}
export const add = (a: P2, b: P2): P2 => ({ x: a.x + b.x, z: a.z + b.z })
export const sub = (a: P2, b: P2): P2 => ({ x: a.x - b.x, z: a.z - b.z })
export const scale = (a: P2, k: number): P2 => ({ x: a.x * k, z: a.z * k })
export const len = (a: P2) => Math.hypot(a.x, a.z)
export const normalize = (a: P2): P2 => {
  const l = len(a) || 1
  return { x: a.x / l, z: a.z / l }
}

export const BALANCE_CENTRE: P2 = { x: ESC.balance.x, z: 0 }
export const WHEEL_CENTRE: P2 = { x: ESC.escapeWheel.x, z: 0 }
export const FORK_PIVOT: P2 = { x: 0, z: 0 }

/* ---------------------------------- Balance → fork ---------------------------------- */

/** World position of the impulse pin. At rest it points straight at the fork. */
export const impulsePin = (balanceAngle: number): P2 => add(BALANCE_CENTRE, polar(ESC.roller.pinRadius, 180 + balanceAngle))

/** Fork angle the pin would demand if nothing stopped the fork. Decreases as the balance angle increases. */
export const rawForkAngle = (balanceAngle: number) => angleOf(impulsePin(balanceAngle))

/**
 * Balance lift angle: the total swing during which the pin is in the notch and the fork is moving.
 * Found by bisection on the raw fork angle, which is monotone over the first quarter turn.
 */
export const LIFT_ANGLE = (() => {
  let lo = 0
  let hi = 90
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (-rawForkAngle(mid) < BANKING_HALF_ANGLE) lo = mid
    else hi = mid
  }
  return 2 * ((lo + hi) / 2)
})()

/** True while the impulse pin sits between the fork horns. */
export const pinInNotch = (balanceAngle: number) => Math.abs(balanceAngle) <= LIFT_ANGLE / 2 + 1e-9

/**
 * Fork angle for a balance angle. Inside the lift angle the fork follows the pin; beyond it the fork
 * stays against whichever banking pin the pin left it on (the pin has swung away round the back).
 */
export function forkAngleFor(balanceAngle: number) {
  if (balanceAngle > LIFT_ANGLE / 2) return -BANKING_HALF_ANGLE
  if (balanceAngle < -LIFT_ANGLE / 2) return BANKING_HALF_ANGLE
  return clamp(rawForkAngle(balanceAngle), -BANKING_HALF_ANGLE, BANKING_HALF_ANGLE)
}

/** Below this amplitude the pin cannot push the fork to the far banking pin and the model would not be honest. */
export const MIN_RUNNING_AMPLITUDE = LIFT_ANGLE / 2 + 10

/* ---------------------------------- Fork → escape wheel ---------------------------------- */

/**
 * Escape wheel advance (degrees) through one beat as a function of `s`, the releasing pallet's
 * progress 0-1 across the lever's travel: recoil while unlocking, a linear impulse (a straight
 * impulse face), a quick free drop, then drawn forward into lock as the fork runs to the banking pin.
 */
export function wheelAdvance(s: number) {
  const { unlockEnd, impulseEnd, dropEnd, recoil, drop, impulse } = ACTION
  const x = clamp(s, 0, 1)
  if (x < unlockEnd) return -recoil * smooth(x / unlockEnd)
  if (x < impulseEnd) return -recoil + (impulse * (x - unlockEnd)) / (impulseEnd - unlockEnd)
  if (x < dropEnd) return -recoil + impulse + drop * smooth((x - impulseEnd) / (dropEnd - impulseEnd))
  return ADVANCE_PER_BEAT - recoil * smooth((1 - x) / (1 - dropEnd))
}

/** Which part of the action `s` falls in. */
export function actionPhase(s: number): Exclude<EscapementPhase, 'free'> {
  if (s < ACTION.unlockEnd) return 'unlock'
  if (s < ACTION.impulseEnd) return 'impulse'
  if (s < ACTION.dropEnd) return 'drop'
  return 'lock'
}

/** Fork angle when the given pallet's release is `s` of the way along. */
export const forkAngleAt = (pallet: Pallet, s: number) => BANKED_FORK_ANGLE[pallet] + (pallet === 'entry' ? 1 : -1) * LEVER_SWING * s

/** The pallet a released tooth lands on. */
export const otherPallet = (p: Pallet): Pallet => (p === 'entry' ? 'exit' : 'entry')

/**
 * Everything for a given oscillator phase (radians) and amplitude (degrees). Even beats are the
 * balance swinging toward +A, which drags the fork from the exit banking to the entry banking and
 * releases the exit pallet; odd beats release the entry pallet.
 */
export function escapementFrame(phase: number, amplitude: number): EscapementFrame {
  const balanceAngle = amplitude * Math.sin(phase)
  const direction: 1 | -1 = Math.cos(phase) >= 0 ? 1 : -1
  const beat = Math.floor((phase + Math.PI / 2) / Math.PI)
  const forkAngle = forkAngleFor(balanceAngle)
  const u = (forkAngle + BANKING_HALF_ANGLE) / LEVER_SWING
  const pallet: Pallet = beat % 2 === 0 ? 'exit' : 'entry'
  const s = pallet === 'exit' ? 1 - u : u
  const inNotch = pinInNotch(balanceAngle)
  return {
    balanceAngle,
    direction,
    forkAngle,
    escapeAngle: ESCAPE_ANGLE_0 + beat * ADVANCE_PER_BEAT + wheelAdvance(s),
    beat,
    s,
    pallet,
    phase: inNotch ? actionPhase(s) : 'free',
    pinInNotch: inNotch,
  }
}

/** Tooth tips have landed this many times by the given frame (the landing is at the end of the drop). */
export const landingsBy = (frame: EscapementFrame) => frame.beat + (frame.s >= ACTION.dropEnd ? 1 : 0)

/** Wheel angle of every tooth tip. */
export const toothTipAngles = (escapeAngle: number) => Array.from({ length: ESC.escapeWheel.teeth }, (_, k) => escapeAngle + k * TOOTH_PITCH)

/** Wheel angle of the tooth the releasing pallet is working on. */
export const activeTipAngle = (pallet: Pallet, s: number) => LOCK_ANGLE[pallet] + wheelAdvance(s)

/* ---------------------------------- Pallet jewel geometry ---------------------------------- */

/**
 * The path a tooth tip traces across a pallet, in the fork's own frame, from full lock through
 * unlocking and the whole impulse to the let-off corner. Drawn as the jewel's working edge, so the
 * animation and the geometry can never disagree.
 */
export function palletWorkingEdge(pallet: Pallet, samples = 40): P2[] {
  const pts: P2[] = []
  for (let i = 0; i <= samples; i++) {
    const s = (ACTION.impulseEnd * i) / samples
    const alpha = forkAngleAt(pallet, s)
    const tip = add(WHEEL_CENTRE, polar(ESC.escapeWheel.tipRadius, activeTipAngle(pallet, s)))
    pts.push(rot(-alpha, tip))
  }
  return pts
}

/** Direction a tooth tip travels at `p` (counter-clockwise about the wheel) and the outward radial. */
function wheelDirections(p: P2) {
  const outward = normalize(sub(p, WHEEL_CENTRE))
  const forward: P2 = { x: outward.z, z: -outward.x }
  return { outward, forward }
}

/**
 * Outline of a pallet jewel in the fork frame: the working edge, a toe that carries the locking face
 * a little past the lock point (lock depth plus safety), and a body offset away from the tooth.
 */
export function palletStoneOutline(pallet: Pallet): P2[] {
  const edge = palletWorkingEdge(pallet)
  const { thickness, toe } = ESC.stones
  const toeDir = normalize(sub(edge[0], edge[1]))
  const working = [add(edge[0], scale(toeDir, toe)), ...edge]

  // Body side: away from the tooth, which lives behind (−forward) and inside (−outward) the edge.
  const normals = working.map((p, i) => {
    const prev = working[Math.max(0, i - 1)]
    const next = working[Math.min(working.length - 1, i + 1)]
    const t = normalize(sub(next, prev))
    let n: P2 = { x: -t.z, z: t.x }
    const { outward, forward } = wheelDirections(p)
    const away = normalize(add(outward, forward))
    if (n.x * away.x + n.z * away.z < 0) n = scale(n, -1)
    return n
  })
  // Mitre at the bend between the locking face and the impulse face so the body keeps its thickness.
  const body = working.map((p, i) => {
    const n = normals[i]
    const prevT = i > 0 ? normalize(sub(p, working[i - 1])) : null
    const nextT = i < working.length - 1 ? normalize(sub(working[i + 1], p)) : null
    let k = 1
    if (prevT && nextT) {
      const segN: P2 = { x: -prevT.z, z: prevT.x }
      const dot = Math.abs(segN.x * n.x + segN.z * n.z)
      k = 1 / Math.max(0.5, dot)
    }
    return add(p, scale(n, thickness * k))
  })
  return [...working, ...body.reverse()]
}

/* ---------------------------------- Banking pins ---------------------------------- */

/** World positions of the two banking pins, just clear of the lever flanks at full swing. */
export function bankingPinPositions(): Record<Pallet, P2> {
  const { radius, pinRadius, clearance } = ESC.banking
  const half = ESC.fork.armWidth / 2 + pinRadius + clearance
  const extra = Math.asin(half / radius) / DEG
  return {
    entry: polar(radius, -(BANKING_HALF_ANGLE + extra)),
    exit: polar(radius, BANKING_HALF_ANGLE + extra),
  }
}

/* ---------------------------------- Timekeeping ---------------------------------- */

export const PHASE_LABEL: Record<EscapementPhase, string> = {
  free: 'Free swing',
  unlock: 'Unlocking',
  impulse: 'Impulse',
  drop: 'Drop',
  lock: 'Locked',
}

/** Hours of running left at a given wind, for the readout. */
export const powerReserveHours = (wind: number, reserveHours: number) => (reserveHours * clamp(wind, 0, 100)) / 100

/** Seconds gained (+) or lost (−) per day for a regulator setting. Identity, but named for the readouts. */
export const dailyRate = (regulator: number) => regulator

/** Degrees the seconds hand has turned for an escape wheel angle, clockwise from 12. */
export const secondsAngleFor = (escapeAngle: number, rate: BeatRate) => (escapeAngle - ESCAPE_ANGLE_0) / secondsRatio(rate)

/* ---------------------------------- Stepping ---------------------------------- */

const ease = (current: number, target: number, tau: number, dt: number) => target + (current - target) * Math.exp(-dt / tau)

/** Write a frame into the state: angles, phase, landing count, watch time. */
function applyFrame(s: EscapementSimState, frame: EscapementFrame, rate: BeatRate) {
  s.balanceAngle = frame.balanceAngle
  s.direction = frame.direction
  s.forkAngle = frame.forkAngle
  s.escapeAngle = frame.escapeAngle
  s.escPhase = frame.phase
  s.pallet = frame.pallet
  s.s = frame.s
  s.pinInNotch = frame.pinInNotch
  s.beats = landingsBy(frame)
  s.watchSeconds = s.beats * beatPeriod(rate)
  s.secondsAngle = secondsAngleFor(frame.escapeAngle, rate)
}

export function createEscapementSimState(beatRate: BeatRate, wind: number): EscapementSimState {
  const amplitude = Math.max(MIN_RUNNING_AMPLITUDE, amplitudeFor(wind))
  const phase = -Math.PI / 2
  const state: EscapementSimState = {
    elapsed: 0,
    phase,
    amplitude,
    balanceAngle: 0,
    direction: 1,
    forkAngle: 0,
    escapeAngle: ESCAPE_ANGLE_0,
    escPhase: 'free',
    pallet: 'exit',
    s: 0,
    pinInNotch: false,
    beats: 0,
    tickFlash: 0,
    lastLanding: 'exit',
    watchSeconds: 0,
    secondsAngle: 0,
    frequencyHz: frequencyHz(beatRate),
  }
  applyFrame(state, escapementFrame(phase, amplitude), beatRate)
  return state
}

/** Jump the oscillator to an absolute phase (used by the paused stepper). No tick events, no flash. */
export function setPhase(s: EscapementSimState, phase: number, rate: BeatRate) {
  s.phase = phase
  applyFrame(s, escapementFrame(phase, s.amplitude), rate)
}

/** Move the oscillator by a fraction of a beat (half-swing); negative steps backwards. */
export const stepBeats = (s: EscapementSimState, beats: number, rate: BeatRate) => setPhase(s, s.phase + beats * Math.PI, rate)

/**
 * Advance the escapement by `dt` wall-clock seconds. Pure apart from mutating `s`. The oscillator
 * phase is the master; amplitude eases toward the mainspring setting; everything else is derived.
 */
export function stepEscapement(s: EscapementSimState, c: EscapementControls, dt: number): EscapementStepEvents {
  const events: EscapementStepEvents = {}
  if (!c.playing) return events
  const step = Math.min(dt, 0.1) * c.speed
  s.elapsed += step

  const f = frequencyHz(c.beatRate) * (1 + rateErrorFor(c.regulator))
  s.frequencyHz = f
  s.amplitude = ease(s.amplitude, Math.max(MIN_RUNNING_AMPLITUDE, amplitudeFor(c.wind)), AMPLITUDE_TAU, step)

  const before = s.beats
  s.phase += (2 * Math.PI * f * step) / ESCAPEMENT_VISUAL_TIME_SCALE
  const frame = escapementFrame(s.phase, s.amplitude)
  applyFrame(s, frame, c.beatRate)

  if (s.beats > before) {
    // A tooth landed: on the pallet opposite to the one releasing in the beat that just finished its drop.
    const landingBeat = s.beats - 1
    s.lastLanding = landingBeat % 2 === 0 ? 'entry' : 'exit'
    s.tickFlash = 1
    events.tick = s.lastLanding
  } else {
    s.tickFlash *= Math.exp(-step / TICK_FLASH_TAU)
  }
  return events
}
