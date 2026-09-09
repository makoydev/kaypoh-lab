import { describe, expect, it } from 'vitest'
import { GEARBOX_PART_INFO, GEARBOX_PART_LIST, STEP_INFO } from '../gearboxInfo'
import { STEP_ORDER } from '../gearboxConfig'

describe('gearbox part info', () => {
  it('covers every listed part with complete copy', () => {
    expect(GEARBOX_PART_LIST).toHaveLength(9)
    for (const id of GEARBOX_PART_LIST) {
      const info = GEARBOX_PART_INFO[id]
      expect(info.id).toBe(id)
      expect(info.name).toBeTruthy()
      expect(info.tagline).toBeTruthy()
      expect(info.role.length).toBeGreaterThan(40)
      expect(info.details.length).toBeGreaterThanOrEqual(2)
      expect(info.kaypohFact.length).toBeGreaterThan(40)
    }
  })

  it('lists the parts a learner meets in order along the box', () => {
    expect(GEARBOX_PART_LIST[0]).toBe('clutch')
    expect(GEARBOX_PART_LIST).toContain('synchro')
    expect(GEARBOX_PART_LIST[GEARBOX_PART_LIST.length - 1]).toBe('casing')
  })
})

describe('step info', () => {
  it('numbers mesh-neutral-synchro-lock 1-4 in order', () => {
    expect(STEP_ORDER.map((s) => STEP_INFO[s].step)).toEqual([1, 2, 3, 4])
    expect(STEP_ORDER.map((s) => STEP_INFO[s].nick)).toEqual(['Mesh', 'Neutral', 'Synchro', 'Lock'])
  })

  it('gives each step a body, bullets and a 3D action', () => {
    for (const s of STEP_ORDER) {
      expect(STEP_INFO[s].bullets.length).toBeGreaterThanOrEqual(3)
      expect(STEP_INFO[s].body.length).toBeGreaterThan(100)
      expect(['cutaway', 'xray', 'synchro']).toContain(STEP_INFO[s].action.viewMode)
    }
    expect(STEP_INFO.synchro.action.viewMode).toBe('synchro')
    expect(STEP_INFO.neutral.action.gear).toBe('N')
  })
})
