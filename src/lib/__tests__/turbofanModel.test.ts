import { describe, expect, it } from 'vitest'
import { BPR, CYCLE, N1, SPOOL_RPM, STAGE_ORDER, TURBOFAN_VISUAL_TIME_SCALE, n2FromN1 } from '../turbofanConfig'
import {
  advanceSpools,
  combustorTemperatureRise,
  compressionTemperatureRatio,
  computeTurbofan,
  computeTurbofanState,
  expansionPressureRatio,
  fanDesignPressureRatio,
  jetVelocity,
  pressureRatioAtSpeed,
  stationOf,
  temperatureAt,
} from '../turbofanModel'

const N1_SWEEP = [20, 30, 40, 50, 60, 70, 80, 90, 100]
const BPR_SWEEP = [2, 4, 6, 8, 10, 12]
const T = (n1: number, bpr: number) => {
  const s = computeTurbofanState(n1, bpr)
  return (id: Parameters<typeof stationOf>[1]) => stationOf(s, id).temperatureK
}
const P = (n1: number, bpr: number) => {
  const s = computeTurbofanState(n1, bpr)
  return (id: Parameters<typeof stationOf>[1]) => stationOf(s, id).pressureRatio
}

describe('component relations', () => {
  it('pressure ratio is 1 at rest and the design value at 100 %', () => {
    expect(pressureRatioAtSpeed(11, 0)).toBe(1)
    expect(pressureRatioAtSpeed(11, 1)).toBe(11)
    expect(pressureRatioAtSpeed(11, 0.5)).toBeCloseTo(3.5)
  })

  it('compression heats the air, expansion to the same ratio cools it', () => {
    expect(compressionTemperatureRatio(1)).toBe(1)
    expect(compressionTemperatureRatio(10)).toBeGreaterThan(1.8)
    expect(expansionPressureRatio(1)).toBe(1)
    expect(expansionPressureRatio(0.8)).toBeLessThan(0.8)
  })

  it('jet velocity is zero without pressure and grows with it', () => {
    expect(jetVelocity(300, 1, 1.4, 1005)).toBe(0)
    expect(jetVelocity(300, 0.9, 1.4, 1005)).toBe(0)
    const v1 = jetVelocity(330, 1.4, 1.4, 1005)
    const v2 = jetVelocity(330, 1.8, 1.4, 1005)
    expect(v1).toBeGreaterThan(200)
    expect(v2).toBeGreaterThan(v1)
  })

  it('gentler fans go with higher bypass ratios', () => {
    expect(fanDesignPressureRatio(2)).toBeGreaterThan(fanDesignPressureRatio(12))
    expect(fanDesignPressureRatio(BPR.max)).toBeGreaterThan(1.3)
    expect(fanDesignPressureRatio(BPR.min)).toBeLessThan(1.8)
  })

  it('schedules fuel between idle and takeoff', () => {
    expect(combustorTemperatureRise(1)).toBe(CYCLE.combustor.maxTemperatureRise)
    expect(combustorTemperatureRise(0)).toBeCloseTo(CYCLE.combustor.maxTemperatureRise * CYCLE.combustor.idleFraction)
  })

  it('maps N2 monotonically from N1 and meets it at 100 %', () => {
    expect(n2FromN1(100)).toBe(100)
    expect(n2FromN1(N1.idle)).toBeGreaterThan(N1.idle)
    for (let n = N1.idle; n < N1.max; n++) expect(n2FromN1(n + 1)).toBeGreaterThan(n2FromN1(n))
  })
})

