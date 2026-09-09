import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { CasingMode } from '../../../types/simulation'
import type { GearId, GearboxPartId, GearboxViewMode, HubId } from '../../../types/gearbox'
import { HUB_OF } from '../../../lib/gearboxConfig'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { HIGHLIGHT_COLOR, materialFactories } from '../materials'

const { metal, ghost, wire } = materialFactories

export type GearboxMaterialKey =
  | 'case'
  | 'section'
  | 'bearing'
  | 'shaftIn'
  | 'shaftCounter'
  | 'shaftOut'
  | 'gearIn'
  | 'gearCd'
  | 'gearC1'
  | 'gearO1'
  | 'gearC2'
  | 'gearO2'
  | 'gearC3'
  | 'gearO3'
  | 'gearC5'
  | 'gearO5'
  | 'gearCR'
  | 'gearIdler'
  | 'gearOR'
  | 'hub12'
  | 'hub34'
  | 'hub5R'
  | 'sleeve12'
  | 'sleeve34'
  | 'sleeve5R'
  | 'ring'
  | 'dog'
  | 'fork'
  | 'rail'
  | 'flywheel'
  | 'clutchDisc'
  | 'pressurePlate'

export type GearboxMaterialSet = Record<GearboxMaterialKey, THREE.Material>

/** Which materials light up when a part is hovered / selected. */
export const GEARBOX_PART_MATERIALS: Record<GearboxPartId, GearboxMaterialKey[]> = {
  clutch: ['flywheel', 'clutchDisc', 'pressurePlate'],
  inputShaft: ['shaftIn', 'gearIn'],
  countershaft: ['shaftCounter', 'gearCd', 'gearC1', 'gearC2', 'gearC3', 'gearC5', 'gearCR'],
  speedGears: ['gearO1', 'gearO2', 'gearO3', 'gearO5', 'gearOR'],
  synchro: ['hub12', 'hub34', 'hub5R', 'sleeve12', 'sleeve34', 'sleeve5R', 'ring', 'dog'],
  reverseIdler: ['gearIdler'],
  shiftForks: ['fork', 'rail'],
  outputShaft: ['shaftOut'],
  casing: ['case', 'section', 'bearing'],
}

/** Material key of a wheel in the mesh table. */
export function wheelMaterialKey(id: string): GearboxMaterialKey {
  switch (id) {
    case 'input':
      return 'gearIn'
    case 'counterDrive':
      return 'gearCd'
    case 'idler':
      return 'gearIdler'
    default:
      return (id.startsWith('counter') ? `gearC${id.slice(7)}` : `gearO${id.slice(6)}`) as GearboxMaterialKey
  }
}

export const hubMaterialKey = (hub: HubId): GearboxMaterialKey => `hub${hub}` as GearboxMaterialKey
export const sleeveMaterialKey = (hub: HubId): GearboxMaterialKey => `sleeve${hub}` as GearboxMaterialKey

/** Every material that carries torque for a locked gear with the clutch in. */
export function torquePathKeys(engaged: GearId, clutch: number): GearboxMaterialKey[] {
  if (engaged === 'N' || clutch < 0.5) return []
  const { hub } = HUB_OF[engaged]
  const base: GearboxMaterialKey[] = ['clutchDisc', 'shaftIn', 'gearIn']
  const tail: GearboxMaterialKey[] = [sleeveMaterialKey(hub), hubMaterialKey(hub), 'shaftOut']
  if (engaged === '4') return [...base, ...tail]
  const viaCounter: GearboxMaterialKey[] = ['gearCd', 'shaftCounter', wheelMaterialKey(`counter${engaged}`)]
  if (engaged === 'R') viaCounter.push('gearIdler')
  return [...base, ...viaCounter, wheelMaterialKey(`output${engaged}`), ...tail]
}

const PATH_COLOR = new THREE.Color('#22d3ee')

