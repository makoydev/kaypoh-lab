import { RoundedBox } from '@react-three/drei'
import type { Bank } from '../../types/simulation'
import { CYLINDERS, GEOMETRY, bankAngleDeg, cylinderZ } from '../../lib/engineConfig'
import { DEG2RAD } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { usePartInteraction } from '../../hooks/usePartInteraction'
import { useEngineMaterials } from './materials'
import { boreLinerGeometry, boreRimGeometry } from './geometries'
import { SparkPlug } from './SparkPlug'
import { Valves } from './Valves'

const { deckDistance: deck, boreBottom, headThickness } = GEOMETRY
const BLOCK_LENGTH = 4.75

/** Ghosted casing should never swallow clicks meant for the parts inside it. */
const passThrough = () => null

interface BankAssemblyProps {
  bank: Bank
  showCasing: boolean
  casingClickable: boolean
  visibleCylinders: Set<number>
}

function BankAssembly({ bank, showCasing, casingClickable, visibleCylinders }: BankAssemblyProps) {
  const m = useEngineMaterials()
  const casingHandlers = usePartInteraction('cylinderBank')
  const casingRaycast = casingClickable ? undefined : passThrough
  const beta = bankAngleDeg(bank) * DEG2RAD
  /** +1 when the bank's outer face is toward local +X. */
  const outerSign = bank === 'left' ? -1 : 1
  const cylinders = CYLINDERS.filter((c) => c.bank === bank)

  return (
    <group rotation-z={beta}>
      {/* Casing: bank block, cylinder head, valve cover */}
      <group visible={showCasing} {...(showCasing && casingClickable ? casingHandlers : {})}>
        <mesh material={m.block} position-y={(boreBottom + deck) / 2} raycast={casingRaycast}>
          <boxGeometry args={[1.32, deck - boreBottom, BLOCK_LENGTH]} />
        </mesh>
        <mesh material={m.head} position-y={deck + headThickness / 2} raycast={casingRaycast}>
          <boxGeometry args={[1.42, headThickness, BLOCK_LENGTH]} />
        </mesh>
        <RoundedBox
          args={[0.74, 0.3, BLOCK_LENGTH - 0.2]}
          radius={0.06}
          smoothness={3}
          material={m.cover}
          position={[-outerSign * 0.14, deck + headThickness + 0.15, 0]}
          raycast={casingRaycast}
        />
      </group>

      {/* Per-cylinder internals: liner, plug, valves */}
      {cylinders.map((c) => {
        const z = cylinderZ(c)
        if (!visibleCylinders.has(c.number)) return null
        return (
          <group key={c.number}>
            <group {...(casingClickable ? casingHandlers : {})}>
              <mesh geometry={boreLinerGeometry()} material={m.bore} position={[0, (boreBottom + deck) / 2, z]} raycast={casingRaycast} />
              <mesh geometry={boreRimGeometry()} material={m.ring} position={[0, deck, z]} rotation-x={Math.PI / 2} raycast={casingRaycast} />
              <mesh geometry={boreRimGeometry()} material={m.ring} position={[0, boreBottom, z]} rotation-x={Math.PI / 2} raycast={casingRaycast} />
            </group>
            <SparkPlug position={[outerSign * 0.3, deck, z]} rotationZ={-outerSign * 0.22} />
            <Valves index={c.number - 1} intakeX={-outerSign * 0.17} exhaustX={outerSign * 0.17} z={z} />
          </group>
        )
      })}
    </group>
  )
}

/** The whole cast lump: crankcase, sump, both banks, heads, and the plumbing in the valley. */
export function EngineBlock() {
  const m = useEngineMaterials()
  const { settings } = useEngine()
  const { viewMode, casingMode, focusCylinder } = settings
  const casingHandlers = usePartInteraction('cylinderBank')

  const pistonMode = viewMode === 'piston'
  const showCasing = !pistonMode && (viewMode === 'xray' || casingMode !== 'hidden')
  // Only a solid casing is clickable; ghost / wireframe casing lets clicks reach the internals.
  const casingClickable = viewMode === 'cutaway' && casingMode === 'solid'
  const casingRaycast = casingClickable ? undefined : passThrough
  const visibleCylinders = new Set(pistonMode ? [focusCylinder] : CYLINDERS.map((c) => c.number))

  return (
    <group>
      <group visible={showCasing} {...(showCasing && casingClickable ? casingHandlers : {})}>
        {/* Crankcase */}
        <mesh material={m.block} position-y={-0.05} raycast={casingRaycast}>
          <boxGeometry args={[3.0, 1.7, 4.9]} />
        </mesh>
        {/* Oil sump */}
        <RoundedBox args={[2.3, 0.62, 4.3]} radius={0.08} smoothness={3} material={m.cover} position-y={-1.19} raycast={casingRaycast} />
        {/* Valley floor + intake plenum */}
        <mesh material={m.block} position-y={1.05} raycast={casingRaycast}>
          <boxGeometry args={[0.9, 0.5, BLOCK_LENGTH]} />
        </mesh>
        <RoundedBox args={[1.05, 0.34, 3.9]} radius={0.06} smoothness={3} material={m.head} position-y={1.55} raycast={casingRaycast} />
        {/* Front timing cover */}
        <RoundedBox args={[2.5, 1.9, 0.14]} radius={0.05} smoothness={2} material={m.cover} position={[0, 0.1, -2.5]} raycast={casingRaycast} />
      </group>
      <BankAssembly bank="left" showCasing={showCasing} casingClickable={casingClickable} visibleCylinders={visibleCylinders} />
      <BankAssembly bank="right" showCasing={showCasing} casingClickable={casingClickable} visibleCylinders={visibleCylinders} />
    </group>
  )
}
