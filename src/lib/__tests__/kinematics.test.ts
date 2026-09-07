import { describe, expect, it } from 'vitest'
import { CYLINDERS, GEOMETRY, cylinderByNumber } from '../engineConfig'
import {
  BDC_DISTANCE,
  TDC_DISTANCE,
  activeCylinderAt,
  chamberPosition,
  combustionIntensity,
  computeAllCylinders,
  computeCylinderState,
  crankAngleForStroke,
  mod,
  strokeAtPhase,
  valveLift,
} from '../kinematics'

const { crankRadius: r, rodLength: l } = GEOMETRY

describe('mod', () => {
  it('wraps negatives into range', () => {
    expect(mod(-10, 720)).toBe(710)
    expect(mod(730, 720)).toBe(10)
    expect(mod(720, 720)).toBe(0)
  })
})

describe('strokeAtPhase', () => {
  it('maps the 720° cycle to power → exhaust → intake → compression', () => {
    expect(strokeAtPhase(0)).toBe('power')
    expect(strokeAtPhase(179.9)).toBe('power')
    expect(strokeAtPhase(180)).toBe('exhaust')
    expect(strokeAtPhase(360)).toBe('intake')
    expect(strokeAtPhase(540)).toBe('compression')
    expect(strokeAtPhase(719.9)).toBe('compression')
  })
})

describe('combustionIntensity', () => {
  it('is zero outside the flash window, rises fast, then decays', () => {
    expect(combustionIntensity(-1)).toBe(0)
    expect(combustionIntensity(200)).toBe(0)
    expect(combustionIntensity(6)).toBeCloseTo(1)
    expect(combustionIntensity(3)).toBeCloseTo(0.5)
    expect(combustionIntensity(30)).toBeLessThan(combustionIntensity(10))
    expect(combustionIntensity(30)).toBeGreaterThan(0)
  })
})

describe('valveLift', () => {
  it('only lifts the matching valve, peaking mid-stroke', () => {
    expect(valveLift('intake', 0.5, 'intake')).toBeCloseTo(1)
    expect(valveLift('intake', 0, 'intake')).toBeCloseTo(0)
    expect(valveLift('intake', 0.5, 'exhaust')).toBe(0)
    expect(valveLift('power', 0.5, 'intake')).toBe(0)
    expect(valveLift('exhaust', 0.5, 'exhaust')).toBeCloseTo(1)
  })
})

