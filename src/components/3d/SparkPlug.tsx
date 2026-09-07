import { usePartInteraction } from '../../hooks/usePartInteraction'
import { useEngineMaterials } from './materials'
import {
  plugCeramicGeometry,
  plugElectrodeGeometry,
  plugHexGeometry,
  plugTerminalGeometry,
  plugThreadGeometry,
} from './geometries'

/** Spark plug built along +Y with its electrode tip at the origin (the deck surface). */
export function SparkPlug(props: { position: [number, number, number]; rotationZ: number }) {
  const m = useEngineMaterials()
  const handlers = usePartInteraction('sparkPlug')
  return (
    <group position={props.position} rotation-z={props.rotationZ} {...handlers}>
      <mesh geometry={plugElectrodeGeometry()} material={m.plugTip} position-y={-0.05} />
      <mesh geometry={plugThreadGeometry()} material={m.plugMetal} position-y={0.17} />
      <mesh geometry={plugHexGeometry()} material={m.plugMetal} position-y={0.4} />
      <mesh geometry={plugCeramicGeometry()} material={m.plugCeramic} position-y={0.62} />
      <mesh geometry={plugTerminalGeometry()} material={m.plugMetal} position-y={0.815} />
    </group>
  )
}
