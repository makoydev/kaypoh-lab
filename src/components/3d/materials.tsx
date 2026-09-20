import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { CasingMode, PartId, ViewMode } from '../../types/simulation'
import { useEngine } from '../../hooks/useEngineSimulation'

export type MaterialKey =
  | 'block'
  | 'head'
  | 'cover'
  | 'bore'
  | 'piston'
  | 'ring'
  | 'rod'
  | 'crank'
  | 'flywheel'
  | 'plugCeramic'
  | 'plugMetal'
  | 'plugTip'
  | 'valveIntake'
  | 'valveExhaust'
  | 'bolt'

export type MaterialSet = Record<MaterialKey, THREE.Material>

/** Which materials light up when a part is hovered / selected. */
export const PART_MATERIALS: Record<PartId, MaterialKey[]> = {
  piston: ['piston', 'ring'],
  connectingRod: ['rod'],
  crankshaft: ['crank'],
  sparkPlug: ['plugCeramic', 'plugMetal', 'plugTip'],
  cylinderBank: ['block', 'head', 'cover', 'bore'],
  flywheel: ['flywheel'],
  valves: ['valveIntake', 'valveExhaust'],
}

const HIGHLIGHT = new THREE.Color('#f59e0b')

function metal(color: string, metalness: number, roughness: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    envMapIntensity: 1.1,
    emissive: HIGHLIGHT,
    emissiveIntensity: 0,
    ...extra,
  })
  m.userData.baseColor = new THREE.Color(color)
  return m
}

function ghost(color: string, opacity: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.6,
    roughness: 0.4,
    transparent: true,
    opacity,
    depthWrite: false,
    envMapIntensity: 0.8,
    emissive: HIGHLIGHT,
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
    ...extra,
  })
  m.userData.baseColor = new THREE.Color(color)
  return m
}

function wire(color: string, opacity: number) {
  const m = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
  })
  m.userData.baseColor = new THREE.Color(color)
  return m
}

function buildMaterials(viewMode: ViewMode, casing: CasingMode): MaterialSet {
  if (viewMode === 'xray') {
    return {
      block: wire('#0e7490', 0.22),
      head: wire('#0e7490', 0.28),
      cover: wire('#0e7490', 0.18),
      bore: wire('#22d3ee', 0.35),
      piston: wire('#a5f3fc', 0.95),
      ring: wire('#67e8f9', 0.9),
      rod: wire('#67e8f9', 0.9),
      crank: wire('#22d3ee', 0.9),
      flywheel: wire('#22d3ee', 0.5),
      plugCeramic: wire('#e0f2fe', 0.8),
      plugMetal: wire('#a5f3fc', 0.8),
      plugTip: wire('#fde68a', 0.9),
      valveIntake: wire('#7dd3fc', 0.9),
      valveExhaust: wire('#cbd5e1', 0.9),
      bolt: wire('#22d3ee', 0.6),
    }
  }

  const solidCasing = casing === 'solid'
  const blockColor = '#6f7682'
  return {
    block: solidCasing ? metal(blockColor, 0.7, 0.5) : ghost(blockColor, 0.16),
    head: solidCasing ? metal('#7b828e', 0.7, 0.45) : ghost('#8a919c', 0.2),
    cover: solidCasing ? metal('#4b5361', 0.5, 0.6) : ghost('#5b6472', 0.14),
    bore: solidCasing ? metal('#aeb4bd', 0.95, 0.2, { side: THREE.DoubleSide }) : ghost('#c9ced6', 0.28, { metalness: 0.9, roughness: 0.2 }),
    piston: metal('#d6d9de', 0.85, 0.32),
    ring: metal('#3b4149', 0.9, 0.35),
    rod: metal('#9aa1ad', 0.9, 0.38),
    crank: metal('#868c96', 1.0, 0.26),
    flywheel: metal('#5c626c', 0.85, 0.5),
    plugCeramic: metal('#f1f5f9', 0.05, 0.55),
    plugMetal: metal('#b9bec7', 0.9, 0.35),
    plugTip: metal('#d97706', 0.9, 0.3),
    valveIntake: metal('#7fb7d9', 0.9, 0.3),
    valveExhaust: metal('#a0a7b1', 0.9, 0.4),
    bolt: metal('#2f343c', 0.8, 0.4),
  }
}

const MaterialContext = createContext<MaterialSet | null>(null)

