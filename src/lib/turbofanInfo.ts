import type { FlowPhase, StageId, TurbofanPartId } from '../types/turbofan'

export interface TurbofanPartInfo {
  id: TurbofanPartId
  name: string
  tagline: string
  role: string
  details: string[]
  kaypohFact: string
}

export const TURBOFAN_PART_INFO: Record<TurbofanPartId, TurbofanPartInfo> = {
  fan: {
    id: 'fan',
    name: 'Fan',
    tagline: 'The big one at the front does most of the work.',
    role: 'Pulls in a huge volume of air and gives all of it a gentle shove backwards. Most of the thrust comes from here, not from the fire.',
    details: [
      '22 wide, twisted titanium (or carbon) blades on the slow LP shaft, spinning about 3,000 rpm at full power.',
      'Only a small share of its air goes into the core; the rest flows around it through the bypass duct.',
      'A gentle pressure rise (about 1.5×) on a lot of air beats a violent one on a little — quieter and cheaper on fuel.',
    ],
    kaypohFact: 'On a big airliner engine the fan is about 3 m across and its blade tips go supersonic on takeoff. That buzz-saw sound is them.',
  },
  booster: {
    id: 'booster',
    name: 'Booster',
    tagline: 'Warm-up act for the compressor.',
    role: 'A few compressor stages bolted to the fan shaft that give the core air its first extra squeeze before the HP compressor.',
    details: [
      'Three rotor + stator pairs right behind the fan hub, inside the splitter.',
      'Spins at fan speed (N1), so it can only add modest pressure — around 1.7× at takeoff.',
      'Also called the low-pressure compressor. Same shaft as the fan and the LP turbine.',
    ],
    kaypohFact: 'Because the booster is chained to the slow fan shaft it can never spin as fast as it would like. Geared turbofans exist to fix exactly this.',
  },
  hpCompressor: {
    id: 'hpCompressor',
    name: 'HP Compressor',
    tagline: 'Eight squeezes, each one smaller than the last.',
    role: 'Packs the core air into a space roughly 30× smaller than when it came in, heating it to around 600 °C before any fuel is added.',
    details: [
      'Eight stages on the fast HP shaft (around 11,000 rpm). Each rotor adds a little speed; the stator behind it turns that speed into pressure.',
      'The blades shrink stage by stage because the same air now takes up much less room.',
      'Squeezing a gas heats it. Compressor exit air is hot enough to bake bread, from pressure alone.',
    ],
    kaypohFact: 'The last HP compressor blades are about the size of your thumb, spinning at 11,000 rpm in air hot enough to melt tin.',
  },
  combustor: {
    id: 'combustor',
    name: 'Combustor',
    tagline: 'One continuous bang.',
    role: 'Fuel is sprayed into the hot compressed air and burns steadily. Temperature jumps by hundreds of degrees; pressure barely changes.',
    details: [
      'An annular can (a ring-shaped tin) with a domed front where the fuel nozzles sit.',
      'Only part of the air goes through the flame; the rest slips along the liner as a cooling film and mixes in later.',
      'Nothing pulses. Unlike the V8, the fire here has been burning non-stop since the engine started.',
    ],
    kaypohFact: 'The flame inside runs around 2,000 °C, hotter than the melting point of the metal around it. A film of cooler air is all that keeps the liner from turning into soup.',
  },
  hpTurbine: {
    id: 'hpTurbine',
    name: 'HP Turbine',
    tagline: 'First in line for the hottest gas.',
    role: 'Takes energy out of the hot gas to spin the HP compressor. Every degree the compressor added, this turbine takes back.',
    details: [
      'Two stages of small, thick, heavily cooled blades on the HP shaft, right behind the combustor.',
      'A row of fixed nozzle guide vanes ahead of each rotor aims the gas at the blades.',
      'Its temperature drop equals the HP compressor’s temperature rise (tests in this app check that).',
    ],
    kaypohFact: 'The first turbine blades sit in gas hotter than their own melting point. They survive on cooling air pumped through tiny passages inside them.',
  },
  lpTurbine: {
    id: 'lpTurbine',
    name: 'LP Turbine',
    tagline: 'The muscle that spins the fan.',
    role: 'Pulls the remaining useful energy from the gas and sends it up the long LP shaft to drive the fan and booster.',
    details: [
      'Four stages that grow bigger stage by stage as the gas expands and slows.',
      'Has to power the fan’s work on all the air — bypass included — using only the core gas, so it takes a big bite.',
      'Raise the bypass ratio and watch this turbine’s temperature drop grow. The fan’s work has to come from somewhere.',
    ],
    kaypohFact: 'In this engine the LP turbine hands over about as much power as the HP turbine, but to a shaft turning 3.5× slower. Slower shaft means bigger blades and more stages.',
  },
  nozzle: {
    id: 'nozzle',
    name: 'Nozzle & Exhaust Cone',
    tagline: 'Where pressure finally becomes speed.',
    role: 'The remaining pressure in the core gas is traded for speed as it squeezes out of the nozzle. That fast jet is the core’s share of the thrust.',
    details: [
      'The exhaust cone (the pointy plug) keeps the gas flowing smoothly as the shaft ends.',
      'Core jet: hot and fast. Bypass jet: cool and slower, but there is far more of it.',
      'Thrust is mass flow × speed. Two jets, two speeds, added up.',
    ],
    kaypohFact: 'The sawtooth chevrons on the back of some 787 engine nacelles are there to mix the two jets more gently. Quieter for everyone under the flight path.',
  },
  nacelle: {
    id: 'nacelle',
    name: 'Nacelle & Casings',
    tagline: 'The smooth suit over a very violent machine.',
    role: 'Guides air smoothly into the fan, carries the bypass duct, and wraps the core in casings that must hold in a blade if one ever lets go.',
    details: [
      'The rounded intake lip keeps air attached and even across the fan face, even in a crosswind.',
      'Casings around each blade row are built to contain a released blade — a test every engine must pass.',
      'This model is sectioned through 270° like a museum cutaway, so you can see in without hiding anything.',
    ],
    kaypohFact: 'The inlet lip is heated with hot air bled from the compressor so ice cannot form on it. A lump of ice into a fan at 3,000 rpm is a very bad day.',
  },
}

