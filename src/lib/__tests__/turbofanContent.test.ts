import { describe, expect, it } from 'vitest'
import { PHASE_INFO, TURBOFAN_PART_INFO, TURBOFAN_PART_LIST } from '../turbofanInfo'
import { PHASE_META, PHASE_ORDER, STAGE_ORDER } from '../turbofanConfig'

describe('turbofan part info', () => {
  it('covers every listed part with complete copy', () => {
    expect(TURBOFAN_PART_LIST).toHaveLength(8)
    for (const id of TURBOFAN_PART_LIST) {
      const info = TURBOFAN_PART_INFO[id]
      expect(info.id).toBe(id)
      expect(info.name).toBeTruthy()
      expect(info.tagline).toBeTruthy()
      expect(info.role.length).toBeGreaterThan(40)
      expect(info.details.length).toBeGreaterThanOrEqual(2)
      expect(info.kaypohFact.length).toBeGreaterThan(40)
    }
  })

  it('has an inspector entry for every stage plus the nacelle', () => {
    for (const stage of STAGE_ORDER) expect(TURBOFAN_PART_LIST).toContain(stage)
    expect(TURBOFAN_PART_LIST).toContain('nacelle')
  })
})

describe('phase info', () => {
  it('numbers suck-squeeze-bang-blow 1-4 in order', () => {
    expect(PHASE_ORDER.map((p) => PHASE_INFO[p].step)).toEqual([1, 2, 3, 4])
    expect(PHASE_ORDER.map((p) => PHASE_INFO[p].nick)).toEqual(['Suck', 'Squeeze', 'Bang', 'Blow'])
  })

  it('agrees with the config about which stages belong to each phase', () => {
    for (const p of PHASE_ORDER) {
      expect(PHASE_INFO[p].stages).toEqual(PHASE_META[p].stages)
      expect(PHASE_INFO[p].bullets.length).toBeGreaterThanOrEqual(3)
      expect(PHASE_INFO[p].body.length).toBeGreaterThan(100)
    }
  })
})
