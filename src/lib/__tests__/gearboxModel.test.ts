import { describe, expect, it } from 'vitest'
import type { GearboxControls, GearId } from '../../types/gearbox'
import {
  PSI,
  canSelect,
  carSpeedKmh,
  createGearboxSimState,
  dogSnap,
  driveline,
  engineTorque,
  gearAngles,
  isMeshed,
  lockedWheelAngle,
  meshBearing,
  meshedAngle,
  nextGear,
  outputRpmFor,
  powerKw,
  restingSleeves,
  shiftDuration,
  shiftFrame,
  shiftPhases,
  stepGearbox,
  toothFraction,
  wheelAngle,
} from '../gearboxModel'
import { DRIVELINE, ENGINE, GB, GEARS, GEARBOX_VISUAL_TIME_SCALE, HUB_OF, MESHES, SHIFT_DURATIONS, TEETH, ratioOf, signedRatio } from '../gearboxConfig'

describe('meshing', () => {
  it('measures tooth fractions from the nearest tooth', () => {
    expect(toothFraction(0, 12, 0)).toBeCloseTo(0, 9)
    expect(toothFraction(0, 12, 15)).toBeCloseTo(0.5, 9)
    expect(toothFraction(10, 12, 40)).toBeCloseTo(0, 9)
  })

  it('puts a driven gap opposite a driver tooth', () => {
    const angle = meshedAngle(0, 21, 180, 32)
    expect(isMeshed(0, 21, 180, angle, 32)).toBe(true)
    expect(isMeshed(0, 21, 180, angle + 360 / 32 / 2, 32)).toBe(false)
  })

  it('keeps every pair in the box meshed through a full sweep', () => {
    for (let i = 0; i <= 200; i++) {
      const angles = gearAngles(i * 7.3)
      for (const { driver, driven } of MESHES) {
        expect(isMeshed(wheelAngle(driver, angles), GEARS[driver].teeth, meshBearing(driver, driven), wheelAngle(driven, angles), GEARS[driven].teeth, 1e-6)).toBe(true)
      }
    }
  })

  it('bears the countershaft straight below the main axis and the idler off to +Z', () => {
    expect(PSI.inputToCounter).toBeCloseTo(180, 9)
    expect(PSI.counterToMain).toBeCloseTo(0, 9)
    expect(PSI.counterToIdler).toBeGreaterThan(0)
    expect(PSI.counterToIdler).toBeLessThan(90)
  })

  it('turns the countershaft backwards and the speed gears forwards, except reverse', () => {
    const a = gearAngles(0)
    const b = gearAngles(10)
    expect(b.counter - a.counter).toBeCloseTo(-10 * (TEETH.input / TEETH.counterDrive), 9)
    for (const g of ['1', '2', '3', '5'] as const) {
      const d = b.freewheel[g] - a.freewheel[g]
      expect(d).toBeCloseTo(10 / ratioOf(g), 9)
    }
    expect(b.idler - a.idler).toBeGreaterThan(0)
    expect(b.freewheel.R - a.freewheel.R).toBeCloseTo(-10 / ratioOf('R'), 9)
    expect(lockedWheelAngle('4', 33)).toBe(33)
  })
})

