import type { StageId, StageState, StationId, StationState, TurbofanState } from '../types/turbofan'
import { BPR, CYCLE, N1, SPOOL_RPM, STAGE_META, STAGE_ORDER, STAGE_STATIONS, STATIONS, TURBOFAN_VISUAL_TIME_SCALE, n2FromN1 } from './turbofanConfig'

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Pressure rise of a compressor scales with the square of shaft speed (0-1). */
export const pressureRatioAtSpeed = (maxPR: number, speedFraction: number) => 1 + (maxPR - 1) * speedFraction * speedFraction

/** Fan pressure ratio at 100 % N1. High bypass ratios pair with gentler fans. */
export const fanDesignPressureRatio = (bpr: number) => CYCLE.fan.pressureRatioBase - CYCLE.fan.pressureRatioPerBpr * bpr

/** Temperature ratio across a compression with polytropic efficiency η: T2/T1 = PR^((γ−1)/(γ·η)). */
export function compressionTemperatureRatio(pressureRatio: number, gamma = CYCLE.gammaAir, eta = CYCLE.polytropicEfficiency) {
  return Math.pow(pressureRatio, (gamma - 1) / (gamma * eta))
}

/** Pressure ratio (out/in, < 1) of a turbine that drops the gas temperature by the given ratio. */
export function expansionPressureRatio(temperatureRatio: number, gamma = CYCLE.gammaGas, eta = CYCLE.polytropicEfficiency) {
  return Math.pow(temperatureRatio, (gamma * eta) / (gamma - 1))
}

/**
 * Fully expanded jet velocity from total temperature and the ratio of total pressure to ambient:
 * V = √(2·cp·Tt·(1 − PR^(−(γ−1)/γ))). Zero if there is no pressure to expand.
 */
export function jetVelocity(totalTemperatureK: number, pressureRatioToAmbient: number, gamma: number, cp: number) {
  if (pressureRatioToAmbient <= 1) return 0
  const term = 1 - Math.pow(pressureRatioToAmbient, -(gamma - 1) / gamma)
  return Math.sqrt(2 * cp * totalTemperatureK * term)
}

/** Combustor temperature rise as a fraction of the takeoff value, driven by fuel scheduling with N1. */
export function combustorTemperatureRise(n1Fraction: number) {
  const { maxTemperatureRise, idleFraction } = CYCLE.combustor
  return maxTemperatureRise * (idleFraction + (1 - idleFraction) * n1Fraction * n1Fraction)
}

/**
 * The whole cycle at one operating point. Pure, cheap, and independent of time: only the throttle
 * (N1) and the bypass ratio decide where every pressure and temperature sits.
 */
