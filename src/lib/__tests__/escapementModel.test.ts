import { describe, expect, it } from 'vitest'
import {
  LIFT_ANGLE,
  MIN_RUNNING_AMPLITUDE,
  activeTipAngle,
  bankingPinPositions,
  createEscapementSimState,
  escapementFrame,
  forkAngleFor,
  impulsePin,
  landingsBy,
  len,
  palletStoneOutline,
  palletWorkingEdge,
  pinInNotch,
  polar,
  rawForkAngle,
  rot,
  setPhase,
  stepBeats,
  stepEscapement,
  sub,
  toothTipAngles,
  wheelAdvance,
  WHEEL_CENTRE,
  add,
  forkAngleAt,
} from '../escapementModel'
import {
  ACTION,
  ADVANCE_PER_BEAT,
  BANKED_FORK_ANGLE,
  BANKING_HALF_ANGLE,
  BEAT_RATES,
  ESC,
  ESCAPE_ANGLE_0,
  ESCAPEMENT_VISUAL_TIME_SCALE,
  LOCK_ANGLE,
  MAINSPRING,
  TOOTH_PITCH,
  amplitudeFor,
  beatPeriod,
  curbPinShift,
  escapeRpm,
  frequencyHz,
  secondsRatio,
} from '../escapementConfig'

const mod360 = (a: number) => ((a % 360) + 360) % 360
const nearTooth = (escapeAngle: number, target: number) => toothTipAngles(escapeAngle).some((t) => Math.abs(mod360(t - target + 180) - 180) < 1e-6)

describe('plane helpers', () => {
  it('polar and rot follow Three’s rotation.y convention', () => {
    const p = polar(2, 90)
    expect(p.x).toBeCloseTo(0, 9)
    expect(p.z).toBeCloseTo(-2, 9)
    const r = rot(90, { x: 1, z: 0 })
    expect(r.x).toBeCloseTo(0, 9)
    expect(r.z).toBeCloseTo(-1, 9)
    const back = rot(-37, rot(37, { x: 0.3, z: -0.8 }))
    expect(back.x).toBeCloseTo(0.3, 9)
    expect(back.z).toBeCloseTo(-0.8, 9)
  })
})

describe('balance → fork', () => {
  it('points the pin at the fork at rest and turns the fork the other way', () => {
    expect(rawForkAngle(0)).toBeCloseTo(0, 9)
    expect(rawForkAngle(10)).toBeLessThan(0)
    expect(rawForkAngle(-10)).toBeGreaterThan(0)
    expect(rawForkAngle(10)).toBeCloseTo(-rawForkAngle(-10), 9)
    expect(impulsePin(0).x).toBeCloseTo(ESC.balance.x - ESC.roller.pinRadius, 9)
  })

  it('has a plausible lift angle and clamps at the banking pins', () => {
    expect(LIFT_ANGLE).toBeGreaterThan(40)
    expect(LIFT_ANGLE).toBeLessThan(65)
    expect(forkAngleFor(LIFT_ANGLE / 2)).toBeCloseTo(-BANKING_HALF_ANGLE, 6)
    expect(forkAngleFor(200)).toBe(-BANKING_HALF_ANGLE)
    expect(forkAngleFor(-200)).toBe(BANKING_HALF_ANGLE)
    expect(pinInNotch(0)).toBe(true)
    expect(pinInNotch(LIFT_ANGLE / 2 + 1)).toBe(false)
    expect(MAINSPRING.minAmplitude).toBeGreaterThan(MIN_RUNNING_AMPLITUDE)
  })

  it('is monotone while the pin is in the notch', () => {
    let prev = forkAngleFor(-LIFT_ANGLE / 2)
    for (let a = -LIFT_ANGLE / 2; a <= LIFT_ANGLE / 2; a += 0.5) {
      const f = forkAngleFor(a)
      expect(f).toBeLessThanOrEqual(prev + 1e-9)
      prev = f
    }
  })
})

