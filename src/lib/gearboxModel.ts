import type { FreewheelGearId, GearId, GearboxAngles, GearboxControls, GearboxSimState, GearboxStepEvents, HubId, ShiftFrame, ShiftPhase, SpeedGearId } from '../types/gearbox'
import {
  CAR_COAST_TAU,
  CLUSTER_COAST_TAU,
  CLUTCH_TAU,
  COUNTER_CENTRE,
  DRIVELINE,
  ENGINE,
  FREEWHEEL_GEARS,
  GB,
  GEARS,
  GEAR_ORDER,
  GEARBOX_VISUAL_TIME_SCALE,
  HUB_OF,
  IDLER_CENTRE,
  MAIN_CENTRE,
  RING_CONTACT_FRACTION,
  SHIFT_DURATIONS,
  SYNCHRO_TAU,
  TEETH,
  bearingDeg,
  hubOf,
  signedRatio,
} from './gearboxConfig'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const mod = (v: number, m: number) => ((v % m) + m) % m
const smooth = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

/* ---------------------------------- Meshing ---------------------------------- */

/**
 * Where the direction `psi` (degrees, from +Y toward +Z) falls between a gear's teeth: 0 = exactly on a
 * tooth, 0.5 = exactly in the gap after it. Tooth k of a wheel at angle `angle` points along
 * `angle + 360·k/teeth`.
 */
export function toothFraction(angle: number, teeth: number, psi: number) {
  const pitch = 360 / teeth
  return mod(psi - angle, pitch) / pitch
}

/**
 * Angle of a driven wheel so that it meshes with a driver whose axis lies in direction `psi` from
 * the driven wheel's point of view reversed — i.e. `psi` is measured from the driver toward the driven.
 * A tooth of the driver at the line of centres meets a gap of the driven, and vice versa.
 */
export function meshedAngle(driverAngle: number, driverTeeth: number, psiDriverToDriven: number, drivenTeeth: number) {
  const f = toothFraction(driverAngle, driverTeeth, psiDriverToDriven)
  return psiDriverToDriven + 180 - (0.5 - f) * (360 / drivenTeeth)
}

/** True when two wheels interleave correctly along their line of centres. */
export function isMeshed(angleA: number, teethA: number, psiAB: number, angleB: number, teethB: number, tolerance = 1e-6) {
  const fA = toothFraction(angleA, teethA, psiAB)
  const fB = toothFraction(angleB, teethB, psiAB + 180)
  return Math.abs(mod(fA + fB, 1) - 0.5) < tolerance
}

/** Line-of-centre bearings the gear train needs. */
export const PSI = {
  inputToCounter: bearingDeg(MAIN_CENTRE, COUNTER_CENTRE),
  counterToMain: bearingDeg(COUNTER_CENTRE, MAIN_CENTRE),
  counterToIdler: bearingDeg(COUNTER_CENTRE, IDLER_CENTRE),
  idlerToMain: bearingDeg(IDLER_CENTRE, MAIN_CENTRE),
}

/**
 * Reference phases at input angle 0, and the (signed) turns each wheel makes per input turn. Every
 * wheel's angle is then `ref + k · inputAngle`, continuous and exactly meshed for all time.
 */
const TRAIN = (() => {
  const kCounter = -TEETH.input / TEETH.counterDrive
  const counter0 = meshedAngle(0, TEETH.input, PSI.inputToCounter, TEETH.counterDrive)
  const freewheel = {} as Record<FreewheelGearId, { ref: number; k: number }>
  for (const g of ['1', '2', '3', '5'] as const) {
    const p = TEETH.pairs[g]
    freewheel[g] = { ref: meshedAngle(counter0, p.counter, PSI.counterToMain, p.output), k: -kCounter * (p.counter / p.output) }
  }
  const r = TEETH.pairs.R
  const idler0 = meshedAngle(counter0, r.counter, PSI.counterToIdler, r.idler)
  const kIdler = -kCounter * (r.counter / r.idler)
  freewheel.R = { ref: meshedAngle(idler0, r.idler, PSI.idlerToMain, r.output), k: -kIdler * (r.idler / r.output) }
  return { counter: { ref: counter0, k: kCounter }, idler: { ref: idler0, k: kIdler }, freewheel }
})()