export function computeTurbofanState(n1Input: number, bprInput: number): TurbofanState {
  const n1 = clamp(n1Input, N1.idle, N1.max)
  const bpr = clamp(bprInput, BPR.min, BPR.max)
  const n2 = n2FromN1(n1)
  const nLP = n1 / 100
  const nHP = n2 / 100

  const { ambient, gammaAir, gammaGas, cpAir, cpGas } = CYCLE
  const P0 = 1
  const T0 = ambient.temperatureK

  // Compression: fan (both streams) → booster → HP compressor
  const fanPR = pressureRatioAtSpeed(fanDesignPressureRatio(bpr), nLP)
  const boosterPR = pressureRatioAtSpeed(CYCLE.booster.maxPressureRatio, nLP)
  const hpcPR = pressureRatioAtSpeed(CYCLE.hpCompressor.maxPressureRatio, nHP)

  const P2 = P0
  const T2 = T0
  const P21 = P2 * fanPR
  const T21 = T2 * compressionTemperatureRatio(fanPR)
  // Duct friction losses scale with dynamic head, so an idling fan still pushes a little.
  const ductScale = nLP * nLP
  const P13 = P21 * (1 - CYCLE.duct.bypassLoss * ductScale)
  const T13 = T21
  const P25 = P21 * boosterPR
  const T25 = T21 * compressionTemperatureRatio(boosterPR)
  const P3 = P25 * hpcPR
  const T3 = T25 * compressionTemperatureRatio(hpcPR)

  // Combustion: heat in, a little pressure lost to friction
  const P4 = P3 * (1 - CYCLE.combustor.pressureLoss)
  const T4 = T3 + combustorTemperatureRise(nLP)

  // Expansion: each turbine takes back exactly the work its compressor(s) put in.
  // The core gas carries all of it, so the fan's work on (1 + BPR) units of air comes out of one unit of gas.
  const workRatio = cpAir / cpGas
  const dT_hpt = (T3 - T25) * workRatio
  const dT_lpt = ((1 + bpr) * (T21 - T2) + (T25 - T21)) * workRatio
  const T45 = T4 - dT_hpt
  const P45 = P4 * expansionPressureRatio(T45 / T4)
  const T5 = T45 - dT_lpt
  const P5 = P45 * expansionPressureRatio(T5 / T45)
  const P8 = P5 * (1 - CYCLE.duct.coreLoss * ductScale)
  const T8 = T5

  // Mass flow and thrust (static, sea level, fuel mass ignored)
  const total = CYCLE.maxMassFlow * nLP
  const core = total / (1 + bpr)
  const bypass = total - core
  const vBypass = jetVelocity(T13, P13, gammaAir, cpAir)
  const vCore = jetVelocity(T8, P8, gammaGas, cpGas)
  const thrustBypass = bypass * vBypass
  const thrustCore = core * vCore
  const thrustTotal = thrustBypass + thrustCore

  const fuelFlow = (core * cpGas * (T4 - T3)) / CYCLE.fuelLHV
  const tsfc = thrustTotal > 0 ? (fuelFlow * 1000) / (thrustTotal / 1000) : 0

  const pressures: Record<StationId, number> = { '0': P0, '2': P2, '13': P13, '21': P21, '25': P25, '3': P3, '4': P4, '45': P45, '5': P5, '8': P8 }
  const temperatures: Record<StationId, number> = { '0': T0, '2': T2, '13': T13, '21': T21, '25': T25, '3': T3, '4': T4, '45': T45, '5': T5, '8': T8 }

  const stations: StationState[] = STATIONS.map((s) => ({
    id: s.id,
    label: s.label,
    x: s.x,
    stream: s.stream,
    strip: s.strip,
    pressureRatio: pressures[s.id],
    pressureKPa: pressures[s.id] * ambient.pressureKPa,
    temperatureK: temperatures[s.id],
  }))

  const stages = Object.fromEntries(
    STAGE_ORDER.map((id) => {
      const { inlet, outlet } = STAGE_STATIONS[id]
      const st: StageState = {
        id,
        inlet,
        outlet,
        pressureRatio: pressures[outlet] / pressures[inlet],
        temperatureInK: temperatures[inlet],
        temperatureOutK: temperatures[outlet],
        spool: STAGE_META[id].spool,
      }
      return [id, st]
    }),
  ) as Record<StageId, StageState>

  return {
    n1,
    n2,
    bpr,
    lpRpm: SPOOL_RPM.lp * nLP,
    hpRpm: SPOOL_RPM.hp * nHP,
    stations,
    stages,
    overallPressureRatio: P3 / P0,
    massFlow: { total, core, bypass },
    jetVelocity: { bypass: vBypass, core: vCore },
    thrust: { total: thrustTotal, core: thrustCore, bypass: thrustBypass, bypassShare: thrustTotal > 0 ? thrustBypass / thrustTotal : 0 },
    fuelFlow,
    tsfc,
    combustorGlow: 0,
  }
}

const T4_IDLE = computeTurbofanState(N1.idle, BPR.default).stations.find((s) => s.id === '4')!.temperatureK
const T4_MAX = computeTurbofanState(N1.max, BPR.default).stations.find((s) => s.id === '4')!.temperatureK

/** `computeTurbofanState` plus the 0-1 combustor glow, normalised between idle and takeoff T4. */
export function computeTurbofan(n1: number, bpr: number): TurbofanState {
  const state = computeTurbofanState(n1, bpr)
  const t4 = state.stations.find((s) => s.id === '4')!.temperatureK
  state.combustorGlow = clamp01((t4 - T4_IDLE) / (T4_MAX - T4_IDLE))
  return state
}

export const stationOf = (state: TurbofanState, id: StationId) => state.stations.find((s) => s.id === id)!

/** Total temperature of the core (or bypass) stream at an axial position, interpolated between stations. */
export function temperatureAt(state: TurbofanState, x: number, stream: 'core' | 'bypass') {
  const path = state.stations.filter((s) => (stream === 'bypass' ? s.stream !== 'core' : s.stream !== 'bypass')).sort((a, b) => a.x - b.x)
  if (x <= path[0].x) return path[0].temperatureK
  for (let i = 1; i < path.length; i++) {
    if (x <= path[i].x) {
      const a = path[i - 1]
      const b = path[i]
      const t = (x - a.x) / (b.x - a.x)
      return a.temperatureK + (b.temperatureK - a.temperatureK) * t
    }
  }
  return path[path.length - 1].temperatureK
}

/** Degrees per real second for each spool, before the visual time scale. */
export const degPerSecond = (rpm: number) => rpm * 6

/**
 * Advance both spool angles by `dt` seconds of wall-clock time at the given playback speed.
 * Both spools turn the same way; the HP spool always leads because it is geared to nothing.
 */
export function advanceSpools(lpAngle: number, hpAngle: number, state: TurbofanState, dt: number, speed: number) {
  const k = (speed * dt) / TURBOFAN_VISUAL_TIME_SCALE
  return {
    lpAngle: ((lpAngle + degPerSecond(state.lpRpm) * k) % 360 + 360) % 360,
    hpAngle: ((hpAngle + degPerSecond(state.hpRpm) * k) % 360 + 360) % 360,
  }
}

export const kelvinToCelsius = (k: number) => k - 273.15
