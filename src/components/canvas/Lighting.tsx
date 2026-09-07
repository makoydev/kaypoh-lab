import { ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'

export const FLOOR_Y = -1.45

/** Procedural studio lights + reflection environment — no HDR downloads, works offline. */
export function StudioEnvironment({ resolution = 256 }: { resolution?: number }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#c7d6ff', '#0b0e13', 0.5]} />
      <directionalLight position={[6, 9, 5]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-7, 4, -4]} intensity={0.8} color="#7dd3fc" />

      <Environment resolution={resolution} frames={1}>
        <Lightformer form="rect" intensity={3} color="#dbe7ff" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[14, 7, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#22d3ee" position={[-9, 2, -2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fb923c" position={[9, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#ffffff" position={[0, 3, 10]} scale={4} />
        <Lightformer form="rect" intensity={0.6} color="#93c5fd" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} />
      </Environment>
    </>
  )
}

/** Full scene dressing for the simulation view: background, fog, studio lights, floor grid and shadows. */
export function Lighting() {
  return (
    <>
      <color attach="background" args={['#07090c']} />
      <fog attach="fog" args={['#07090c', 22, 48]} />
      <StudioEnvironment />

      <ContactShadows position={[0, FLOOR_Y + 0.005, 0]} opacity={0.6} scale={16} blur={2.6} far={4.5} resolution={512} color="#000000" />
      <Grid
        position={[0, FLOOR_Y, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1b2029"
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor="#2b3341"
        fadeDistance={30}
        fadeStrength={1.6}
        infiniteGrid
      />
    </>
  )
}