/** Angle of every wheel for a given input-shaft angle (degrees). */
export function gearAngles(inputAngle: number): GearboxAngles {
  const freewheel = {} as Record<FreewheelGearId, number>
  for (const g of FREEWHEEL_GEARS) freewheel[g] = TRAIN.freewheel[g].ref + TRAIN.freewheel[g].k * inputAngle
  return {
    input: inputAngle,
    counter: TRAIN.counter.ref + TRAIN.counter.k * inputAngle,
    idler: TRAIN.idler.ref + TRAIN.idler.k * inputAngle,
    freewheel,
  }
}

/** Angle of the wheel a sleeve locks onto for a speed (4th is the input gear itself). */
export function lockedWheelAngle(gear: SpeedGearId, inputAngle: number) {
  return gear === '4' ? inputAngle : gearAngles(inputAngle).freewheel[gear]
}

/** Signed turns of the locked wheel per input turn. */
export const wheelTurnsPerInputTurn = (gear: SpeedGearId) => (gear === '4' ? 1 : TRAIN.freewheel[gear].k)

/** Which wheel of the mesh table is which, for the mesh test and the meshes. */
export function wheelAngle(id: string, angles: GearboxAngles): number {
  switch (id) {
    case 'input':
      return angles.input
    case 'idler':
      return angles.idler
    case 'outputR':
      return angles.freewheel.R
    default:
      if (id.startsWith('counter')) return angles.counter
      return angles.freewheel[id.replace('output', '') as FreewheelGearId]
  }
}

/** Bearing from the driver wheel's axis to the driven wheel's axis, for a meshing pair. */
export function meshBearing(driver: string, driven: string) {
  return bearingDeg(GEARS[driver].centre, GEARS[driven].centre)
}

/* ---------------------------------- Shifting ---------------------------------- */

/** The phases a particular shift goes through, with their durations. */
export function shiftPhases(from: GearId, to: GearId, synchro: boolean): { phase: ShiftPhase; duration: number }[] {
  const d = SHIFT_DURATIONS
  const list: { phase: ShiftPhase; duration: number }[] = [{ phase: 'clutchOut', duration: d.clutchOut }]
  if (from !== 'N') list.push({ phase: 'disengage', duration: d.disengage })
  if (to !== 'N') {
    list.push(synchro ? { phase: 'synchro', duration: d.synchro } : { phase: 'grind', duration: d.grind })
    list.push({ phase: 'engage', duration: d.engage })
  }
  list.push({ phase: 'clutchIn', duration: d.clutchIn })
  return list
}

export const shiftDuration = (from: GearId, to: GearId, synchro: boolean) => shiftPhases(from, to, synchro).reduce((s, p) => s + p.duration, 0)

/** Sleeve positions when nothing is moving: the engaged gear's hub is pushed its way, the rest centred. */
export function restingSleeves(engaged: GearId): Record<HubId, number> {
  const sleeves: Record<HubId, number> = { '34': 0, '12': 0, '5R': 0 }
  if (engaged !== 'N') sleeves[HUB_OF[engaged].hub] = HUB_OF[engaged].side
  return sleeves
}