export const TURBOFAN_PART_LIST: TurbofanPartId[] = ['fan', 'booster', 'hpCompressor', 'combustor', 'hpTurbine', 'lpTurbine', 'nozzle', 'nacelle']

export interface PhaseInfo {
  id: FlowPhase
  step: number
  title: string
  nick: string
  headline: string
  body: string
  bullets: string[]
  /** Stages this phase happens in, front to back. */
  stages: StageId[]
  /** Which stations the phase spans, for the strip. */
  stations: string
}

export const PHASE_INFO: Record<FlowPhase, PhaseInfo> = {
  suck: {
    id: 'suck',
    step: 1,
    title: 'Intake',
    nick: 'Suck',
    headline: 'The fan pulls in a huge amount of air and gives all of it a gentle shove.',
    body: 'No piston, no valve, no timing. The fan simply spins and air keeps coming. Most of it (the bypass ratio says how much) goes around the core and straight out the back, and that gentle push on a lot of air is where most of the thrust comes from. Only a small share is sent inward to feed the fire.',
    bullets: ['Fan pressure ratio: ~1.4–1.8×', 'Temperature rise: ~30–50 °C', 'Bypass air: most of it', 'Core air: the rest'],
    stages: ['fan'],
    stations: 'Stations 0 → 2 → 13 / 21',
  },
  squeeze: {
    id: 'squeeze',
    step: 2,
    title: 'Compression',
    nick: 'Squeeze',
    headline: 'Rows of blades pack the core air into a space around 30× smaller.',
    body: 'Each rotor row flings the air faster; the stator row behind it slows the air down and turns that speed into pressure. Do that eleven times and the air is dense, hot (about 600 °C) and very keen to burn. The blades shrink as you go back because the same air now takes up much less room. Nothing moves in and out — it is all one steady stream.',
    bullets: ['Booster: 3 stages, fan shaft', 'HP compressor: 8 stages, fast shaft', 'Overall pressure ratio: ~30× at takeoff', 'Exit temperature: ~600 °C'],
    stages: ['booster', 'hpCompressor'],
    stations: 'Stations 21 → 25 → 3',
  },
  bang: {
    id: 'bang',
    step: 3,
    title: 'Combustion',
    nick: 'Bang',
    headline: 'Fuel sprays into the hot air and burns continuously. Nothing actually goes bang.',
    body: 'The combustor is a ring-shaped tin with fuel nozzles in its front dome. The flame has been burning non-stop since the engine started; adding fuel just makes it hotter. Temperature jumps by several hundred degrees while pressure barely changes, which is the trick: hot gas at high pressure wants out, badly.',
    bullets: ['Temperature rise: ~300–900 °C', 'Pressure loss: ~4 %', 'Flame: ~2,000 °C locally', 'Liner: cooled by an air film'],
    stages: ['combustor'],
    stations: 'Stations 3 → 4',
  },
  blow: {
    id: 'blow',
    step: 4,
    title: 'Expansion',
    nick: 'Blow',
    headline: 'Hot gas spins two turbines to power the front, then rushes out the nozzle.',
    body: 'The HP turbine takes back exactly the energy the HP compressor spent. The LP turbine takes what the fan and booster need — a lot, because the fan works on all that bypass air. Whatever pressure is left turns into a fast core jet at the nozzle. Two jets leave: a slower cool one from the bypass duct and a fast hot one from the core.',
    bullets: ['HP turbine → HP compressor', 'LP turbine → fan + booster', 'Core jet: hot, ~500–900 m/s', 'Bypass jet: cool, ~200–300 m/s'],
    stages: ['hpTurbine', 'lpTurbine', 'nozzle'],
    stations: 'Stations 4 → 45 → 5 → 8',
  },
}
