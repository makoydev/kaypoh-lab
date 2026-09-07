import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TF } from '../../../lib/turbofanConfig'
import { exhaustGlow } from '../../../lib/flowVis'
import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { EMBER, useTurbofanMaterials } from './materials'
import { exhaustPlumeGeometry, flameGeometry } from './geometries'

const DULL = new THREE.Color('#9a3412')
const BRIGHT = new THREE.Color('#fde68a')
const HIGHLIGHT = new THREE.Color('#f59e0b')

/**
 * The "bang" of this module: an additive flame ring inside the combustor liner, a point light that
 * throws ember onto the surrounding metal, a heated liner, and a soft plume behind the nozzle. All
 * scale with the model's combustor glow (idle → takeoff) and exhaust temperature.
 */
export function CombustionGlow() {
  const flame = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const plume = useRef<THREE.Mesh>(null)
  const { sim, settingsRef } = useTurbofan()
  const m = useTurbofanMaterials()

  const flameMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }),
    [],
  )
  const plumeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fb923c', vertexColors: true, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }),
    [],
  )

  useFrame(({ clock }) => {
    const state = sim.state
    const glow = state.combustorGlow
    const flicker = 1 + 0.06 * Math.sin(clock.elapsedTime * 23) * glow + 0.03 * Math.sin(clock.elapsedTime * 41)
    const xray = settingsRef.current.viewMode === 'xray'

    if (flame.current) {
      flame.current.visible = !xray
      flameMat.opacity = (0.16 + 0.6 * glow) * flicker
      flameMat.color.copy(DULL).lerp(BRIGHT, glow)
    }
    if (light.current) {
      light.current.intensity = (6 + 46 * glow) * flicker
    }
    if (plume.current) {
      const heat = exhaustGlow(state)
      plume.current.visible = !xray
      plumeMat.opacity = 0.05 + 0.3 * heat
      const stretch = 0.6 + 0.8 * (state.n1 / 100)
      // Scale about the nozzle lip, not the plume's centre.
      plume.current.scale.set(stretch, 1, 1)
      plume.current.position.x = (1 - stretch) * (TF.nozzle.xEnd - 0.05)
    }

    // Heated liner: emissive rides on top of any hover / selection highlight.
    const liner = m.combustorLiner
    if (liner instanceof THREE.MeshPhysicalMaterial) {
      const hl = (liner.userData.highlight as number | undefined) ?? 0
      liner.emissive.copy(EMBER).lerp(HIGHLIGHT, Math.min(1, hl * 2))
      liner.emissiveIntensity = 0.2 + 1.4 * glow * flicker + hl
    }
  })

  const cx = (TF.combustor.xStart + TF.combustor.xEnd) / 2

  return (
    <group>
      <mesh ref={flame} geometry={flameGeometry()} material={flameMat} raycast={() => null} />
      <pointLight ref={light} position={[cx, 0, 0]} color="#fb923c" intensity={0} distance={7} decay={2} />
      <mesh ref={plume} geometry={exhaustPlumeGeometry()} material={plumeMat} raycast={() => null} />
    </group>
  )
}