/** The state of the clutch, sleeves and ring `elapsed` seconds into a shift from `from` to `to`. */
export function shiftFrame(from: GearId, to: GearId, elapsed: number, synchro: boolean): ShiftFrame {
  const phases = shiftPhases(from, to, synchro)
  const total = phases.reduce((s, p) => s + p.duration, 0)
  const t = clamp(elapsed, 0, total)
  let acc = 0
  let index = phases.length - 1
  let phaseProgress = 1
  for (let i = 0; i < phases.length; i++) {
    if (t < acc + phases[i].duration) {
      index = i
      phaseProgress = (t - acc) / phases[i].duration
      break
    }
    acc += phases[i].duration
  }
  const phase = phases[index].phase
  const order = (p: ShiftPhase) => phases.findIndex((x) => x.phase === p)
  const after = (p: ShiftPhase) => order(p) >= 0 && index > order(p)
  const p = phaseProgress

  const sleeves: Record<HubId, number> = { '34': 0, '12': 0, '5R': 0 }
  if (from !== 'N') {
    const { hub, side } = HUB_OF[from]
    sleeves[hub] = side * (phase === 'disengage' ? 1 - smooth(p) : after('disengage') ? 0 : 1)
  }
  let ringContact = 0
  if (to !== 'N') {
    const { hub, side } = HUB_OF[to]
    let pos = 0
    if (phase === 'synchro') {
      pos = RING_CONTACT_FRACTION * smooth(p * 1.6)
      ringContact = Math.pow(Math.sin(Math.PI * clamp(p, 0, 1)), 0.6)
    } else if (phase === 'grind') {
      // No ring: the sleeve goes straight to the dog faces and chatters against them.
      const chatter = 0.06 * Math.sin(p * 90) * (1 - p)
      pos = 0.8 * smooth(p * 3) + chatter
    } else if (phase === 'engage') {
      pos = RING_CONTACT_FRACTION + (1 - RING_CONTACT_FRACTION) * smooth(p)
    } else if (after('engage')) pos = 1
    if (pos > 0) sleeves[hub] = side * pos
  }

  const clutch = phase === 'clutchOut' ? 1 - smooth(p) : phase === 'clutchIn' ? smooth(p) : 0
  return {
    from,
    to,
    phase,
    phaseProgress,
    progress: total > 0 ? t / total : 1,
    clutch,
    sleeves,
    ringContact,
    hub: hubOf(to) ?? hubOf(from),
    done: elapsed >= total,
  }
}

/** Human label for what the box is doing. */
export const SHIFT_PHASE_LABEL: Record<ShiftPhase, string> = {
  clutchOut: 'Clutch out',
  disengage: 'Sleeve sliding out',
  synchro: 'Synchro matching speed',
  grind: 'Crunch! No synchro',
  engage: 'Dog teeth locking',
  clutchIn: 'Clutch in',
}

/** Offset (degrees) that puts the sleeve's teeth between the gear's dog teeth, nearest to the current relative angle. */
export function dogSnap(outputAngle: number, wheelAngle: number) {
  const pitch = 360 / GB.dog.count
  const half = pitch / 2
  const rel = outputAngle - wheelAngle
  return half + Math.round((rel - half) / pitch) * pitch
}

/* ---------------------------------- Driveline ---------------------------------- */

/** Engine torque, N·m: a parabola around the peak, floored so idle still has some. */
export function engineTorque(rpm: number) {
  const { peak, peakRpm, width, floor } = ENGINE.torque
  const x = (rpm - peakRpm) / width
  return peak * Math.max(floor, 1 - x * x)
}

export const outputRpmFor = (inputRpm: number, gear: GearId) => (gear === 'N' ? 0 : inputRpm / signedRatio(gear))
export const carSpeedKmh = (outputRpm: number) => ((outputRpm / DRIVELINE.finalDrive) * DRIVELINE.tyreCircumference * 60) / 1000
export const powerKw = (torqueNm: number, rpm: number) => (torqueNm * rpm * 2 * Math.PI) / 60 / 1000
export const clampEngineRpm = (rpm: number) => clamp(rpm, ENGINE.idle, ENGINE.redline)

export interface DrivelineReadout {
  ratio: number
  inputRpm: number
  inputTorque: number
  outputRpm: number
  outputTorque: number
  wheelTorque: number
  speedKmh: number
  powerKw: number
}