describe('shift timeline', () => {
  it('skips the phases that do not apply', () => {
    expect(shiftPhases('N', '1', true).map((p) => p.phase)).toEqual(['clutchOut', 'synchro', 'engage', 'clutchIn'])
    expect(shiftPhases('1', 'N', true).map((p) => p.phase)).toEqual(['clutchOut', 'disengage', 'clutchIn'])
    expect(shiftPhases('1', '2', true).map((p) => p.phase)).toEqual(['clutchOut', 'disengage', 'synchro', 'engage', 'clutchIn'])
    expect(shiftPhases('1', '2', false).map((p) => p.phase)).toContain('grind')
    expect(shiftDuration('1', '2', true)).toBeCloseTo(SHIFT_DURATIONS.clutchOut + SHIFT_DURATIONS.disengage + SHIFT_DURATIONS.synchro + SHIFT_DURATIONS.engage + SHIFT_DURATIONS.clutchIn, 9)
  })

  it('starts and ends with the clutch in and the sleeves where the gears say', () => {
    const start = shiftFrame('1', '2', 0, true)
    expect(start.clutch).toBe(1)
    expect(start.sleeves['12']).toBe(HUB_OF['1'].side)
    expect(start.done).toBe(false)
    const end = shiftFrame('1', '2', 99, true)
    expect(end.clutch).toBeCloseTo(1, 9)
    expect(end.sleeves['12']).toBe(HUB_OF['2'].side)
    expect(end.done).toBe(true)
    expect(end.progress).toBe(1)
  })

  it('drops the clutch, slides the sleeve through the ring, then locks', () => {
    const d = SHIFT_DURATIONS
    const mid = shiftFrame('3', '4', d.clutchOut + d.disengage + d.synchro / 2, true)
    expect(mid.phase).toBe('synchro')
    expect(mid.clutch).toBe(0)
    expect(mid.ringContact).toBeGreaterThan(0.5)
    expect(mid.hub).toBe('34')
    expect(Math.sign(mid.sleeves['34'])).toBe(HUB_OF['4'].side)
    expect(Math.abs(mid.sleeves['34'])).toBeLessThan(1)
    const engage = shiftFrame('3', '4', d.clutchOut + d.disengage + d.synchro + d.engage * 0.99, true)
    expect(engage.phase).toBe('engage')
    expect(Math.abs(engage.sleeves['34'])).toBeGreaterThan(0.95)
    expect(engage.ringContact).toBe(0)
  })

  it('never touches the other hubs', () => {
    for (let t = 0; t < 2; t += 0.05) {
      const f = shiftFrame('2', '5', t, true)
      expect(f.sleeves['34']).toBe(0)
    }
  })

  it('reports the resting sleeve layout for any gear', () => {
    expect(restingSleeves('N')).toEqual({ '34': 0, '12': 0, '5R': 0 })
    expect(restingSleeves('R')).toEqual({ '34': 0, '12': 0, '5R': 1 })
  })

  it('snaps to the nearest half dog pitch', () => {
    const pitch = 360 / GB.dog.count
    expect(dogSnap(0, 0)).toBeCloseTo(pitch / 2, 9)
    expect(dogSnap(pitch * 2.4, 0)).toBeCloseTo(pitch * 2.5, 9)
    expect(dogSnap(-pitch * 0.6, 0)).toBeCloseTo(-pitch * 0.5, 9)
  })
})

describe('driveline', () => {
  it('peaks the torque where the config says and never drops to zero', () => {
    expect(engineTorque(ENGINE.torque.peakRpm)).toBe(ENGINE.torque.peak)
    expect(engineTorque(ENGINE.idle)).toBeGreaterThan(0)
    expect(engineTorque(ENGINE.redline)).toBeLessThan(engineTorque(ENGINE.torque.peakRpm))
  })

  it('multiplies torque by exactly what it divides speed by', () => {
    const rpm = 3000
    const out = outputRpmFor(rpm, '1')
    const r = driveline(rpm, out, '1', 1)
    expect(r.outputTorque / r.inputTorque).toBeCloseTo(ratioOf('1'), 9)
    expect(r.inputRpm / r.outputRpm).toBeCloseTo(ratioOf('1'), 9)
    expect(powerKw(r.outputTorque, Math.abs(r.outputRpm))).toBeCloseTo(r.powerKw, 9)
    expect(r.wheelTorque).toBeCloseTo(r.outputTorque * DRIVELINE.finalDrive, 9)
  })

  it('passes no torque in neutral or with the clutch out', () => {
    expect(driveline(3000, 0, 'N', 1).outputTorque).toBe(0)
    expect(driveline(3000, 1000, '2', 0).outputTorque).toBe(0)
    expect(outputRpmFor(3000, 'N')).toBe(0)
    expect(outputRpmFor(3000, 'R')).toBeLessThan(0)
  })

  it('turns output rpm into a road speed', () => {
    const kmh = carSpeedKmh(1000)
    expect(kmh).toBeCloseTo(((1000 / DRIVELINE.finalDrive) * DRIVELINE.tyreCircumference * 60) / 1000, 9)
    expect(carSpeedKmh(-500)).toBeLessThan(0)
  })

  it('walks the gate one notch at a time', () => {
    expect(nextGear('N', 1)).toBe('1')
    expect(nextGear('N', -1)).toBe('R')
    expect(nextGear('R', -1)).toBe('R')
    expect(nextGear('5', 1)).toBe('5')
    expect(nextGear('3', -1)).toBe('2')
  })

  it('refuses reverse while rolling', () => {
    expect(canSelect('R', '1', 800).ok).toBe(false)
    expect(canSelect('R', 'N', 10).ok).toBe(true)
    expect(canSelect('1', 'R', -400).ok).toBe(false)
    expect(canSelect('N', 'R', -400).ok).toBe(true)
    expect(canSelect('3', '2', 2000).ok).toBe(true)
  })
})

