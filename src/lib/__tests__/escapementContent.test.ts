import { describe, expect, it } from 'vitest'
import { ESCAPEMENT_PART_INFO, ESCAPEMENT_PART_LIST, ESCAPEMENT_STEP_INFO } from '../escapementInfo'
import { STEP_ORDER } from '../escapementConfig'

describe('escapement part info', () => {
  it('covers every listed part with complete copy', () => {
    expect(ESCAPEMENT_PART_LIST).toHaveLength(9)
    for (const id of ESCAPEMENT_PART_LIST) {
      const info = ESCAPEMENT_PART_INFO[id]
      expect(info.id).toBe(id)
      expect(info.name).toBeTruthy()
      expect(info.tagline).toBeTruthy()
      expect(info.role.length).toBeGreaterThan(40)
      expect(info.details.length).toBeGreaterThanOrEqual(2)
      expect(info.kaypohFact.length).toBeGreaterThan(40)
    }
  })

  it('lists the parts from the balance down the energy path to the frame', () => {
    expect(ESCAPEMENT_PART_LIST[0]).toBe('balance')
    expect(ESCAPEMENT_PART_LIST).toContain('pallets')
    expect(ESCAPEMENT_PART_LIST[ESCAPEMENT_PART_LIST.length - 1]).toBe('plate')
  })
})

describe('step info', () => {
  it('numbers swing-unlock-impulse-lock 1-4 in order', () => {
    expect(STEP_ORDER.map((s) => ESCAPEMENT_STEP_INFO[s].step)).toEqual([1, 2, 3, 4])
    expect(STEP_ORDER.map((s) => ESCAPEMENT_STEP_INFO[s].nick)).toEqual(['Swing', 'Unlock', 'Impulse', 'Lock'])
  })

  it('gives each step a body, bullets and a 3D action', () => {
    for (const s of STEP_ORDER) {
      expect(ESCAPEMENT_STEP_INFO[s].bullets.length).toBeGreaterThanOrEqual(3)
      expect(ESCAPEMENT_STEP_INFO[s].body.length).toBeGreaterThan(100)
      expect(['cutaway', 'xray', 'pallet']).toContain(ESCAPEMENT_STEP_INFO[s].action.viewMode)
    }
    expect(ESCAPEMENT_STEP_INFO.impulse.action.viewMode).toBe('pallet')
  })
})
