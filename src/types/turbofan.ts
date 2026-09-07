import type { CasingMode, SpeedMultiplier } from './simulation'

/** The seven regions of the engine a learner can isolate. Ordered front to back. */
export type StageId = 'fan' | 'booster' | 'hpCompressor' | 'combustor' | 'hpTurbine' | 'lpTurbine' | 'nozzle'

/** Selectable / inspectable turbofan components. */
export type TurbofanPartId = StageId | 'nacelle'

/** Which shaft a rotating part belongs to. */
export type Spool = 'lp' | 'hp'

/**
 * Standard station numbering (SAE ARP 755): 0 ambient · 2 fan face · 13 bypass duct exit ·
 * 21 fan exit (core side) · 25 booster exit · 3 HP compressor exit · 4 combustor exit ·
 * 45 HP turbine exit · 5 LP turbine exit · 8 core nozzle exit.
 */
export type StationId = '0' | '2' | '13' | '21' | '25' | '3' | '4' | '45' | '5' | '8'

export type Stream = 'core' | 'bypass' | 'both'

/** The same four ideas as the V8, but as regions of a continuous flow rather than strokes. */
export type FlowPhase = 'suck' | 'squeeze' | 'bang' | 'blow'

/** Rendering modes for the turbofan scene. */
export type TurbofanViewMode = 'cutaway' | 'xray' | 'stage'

export interface StationState {
  id: StationId
  label: string
  /** Axial position in scene units, air flows toward +x. */
  x: number
  stream: Stream
  /** Total pressure relative to ambient. */
  pressureRatio: number
  pressureKPa: number
  temperatureK: number
  /** Whether the HUD station strip shows this station. */
  strip: boolean
}

export interface StageState {
  id: StageId
  inlet: StationId
  outlet: StationId
  /** Outlet / inlet total pressure. Below 1 for the turbines and nozzle. */
  pressureRatio: number
  temperatureInK: number
  temperatureOutK: number
  spool: Spool | null
}

export interface TurbofanState {
  /** Fan speed, % of rated. */
  n1: number
  /** HP spool speed, % of rated. */
  n2: number
  bpr: number
  lpRpm: number
  hpRpm: number
  stations: StationState[]
  stages: Record<StageId, StageState>
  /** P3 / P0. */
  overallPressureRatio: number
  /** kg/s */
  massFlow: { total: number; core: number; bypass: number }
  /** Fully expanded jet velocities, m/s. */
  jetVelocity: { bypass: number; core: number }
  /** Newtons. */
  thrust: { total: number; core: number; bypass: number; bypassShare: number }
  /** kg/s */
  fuelFlow: number
  /** Thrust-specific fuel consumption, g/(kN·s). */
  tsfc: number
  /** 0-1, how hard the combustor is working relative to idle-to-takeoff. */
  combustorGlow: number
}

export interface TurbofanSettings {
  n1: number
  bpr: number
  playing: boolean
  speed: SpeedMultiplier
  viewMode: TurbofanViewMode
  casingMode: CasingMode
  autoRotate: boolean
  showFlow: boolean
  selectedPart: TurbofanPartId | null
  hoveredPart: TurbofanPartId | null
  /** Stage isolated by stage-focus mode. */
  focusStage: StageId
}

export interface TurbofanSnapshot {
  /** LP spool angle, degrees 0-360. */
  lpAngle: number
  /** HP spool angle, degrees 0-360. */
  hpAngle: number
  state: TurbofanState
}
