import { describe, expect, it } from 'vitest'
import {
  BLADE_ROWS,
  CORE_CASING_LINE,
  ENGINE_X_MAX,
  ENGINE_X_MIN,
  HUB_LINE,
  PHASE_META,
  PHASE_ORDER,
  STAGE_EXTENT,
  STAGE_META,
  STAGE_ORDER,
  STAGE_STATIONS,
  STATIONS,
  TF,
  bypassAnnulusAt,
  coreAnnulusAt,
  piecewise,
  rowsForStage,
  stageAtX,
  stationById,
} from '../turbofanConfig'

describe('piecewise', () => {
  it('interpolates linearly and clamps at both ends', () => {
    const pts = [
      [0, 1],
      [1, 3],
      [2, 3],
    ] as const
    expect(piecewise(pts, -1)).toBe(1)
    expect(piecewise(pts, 0.5)).toBe(2)
    expect(piecewise(pts, 1.5)).toBe(3)
    expect(piecewise(pts, 9)).toBe(3)
  })
})

describe('stations', () => {
  it('run front to back along the core with the bypass exit branching off', () => {
    const core = STATIONS.filter((s) => s.stream !== 'bypass')
    for (let i = 1; i < core.length; i++) expect(core[i].x).toBeGreaterThan(core[i - 1].x)
    expect(stationById('13').x).toBeGreaterThan(stationById('2').x)
    expect(new Set(STATIONS.map((s) => s.id)).size).toBe(STATIONS.length)
  })

  it('bounds every stage with stations in flow order', () => {
    for (const id of STAGE_ORDER) {
      const { inlet, outlet } = STAGE_STATIONS[id]
      expect(stationById(outlet).x).toBeGreaterThan(stationById(inlet).x)
    }
  })
})

describe('stages and phases', () => {
  it('assigns every stage to exactly one of the four phases', () => {
    const seen = new Map<string, number>()
    for (const p of PHASE_ORDER) for (const s of PHASE_META[p].stages) seen.set(s, (seen.get(s) ?? 0) + 1)
    for (const id of STAGE_ORDER) {
      expect(seen.get(id)).toBe(1)
      expect(STAGE_META[id].phase).toBe(PHASE_ORDER.find((p) => PHASE_META[p].stages.includes(id)))
    }
    expect(PHASE_ORDER.map((p) => PHASE_META[p].nick)).toEqual(['Suck', 'Squeeze', 'Bang', 'Blow'])
  })

  it('lays stages out front to back without overlap and finds them by x', () => {
    for (let i = 1; i < STAGE_ORDER.length; i++) {
      expect(STAGE_EXTENT[STAGE_ORDER[i]].xStart).toBeGreaterThanOrEqual(STAGE_EXTENT[STAGE_ORDER[i - 1]].xEnd - 1e-9)
    }
    expect(stageAtX(TF.fan.x)).toBe('fan')
    expect(stageAtX((TF.combustor.xStart + TF.combustor.xEnd) / 2)).toBe('combustor')
    expect(stageAtX(TF.exhaustCone.xEnd)).toBe('nozzle')
    expect(stageAtX(-99)).toBeNull()
  })
})

describe('blade rows', () => {
  it('has a rotor and a stator for every stage of every rotating component', () => {
    expect(rowsForStage('fan').filter((r) => r.kind === 'rotor')).toHaveLength(1)
    expect(rowsForStage('booster').filter((r) => r.kind === 'rotor')).toHaveLength(TF.booster.stages)
    expect(rowsForStage('hpCompressor').filter((r) => r.kind === 'rotor')).toHaveLength(TF.hpCompressor.stages)
    expect(rowsForStage('hpTurbine').filter((r) => r.kind === 'rotor')).toHaveLength(TF.hpTurbine.stages)
    expect(rowsForStage('lpTurbine').filter((r) => r.kind === 'rotor')).toHaveLength(TF.lpTurbine.stages)
    for (const r of BLADE_ROWS) {
      expect(r.kind === 'rotor' ? r.spool : null).toBe(r.spool)
      if (r.kind === 'rotor') expect(r.spool).toBe(STAGE_META[r.stage].spool)
    }
  })

  it('orders core rows front to back with no two rows sharing an axial position', () => {
    const core = BLADE_ROWS.filter((r) => r.stream !== 'bypass')
    for (let i = 1; i < core.length; i++) expect(core[i].x).toBeGreaterThan(core[i - 1].x)
    const ogv = BLADE_ROWS.find((r) => r.stream === 'bypass')!
    expect(ogv.x).toBeGreaterThan(TF.fan.x)
    expect(ogv.x).toBeLessThan(TF.nacelle.xEnd)
  })

  it('shrinks the blades stage by stage through the compressor', () => {
    const rotors = rowsForStage('hpCompressor').filter((r) => r.kind === 'rotor')
    for (let i = 1; i < rotors.length; i++) {
      const prev = rotors[i - 1].tipRadius - rotors[i - 1].hubRadius
      const next = rotors[i].tipRadius - rotors[i].hubRadius
      expect(next).toBeLessThan(prev)
    }
    const boosters = rowsForStage('booster').filter((r) => r.kind === 'rotor')
    expect(boosters[boosters.length - 1].tipRadius).toBeLessThan(boosters[0].tipRadius)
  })

  it('grows the blades stage by stage through the turbines', () => {
    for (const stage of ['hpTurbine', 'lpTurbine'] as const) {
      const rotors = rowsForStage(stage).filter((r) => r.kind === 'rotor')
      for (let i = 1; i < rotors.length; i++) expect(rotors[i].tipRadius).toBeGreaterThan(rotors[i - 1].tipRadius)
    }
  })

  it('keeps every blade inside its flow annulus', () => {
    for (const r of BLADE_ROWS) {
      expect(r.tipRadius).toBeGreaterThan(r.hubRadius)
      expect(r.count).toBeGreaterThan(10)
      if (r.stage === 'fan') {
        expect(r.tipRadius).toBeLessThan(TF.nacelle.innerRadius)
      } else {
        const { inner, outer } = coreAnnulusAt(r.x)
        expect(r.hubRadius).toBeGreaterThanOrEqual(inner - 1e-6)
        expect(r.tipRadius).toBeLessThanOrEqual(outer + 1e-6)
      }
    }
  })
})

describe('flow path', () => {
  it('has monotonic control points and a core annulus that never pinches shut', () => {
    for (const line of [HUB_LINE, CORE_CASING_LINE]) {
      for (let i = 1; i < line.length; i++) expect(line[i][0]).toBeGreaterThanOrEqual(line[i - 1][0])
    }
    for (let x = TF.splitter.x; x <= TF.nozzle.xEnd; x += 0.05) {
      const { inner, outer } = coreAnnulusAt(x)
      expect(outer).toBeGreaterThan(inner)
    }
  })

  it('keeps the bypass duct open around the core casing', () => {
    for (let x = TF.fan.x; x <= TF.nacelle.xEnd; x += 0.05) {
      const { inner, outer } = bypassAnnulusAt(x)
      expect(outer).toBeGreaterThan(inner)
      expect(outer).toBe(TF.nacelle.innerRadius)
    }
  })

  it('spans the whole engine from spinner tip to exhaust cone', () => {
    expect(ENGINE_X_MIN).toBeLessThan(TF.nacelle.xStart + 0.5)
    expect(ENGINE_X_MAX).toBe(TF.exhaustCone.xEnd)
    expect(coreAnnulusAt(ENGINE_X_MIN).inner).toBe(0)
    expect(coreAnnulusAt(ENGINE_X_MAX).inner).toBe(0)
  })
})