describe('wheel advance profile', () => {
  it('recoils, impulses, drops and locks for exactly half a pitch', () => {
    expect(wheelAdvance(0)).toBeCloseTo(0, 12)
    expect(wheelAdvance(ACTION.unlockEnd)).toBeCloseTo(-ACTION.recoil, 9)
    expect(wheelAdvance(ACTION.impulseEnd)).toBeCloseTo(-ACTION.recoil + ACTION.impulse, 9)
    expect(wheelAdvance(ACTION.dropEnd)).toBeCloseTo(ADVANCE_PER_BEAT - ACTION.recoil, 9)
    expect(wheelAdvance(1)).toBeCloseTo(ADVANCE_PER_BEAT, 9)
    expect(ADVANCE_PER_BEAT).toBe(12)
  })

  it('never goes backwards by more than the draw', () => {
    let min = Infinity
    let prev = wheelAdvance(0)
    for (let s = 0; s <= 1; s += 0.001) {
      const w = wheelAdvance(s)
      min = Math.min(min, w)
      if (s > ACTION.unlockEnd) expect(w).toBeGreaterThanOrEqual(prev - 1e-3)
      prev = w
    }
    expect(min).toBeCloseTo(-ACTION.recoil, 6)
  })
})

describe('escapementFrame', () => {
  const A = 280

  it('starts with the exit pallet locked and the wheel parked on a tooth', () => {
    const f = escapementFrame(-Math.PI / 2, A)
    expect(f.beat).toBe(0)
    expect(f.pallet).toBe('exit')
    expect(f.s).toBe(0)
    expect(f.phase).toBe('free')
    expect(f.forkAngle).toBe(BANKED_FORK_ANGLE.exit)
    expect(nearTooth(f.escapeAngle, LOCK_ANGLE.exit)).toBe(true)
  })

  it('locks the entry pallet at the end of the first beat and advances half a pitch', () => {
    const f = escapementFrame(Math.PI / 2 - 1e-9, A)
    expect(f.beat).toBe(0)
    expect(f.s).toBeCloseTo(1, 6)
    expect(f.forkAngle).toBe(BANKED_FORK_ANGLE.entry)
    expect(f.escapeAngle - ESCAPE_ANGLE_0).toBeCloseTo(ADVANCE_PER_BEAT, 6)
    expect(nearTooth(f.escapeAngle, LOCK_ANGLE.entry)).toBe(true)
    const g = escapementFrame(Math.PI / 2 + 1e-9, A)
    expect(g.beat).toBe(1)
    expect(g.pallet).toBe('entry')
    expect(g.s).toBeCloseTo(0, 6)
  })

  it('advances one full tooth pitch per oscillation, continuously', () => {
    let prev = escapementFrame(-Math.PI / 2, A)
    for (let p = -Math.PI / 2; p <= 3.5 * Math.PI; p += 0.002) {
      const f = escapementFrame(p, A)
      const d = f.escapeAngle - prev.escapeAngle
      expect(Math.abs(d)).toBeLessThan(0.5)
      expect(d).toBeGreaterThan(-0.1)
      prev = f
    }
    expect(escapementFrame(1.5 * Math.PI, A).escapeAngle - escapementFrame(-0.5 * Math.PI, A).escapeAngle).toBeCloseTo(TOOTH_PITCH, 6)
  })

  it('keeps the wheel locked and the fork banked through the supplementary arc', () => {
    for (const p of [-1.2, -1.0, 1.0, 1.3, Math.PI - 1.1]) {
      const f = escapementFrame(p, A)
      expect(Math.abs(f.balanceAngle)).toBeGreaterThan(LIFT_ANGLE / 2)
      expect(f.phase).toBe('free')
      expect(Math.abs(f.forkAngle)).toBe(BANKING_HALF_ANGLE)
      expect(Math.abs(((f.escapeAngle - ESCAPE_ANGLE_0) / ADVANCE_PER_BEAT) % 1)).toBeLessThan(1e-9)
    }
  })

  it('walks unlock → impulse → drop → lock inside the notch', () => {
    const seen = new Set<string>()
    for (let p = -Math.PI / 2; p <= Math.PI / 2; p += 0.001) seen.add(escapementFrame(p, A).phase)
    expect([...seen].sort()).toEqual(['drop', 'free', 'impulse', 'lock', 'unlock'])
    expect(escapementFrame(0, A).phase).toBe('impulse')
  })

  it('counts landings once per beat, at the end of the drop', () => {
    expect(landingsBy(escapementFrame(-Math.PI / 2, A))).toBe(0)
    expect(landingsBy(escapementFrame(0, A))).toBe(0)
    expect(landingsBy(escapementFrame(Math.PI / 2 - 0.01, A))).toBe(1)
    expect(landingsBy(escapementFrame(Math.PI, A))).toBe(1)
    expect(landingsBy(escapementFrame(1.5 * Math.PI - 0.01, A))).toBe(2)
  })
})

