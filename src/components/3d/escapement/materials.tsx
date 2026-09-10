import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { CasingMode } from '../../../types/simulation'
import type { EscapementPartId, EscapementPhase, EscapementViewMode, Pallet } from '../../../types/escapement'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { applyGlow, materialFactories } from '../materials'

const { metal, ghost, wire } = materialFactories

export type EscapementMaterialKey =
  | 'plate'
  | 'bridge'
  | 'jewelBearing'
  | 'balanceRim'
  | 'balanceArm'
  | 'staff'
  | 'screw'
  | 'hairspring'
  | 'collet'
  | 'stud'
  | 'regulator'
  | 'roller'
  | 'impulsePin'
  | 'fork'
  | 'forkArbor'
  | 'entryPallet'
  | 'exitPallet'
  | 'escapeWheel'
  | 'escapeArbor'
  | 'banking'

export type EscapementMaterialSet = Record<EscapementMaterialKey, THREE.Material>

/** Which materials light up when a part is hovered / selected. */
export const ESCAPEMENT_PART_MATERIALS: Record<EscapementPartId, EscapementMaterialKey[]> = {
  balance: ['balanceRim', 'balanceArm', 'staff', 'screw'],
  hairspring: ['hairspring', 'collet', 'stud'],
  regulator: ['regulator'],
  roller: ['roller', 'impulsePin'],
  fork: ['fork', 'forkArbor'],
  pallets: ['entryPallet', 'exitPallet'],
  escapeWheel: ['escapeWheel', 'escapeArbor'],
  banking: ['banking'],
  plate: ['plate', 'bridge', 'jewelBearing'],
}

export const palletMaterialKey = (p: Pallet): EscapementMaterialKey => (p === 'entry' ? 'entryPallet' : 'exitPallet')

/** Materials the energy is flowing through right now: mainspring → wheel → jewel → fork → pin during the impulse. */
export function energyPathKeys(phase: EscapementPhase, pallet: Pallet): EscapementMaterialKey[] {
  if (phase !== 'impulse') return []
  return ['escapeWheel', palletMaterialKey(pallet), 'fork', 'impulsePin']
}

const PATH_COLOR = new THREE.Color('#22d3ee')

function ruby(color: string) {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.05,
    roughness: 0.12,
    transmission: 0.25,
    thickness: 0.1,
    ior: 1.77,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.4,
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0,
  })
  m.userData.baseColor = new THREE.Color(color)
  return m
}

function buildMaterials(viewMode: EscapementViewMode, casing: CasingMode): EscapementMaterialSet {
  if (viewMode === 'xray') {
    return {
      plate: wire('#0e7490', 0.1),
      bridge: wire('#0e7490', 0.18),
      jewelBearing: wire('#f87171', 0.6),
      balanceRim: wire('#22d3ee', 0.75),
      balanceArm: wire('#22d3ee', 0.6),
      staff: wire('#67e8f9', 0.7),
      screw: wire('#22d3ee', 0.5),
      hairspring: wire('#7dd3fc', 0.9),
      collet: wire('#67e8f9', 0.6),
      stud: wire('#67e8f9', 0.6),
      regulator: wire('#a5f3fc', 0.6),
      roller: wire('#a5f3fc', 0.7),
      impulsePin: wire('#fb7185', 0.95),
      fork: wire('#e0f2fe', 0.9),
      forkArbor: wire('#67e8f9', 0.6),
      entryPallet: wire('#fb7185', 0.95),
      exitPallet: wire('#fb7185', 0.95),
      escapeWheel: wire('#a5f3fc', 0.9),
      escapeArbor: wire('#67e8f9', 0.6),
      banking: wire('#fbbf24', 0.8),
    }
  }

  const solid = casing === 'solid'
  return {
    plate: solid ? metal('#6e6653', 0.7, 0.5) : ghost('#8a8068', 0.14),
    bridge: solid ? metal('#8f846a', 0.8, 0.38) : ghost('#8f846a', 0.18),
    jewelBearing: ruby('#c0263f'),
    balanceRim: metal('#c9a86a', 0.95, 0.22),
    balanceArm: metal('#b8975a', 0.9, 0.32),
    staff: metal('#d8dce3', 0.95, 0.2),
    screw: metal('#e2e6ec', 0.95, 0.25),
    hairspring: metal('#2f4f9e', 0.85, 0.3, { side: THREE.DoubleSide }),
    collet: metal('#b9bec7', 0.9, 0.35),
    stud: metal('#8c939e', 0.85, 0.4),
    regulator: metal('#d0d4da', 0.9, 0.3),
    roller: metal('#8f96a1', 0.9, 0.35),
    impulsePin: ruby('#d6304d'),
    fork: metal('#d6d9de', 0.95, 0.18),
    forkArbor: metal('#b9bec7', 0.9, 0.3),
    entryPallet: ruby('#d6304d'),
    exitPallet: ruby('#d6304d'),
    escapeWheel: metal('#e3e6eb', 0.95, 0.16),
    escapeArbor: metal('#b9bec7', 0.9, 0.3),
    banking: metal('#6b7280', 0.85, 0.45),
  }
}

const MaterialContext = createContext<EscapementMaterialSet | null>(null)

export function EscapementMaterialsProvider({ children }: { children: ReactNode }) {
  const { settings } = useEscapement()
  const { viewMode, casingMode } = settings
  const materials = useMemo(() => buildMaterials(viewMode, casingMode), [viewMode, casingMode])

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose())
    }
  }, [materials])

  return <MaterialContext.Provider value={materials}>{children}</MaterialContext.Provider>
}

export function useEscapementMaterials() {
  const ctx = useContext(MaterialContext)
  if (!ctx) throw new Error('useEscapementMaterials must be used inside <EscapementMaterialsProvider>')
  return ctx
}

/** Selection / hover (amber) plus the impulse energy path (cyan), eased per frame. */
export function applyEscapementGlow(
  materials: EscapementMaterialSet,
  inputs: { selected: EscapementPartId | null; hovered: EscapementPartId | null; path: EscapementMaterialKey[] },
  dt: number,
) {
  applyGlow(materials, ESCAPEMENT_PART_MATERIALS, { ...inputs, pathColor: PATH_COLOR }, dt)
}