/** Torque and speed through the box. Torque only flows when a gear is locked and the clutch is in. */
export function driveline(inputRpm: number, outputRpm: number, engaged: GearId, clutch: number): DrivelineReadout {
  const ratio = signedRatio(engaged)
  const transmitting = engaged !== 'N' && clutch >= 0.5
  const inputTorque = engineTorque(Math.abs(inputRpm))
  const outputTorque = transmitting ? inputTorque * ratio : 0
  return {
    ratio,
    inputRpm,
    inputTorque,
    outputRpm,
    outputTorque,
    wheelTorque: outputTorque * DRIVELINE.finalDrive,
    speedKmh: carSpeedKmh(outputRpm),
    powerKw: powerKw(inputTorque, Math.abs(inputRpm)),
  }
}

/** Reverse (and leaving reverse) needs the car stopped: it has no synchro worth the name. */
export function canSelect(gear: GearId, current: GearId, outputRpm: number): { ok: boolean; reason?: string } {
  const moving = Math.abs(outputRpm) > DRIVELINE.stoppedRpm
  if (gear === current) return { ok: true }
  if (moving && gear === 'R') return { ok: false, reason: 'Stop the car first — reverse has no synchro to save you.' }
  if (moving && current === 'R' && gear !== 'N') return { ok: false, reason: 'Stop before leaving reverse, lah.' }
  return { ok: true }
}

/** The lever position one notch up (+1) or down (−1) the R-N-1-2-3-4-5 gate. */
export function nextGear(gear: GearId, direction: 1 | -1): GearId {
  const i = clamp(GEAR_ORDER.indexOf(gear) + direction, 0, GEAR_ORDER.length - 1)
  return GEAR_ORDER[i]
}

export const slipFor = (inputRpm: number, outputRpm: number, gear: GearId) => (gear === 'N' ? 0 : inputRpm - outputRpm * signedRatio(gear))

/* ---------------------------------- Stepping ---------------------------------- */

export const degPerSecond = (rpm: number) => rpm * 6
const ease = (current: number, target: number, tau: number, dt: number) => target + (current - target) * Math.exp(-dt / tau)

export function createGearboxSimState(engineRpm: number, gear: GearId): GearboxSimState {
  const inputAngle = 0
  const lockOffset = gear === 'N' ? 0 : dogSnap(0, lockedWheelAngle(gear, inputAngle))
  return {
    elapsed: 0,
    engineAngle: 0,
    inputAngle,
    outputAngle: gear === 'N' ? 0 : lockedWheelAngle(gear, inputAngle) + lockOffset,
    lockOffset,
    engineRpm,
    inputRpm: engineRpm,
    outputRpm: outputRpmFor(engineRpm, gear),
    engaged: gear,
    target: gear,
    shift: null,
    shiftStart: 0,
    engineOverride: null,
    clutch: 1,
    sleeves: restingSleeves(gear),
    ringContact: 0,
    slipRpm: 0,
    crunches: 0,
    lastHub: hubOf(gear) ?? '12',
  }
}

/**
 * Advance the gearbox by `dt` wall-clock seconds. Pure apart from mutating `s`. Handles starting
 * shifts, the shift timeline, the clutch, the synchro speed-matching, coasting, and every angle.
 */