describe('computeCylinderState', () => {
  it.each(CYLINDERS.map((c) => [c.number, c] as const))('cylinder %i is exactly at TDC when it fires', (_, spec) => {
    const s = computeCylinderState(spec, spec.fireAngle)
    expect(s.travel).toBeCloseTo(1, 6)
    expect(s.pistonDistance).toBeCloseTo(TDC_DISTANCE, 6)
    expect(s.stroke).toBe('power')
    expect(s.phase).toBeCloseTo(0)
  })

  it.each(CYLINDERS.map((c) => [c.number, c] as const))('cylinder %i is at BDC 180° after firing', (_, spec) => {
    const s = computeCylinderState(spec, spec.fireAngle + 180)
    expect(s.travel).toBeCloseTo(0, 6)
    expect(s.pistonDistance).toBeCloseTo(BDC_DISTANCE, 6)
    expect(s.stroke).toBe('exhaust')
  })

  it('keeps the connecting rod at constant length for every crank angle', () => {
    for (const spec of CYLINDERS) {
      for (let deg = 0; deg < 720; deg += 7.5) {
        const s = computeCylinderState(spec, deg)
        const len = Math.hypot(s.piston.x - s.pin.x, s.piston.y - s.pin.y)
        expect(len).toBeCloseTo(l, 6)
      }
    }
  })

  it('keeps the crank pin on a circle of the crank radius', () => {
    const spec = cylinderByNumber(3)
    for (let deg = 0; deg < 720; deg += 15) {
      const s = computeCylinderState(spec, deg)
      expect(Math.hypot(s.pin.x, s.pin.y)).toBeCloseTo(r, 6)
    }
  })

  it('keeps the piston on its bank axis', () => {
    const spec = cylinderByNumber(1) // left bank, +45°
    for (let deg = 0; deg < 720; deg += 30) {
      const s = computeCylinderState(spec, deg)
      // left bank direction is (-sin45, cos45) → x = -y
      expect(s.piston.x).toBeCloseTo(-s.piston.y, 6)
      expect(s.piston.y).toBeGreaterThan(0)
    }
  })

  it('reports a rod angle that points from pin to piston', () => {
    const s = computeCylinderState(cylinderByNumber(1), 123)
    const dx = s.piston.x - s.pin.x
    const dy = s.piston.y - s.pin.y
    // rotating (0,1) by rodAngle about Z gives (-sin, cos); must be parallel to (dx, dy)
    const nx = -Math.sin(s.rodAngle)
    const ny = Math.cos(s.rodAngle)
    expect(nx * dy - ny * dx).toBeCloseTo(0, 6)
    expect(nx * dx + ny * dy).toBeGreaterThan(0)
  })

  it('has zero piston velocity at TDC and BDC and non-zero in between', () => {
    const spec = cylinderByNumber(1)
    expect(computeCylinderState(spec, spec.fireAngle).pistonVelocity).toBeCloseTo(0, 6)
    expect(computeCylinderState(spec, spec.fireAngle + 180).pistonVelocity).toBeCloseTo(0, 6)
    expect(computeCylinderState(spec, spec.fireAngle + 90).pistonVelocity).toBeLessThan(0) // moving toward BDC
    expect(computeCylinderState(spec, spec.fireAngle + 270).pistonVelocity).toBeGreaterThan(0) // moving toward TDC
  })

  it('strokeProgress runs 0→1 within each stroke', () => {
    const spec = cylinderByNumber(1)
    expect(computeCylinderState(spec, spec.fireAngle + 45).strokeProgress).toBeCloseTo(0.25)
    expect(computeCylinderState(spec, spec.fireAngle + 180 + 90).strokeProgress).toBeCloseTo(0.5)
  })

  it('shares a crank pin position between paired cylinders', () => {
    for (const j of [0, 1, 2, 3]) {
      const [a, b] = CYLINDERS.filter((c) => c.journal === j)
      const sa = computeCylinderState(a, 200)
      const sb = computeCylinderState(b, 200)
      expect(sa.pin.x).toBeCloseTo(sb.pin.x, 6)
      expect(sa.pin.y).toBeCloseTo(sb.pin.y, 6)
    }
  })
})

describe('computeAllCylinders', () => {
  it('returns one state per cylinder in order', () => {
    const all = computeAllCylinders(0)
    expect(all).toHaveLength(8)
    expect(all.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('has exactly one cylinder starting its power stroke every 90°', () => {
    for (let deg = 0; deg < 720; deg += 90) {
      const firing = computeAllCylinders(deg + 1).filter((s) => s.phase < 2)
      expect(firing).toHaveLength(1)
    }
  })
})

describe('activeCylinderAt', () => {
  it('follows the firing order', () => {
    expect(activeCylinderAt(0)).toBe(1)
    expect(activeCylinderAt(95)).toBe(8)
    expect(activeCylinderAt(185)).toBe(4)
    expect(activeCylinderAt(719)).toBe(2)
    expect(activeCylinderAt(725)).toBe(1)
  })
})

describe('crankAngleForStroke', () => {
  it('lands inside the requested stroke for the requested cylinder', () => {
    for (const spec of CYLINDERS) {
      for (const stroke of ['intake', 'compression', 'power', 'exhaust'] as const) {
        const deg = crankAngleForStroke(spec, stroke, 0.5)
        expect(computeCylinderState(spec, deg).stroke).toBe(stroke)
        expect(computeCylinderState(spec, deg).strokeProgress).toBeCloseTo(0.5)
      }
    }
  })
})

describe('chamberPosition', () => {
  it('sits just under the deck on the bank axis', () => {
    const p = chamberPosition(cylinderByNumber(2), 0.1)
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(GEOMETRY.deckDistance - 0.1)
    expect(p.x).toBeGreaterThan(0) // right bank is on +x
  })
})
