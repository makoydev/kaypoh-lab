import type { PartId } from '../types/simulation'

export interface PartInfo {
  id: PartId
  name: string
  tagline: string
  role: string
  details: string[]
  kaypohFact: string
}

export const PART_INFO: Record<PartId, PartInfo> = {
  piston: {
    id: 'piston',
    name: 'Piston',
    tagline: 'The thing that kena pushed.',
    role: 'Seals the bottom of the combustion chamber and turns gas pressure into a straight-line shove down the bore.',
    details: [
      'Cast or forged aluminium alloy — light, so it can reverse direction thousands of times a minute.',
      'Piston rings seal against the bore wall and scrape oil back down into the sump.',
      'The wrist (gudgeon) pin connects it to the small end of the connecting rod.',
    ],
    kaypohFact: 'At 7,000 rpm each piston stops dead and reverses 233 times a second. Somehow it never complains.',
  },
  connectingRod: {
    id: 'connectingRod',
    name: 'Connecting Rod',
    tagline: 'Straight-line to round-and-round, one rod at a time.',
    role: 'Links the piston to the crankshaft and converts reciprocating motion into rotation.',
    details: [
      'Forged steel I-beam section: strong in compression from combustion, stiff in tension at TDC.',
      'Big end wraps the crank pin on a bearing shell; small end pivots on the wrist pin.',
      'Because the rod swings sideways, piston motion is not a pure sine wave — it lingers longer near BDC.',
    ],
    kaypohFact: 'Two rods share every crank pin on this V8, sitting side by side like commuters on a bench.',
  },
  crankshaft: {
    id: 'crankshaft',
    name: 'Crankshaft',
    tagline: 'Eight small punches, one smooth spin.',
    role: 'Collects the pushes from all eight pistons and turns them into a single rotating output.',
    details: [
      'Four crank pins, offset 90° from each other — the “crossplane” layout that gives American V8s their burble.',
      'Counterweights opposite each pin cancel the wobble from the pins and rods.',
      'Main journals ride in bearings in the block; the whole thing spins in a bath of pressurised oil.',
    ],
    kaypohFact: 'The crank turns twice for every complete four-stroke cycle, which is why the angle here counts to 720°.',
  },
  sparkPlug: {
    id: 'sparkPlug',
    name: 'Spark Plug',
    tagline: 'One tiny lightning bolt, on schedule.',
    role: 'Ignites the compressed air-fuel mixture at precisely the right crank angle.',
    details: [
      'The coil steps 12 V up to 20–40 kV so the spark can jump the electrode gap.',
      'Fires a little before TDC so peak pressure lands just after the piston turns around.',
      'The white ceramic insulator stops that high voltage from shorting to the cylinder head.',
    ],
    kaypohFact: 'At 7,000 rpm each plug sparks about 58 times a second — and there are eight of them going.',
  },
  cylinderBank: {
    id: 'cylinderBank',
    name: 'Cylinder Block & Heads',
    tagline: 'Two banks, 90° apart, one big V.',
    role: 'Houses the bores, supports the crank, and carries the heads with their valves and spark plugs.',
    details: [
      'Cast iron or aluminium block with cylinder liners; coolant passages snake around each bore.',
      'Each cylinder head seals the top of four bores and holds the intake and exhaust valves.',
      'The 90° angle lets pistons on opposite banks share crank pins and keeps the engine short.',
    ],
    kaypohFact: 'The V-shaped valley between the banks is where the intake manifold usually sits — prime real estate.',
  },
  flywheel: {
    id: 'flywheel',
    name: 'Flywheel',
    tagline: 'Momentum insurance.',
    role: 'Stores rotational energy so the crank keeps spinning smoothly between power strokes.',
    details: [
      'Heavy steel disc bolted to the rear of the crank; the clutch or torque converter mounts here.',
      'The ring gear around the edge is what the starter motor bites into.',
      'Eight power pulses per two revolutions still leave gaps — the flywheel papers over them.',
    ],
    kaypohFact: 'On an idling V8, the flywheel is what stops the whole engine from shuddering like a wet dog.',
  },
  valves: {
    id: 'valves',
    name: 'Valves',
    tagline: 'Doorman for the combustion chamber.',
    role: 'Let fresh mixture in during Intake and spent gas out during Exhaust, sealing tight for the rest.',
    details: [
      'Intake valve (blue) opens as the piston descends; exhaust valve (grey) opens as it rises after combustion.',
      'Driven by a camshaft spinning at half crank speed — one lobe pass per four-stroke cycle.',
      'Exhaust valves run hotter, so they are often sodium-filled or made of exotic alloys.',
    ],
    kaypohFact: 'A single valve on this engine opens and shuts roughly 3,500 times a minute at full chat.',
  },
}

export const PART_LIST: PartId[] = ['piston', 'connectingRod', 'crankshaft', 'sparkPlug', 'valves', 'cylinderBank', 'flywheel']