describe('computeTurbofanState', () => {
  it('temperature rises through compression and combustion, then falls through the turbines', () => {
    for (const n1 of [N1.idle, 60, N1.max]) {
      for (const bpr of [BPR.min, BPR.default, BPR.max]) {
        const t = T(n1, bpr)
        expect(t('2')).toBe(CYCLE.ambient.temperatureK)
        expect(t('21')).toBeGreaterThan(t('2'))
        expect(t('25')).toBeGreaterThan(t('21'))
        expect(t('3')).toBeGreaterThan(t('25'))
        expect(t('4')).toBeGreaterThan(t('3'))
        expect(t('45')).toBeLessThan(t('4'))
        expect(t('5')).toBeLessThan(t('45'))
        expect(t('8')).toBeLessThanOrEqual(t('5'))
        expect(t('13')).toBe(t('21'))
      }
    }
  })

  it('pressure builds through the compressors and drains through the turbines', () => {
    const p = P(100, 8)
    expect(p('0')).toBe(1)
    expect(p('21')).toBeGreaterThan(p('2'))
    expect(p('25')).toBeGreaterThan(p('21'))
    expect(p('3')).toBeGreaterThan(p('25'))
    expect(p('4')).toBeLessThan(p('3'))
    expect(p('45')).toBeLessThan(p('4'))
    expect(p('5')).toBeLessThan(p('45'))
    expect(p('8')).toBeLessThan(p('5'))
    expect(p('8')).toBeGreaterThan(1)
  })

  it('stage pressure ratios multiply to the overall pressure ratio', () => {
    for (const n1 of N1_SWEEP) {
      const s = computeTurbofanState(n1, 8)
      const product = s.stages.fan.pressureRatio * s.stages.booster.pressureRatio * s.stages.hpCompressor.pressureRatio
      expect(product).toBeCloseTo(s.overallPressureRatio, 9)
      expect(product).toBeCloseTo(stationOf(s, '3').pressureRatio, 9)
    }
  })

  it('reaches a believable takeoff cycle', () => {
    const s = computeTurbofanState(100, 8)
    expect(s.overallPressureRatio).toBeGreaterThan(25)
    expect(s.overallPressureRatio).toBeLessThan(45)
    const t4 = stationOf(s, '4').temperatureK
    expect(t4).toBeGreaterThan(1600)
    expect(t4).toBeLessThan(1900)
    expect(s.thrust.total).toBeGreaterThan(100_000)
    expect(s.thrust.total).toBeLessThan(250_000)
    expect(s.jetVelocity.bypass).toBeGreaterThan(200)
    expect(s.jetVelocity.bypass).toBeLessThan(350)
    expect(s.jetVelocity.core).toBeGreaterThan(s.jetVelocity.bypass)
    expect(s.tsfc).toBeGreaterThan(6)
    expect(s.tsfc).toBeLessThan(14)
  })

  it('makes most of its thrust with the fan once it is off idle', () => {
    for (const n1 of N1_SWEEP.filter((n) => n >= 40)) {
      for (const bpr of BPR_SWEEP.filter((b) => b >= 6)) {
        expect(computeTurbofanState(n1, bpr).thrust.bypassShare).toBeGreaterThan(0.5)
      }
    }
    for (const n1 of N1_SWEEP.filter((n) => n >= 50)) expect(computeTurbofanState(n1, 4).thrust.bypassShare).toBeGreaterThan(0.5)
    for (const bpr of BPR_SWEEP.filter((b) => b >= 6)) expect(computeTurbofanState(100, bpr).thrust.bypassShare).toBeGreaterThan(0.65)
    for (const bpr of BPR_SWEEP.filter((b) => b >= 10)) expect(computeTurbofanState(100, bpr).thrust.bypassShare).toBeGreaterThan(0.75)
    expect(computeTurbofanState(100, 12).thrust.bypassShare).toBeGreaterThan(computeTurbofanState(100, 4).thrust.bypassShare)
  })

  it('thrust increases monotonically with N1', () => {
    for (const bpr of BPR_SWEEP) {
      let last = 0
      for (const n1 of N1_SWEEP) {
        const f = computeTurbofanState(n1, bpr).thrust.total
        expect(f).toBeGreaterThan(last)
        last = f
      }
    }
  })

  it('splits mass flow by bypass ratio and conserves it', () => {
    for (const bpr of BPR_SWEEP) {
      const { massFlow } = computeTurbofanState(70, bpr)
      expect(massFlow.core + massFlow.bypass).toBeCloseTo(massFlow.total, 9)
      expect(massFlow.bypass / massFlow.core).toBeCloseTo(bpr, 9)
      expect(massFlow.total).toBeCloseTo(CYCLE.maxMassFlow * 0.7, 9)
    }
  })

  it('turbines take back exactly the work the compressors put in', () => {
    const s = computeTurbofanState(90, 6)
    const t = (id: Parameters<typeof stationOf>[1]) => stationOf(s, id).temperatureK
    const hptWork = CYCLE.cpGas * (t('4') - t('45'))
    const hpcWork = CYCLE.cpAir * (t('3') - t('25'))
    expect(hptWork).toBeCloseTo(hpcWork, 6)
    const lptWork = CYCLE.cpGas * (t('45') - t('5'))
    const lpWork = CYCLE.cpAir * ((1 + 6) * (t('21') - t('2')) + (t('25') - t('21')))
    expect(lptWork).toBeCloseTo(lpWork, 6)
  })

  it('stays physically sane at every N1 and bypass ratio, including the extremes', () => {
    for (const n1 of N1_SWEEP) {
      for (const bpr of BPR_SWEEP) {
        const s = computeTurbofanState(n1, bpr)
        for (const st of s.stations) {
          expect(Number.isFinite(st.temperatureK)).toBe(true)
          expect(st.temperatureK).toBeGreaterThan(200)
          expect(st.pressureRatio).toBeGreaterThan(0.99)
        }
        // The core jet must still have pressure to push with after both turbines have fed.
        expect(stationOf(s, '8').pressureRatio).toBeGreaterThan(1.05)
        expect(stationOf(s, '5').temperatureK).toBeGreaterThan(CYCLE.ambient.temperatureK)
        expect(s.jetVelocity.core).toBeGreaterThan(0)
        expect(s.jetVelocity.bypass).toBeGreaterThan(0)
        expect(s.thrust.total).toBeGreaterThan(0)
        expect(Number.isFinite(s.tsfc)).toBe(true)
        expect(s.fuelFlow).toBeGreaterThan(0)
      }
    }
  })

  it('burns less fuel per unit of thrust as bypass ratio rises', () => {
    for (const n1 of [40, 70, 100]) {
      let last = Number.POSITIVE_INFINITY
      for (const bpr of BPR_SWEEP) {
        const { tsfc } = computeTurbofanState(n1, bpr)
        expect(tsfc).toBeLessThan(last)
        last = tsfc
      }
    }
  })

  it('clamps out-of-range inputs', () => {
    expect(computeTurbofanState(0, 8).n1).toBe(N1.idle)
    expect(computeTurbofanState(500, 8).n1).toBe(N1.max)
    expect(computeTurbofanState(60, 0).bpr).toBe(BPR.min)
    expect(computeTurbofanState(60, 99).bpr).toBe(BPR.max)
  })

  it('reports a stage for every stage id with matching station temperatures', () => {
    const s = computeTurbofanState(80, 8)
    for (const id of STAGE_ORDER) {
      const st = s.stages[id]
      expect(st.id).toBe(id)
      expect(st.temperatureInK).toBe(stationOf(s, st.inlet).temperatureK)
      expect(st.temperatureOutK).toBe(stationOf(s, st.outlet).temperatureK)
    }
    expect(s.stages.hpCompressor.pressureRatio).toBeGreaterThan(1)
    expect(s.stages.hpTurbine.pressureRatio).toBeLessThan(1)
    expect(s.stages.combustor.pressureRatio).toBeCloseTo(1 - CYCLE.combustor.pressureLoss)
  })

  it('spool speeds scale with N1 and N2', () => {
    const s = computeTurbofanState(100, 8)
    expect(s.lpRpm).toBe(SPOOL_RPM.lp)
    expect(s.hpRpm).toBe(SPOOL_RPM.hp)
    const idle = computeTurbofanState(N1.idle, 8)
    expect(idle.lpRpm).toBeCloseTo(SPOOL_RPM.lp * 0.2)
    expect(idle.hpRpm).toBeCloseTo(SPOOL_RPM.hp * (n2FromN1(N1.idle) / 100))
  })
})