describe('pallet jewels', () => {
  it('have their lock point on the tooth-tip circle when banked and clear of it on the other banking', () => {
    for (const pallet of ['entry', 'exit'] as const) {
      const edge = palletWorkingEdge(pallet)
      const lockWorld = rot(BANKED_FORK_ANGLE[pallet], edge[0])
      expect(len(sub(lockWorld, WHEEL_CENTRE))).toBeCloseTo(ESC.escapeWheel.tipRadius, 6)
      const other = pallet === 'entry' ? 'exit' : 'entry'
      const awayWorld = rot(BANKED_FORK_ANGLE[other], edge[0])
      expect(len(sub(awayWorld, WHEEL_CENTRE))).toBeGreaterThan(ESC.escapeWheel.tipRadius + 0.05)
      // Let-off corner sits deeper in the wheel than the lock corner, in the jewel's own frame.
      expect(len(sub(edge[edge.length - 1], WHEEL_CENTRE))).toBeLessThan(len(sub(edge[0], WHEEL_CENTRE)))
    }
  })

  it('touch the tooth they are working on throughout the action', () => {
    for (const pallet of ['entry', 'exit'] as const) {
      const edge = palletWorkingEdge(pallet, 20)
      edge.forEach((p, i) => {
        const s = (ACTION.impulseEnd * i) / 20
        const world = rot(forkAngleAt(pallet, s), p)
        const tip = add(WHEEL_CENTRE, polar(ESC.escapeWheel.tipRadius, activeTipAngle(pallet, s)))
        expect(len(sub(world, tip))).toBeLessThan(1e-9)
      })
    }
  })

  it('produce a closed, finite outline with a body', () => {
    for (const pallet of ['entry', 'exit'] as const) {
      const outline = palletStoneOutline(pallet)
      expect(outline.length).toBeGreaterThan(20)
      for (const p of outline) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.z)).toBe(true)
      }
      const edge = palletWorkingEdge(pallet)
      const body = outline[outline.length - 2]
      expect(len(sub(body, edge[0]))).toBeGreaterThan(ESC.stones.thickness * 0.9)
    }
  })

  it('places banking pins symmetrically, just outside the lever flank', () => {
    const pins = bankingPinPositions()
    expect(pins.entry.x).toBeCloseTo(pins.exit.x, 9)
    expect(pins.entry.z).toBeCloseTo(-pins.exit.z, 9)
    expect(Math.abs(pins.exit.z)).toBeGreaterThan(ESC.fork.armWidth / 2)
  })
})

describe('timekeeping constants', () => {
  it('turns real beat rates into frequencies and whole-number train ratios', () => {
    expect(frequencyHz(28800)).toBe(4)
    expect(beatPeriod(28800)).toBe(0.125)
    expect(escapeRpm(28800)).toBe(16)
    for (const r of BEAT_RATES) expect(Number.isInteger(secondsRatio(r))).toBe(true)
  })

  it('maps the mainspring to amplitude and the regulator to a small curb-pin move', () => {
    expect(amplitudeFor(MAINSPRING.minWind)).toBe(MAINSPRING.minAmplitude)
    expect(amplitudeFor(MAINSPRING.maxWind)).toBe(MAINSPRING.maxAmplitude)
    expect(amplitudeFor(-50)).toBe(MAINSPRING.minAmplitude)
    expect(curbPinShift(0)).toBe(0)
    expect(curbPinShift(240)).toBeGreaterThan(5)
    expect(curbPinShift(240)).toBeLessThan(40)
    expect(curbPinShift(-240)).toBeLessThan(0)
  })
})

