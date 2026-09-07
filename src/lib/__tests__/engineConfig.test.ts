import { describe, expect, it } from 'vitest'
import { CYLINDERS, DEG_PER_FIRE, FIRING_ORDER, GEOMETRY, PIN_OFFSETS_DEG, bankAngleDeg, cylinderByNumber, cylinderZ, journalZ } from '../engineConfig'

describe('engineConfig', () => {
  it('defines eight cylinders numbered 1-8', () => {
    expect(CYLINDERS).toHaveLength(8)
    expect(CYLINDERS.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('puts odd cylinders on the left bank and even on the right', () => {
    for (const c of CYLINDERS) {
      expect(c.bank).toBe(c.number % 2 === 1 ? 'left' : 'right')
    }
  })

  it('pairs cylinders (1,2) (3,4) (5,6) (7,8) on shared crank throws', () => {
    expect(CYLINDERS.map((c) => c.journal)).toEqual([0, 0, 1, 1, 2, 2, 3, 3])
  })

  it('uses the classic crossplane firing order with even 90° spacing', () => {
    expect(FIRING_ORDER).toEqual([1, 8, 4, 3, 6, 5, 7, 2])
    expect(DEG_PER_FIRE).toBe(90)
    const fireAngles = FIRING_ORDER.map((n) => cylinderByNumber(n).fireAngle)
    expect(fireAngles).toEqual([0, 90, 180, 270, 360, 450, 540, 630])
  })

  it('derives crank pins 90° apart in a cross', () => {
    // 45, 135, 315, 225 → relative offsets 0, 90, 270, 180
    expect(PIN_OFFSETS_DEG).toEqual([45, 135, 315, 225])
    const sorted = [...PIN_OFFSETS_DEG].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBe(90)
  })

  it('has a 90° V (±45° banks)', () => {
    expect(bankAngleDeg('left') - bankAngleDeg('right')).toBe(90)
  })

  it('spaces journals evenly along Z and nudges paired rods apart', () => {
    expect(journalZ(1) - journalZ(0)).toBeCloseTo(GEOMETRY.journalSpacing)
    const c1 = cylinderByNumber(1)
    const c2 = cylinderByNumber(2)
    expect(cylinderZ(c2) - cylinderZ(c1)).toBeCloseTo(2 * GEOMETRY.rodOffset)
  })

  it('keeps the geometry physically sane', () => {
    // Rod must be longer than the crank throw or the mechanism locks up.
    expect(GEOMETRY.rodLength).toBeGreaterThan(GEOMETRY.crankRadius)
    // Piston at TDC must sit below the deck.
    const crownAtTDC = GEOMETRY.rodLength + GEOMETRY.crankRadius + GEOMETRY.pistonCentreOffset + GEOMETRY.pistonHeight / 2
    expect(crownAtTDC).toBeLessThan(GEOMETRY.deckDistance)
    // Piston fits in the bore.
    expect(GEOMETRY.pistonRadius).toBeLessThan(GEOMETRY.boreRadius)
  })
})
