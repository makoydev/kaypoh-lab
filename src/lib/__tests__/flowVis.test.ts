import { describe, expect, it } from 'vitest'
import { FLOW_X_END_BYPASS, FLOW_X_END_CORE, FLOW_X_START, exhaustGlow, flowSpeedAt, swirlRateAt, temperatureColor } from '../flowVis'
import { ENGINE_X_MAX, ENGINE_X_MIN, TF, stationById } from '../turbofanConfig'
import { computeTurbofanState } from '../turbofanModel'

describe('flowSpeedAt', () => {
  it('is always positive and faster at higher N1', () => {
    const idle = computeTurbofanState(20, 8)
    const takeoff = computeTurbofanState(100, 8)
    for (let x = FLOW_X_START; x <= FLOW_X_END_CORE; x += 0.25) {
      for (const stream of ['core', 'bypass'] as const) {
        expect(flowSpeedAt(idle, x, stream)).toBeGreaterThan(0)
        expect(flowSpeedAt(takeoff, x, stream)).toBeGreaterThan(flowSpeedAt(idle, x, stream))
      }
    }
  })

  it('speeds the jets up behind their exits', () => {
    const s = computeTurbofanState(80, 8)
    expect(flowSpeedAt(s, stationById('8').x + 0.5, 'core')).toBeGreaterThan(flowSpeedAt(s, TF.fan.x, 'core'))
    expect(flowSpeedAt(s, stationById('13').x + 0.5, 'bypass')).toBeGreaterThan(flowSpeedAt(s, TF.fan.x, 'bypass'))
    // The core jet is the faster of the two, as in the model.
    expect(flowSpeedAt(s, FLOW_X_END_CORE, 'core')).toBeGreaterThan(flowSpeedAt(s, FLOW_X_END_BYPASS, 'bypass'))
  })

  it('brackets the whole engine', () => {
    expect(FLOW_X_START).toBeLessThan(ENGINE_X_MIN)
    expect(FLOW_X_END_CORE).toBeGreaterThan(ENGINE_X_MAX)
    expect(FLOW_X_END_BYPASS).toBeGreaterThan(TF.nacelle.xEnd)
  })
})

describe('swirlRateAt', () => {
  it('is zero ahead of the fan and non-negative everywhere', () => {
    const s = computeTurbofanState(70, 8)
    expect(swirlRateAt(s, TF.fan.x - 1, 'core')).toBe(0)
    for (let x = FLOW_X_START; x <= FLOW_X_END_CORE; x += 0.3) {
      expect(swirlRateAt(s, x, 'core')).toBeGreaterThanOrEqual(0)
      expect(swirlRateAt(s, x, 'bypass')).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('temperatureColor', () => {
  it('goes from blue through ember to near white as it heats up', () => {
    const cold = temperatureColor(288)
    const warm = temperatureColor(800)
    const hot = temperatureColor(1750)
    expect(cold[2]).toBeGreaterThan(cold[0]) // more blue than red
    expect(warm[0]).toBeGreaterThan(warm[2]) // more red than blue
    expect(hot[0] + hot[1] + hot[2]).toBeGreaterThan(warm[0] + warm[1] + warm[2]) // brighter
    for (const c of [cold, warm, hot]) for (const v of c) expect(v).toBeGreaterThanOrEqual(0)
    for (const c of [cold, warm, hot]) for (const v of c) expect(v).toBeLessThanOrEqual(1)
  })

  it('clamps outside the ramp', () => {
    expect(temperatureColor(0)).toEqual(temperatureColor(260))
    expect(temperatureColor(9000)).toEqual(temperatureColor(1800))
  })
})

describe('exhaustGlow', () => {
  it('is faint at idle and stronger at takeoff, never above 1', () => {
    const idle = exhaustGlow(computeTurbofanState(20, 8))
    const takeoff = exhaustGlow(computeTurbofanState(100, 8))
    expect(idle).toBeGreaterThanOrEqual(0)
    expect(takeoff).toBeGreaterThan(idle)
    expect(takeoff).toBeLessThanOrEqual(1)
    // A low bypass ratio means a hotter core jet.
    expect(exhaustGlow(computeTurbofanState(100, 2))).toBeGreaterThan(exhaustGlow(computeTurbofanState(100, 12)))
  })
})