export function EngineMaterialsProvider({ children }: { children: ReactNode }) {
  const { settings } = useEngine()
  const { viewMode, casingMode } = settings
  const materials = useMemo(() => buildMaterials(viewMode, casingMode), [viewMode, casingMode])

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose())
    }
  }, [materials])

  return <MaterialContext.Provider value={materials}>{children}</MaterialContext.Provider>
}

export function useEngineMaterials() {
  const ctx = useContext(MaterialContext)
  if (!ctx) throw new Error('useEngineMaterials must be used inside <EngineMaterialsProvider>')
  return ctx
}

export const HIGHLIGHT_COLOR = HIGHLIGHT

/**
 * Smoothly pushes hover / selection highlight into the relevant shared materials. Generic over the
 * module's material keys and part ids so every module shares one implementation.
 */
export function applyHighlight<K extends string, P extends string>(
  materials: Record<K, THREE.Material>,
  partMaterials: Record<P, K[]>,
  selected: P | null,
  hovered: P | null,
  dt: number,
) {
  const targetFor = (key: K) => {
    if (selected && partMaterials[selected].includes(key)) return 0.45
    if (hovered && partMaterials[hovered].includes(key)) return 0.25
    return 0
  }
  const k = 1 - Math.exp(-dt * 14)
  for (const key of Object.keys(materials) as K[]) {
    const mat = materials[key]
    const target = targetFor(key)
    const current = (mat.userData.highlight as number | undefined) ?? 0
    const next = current + (target - current) * k
    if (Math.abs(next - current) < 1e-4 && next === target) continue
    mat.userData.highlight = next
    if (mat instanceof THREE.MeshPhysicalMaterial || mat instanceof THREE.MeshStandardMaterial) {
      mat.emissiveIntensity = next
    } else if (mat instanceof THREE.MeshBasicMaterial) {
      const base = mat.userData.baseColor as THREE.Color
      mat.color.copy(base).lerp(HIGHLIGHT, Math.min(1, next * 1.5))
    }
  }
}

export interface GlowInputs<K extends string, P extends string> {
  selected: P | null
  hovered: P | null
  /** Materials carrying energy right now (a torque path, an impulse), lit in `pathColor`. */
  path?: K[]
  pathColor?: THREE.Color
}

const DEFAULT_PATH_COLOR = new THREE.Color('#22d3ee')

/**
 * Hover / selection (amber) and an optional energy path (cyan by default) share one emissive channel
 * per material, so resolve them with a fixed priority (selection > hover > path) and ease the result.
 * Generic over the module's material keys and part ids.
 */
export function applyGlow<K extends string, P extends string>(
  materials: Record<K, THREE.Material>,
  partMaterials: Record<P, K[]>,
  { selected, hovered, path = [], pathColor = DEFAULT_PATH_COLOR }: GlowInputs<K, P>,
  dt: number,
) {
  const k = 1 - Math.exp(-dt * 14)
  for (const key of Object.keys(materials) as K[]) {
    const mat = materials[key]
    let target = 0
    let color = HIGHLIGHT
    if (selected && partMaterials[selected].includes(key)) target = 0.45
    else if (hovered && partMaterials[hovered].includes(key)) target = 0.25
    else if (path.includes(key)) {
      target = 0.32
      color = pathColor
    }
    const current = (mat.userData.highlight as number | undefined) ?? 0
    // A material going dark keeps the colour it lit up in. Adopting the new colour straight away
    // made every impulse fade out amber — the selection colour — the instant the path moved on.
    const glow = target > 0 ? color : ((mat.userData.glowColor as THREE.Color | undefined) ?? color)
    const next = current + (target - current) * k
    if (Math.abs(next - current) < 1e-4 && next === target && mat.userData.glowColor === glow) continue
    mat.userData.highlight = next
    mat.userData.glowColor = glow
    if (mat instanceof THREE.MeshPhysicalMaterial || mat instanceof THREE.MeshStandardMaterial) {
      mat.emissive.copy(glow)
      mat.emissiveIntensity = next
    } else if (mat instanceof THREE.MeshBasicMaterial) {
      const base = mat.userData.baseColor as THREE.Color
      mat.color.copy(base).lerp(glow, Math.min(1, next * 1.5))
    }
  }
}

/** Material factories shared with other modules' material sets. */
export const materialFactories = { metal, ghost, wire }
