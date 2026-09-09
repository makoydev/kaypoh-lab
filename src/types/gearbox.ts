import type { CasingMode, SpeedMultiplier } from './simulation'

/** Shifter positions in shift-up order: reverse, neutral, then first to fifth. */
export type GearId = 'R' | 'N' | '1' | '2' | '3' | '4' | '5'

/** Gears that have a ratio (everything but neutral). */
export type SpeedGearId = Exclude<GearId, 'N'>

/** Gears with their own freewheeling wheel on the output shaft (4th locks onto the input gear directly). */
export type FreewheelGearId = Exclude<SpeedGearId, '4'>

/** The three synchro hubs on the output shaft, each serving two gears. */
export type HubId = '12' | '34' | '5R'

/** Selectable / inspectable gearbox components. */
export type GearboxPartId =
  | 'clutch'
  | 'inputShaft'
  | 'countershaft'
  | 'speedGears'
  | 'synchro'
  | 'reverseIdler'
  | 'shiftForks'
  | 'outputShaft'
  | 'casing'

/** Rendering modes for the gearbox scene. */
export type GearboxViewMode = 'cutaway' | 'xray' | 'synchro'

/** What the box is doing during a gear change, in order. */
export type ShiftPhase = 'clutchOut' | 'disengage' | 'synchro' | 'grind' | 'engage' | 'clutchIn'

/** The four ideas the explainer walks through. */
export type GearboxStep = 'mesh' | 'neutral' | 'synchro' | 'lock'

/** Angles (degrees, continuous) of every rotating part for a given input-shaft angle. */
export interface GearboxAngles {
  input: number
  counter: number
  idler: number
  freewheel: Record<FreewheelGearId, number>
}

/** One moment in a scripted gear change. */
export interface ShiftFrame {
  from: GearId
  to: GearId
  phase: ShiftPhase
  /** 0-1 within the current phase. */
  phaseProgress: number
  /** 0-1 across the whole shift. */
  progress: number
  /** 1 = clutch fully engaged (engine coupled to the input shaft). */
  clutch: number
  /** Sleeve position per hub, −1..1; sign is which of the hub's two gears it moves toward. */
  sleeves: Record<HubId, number>
  /** 0-1 how hard the blocker ring is pressed onto the target gear's cone. */
  ringContact: number
  /** Hub doing the work for this shift, if any. */
  hub: HubId | null
  done: boolean
}

export interface GearboxSettings {
  engineRpm: number
  /** Where the driver has put the lever. The box catches up through a shift. */
  gear: GearId
  synchro: boolean
  playing: boolean
  speed: SpeedMultiplier
  viewMode: GearboxViewMode
  casingMode: CasingMode
  autoRotate: boolean
  showTorquePath: boolean
  selectedPart: GearboxPartId | null
  hoveredPart: GearboxPartId | null
}

/** Low-frequency copy of the store for the HUD. */
export interface GearboxSnapshot {
  inputRpm: number
  outputRpm: number
  engineRpm: number
  engaged: GearId
  shift: ShiftFrame | null
  /** Speed difference the synchro is currently absorbing, rpm. */
  slipRpm: number
  crunches: number
  lastHub: HubId
}

/** Everything the driver mutates once per frame. Plain data so `stepGearbox` can be unit-tested. */
export interface GearboxSimState {
  /** Scene seconds elapsed (already scaled by the playback multiplier). */
  elapsed: number
  /** Flywheel / pressure plate angle (engine side of the clutch), degrees, continuous. */
  engineAngle: number
  /** Input shaft angle; every gear angle derives from it. */
  inputAngle: number
  /** Output shaft (hubs, sleeves) angle. */
  outputAngle: number
  /** While locked, outputAngle = engaged gear angle + lockOffset (dog teeth interleaved). */
  lockOffset: number
  engineRpm: number
  inputRpm: number
  outputRpm: number
  /** Gear whose dogs are currently in the sleeve; 'N' between gears. */
  engaged: GearId
  /** Latest lever position the box is working toward. */
  target: GearId
  shift: ShiftFrame | null
  shiftStart: number
  /** Engine rpm the model wrote at the last clutch-in, and the control value it replaced. */
  engineOverride: { value: number; replaced: number } | null
  clutch: number
  sleeves: Record<HubId, number>
  ringContact: number
  slipRpm: number
  crunches: number
  lastHub: HubId
}

export interface GearboxControls {
  engineRpm: number
  gear: GearId
  synchro: boolean
  speed: number
  playing: boolean
}

/** Things the model wants the UI layer to know about after a step. */
export interface GearboxStepEvents {
  /** The clutch bit and dragged the engine to a new speed: settings should adopt it. */
  engineRpm?: number
}
