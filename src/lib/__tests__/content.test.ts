import { describe, expect, it } from 'vitest'
import { MODULES, moduleById, ACTIVE_MODULE } from '../modules'
import { PART_INFO, PART_LIST } from '../partInfo'
import { STROKE_INFO } from '../strokeInfo'
import { STROKE_ORDER } from '../engineConfig'

describe('module catalog', () => {
  it('has unique ids and drawing numbers', () => {
    const ids = MODULES.map((m) => m.id)
    const codes = MODULES.map((m) => m.code)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has exactly one live module, the V8', () => {
    expect(MODULES.filter((m) => m.status === 'active')).toHaveLength(1)
    expect(ACTIVE_MODULE.id).toBe('v8-engine')
  })

  it('gives every module learning objectives and concepts', () => {
    for (const m of MODULES) {
      expect(m.learn.length).toBeGreaterThanOrEqual(3)
      expect(m.concepts.length).toBeGreaterThanOrEqual(3)
      expect(m.minutes).toBeGreaterThan(0)
      expect([1, 2, 3]).toContain(m.difficulty)
    }
  })

  it('gives drafts a progress percentage', () => {
    for (const m of MODULES.filter((m) => m.status === 'upcoming')) {
      expect(m.progress).toBeGreaterThanOrEqual(0)
      expect(m.progress).toBeLessThanOrEqual(100)
    }
  })

  it('looks modules up by id', () => {
    expect(moduleById('turbofan')?.name).toBe('Turbofan Jet Engine')
    expect(moduleById('nope')).toBeUndefined()
  })
})

describe('part info', () => {
  it('covers every listed part with complete copy', () => {
    for (const id of PART_LIST) {
      const info = PART_INFO[id]
      expect(info.id).toBe(id)
      expect(info.name).toBeTruthy()
      expect(info.role).toBeTruthy()
      expect(info.details.length).toBeGreaterThanOrEqual(2)
      expect(info.kaypohFact).toBeTruthy()
    }
  })
})

describe('stroke info', () => {
  it('numbers the four strokes 1-4 in cycle order', () => {
    expect(STROKE_ORDER.map((s) => STROKE_INFO[s].step)).toEqual([1, 2, 3, 4])
    expect(STROKE_ORDER.map((s) => STROKE_INFO[s].nick)).toEqual(['Suck', 'Squeeze', 'Bang', 'Blow'])
  })
})
