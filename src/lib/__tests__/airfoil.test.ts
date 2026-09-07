import { describe, expect, it } from 'vitest'
import { airfoilSection, camberLine, naca4Thickness } from '../airfoil'

describe('naca4Thickness', () => {
  it('is zero at both ends and peaks near 30 % chord', () => {
    expect(naca4Thickness(0, 0.12)).toBe(0)
    expect(Math.abs(naca4Thickness(1, 0.12))).toBeLessThan(1e-3)
    let best = 0
    let bestX = 0
    for (let x = 0; x <= 1; x += 0.01) {
      const t = naca4Thickness(x, 0.12)
      if (t > best) {
        best = t
        bestX = x
      }
    }
    expect(bestX).toBeGreaterThan(0.25)
    expect(bestX).toBeLessThan(0.35)
    // Half thickness peaks at half the nominal thickness.
    expect(best).toBeCloseTo(0.06, 2)
  })
})

describe('camberLine', () => {
  it('is zero at the ends and maximal at mid-chord', () => {
    expect(camberLine(0, 0.1)).toBe(0)
    expect(camberLine(1, 0.1)).toBe(0)
    expect(camberLine(0.5, 0.1)).toBeCloseTo(0.1)
  })
})

describe('airfoilSection', () => {
  it('returns a closed loop with the upper surface above the lower', () => {
    const pts = airfoilSection({ thickness: 0.1, camber: 0.05, segments: 10 })
    expect(pts).toHaveLength(20)
    expect(pts[0].x).toBe(0)
    expect(pts[10].x).toBeCloseTo(1)
    const upper = pts.slice(0, 11)
    const lower = pts.slice(11)
    const meanUpper = upper.reduce((a, p) => a + p.y, 0) / upper.length
    const meanLower = lower.reduce((a, p) => a + p.y, 0) / lower.length
    expect(meanUpper).toBeGreaterThan(meanLower)
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1)
    }
  })
})
