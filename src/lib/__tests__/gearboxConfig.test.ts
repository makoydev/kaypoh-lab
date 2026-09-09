import { describe, expect, it } from 'vitest'
import {
  DRIVE_RATIO,
  FREEWHEEL_GEARS,
  GB,
  GEARS,
  GEAR_ORDER,
  HUB_OF,
  HUB_X,
  IDLER_CENTRE,
  MESHES,
  REVERSE_MODULE,
  SPEED_GEARS,
  TEETH,
  directionOf,
  gearX,
  hubOf,
  ratioOf,
  signedRatio,
} from '../gearboxConfig'

const dist = (a: { y: number; z: number }, b: { y: number; z: number }) => Math.hypot(a.y - b.y, a.z - b.z)

describe('gear ratios', () => {
  it('orders the forward gears from shortest to tallest with 4th direct', () => {
    expect(ratioOf('1')).toBeGreaterThan(ratioOf('2'))
    expect(ratioOf('2')).toBeGreaterThan(ratioOf('3'))
    expect(ratioOf('3')).toBeGreaterThan(ratioOf('4'))
    expect(ratioOf('4')).toBe(1)
    expect(ratioOf('5')).toBeLessThan(1)
    expect(ratioOf('N')).toBe(0)
  })

  it('lands near a real five-speed', () => {
    expect(ratioOf('1')).toBeCloseTo(3.16, 1)
    expect(ratioOf('2')).toBeCloseTo(1.9, 1)
    expect(ratioOf('3')).toBeCloseTo(1.35, 1)
    expect(ratioOf('5')).toBeCloseTo(0.84, 1)
    expect(ratioOf('R')).toBeCloseTo(3.63, 1)
    expect(DRIVE_RATIO).toBeCloseTo(32 / 21, 6)
  })

  it('makes reverse the only gear that turns the other way', () => {
    for (const g of SPEED_GEARS) expect(directionOf(g)).toBe(g === 'R' ? -1 : 1)
    expect(directionOf('N')).toBe(0)
    expect(signedRatio('R')).toBeLessThan(0)
    expect(signedRatio('1')).toBeGreaterThan(0)
  })

  it('derives every ratio from tooth counts, not from a table', () => {
    for (const g of ['1', '2', '3', '5', 'R'] as const) {
      const p = TEETH.pairs[g]
      expect(ratioOf(g)).toBeCloseTo((TEETH.counterDrive / TEETH.input) * (p.output / p.counter), 10)
    }
  })
})

describe('geometry', () => {
  it('has every meshing pair spanning exactly its centre distance', () => {
    for (const { driver, driven } of MESHES) {
      const a = GEARS[driver]
      const b = GEARS[driven]
      expect(a.radius + b.radius).toBeCloseTo(dist(a.centre, b.centre), 9)
      expect(a.x).toBeCloseTo(b.x, 9)
      expect(a.module).toBeCloseTo(b.module, 9)
    }
  })

  it('puts the reverse idler one centre distance from the output and its own distance from the countershaft', () => {
    expect(dist(IDLER_CENTRE, { y: 0, z: 0 })).toBeCloseTo(GB.centreDistance, 9)
    expect(dist(IDLER_CENTRE, { y: -GB.centreDistance, z: 0 })).toBeCloseTo((REVERSE_MODULE * (TEETH.pairs.R.counter + TEETH.pairs.R.idler)) / 2, 9)
    expect(IDLER_CENTRE.z).toBeGreaterThan(0)
    // The counter and output reverse gears must not touch each other directly.
    expect(GEARS.counterR.radius + GEARS.outputR.radius).toBeLessThan(GB.centreDistance - 0.05)
  })

  it('keeps every wheel clear of its shaft and inside the case', () => {
    for (const g of Object.values(GEARS)) {
      const root = g.radius - 1.25 * g.module
      expect(root).toBeGreaterThan(g.bore + 0.05)
      const tip = g.radius + g.module
      expect(g.centre.y + tip).toBeLessThan(GB.case.top - GB.case.wall)
      expect(g.centre.y - tip).toBeGreaterThan(GB.case.bottom + GB.case.wall)
      expect(Math.abs(g.centre.z) + tip).toBeLessThan(GB.case.halfWidth - GB.case.wall)
    }
  })

  it('keeps the dog collar inside every output gear root', () => {
    for (const g of FREEWHEEL_GEARS) {
      const w = GEARS[`output${g}`]
      expect(w.radius - 1.25 * w.module).toBeGreaterThan(GB.dog.outerRadius)
    }
    expect(GEARS.input.radius - 1.25 * GEARS.input.module).toBeGreaterThan(GB.dog.outerRadius)
  })

  it('spaces gears and hubs so nothing on the main axis overlaps', () => {
    const spans: [number, number][] = []
    for (const g of SPEED_GEARS) spans.push([gearX(g) - GB.faceWidth / 2, gearX(g) + GB.faceWidth / 2])
    for (const x of Object.values(HUB_X)) spans.push([x - GB.sleeve.width / 2, x + GB.sleeve.width / 2])
    spans.sort((a, b) => a[0] - b[0])
    for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBeGreaterThanOrEqual(spans[i - 1][1] + GB.synchroGap - 1e-9)
    expect(spans[0][0]).toBeGreaterThan(GB.shafts.counter.xStart)
    expect(spans[spans.length - 1][1]).toBeLessThan(GB.case.xEnd)
  })

  it('gives each hub one gear either side', () => {
    for (const g of SPEED_GEARS) {
      const { hub, side } = HUB_OF[g]
      expect(Math.sign(gearX(g) - HUB_X[hub])).toBe(side)
      expect(hubOf(g)).toBe(hub)
    }
    expect(hubOf('N')).toBeNull()
    expect(GEAR_ORDER).toEqual(['R', 'N', '1', '2', '3', '4', '5'])
  })
})
