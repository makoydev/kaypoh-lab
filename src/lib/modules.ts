import type { CatalogModule } from '../types/simulation'

export const MODULES: CatalogModule[] = [
  {
    id: 'v8-engine',
    code: 'HLD-001',
    name: 'V8 Engine',
    tagline: 'Eight very busy pistons, one smooth spin.',
    description:
      'A crossplane four-stroke V8, torn open. Watch the crank turn, follow one cylinder through suck-squeeze-bang-blow, and see why the firing order is not just a random list of numbers.',
    status: 'active',
    category: 'Internal combustion',
    difficulty: 2,
    minutes: 12,
    concepts: ['Otto cycle', 'Slider-crank kinematics', 'Firing order', 'Crossplane crank'],
    learn: [
      'Why the crank turns twice for every power stroke a cylinder makes',
      'How a spinning crank turns into pistons going up and down (and back)',
      'What the 1-8-4-3-6-5-7-2 firing order actually does for smoothness',
    ],
    accent: '#22d3ee',
  },
  {
    id: 'turbofan',
    code: 'HLD-002',
    name: 'Turbofan Jet Engine',
    tagline: 'Suck, squeeze, bang, blow — but never stops.',
    description:
      'Fan, compressor, combustor, turbine, nozzle. The same four ideas as the V8, except everything happens at once and nothing goes up and down.',
    status: 'active',
    category: 'Propulsion',
    difficulty: 3,
    minutes: 15,
    concepts: ['Bypass ratio', 'Brayton cycle', 'Compressor stages', 'Thrust'],
    learn: [
      'Where the thrust actually comes from (hint: mostly the fan)',
      'Why the compressor blades get smaller as you go back',
      'How the turbine steals energy to spin the front end',
    ],
    accent: '#a78bfa',
  },
  {
    id: 'escapement',
    code: 'HLD-003',
    name: 'Mechanical Watch Escapement',
    tagline: 'How a tiny lever makes a spring tick instead of unwind.',
    description:
      'Balance wheel, pallet fork, escape wheel. The tick-tock is a spring being let go one tooth at a time, 28,800 times an hour.',
    status: 'active',
    category: 'Horology',
    difficulty: 2,
    minutes: 10,
    concepts: ['Balance wheel', 'Pallet fork', 'Impulse & lock', 'Beat rate'],
    learn: [
      'Why the balance wheel swings at a steady rate no matter the spring tension',
      'What the pallet fork does on every single tick',
      'Where the tick sound actually comes from',
    ],
    accent: '#f59e0b',
  },
  {
    id: 'manual-transmission',
    code: 'HLD-004',
    name: 'Manual Transmission',
    tagline: 'Synchros, dog teeth, and why you cannot just yank it into first.',
    description:
      'Input shaft, countershaft, output shaft. Every gear is always meshed — the lever only decides which pair gets locked to the shaft, and a brass ring makes sure it happens at the right speed.',
    status: 'active',
    category: 'Drivetrain',
    difficulty: 2,
    minutes: 12,
    concepts: ['Gear ratio', 'Constant mesh', 'Synchroniser', 'Torque multiplication'],
    learn: [
      'Why gears are always touching yet the car can be in neutral',
      'What a synchroniser ring is saving you from',
      'How a smaller gear driving a bigger one makes more torque',
    ],
    accent: '#34d399',
  },
  {
    id: 'differential',
    code: 'HLD-005',
    name: 'Open Differential',
    tagline: 'One engine, two wheels, and a corner to get round.',
    description:
      'Ring gear, spider gears, two half-shafts. How a car sends power to both driven wheels yet lets the outside one turn faster in a bend, and why one wheel on ice spins uselessly.',
    status: 'upcoming',
    category: 'Drivetrain',
    difficulty: 2,
    minutes: 8,
    concepts: ['Bevel gears', 'Speed averaging', 'Torque split', 'Limited slip'],
    learn: [
      'Why the two wheels always average to the ring gear speed',
      'What the spider gears do in a straight line (nothing) and in a corner (everything)',
      'Why an open diff sends its torque to the wheel with the least grip',
    ],
    progress: 5,
    accent: '#f472b6',
  },
]

export const ACTIVE_MODULE = MODULES.find((m) => m.status === 'active')!

export const moduleById = (id: string) => MODULES.find((m) => m.id === id)
