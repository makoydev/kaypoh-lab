/** Four-stroke Otto cycle phases. */
export type Stroke = 'intake' | 'compression' | 'power' | 'exhaust'

/** Rendering modes for the engine scene. */
export type ViewMode = 'cutaway' | 'xray' | 'piston'

/** How the engine casing (block, heads, covers) is drawn in cutaway mode. */
export type CasingMode = 'hidden' | 'ghost' | 'solid'

/** Playback speed multipliers. */
export type SpeedMultiplier = 0.1 | 0.5 | 1

/** Selectable / inspectable engine components. */
export type PartId =
  | 'piston'
  | 'connectingRod'
  | 'crankshaft'
  | 'sparkPlug'
  | 'cylinderBank'
  | 'flywheel'
  | 'valves'

/** Which side of the V a cylinder lives on. */
export type Bank = 'left' | 'right'

export interface CylinderSpec {
  /** Cylinder number, 1-8 (odd = left bank, even = right bank). */
  number: number
  bank: Bank
  /** Crank throw index 0-3 shared by a pair of cylinders. */
  journal: number
  /** Crank angle (0-720°) at which this cylinder's power stroke begins (firing TDC). */
  fireAngle: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Fully resolved kinematic + thermodynamic state of one cylinder at a given crank angle. */
export interface CylinderState {
  number: number
  bank: Bank
  journal: number
  /** Degrees since firing TDC, 0-720. */
  phase: number
  stroke: Stroke
  /** 0-1 progress within the current stroke. */
  strokeProgress: number
  /** 0-1 combustion flash intensity. */
  flash: number
  /** 0 = BDC, 1 = TDC. */
  travel: number
  /** Distance of the wrist pin from the crank axis along the bore. */
  pistonDistance: number
  /** Signed piston speed along the bore (units per crank-degree; +ve = toward TDC). */
  pistonVelocity: number
  /** Crank pin centre in world space. */
  pin: Vec3
  /** Wrist pin centre in world space. */
  piston: Vec3
  /** Rotation about Z (radians) that aligns the rod's +Y axis from pin to piston. */
  rodAngle: number
  /** Bank angle in radians. */
  bankAngle: number
}

export interface EngineSettings {
  rpm: number
  playing: boolean
  speed: SpeedMultiplier
  viewMode: ViewMode
  casingMode: CasingMode
  autoRotate: boolean
  selectedPart: PartId | null
  hoveredPart: PartId | null
  /** Cylinder used for piston-focus mode and stroke readouts. */
  focusCylinder: number
}

export interface SimSnapshot {
  angle: number
  cylinders: CylinderState[]
  /** Cylinder number whose power stroke is currently the freshest. */
  activeCylinder: number
}

export interface CatalogModule {
  id: string
  /** Drawing number shown in the title block, e.g. HLD-001. */
  code: string
  name: string
  tagline: string
  description: string
  status: 'active' | 'upcoming'
  category: string
  /** 1 = kopi-break easy, 3 = bring a notebook. */
  difficulty: 1 | 2 | 3
  /** Rough time to work through the module. */
  minutes: number
  concepts: string[]
  /** Learning objectives. */
  learn: string[]
  /** Drafting progress for upcoming modules, 0-100. */
  progress?: number
  accent: string
}

export type Route = { name: 'hub' } | { name: 'sim'; moduleId: string }
