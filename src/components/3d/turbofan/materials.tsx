import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { CasingMode } from '../../../types/simulation'
import type { TurbofanPartId, TurbofanViewMode } from '../../../types/turbofan'
import type { BladeRow } from '../../../lib/turbofanConfig'
import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { materialFactories } from '../materials'

const { metal, ghost, wire } = materialFactories

export type TurbofanMaterialKey =
  | 'nacelle'
  | 'casing'
  | 'section'
  | 'spinner'
  | 'fanBlade'
  | 'fanDisc'
  | 'ogv'
  | 'boosterBlade'
  | 'boosterStator'
  | 'hpcBlade'
  | 'hpcStator'
  | 'combustorLiner'
  | 'hptBlade'
  | 'hptStator'
  | 'lptBlade'
  | 'lptStator'
  | 'nozzle'
  | 'exhaustCone'
  | 'drum'
  | 'shaft'

export type TurbofanMaterialSet = Record<TurbofanMaterialKey, THREE.Material>

/** Which materials light up when a part is hovered / selected. */
export const TURBOFAN_PART_MATERIALS: Record<TurbofanPartId, TurbofanMaterialKey[]> = {
  fan: ['fanBlade', 'fanDisc', 'spinner', 'ogv'],
  booster: ['boosterBlade', 'boosterStator'],
  hpCompressor: ['hpcBlade', 'hpcStator'],
  combustor: ['combustorLiner'],
  hpTurbine: ['hptBlade', 'hptStator'],
  lpTurbine: ['lptBlade', 'lptStator'],
  nozzle: ['nozzle', 'exhaustCone'],
  nacelle: ['nacelle', 'casing', 'section'],
}

/** Material for a blade row, by stage and rotor/stator. */
export function rowMaterialKey(row: BladeRow): TurbofanMaterialKey {
  switch (row.stage) {
    case 'fan':
      return row.kind === 'rotor' ? 'fanBlade' : 'ogv'
    case 'booster':
      return row.kind === 'rotor' ? 'boosterBlade' : 'boosterStator'
    case 'hpCompressor':
      return row.kind === 'rotor' ? 'hpcBlade' : 'hpcStator'
    case 'hpTurbine':
      return row.kind === 'rotor' ? 'hptBlade' : 'hptStator'
    case 'lpTurbine':
      return row.kind === 'rotor' ? 'lptBlade' : 'lptStator'
    default:
      return 'drum'
  }
}

export const EMBER = new THREE.Color('#fb923c')

function buildMaterials(viewMode: TurbofanViewMode, casing: CasingMode): TurbofanMaterialSet {
  if (viewMode === 'xray') {
    return {
      nacelle: wire('#0e7490', 0.16),
      casing: wire('#0e7490', 0.22),
      section: wire('#0e7490', 0.1),
      spinner: wire('#a5f3fc', 0.7),
      fanBlade: wire('#67e8f9', 0.9),
      fanDisc: wire('#22d3ee', 0.6),
      ogv: wire('#38bdf8', 0.5),
      boosterBlade: wire('#818cf8', 0.85),
      boosterStator: wire('#6366f1', 0.5),
      hpcBlade: wire('#a78bfa', 0.85),
      hpcStator: wire('#8b5cf6', 0.5),
      combustorLiner: wire('#fb923c', 0.8),
      hptBlade: wire('#fbbf24', 0.85),
      hptStator: wire('#d97706', 0.5),
      lptBlade: wire('#e2b04a', 0.85),
      lptStator: wire('#b45309', 0.5),
      nozzle: wire('#94a3b8', 0.5),
      exhaustCone: wire('#94a3b8', 0.6),
      drum: wire('#22d3ee', 0.35),
      shaft: wire('#22d3ee', 0.5),
    }
  }

  const solid = casing === 'solid'
  return {
    nacelle: solid ? metal('#cfd4db', 0.25, 0.42) : ghost('#cfd4db', 0.14),
    casing: solid ? metal('#868d99', 0.85, 0.42) : ghost('#98a0ab', 0.18),
    section: metal('#b45309', 0.15, 0.85, { side: THREE.DoubleSide }),
    spinner: metal('#e8eaee', 0.3, 0.4),
    fanBlade: metal('#c3c9d2', 0.92, 0.28, { side: THREE.DoubleSide }),
    fanDisc: metal('#6f7682', 0.8, 0.5),
    ogv: metal('#a3aab5', 0.85, 0.4, { side: THREE.DoubleSide }),
    boosterBlade: metal('#b6bcc6', 0.9, 0.32, { side: THREE.DoubleSide }),
    boosterStator: metal('#8c939e', 0.85, 0.42, { side: THREE.DoubleSide }),
    hpcBlade: metal('#c9ced6', 0.92, 0.3, { side: THREE.DoubleSide }),
    hpcStator: metal('#8c939e', 0.85, 0.42, { side: THREE.DoubleSide }),
    combustorLiner: metal('#8a5a3a', 0.7, 0.55, { emissive: EMBER, emissiveIntensity: 0.25, side: THREE.DoubleSide }),
    hptBlade: metal('#c9a66b', 0.9, 0.35, { side: THREE.DoubleSide }),
    hptStator: metal('#9a7a4d', 0.85, 0.45, { side: THREE.DoubleSide }),
    lptBlade: metal('#b5a07a', 0.9, 0.35, { side: THREE.DoubleSide }),
    lptStator: metal('#857457', 0.85, 0.45, { side: THREE.DoubleSide }),
    nozzle: solid ? metal('#5f6670', 0.9, 0.38) : ghost('#7a8290', 0.2),
    exhaustCone: metal('#545b66', 0.9, 0.4),
    drum: metal('#6a717d', 0.85, 0.5),
    shaft: metal('#50565f', 0.9, 0.45),
  }
}

const MaterialContext = createContext<TurbofanMaterialSet | null>(null)

export function TurbofanMaterialsProvider({ children }: { children: ReactNode }) {
  const { settings } = useTurbofan()
  const { viewMode, casingMode } = settings
  const materials = useMemo(() => buildMaterials(viewMode, casingMode), [viewMode, casingMode])

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose())
    }
  }, [materials])

  return <MaterialContext.Provider value={materials}>{children}</MaterialContext.Provider>
}

export function useTurbofanMaterials() {
  const ctx = useContext(MaterialContext)
  if (!ctx) throw new Error('useTurbofanMaterials must be used inside <TurbofanMaterialsProvider>')
  return ctx
}
