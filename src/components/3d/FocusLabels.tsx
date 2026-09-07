import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CYLINDERS, GEOMETRY, STROKE_META, bankAngleDeg, cylinderZ } from '../../lib/engineConfig'
import { BDC_DISTANCE, DEG2RAD, TDC_DISTANCE } from '../../lib/kinematics'
import { useEngine, useSimSnapshot } from '../../hooks/useEngineSimulation'
import { boreRimGeometry } from './geometries'

const labelClass =
  'pointer-events-none select-none whitespace-nowrap rounded-md border border-white/10 bg-ink-900/90 px-2 py-1 font-mono text-[11px] leading-none text-fog-100 shadow-lg'

function Label({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <Html center distanceFactor={5} zIndexRange={[10, 0]}>
      <div className={labelClass} style={accent ? { borderColor: accent, color: accent } : undefined}>
        {children}
      </div>
    </Html>
  )
}

/** Annotations for piston-focus mode: TDC / BDC rings, live stroke tag, crank-pin tag. */
export function FocusLabels({ index }: { index: number }) {
  const spec = CYLINDERS[index]
  const beta = bankAngleDeg(spec.bank) * DEG2RAD
  const z = cylinderZ(spec)
  const outer = spec.bank === 'left' ? -1 : 1
  const pistonRef = useRef<THREE.Group>(null)
  const pinRef = useRef<THREE.Group>(null)
  const { sim } = useEngine()
  const snap = useSimSnapshot(15)
  const st = snap.cylinders[index]
  const meta = st ? STROKE_META[st.stroke] : null

  useFrame(() => {
    const s = sim.cylinders[index]
    if (!s) return
    pistonRef.current?.position.set(s.piston.x, s.piston.y, s.piston.z)
    pinRef.current?.position.set(s.pin.x, s.pin.y, s.pin.z)
  })

  const crownTDC = TDC_DISTANCE + GEOMETRY.pistonCentreOffset + GEOMETRY.pistonHeight / 2
  const crownBDC = BDC_DISTANCE + GEOMETRY.pistonCentreOffset + GEOMETRY.pistonHeight / 2

  return (
    <group>
      {/* Bank-local static markers */}
      <group rotation-z={beta}>
        <mesh geometry={boreRimGeometry()} position={[0, crownTDC, z]} rotation-x={Math.PI / 2} scale={1.12}>
          <meshBasicMaterial color="#22d3ee" toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <mesh geometry={boreRimGeometry()} position={[0, crownBDC, z]} rotation-x={Math.PI / 2} scale={1.12}>
          <meshBasicMaterial color="#8b919c" toneMapped={false} transparent opacity={0.8} />
        </mesh>
        <group position={[-outer * 0.85, crownTDC, z]}>
          <Label accent="#22d3ee">TDC · top dead centre</Label>
        </group>
        <group position={[-outer * 0.85, crownBDC, z]}>
          <Label accent="#8b919c">BDC · bottom dead centre</Label>
        </group>
        <group position={[outer * 0.55, GEOMETRY.deckDistance + 1.0, z]}>
          <Label>Spark plug</Label>
        </group>
      </group>

      {/* Moving tags */}
      <group ref={pistonRef}>
        <group position={[outer * 0.8, 0.25, 0]}>
          {meta && st && (
            <Label accent={meta.color}>
              {meta.label} · {meta.nick} · {Math.round(st.strokeProgress * 100)}%
            </Label>
          )}
        </group>
      </group>
      <group ref={pinRef}>
        <group position={[0, 0, 0.55]}>
          <Label>Crank pin</Label>
        </group>
      </group>
    </group>
  )
}