const controls = (over: Partial<GearboxControls> = {}): GearboxControls => ({ engineRpm: 3000, gear: '1', synchro: true, speed: 1, playing: true, ...over })

function run(state: ReturnType<typeof createGearboxSimState>, c: GearboxControls, seconds: number, dt = 1 / 60) {
  const events: number[] = []
  for (let t = 0; t < seconds; t += dt) {
    const e = stepGearbox(state, c, dt)
    if (e.engineRpm !== undefined) events.push(e.engineRpm)
  }
  return events
}

describe('stepGearbox', () => {
  it('starts locked in the requested gear at a consistent steady state', () => {
    const s = createGearboxSimState(3000, '2')
    expect(s.engaged).toBe('2')
    expect(s.inputRpm).toBe(3000)
    expect(s.outputRpm).toBeCloseTo(3000 / ratioOf('2'), 9)
    expect(s.sleeves['12']).toBe(HUB_OF['2'].side)
    expect(s.clutch).toBe(1)
  })

  it('spins the input at engine speed and the output through the ratio', () => {
    const s = createGearboxSimState(3000, '1')
    run(s, controls(), 1)
    expect(s.inputRpm).toBeCloseTo(3000, 3)
    expect(s.outputRpm).toBeCloseTo(3000 / ratioOf('1'), 3)
    expect(s.inputAngle).toBeCloseTo((3000 * 6) / GEARBOX_VISUAL_TIME_SCALE, 0)
    // Output shaft rides on the 1st gear wheel with the dogs interleaved.
    expect(s.outputAngle - lockedWheelAngle('1', s.inputAngle)).toBeCloseTo(s.lockOffset, 9)
  })

  it('does nothing while paused', () => {
    const s = createGearboxSimState(3000, '1')
    run(s, controls({ playing: false, gear: '2' }), 1)
    expect(s.inputAngle).toBe(0)
    expect(s.shift).toBeNull()
    expect(s.engaged).toBe('1')
  })

  it('shifts up: the car keeps rolling, the synchro slows the cluster, the clutch drops the revs', () => {
    const s = createGearboxSimState(4000, '1')
    run(s, controls({ engineRpm: 4000 }), 0.5)
    const carBefore = s.outputRpm
    const c = controls({ engineRpm: 4000, gear: '2' })
    const events = run(s, c, 0.7)
    // Mid-shift: clutch out, box in neutral, sleeve heading for 2nd.
    expect(s.shift).not.toBeNull()
    expect(s.clutch).toBe(0)
    expect(s.engaged).toBe('N')
    expect(Math.abs(s.outputRpm - carBefore) / carBefore).toBeLessThan(0.05)
    run(s, c, 1.5)
    expect(s.shift).toBeNull()
    expect(s.engaged).toBe('2')
    expect(events.length + run(s, c, 0.01).length).toBeGreaterThanOrEqual(0)
    // The engine was dragged down to what the wheels demand in 2nd.
    expect(s.engineOverride).not.toBeNull()
    const expected = carBefore * ratioOf('2')
    expect(s.engineRpm).toBeGreaterThan(ENGINE.idle)
    expect(Math.abs(s.engineRpm - expected) / expected).toBeLessThan(0.12)
    expect(s.outputRpm * ratioOf('2')).toBeCloseTo(s.inputRpm, 0)
    expect(s.crunches).toBe(0)
  })

  it('reports the rev drop once so the settings can adopt it', () => {
    const s = createGearboxSimState(4000, '1')
    const c = controls({ engineRpm: 4000, gear: '2' })
    const events = run(s, c, 3)
    expect(events).toHaveLength(1)
    expect(events[0]).toBeLessThan(4000)
    // Once the control catches up, the override lets go.
    stepGearbox(s, { ...c, engineRpm: events[0] }, 1 / 60)
    expect(s.engineOverride).toBeNull()
  })

  it('shows slip during the synchro phase and none once locked', () => {
    const s = createGearboxSimState(4000, '1')
    const c = controls({ engineRpm: 4000, gear: '2' })
    let maxSlip = 0
    for (let t = 0; t < 3; t += 1 / 60) {
      stepGearbox(s, c, 1 / 60)
      if (s.shift?.phase === 'synchro') maxSlip = Math.max(maxSlip, Math.abs(s.slipRpm))
    }
    expect(maxSlip).toBeGreaterThan(500)
    expect(s.slipRpm).toBe(0)
  })

  it('crunches without a synchro and counts it', () => {
    const s = createGearboxSimState(4000, '1')
    const c = controls({ engineRpm: 4000, gear: '2', synchro: false })
    const phases = new Set<string>()
    for (let t = 0; t < 4; t += 1 / 60) {
      stepGearbox(s, c, 1 / 60)
      if (s.shift) phases.add(s.shift.phase)
    }
    expect(phases.has('grind')).toBe(true)
    expect(phases.has('synchro')).toBe(false)
    expect(s.crunches).toBe(1)
    expect(s.engaged).toBe('2')
  })

  it('goes to neutral and coasts', () => {
    const s = createGearboxSimState(3000, '3')
    const c = controls({ engineRpm: 3000, gear: 'N' })
    const events = run(s, c, 2)
    expect(events).toHaveLength(0)
    expect(s.engaged).toBe('N')
    expect(s.shift).toBeNull()
    expect(s.clutch).toBe(1)
    expect(s.inputRpm).toBeCloseTo(3000, 0)
    const rolling = s.outputRpm
    expect(rolling).toBeGreaterThan(0)
    run(s, c, 5)
    expect(s.outputRpm).toBeLessThan(rolling)
    expect(s.outputRpm).toBeGreaterThan(0)
  })

  it('takes reverse from rest and turns the output backwards', () => {
    const s = createGearboxSimState(1500, 'N')
    const c = controls({ engineRpm: 1500, gear: 'R' })
    run(s, c, 3)
    expect(s.engaged).toBe('R')
    expect(s.outputRpm).toBeLessThan(0)
    expect(s.outputRpm).toBeCloseTo(s.inputRpm / signedRatio('R'), 3)
    expect(s.sleeves['5R']).toBe(HUB_OF.R.side)
  })

  it('queues a second lever move until the first shift is done', () => {
    const s = createGearboxSimState(3000, '1')
    const c2 = controls({ gear: '2' })
    run(s, c2, 0.3)
    const c3 = controls({ gear: '3' })
    run(s, c3, 0.4)
    expect(s.shift?.to).toBe('2')
    run(s, c3, 4)
    expect(s.engaged).toBe('3')
  })

  it('handles every gear-to-gear move without leaving a shift hanging', () => {
    const gears: GearId[] = ['N', '1', '2', '3', '4', '5']
    for (const from of gears) {
      for (const to of gears) {
        const s = createGearboxSimState(2500, from)
        run(s, controls({ engineRpm: 2500, gear: to }), 3)
        expect(s.shift).toBeNull()
        expect(s.engaged).toBe(to)
        expect(s.clutch).toBe(1)
        expect(Number.isFinite(s.outputAngle)).toBe(true)
      }
    }
  })
})
