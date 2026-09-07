import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ViewMode } from '../../types/simulation'
import { CYLINDERS } from '../../lib/engineConfig'
import { borePoint } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'

export const ENGINE_Y_OFFSET = 0.2
export const DEFAULT_CAMERA_POSITION: [number, number, number] = [6.4, 3.4, 7.2]
export const DEFAULT_TARGET: [number, number, number] = [0, 0.55, 0]

/** Narrow (portrait) viewports need the camera further back to keep the whole engine in frame. */
function backOffFor(aspect: number) {
  return aspect >= 1.3 ? 1 : Math.min(2.4, 1.3 / aspect)
}

function goalFor(viewMode: ViewMode, focusCylinder: number, aspect: number) {
  const backOff = backOffFor(aspect)
  if (viewMode !== 'piston') {
    const target = new THREE.Vector3(...DEFAULT_TARGET)
    const position = new THREE.Vector3(...DEFAULT_CAMERA_POSITION).sub(target).multiplyScalar(backOff).add(target)
    return { position, target }
  }
  const spec = CYLINDERS[focusCylinder - 1]
  const mid = borePoint(spec, 1.7)
  const side = spec.bank === 'left' ? -1 : 1
  const target = new THREE.Vector3(mid.x, mid.y + ENGINE_Y_OFFSET, mid.z)
  const position = target.clone().add(new THREE.Vector3(side * 3.4, 1.5, 4.6).multiplyScalar(backOff))
  return { position, target }
}

/** Flies the camera to a framing whenever the view mode / focus cylinder changes or a reset is requested. */
export function CameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const { settings, cameraToken } = useEngine()
  const { viewMode, focusCylinder } = settings
  const aspect = size.width / Math.max(1, size.height)
  const goal = useMemo(() => goalFor(viewMode, focusCylinder, aspect), [viewMode, focusCylinder, aspect])
  const active = useRef(false)

  useEffect(() => {
    active.current = true
  }, [goal, cameraToken])

  // A user grabbing the controls cancels the fly-to.
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const stop = () => {
      active.current = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controlsRef])

  useFrame((_, dt) => {
    if (!active.current) return
    const controls = controlsRef.current
    if (!controls) return
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 4.5)
    camera.position.lerp(goal.position, k)
    controls.target.lerp(goal.target, k)
    controls.update()
    if (camera.position.distanceTo(goal.position) < 0.01 && controls.target.distanceTo(goal.target) < 0.01) {
      active.current = false
    }
  })

  return null
}