describe('stepEscapement', () => {
  const controls = { beatRate: 28800 as const, wind: 80, regulator: 0, speed: 1, playing: true }

  it('does nothing when paused', () => {
    const s = createEscapementSimState(28800, 80)
    const before = { ...s }
    stepEscapement(s, { ...controls, playing: false }, 0.5)
    expect(s).toEqual(before)
  })

  it('ticks once per beat at the scene time scale and keeps watch time', () => {
    const s = createEscapementSimState(28800, 80)
    const sceneBeat = beatPeriod(28800) * ESCAPEMENT_VISUAL_TIME_SCALE
    let ticks = 0
    for (let t = 0; t < sceneBeat * 4; t += 1 / 120) {
      const e = stepEscapement(s, controls, 1 / 120)
      if (e.tick) ticks++
    }
    expect(ticks).toBe(4)
    expect(s.beats).toBe(4)
    expect(s.watchSeconds).toBeCloseTo(4 * beatPeriod(28800), 9)
    expect(s.escapeAngle - ESCAPE_ANGLE_0).toBeGreaterThan(3 * ADVANCE_PER_BEAT)
    expect(s.lastLanding).toBe('exit')
  })

  it('alternates landings entry, exit, entry…', () => {
    const s = createEscapementSimState(28800, 80)
    const landings: string[] = []
    for (let i = 0; i < 400; i++) {
      const e = stepEscapement(s, controls, 1 / 60)
      if (e.tick) landings.push(e.tick)
    }
    expect(landings.slice(0, 4)).toEqual(['entry', 'exit', 'entry', 'exit'])
  })

  it('follows the mainspring into a new amplitude without changing the rate', () => {
    const slow = createEscapementSimState(28800, 100)
    const fast = createEscapementSimState(28800, 100)
    for (let i = 0; i < 600; i++) {
      stepEscapement(slow, { ...controls, wind: 20 }, 1 / 60)
      stepEscapement(fast, { ...controls, wind: 100 }, 1 / 60)
    }
    expect(slow.amplitude).toBeLessThan(amplitudeFor(20) + 2)
    expect(fast.amplitude).toBeCloseTo(amplitudeFor(100), 3)
    expect(slow.phase).toBeCloseTo(fast.phase, 9)
    expect(slow.beats).toBe(fast.beats)
  })

  it('runs fast with a positive regulator setting', () => {
    const a = createEscapementSimState(28800, 80)
    const b = createEscapementSimState(28800, 80)
    for (let i = 0; i < 300; i++) {
      stepEscapement(a, controls, 1 / 60)
      stepEscapement(b, { ...controls, regulator: 240 }, 1 / 60)
    }
    const p0 = -Math.PI / 2
    expect((b.phase - p0) / (a.phase - p0)).toBeCloseTo(1 + 240 / 86400, 6)
    expect(b.frequencyHz).toBeGreaterThan(a.frequencyHz)
  })

  it('steps whole and fractional beats while paused', () => {
    const s = createEscapementSimState(28800, 80)
    stepBeats(s, 1, 28800)
    expect(s.beats).toBe(1)
    expect(s.escapeAngle - ESCAPE_ANGLE_0).toBeCloseTo(ADVANCE_PER_BEAT, 6)
    stepBeats(s, -0.5, 28800)
    expect(s.escPhase).toBe('impulse')
    setPhase(s, -Math.PI / 2, 28800)
    expect(s.beats).toBe(0)
    expect(s.escapeAngle).toBeCloseTo(ESCAPE_ANGLE_0, 9)
  })
})