export function stepGearbox(s: GearboxSimState, c: GearboxControls, dt: number): GearboxStepEvents {
  const events: GearboxStepEvents = {}
  if (!c.playing) return events
  const step = Math.min(dt, 0.1) * c.speed
  s.elapsed += step
  s.target = c.gear

  // The control is the engine unless the clutch just rewrote it and the settings haven't caught up.
  if (s.engineOverride && c.engineRpm !== s.engineOverride.replaced) s.engineOverride = null
  const engine = s.engineOverride ? s.engineOverride.value : c.engineRpm
  s.engineRpm = engine

  // Start a shift when the lever and the box disagree and nothing is in progress.
  if (!s.shift && s.target !== s.engaged) {
    s.shift = shiftFrame(s.engaged, s.target, 0, c.synchro)
    s.shiftStart = s.elapsed
    s.lastHub = hubOf(s.target) ?? hubOf(s.engaged) ?? s.lastHub
  }

  if (s.shift) {
    const prev = s.shift
    const frame = shiftFrame(prev.from, prev.to, s.elapsed - s.shiftStart, c.synchro)
    if (frame.phase !== prev.phase || frame.done !== prev.done) {
      // Phase transitions with side effects.
      if (prev.phase === 'disengage') s.engaged = 'N'
      if (frame.phase === 'engage' && prev.phase !== 'engage' && frame.to !== 'N') {
        if (prev.phase === 'grind') {
          // The dogs finally caught: the speeds are forced to match, teeth pay for it.
          s.crunches += 1
          s.inputRpm = s.outputRpm * signedRatio(frame.to)
        }
        s.engaged = frame.to
        s.lockOffset = dogSnap(s.outputAngle, lockedWheelAngle(frame.to, s.inputAngle))
      }
      if (frame.phase === 'clutchIn' && prev.phase !== 'clutchIn' && frame.to !== 'N') {
        const bite = clampEngineRpm(Math.abs(s.outputRpm * signedRatio(frame.to)))
        s.engineOverride = { value: bite, replaced: c.engineRpm }
        s.engineRpm = bite
        events.engineRpm = bite
      }
    }
    s.shift = frame.done ? null : frame
    s.clutch = frame.clutch
    s.sleeves = frame.sleeves
    s.ringContact = frame.ringContact
    if (frame.done) {
      s.engaged = frame.to
      s.clutch = 1
      s.sleeves = restingSleeves(frame.to)
      s.ringContact = 0
    }
  } else {
    s.clutch = 1
    s.sleeves = restingSleeves(s.engaged)
    s.ringContact = 0
  }

  // Speeds.
  const phase = s.shift?.phase
  const to = s.shift?.to ?? s.engaged
  const engineNow = s.engineOverride ? s.engineOverride.value : engine
  if (s.clutch >= 0.5) {
    s.inputRpm = ease(s.inputRpm, engineNow, CLUTCH_TAU, step)
    if (s.engaged !== 'N') s.outputRpm = s.inputRpm / signedRatio(s.engaged)
    else s.outputRpm = ease(s.outputRpm, 0, CAR_COAST_TAU, step)
  } else {
    s.outputRpm = ease(s.outputRpm, 0, CAR_COAST_TAU, step)
    if (s.engaged !== 'N') {
      // Sleeve still in: the rolling car drives the cluster.
      s.inputRpm = s.outputRpm * signedRatio(s.engaged)
    } else if (phase === 'synchro' && to !== 'N') {
      const tau = SYNCHRO_TAU / Math.max(0.08, s.ringContact)
      s.inputRpm = ease(s.inputRpm, s.outputRpm * signedRatio(to), tau, step)
    } else {
      s.inputRpm = ease(s.inputRpm, 0, CLUSTER_COAST_TAU, step)
    }
  }
  s.slipRpm = s.shift && s.shift.to !== 'N' && s.engaged === 'N' ? slipFor(s.inputRpm, s.outputRpm, s.shift.to) : 0

  // Angles.
  const k = step / GEARBOX_VISUAL_TIME_SCALE
  s.engineAngle += degPerSecond(engineNow) * k
  s.inputAngle += degPerSecond(s.inputRpm) * k
  if (s.engaged !== 'N') {
    const locked = lockedWheelAngle(s.engaged, s.inputAngle) + s.lockOffset
    if (phase === 'engage' && s.shift) {
      // Chamfers guide the sleeve the last few degrees into the dogs.
      const free = s.outputAngle + degPerSecond(s.outputRpm) * k
      s.outputAngle = free + (locked - free) * smooth(s.shift.phaseProgress)
    } else s.outputAngle = locked
  } else {
    s.outputAngle += degPerSecond(s.outputRpm) * k
  }
  return events
}
