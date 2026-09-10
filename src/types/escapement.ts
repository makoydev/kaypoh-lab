import type { CasingMode, SpeedMultiplier } from './simulation'

/** Selectable / inspectable escapement components. */
export type EscapementPartId = 'balance' | 'hairspring' | 'regulator' | 'roller' | 'fork' | 'pallets' | 'escapeWheel' | 'banking' | 'plate'

/** Rendering modes for the escapement scene. */
export type EscapementViewMode = 'cutaway' | 'xray' | 'pallet'

/** Real watch beat rates, vibrations (half-swings) per hour. */
export type BeatRate = 18000 | 21600 | 28800 | 36000

/** The two pallet jewels, named for the order a tooth meets them. */
export type Pallet = 'entry' | 'exit'

/** What the escapement is doing at this instant. */
export type EscapementPhase = 'free' | 'unlock' | 'impulse' | 'drop' | 'lock'

/** The four ideas the explainer walks through. */
export type EscapementStep = 'swing' | 'unlock' | 'impulse' | 'lock'

/** Everything the escapement does as a pure function of the balance oscillator. */
export interface EscapementFrame {
  /** Balance angle from its rest (hairspring neutral) position, degrees, positive counter-clockwise from above. */
  balanceAngle: number
  /** +1 when the balance angle is increasing, −1 when decreasing. */
  direction: 1 | -1
  /** Pallet fork angle, degrees, clamped by the banking pins. */
  forkAngle: number
  /** Escape wheel angle, degrees, continuous and only ever recoiling by the draw. */
  escapeAngle: number
  /** Which beat this is since the start (one per half-swing). */
  beat: number
  /** 0-1 through the releasing pallet's action once the fork starts moving. */
  s: number
  /** The pallet that is letting a tooth go (or just did) this beat. */
  pallet: Pallet
  phase: EscapementPhase
  /** True while the impulse pin is inside the fork notch. */
  pinInNotch: boolean
}

export interface EscapementSettings {
  beatRate: BeatRate
  /** Mainspring wind, 10–100 %. Sets the balance amplitude, not the rate. */
  wind: number
  /** Regulator setting, seconds per day fast (+) or slow (−). */
  regulator: number
  playing: boolean
  speed: SpeedMultiplier
  viewMode: EscapementViewMode
  casingMode: CasingMode
  autoRotate: boolean
  /** Synthesised tick on every lock. Off by default. */
  sound: boolean
  selectedPart: EscapementPartId | null
  hoveredPart: EscapementPartId | null
}

/** Low-frequency copy of the store for the HUD. */
export interface EscapementSnapshot {
  balanceAngle: number
  forkAngle: number
  escapeAngle: number
  amplitude: number
  phase: EscapementPhase
  pallet: Pallet
  beats: number
  /** Watch time kept so far, seconds (beats × beat period). */
  watchSeconds: number
  /** Seconds-hand angle, degrees clockwise from 12. */
  secondsAngle: number
  frequencyHz: number
  s: number
}

/** Everything the driver mutates once per frame. Plain data so `stepEscapement` can be unit-tested. */
export interface EscapementSimState {
  /** Scene seconds elapsed (already scaled by the playback multiplier). */
  elapsed: number
  /** Oscillator phase, radians, continuous. θ = A·sin(phase). */
  phase: number
  /** Current amplitude, degrees; eases toward the target set by the mainspring wind. */
  amplitude: number
  balanceAngle: number
  direction: 1 | -1
  forkAngle: number
  escapeAngle: number
  escPhase: EscapementPhase
  pallet: Pallet
  s: number
  pinInNotch: boolean
  /** Beats completed since the start. */
  beats: number
  /** 1 at the instant a tooth lands, decaying to 0. */
  tickFlash: number
  /** Pallet that received the last tick. */
  lastLanding: Pallet
  watchSeconds: number
  secondsAngle: number
  frequencyHz: number
}

export interface EscapementControls {
  beatRate: BeatRate
  wind: number
  regulator: number
  speed: number
  playing: boolean
}

/** Things the model wants the UI layer to know about after a step. */
export interface EscapementStepEvents {
  /** A tooth landed on this pallet during the step. */
  tick?: Pallet
}