function buildMaterials(viewMode: GearboxViewMode, casing: CasingMode): GearboxMaterialSet {
  if (viewMode === 'xray') {
    const gear = (c: string) => wire(c, 0.85)
    return {
      case: wire('#0e7490', 0.14),
      section: wire('#0e7490', 0.1),
      bearing: wire('#22d3ee', 0.35),
      shaftIn: wire('#22d3ee', 0.6),
      shaftCounter: wire('#22d3ee', 0.5),
      shaftOut: wire('#22d3ee', 0.6),
      gearIn: gear('#a5f3fc'),
      gearCd: gear('#67e8f9'),
      gearC1: gear('#67e8f9'),
      gearO1: gear('#a5f3fc'),
      gearC2: gear('#67e8f9'),
      gearO2: gear('#a5f3fc'),
      gearC3: gear('#67e8f9'),
      gearO3: gear('#a5f3fc'),
      gearC5: gear('#67e8f9'),
      gearO5: gear('#a5f3fc'),
      gearCR: gear('#67e8f9'),
      gearIdler: gear('#7dd3fc'),
      gearOR: gear('#a5f3fc'),
      hub12: wire('#38bdf8', 0.6),
      hub34: wire('#38bdf8', 0.6),
      hub5R: wire('#38bdf8', 0.6),
      sleeve12: wire('#e0f2fe', 0.9),
      sleeve34: wire('#e0f2fe', 0.9),
      sleeve5R: wire('#e0f2fe', 0.9),
      ring: wire('#fbbf24', 0.9),
      dog: wire('#bae6fd', 0.7),
      fork: wire('#22d3ee', 0.45),
      rail: wire('#22d3ee', 0.35),
      flywheel: wire('#22d3ee', 0.4),
      clutchDisc: wire('#a5f3fc', 0.7),
      pressurePlate: wire('#22d3ee', 0.4),
    }
  }

  const solid = casing === 'solid'
  const steel = (c: string) => metal(c, 0.9, 0.34)
  return {
    case: solid ? metal('#7b828e', 0.55, 0.55) : ghost('#8a919c', 0.16),
    section: metal('#b45309', 0.15, 0.85, { side: THREE.DoubleSide }),
    bearing: metal('#2f343c', 0.8, 0.45),
    shaftIn: steel('#aeb4bd'),
    shaftCounter: steel('#8f96a1'),
    shaftOut: steel('#aeb4bd'),
    gearIn: steel('#c9ced6'),
    gearCd: steel('#9aa1ad'),
    gearC1: steel('#9aa1ad'),
    gearO1: steel('#c3c9d2'),
    gearC2: steel('#9aa1ad'),
    gearO2: steel('#c3c9d2'),
    gearC3: steel('#9aa1ad'),
    gearO3: steel('#c3c9d2'),
    gearC5: steel('#9aa1ad'),
    gearO5: steel('#c3c9d2'),
    gearCR: steel('#9aa1ad'),
    gearIdler: steel('#b0b6c0'),
    gearOR: steel('#c3c9d2'),
    hub12: metal('#5f6670', 0.85, 0.5),
    hub34: metal('#5f6670', 0.85, 0.5),
    hub5R: metal('#5f6670', 0.85, 0.5),
    sleeve12: metal('#dfe3e8', 0.85, 0.28),
    sleeve34: metal('#dfe3e8', 0.85, 0.28),
    sleeve5R: metal('#dfe3e8', 0.85, 0.28),
    ring: metal('#c9a227', 0.9, 0.35),
    dog: metal('#8c939e', 0.9, 0.4),
    fork: metal('#454c57', 0.7, 0.55),
    rail: metal('#868c96', 0.95, 0.3),
    flywheel: metal('#5c626c', 0.85, 0.5),
    clutchDisc: metal('#8a5a3a', 0.4, 0.75),
    pressurePlate: metal('#6a717d', 0.85, 0.45),
  }
}

const MaterialContext = createContext<GearboxMaterialSet | null>(null)

export function GearboxMaterialsProvider({ children }: { children: ReactNode }) {
  const { settings } = useGearbox()
  const { viewMode, casingMode } = settings
  const materials = useMemo(() => buildMaterials(viewMode, casingMode), [viewMode, casingMode])

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose())
    }
  }, [materials])

  return <MaterialContext.Provider value={materials}>{children}</MaterialContext.Provider>
}

export function useGearboxMaterials() {
  const ctx = useContext(MaterialContext)
  if (!ctx) throw new Error('useGearboxMaterials must be used inside <GearboxMaterialsProvider>')
  return ctx
}

interface GlowInputs {
  selected: GearboxPartId | null
  hovered: GearboxPartId | null
  /** Materials carrying torque right now (empty when the path overlay is off). */
  path: GearboxMaterialKey[]
}

/**
 * Hover / selection (amber) and the torque path (cyan) share one emissive channel per material, so
 * resolve them here with a fixed priority and ease the result. The hot blocker ring is a separate
 * additive mesh (`RingGlow`) because all six rings share one material.
 */
export function applyGearboxGlow(materials: GearboxMaterialSet, { selected, hovered, path }: GlowInputs, dt: number) {
  const k = 1 - Math.exp(-dt * 14)
  for (const key of Object.keys(materials) as GearboxMaterialKey[]) {
    const mat = materials[key]
    let target = 0
    let color = HIGHLIGHT_COLOR
    if (selected && GEARBOX_PART_MATERIALS[selected].includes(key)) target = 0.45
    else if (hovered && GEARBOX_PART_MATERIALS[hovered].includes(key)) target = 0.25
    else if (path.includes(key)) {
      target = 0.32
      color = PATH_COLOR
    }
    const current = (mat.userData.highlight as number | undefined) ?? 0
    const next = current + (target - current) * k
    if (Math.abs(next - current) < 1e-4 && next === target && mat.userData.glowColor === color) continue
    mat.userData.highlight = next
    mat.userData.glowColor = color
    if (mat instanceof THREE.MeshPhysicalMaterial || mat instanceof THREE.MeshStandardMaterial) {
      mat.emissive.copy(color)
      mat.emissiveIntensity = next
    } else if (mat instanceof THREE.MeshBasicMaterial) {
      const base = mat.userData.baseColor as THREE.Color
      mat.color.copy(base).lerp(color, Math.min(1, next * 1.5))
    }
  }
}