describe('computeTurbofan (with glow)', () => {
  it('glow runs from 0 at idle to 1 at takeoff and grows in between', () => {
    expect(computeTurbofan(N1.idle, 8).combustorGlow).toBeCloseTo(0)
    expect(computeTurbofan(N1.max, 8).combustorGlow).toBeCloseTo(1)
    const mid = computeTurbofan(60, 8).combustorGlow
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })
})

describe('temperatureAt', () => {
  it('interpolates along the core and stays cool in the bypass', () => {
    const s = computeTurbofanState(100, 8)
    const t4 = stationOf(s, '4')
    const t3 = stationOf(s, '3')
    const mid = temperatureAt(s, (t3.x + t4.x) / 2, 'core')
    expect(mid).toBeGreaterThan(t3.temperatureK)
    expect(mid).toBeLessThan(t4.temperatureK)
    expect(temperatureAt(s, -10, 'core')).toBe(CYCLE.ambient.temperatureK)
    expect(temperatureAt(s, 10, 'core')).toBe(stationOf(s, '8').temperatureK)
    expect(temperatureAt(s, t4.x, 'bypass')).toBeLessThan(400)
  })
})

describe('advanceSpools', () => {
  it('advances both spools in the same direction at their rpm ratio', () => {
    const s = computeTurbofanState(100, 8)
    const { lpAngle, hpAngle } = advanceSpools(0, 0, s, 0.01, 1)
    expect(lpAngle).toBeGreaterThan(0)
    expect(hpAngle).toBeGreaterThan(0)
    expect(hpAngle / lpAngle).toBeCloseTo(SPOOL_RPM.hp / SPOOL_RPM.lp, 6)
  })

  it('turns the fan once per second of wall clock at 100 % after the visual time scale', () => {
    const s = computeTurbofanState(100, 8)
    const { lpAngle } = advanceSpools(0, 0, s, 1 / 60, 1)
    const degPerSec = lpAngle * 60
    expect(degPerSec).toBeCloseTo((SPOOL_RPM.lp * 6) / TURBOFAN_VISUAL_TIME_SCALE)
  })

  it('wraps to 0-360 and honours playback speed', () => {
    const s = computeTurbofanState(100, 8)
    const a = advanceSpools(359, 359, s, 1, 1)
    expect(a.lpAngle).toBeGreaterThanOrEqual(0)
    expect(a.lpAngle).toBeLessThan(360)
    const slow = advanceSpools(0, 0, s, 0.01, 0.5)
    const fast = advanceSpools(0, 0, s, 0.01, 1)
    expect(fast.lpAngle / slow.lpAngle).toBeCloseTo(2)
  })
})
