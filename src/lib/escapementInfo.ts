import type { EscapementPartId, EscapementStep, EscapementViewMode } from '../types/escapement'

export interface EscapementPartInfo {
  id: EscapementPartId
  name: string
  tagline: string
  role: string
  details: string[]
  kaypohFact: string
}

export const ESCAPEMENT_PART_INFO: Record<EscapementPartId, EscapementPartInfo> = {
  balance: {
    id: 'balance',
    name: 'Balance wheel',
    tagline: 'The pendulum of a watch, only it swings round and round.',
    role: 'A weighted rim on a fine steel arbor that swings back and forth through nearly a full turn, eight times a second. Its size and weight, together with the hairspring, set the rate of the whole watch. Everything else exists to keep it swinging.',
    details: [
      'Bigger rim, more inertia, slower swing. The balance and hairspring are chosen as a pair.',
      'It swings through 270–310° each way when the watch is fully wound. That is the amplitude.',
      'The pivots are a tenth of a millimetre across and run in ruby jewels, so friction stays almost nil.',
    ],
    kaypohFact: 'A balance wheel swinging 28,800 times an hour for a year covers about 250 million half-turns. A car engine at cruising speed manages that in a few months, with an oil change.',
  },
  hairspring: {
    id: 'hairspring',
    name: 'Hairspring',
    tagline: 'A coil of steel thinner than a hair, and the actual clock.',
    role: 'A flat spiral spring: inner end fixed to the balance, outer end fixed to the frame. Twist the balance and the spring twists back. Because its push grows in exact proportion to the twist, the swing takes the same time whether it is big or small.',
    details: [
      'That proportional push is Hooke’s law, and it is why the rate barely changes with amplitude: the physics is the same as a pendulum.',
      'Watch it breathe: as the balance swings the coils open and close together, in and out, rather than swinging side to side.',
      'Modern ones are a nickel alloy or silicon so heat and magnets do not change their stiffness.',
    ],
    kaypohFact: 'A hairspring weighs about two milligrams. A small drop of water on it, or a fingerprint, is enough to glue two coils together and make the watch gain minutes an hour.',
  },
  regulator: {
    id: 'regulator',
    name: 'Regulator',
    tagline: 'Two pins that decide how long the spring really is.',
    role: 'A small arm on the balance cock with two pins that pinch the outer coil of the hairspring. Slide the pins along the coil and you change how much spring is free to flex. Shorter spring, stiffer, faster swing. The watchmaker moves it a hair to bring the watch to time.',
    details: [
      'Rate goes as one over the square root of spring length, so a tiny move is a big change: half a percent of coil is about four minutes a day.',
      'Marked F/S or +/− on the balance cock. Some watches use a free-sprung balance with weights on the rim instead.',
      'Drag the regulator slider in this model and watch the curb pins walk along the outer coil.',
    ],
    kaypohFact: 'A watch that gains 5 seconds a day is running 0.006 % fast. Chronometer grade is −4 to +6 s/day. Your phone checks itself against an atomic clock; the watch just has these two pins.',
  },
  roller: {
    id: 'roller',
    name: 'Roller & impulse pin',
    tagline: 'The one place the balance touches anything.',
    role: 'A small disc on the balance staff carrying a D-shaped ruby pin. For most of every swing the pin is nowhere near the fork. For about 55° in the middle it enters the fork’s notch, flicks the lever across, and picks up a tiny kick in return.',
    details: [
      'The pin only meets the fork over the lift angle, roughly 55° around the centre of a swing that reaches about 300° either side. The rest is free swing.',
      'It is the pin that unlocks the escape wheel each time, using the momentum of the balance.',
      'The disc has a crescent cut for the guard pin, so the fork cannot flip across when the pin is away.',
    ],
    kaypohFact: 'The impulse pin is a ruby because rubies do not wear and need almost no oil. The first jewelled watches used real gemstones; today they are grown in a furnace by the ton.',
  },
  fork: {
    id: 'fork',
    name: 'Pallet fork',
    tagline: 'A lever that says “one tooth, and no more”.',
    role: 'A see-saw between the balance and the escape wheel. Its forked end is flicked by the impulse pin; its other end carries two jewels that alternately block and release the escape wheel. It rocks about 10° between two banking pins, once per tick.',
    details: [
      'Nothing pushes the fork except the pin and the wheel. It rests against a banking pin until the pin comes back.',
      'The angled locking faces give “draw”: the wheel’s own push keeps the fork pressed against its pin, so a knock cannot unlock it.',
      'It is the lever that gives the “lever escapement” its name. Every mechanical watch you have seen this decade has one.',
    ],
    kaypohFact: 'The whole lever weighs a few milligrams and flicks across in a couple of milliseconds. It does that half a billion times before its first service.',
  },
  pallets: {
    id: 'pallets',
    name: 'Pallet jewels',
    tagline: 'Two rubies: one catches, one lets go, then they swap.',
    role: 'The entry and exit pallets are rectangular rubies set in the fork. Each has a locking face that stops a tooth dead, and an inclined impulse face the tooth slides down, pushing the fork and, through it, the balance. Together they let the wheel go half a tooth per tick.',
    details: [
      'Lock: the tooth tip sits on the locking face. Unlock: the fork lifts the jewel and the wheel recoils a fraction. Impulse: the tooth rides down the slope.',
      'Drop: the tooth leaves the slope and the wheel runs free for a degree or so until another tooth lands on the other jewel. That landing is the tick.',
      'In this model the jewel shapes are drawn from the exact path the tooth tip takes, so what you see touching is what the maths says touches.',
    ],
    kaypohFact: 'The impulse face is inclined by roughly 15°. Change it by a degree and the watch keeps time, but the amplitude changes and so does the sound of the tick.',
  },
  escapeWheel: {
    id: 'escapeWheel',
    name: 'Escape wheel',
    tagline: 'The last wheel of the train, released one tooth at a time.',
    role: 'The mainspring is always trying to unwind through the gear train, and this fifteen-tooth wheel is where it gets stopped. Its club-shaped teeth are held by one pallet jewel, released, given a short run, and caught by the other. Twelve degrees per tick; one turn every 3.75 seconds at 28,800.',
    details: [
      'Fifteen teeth, and the pallets straddle two and a half of them. That is why the wheel moves half a pitch per tick and alternates jewels.',
      'It does the pushing: each time a tooth slides off a jewel it gives the balance the energy it lost to friction and air in the last swing.',
      'It is turned by the fourth wheel, which carries the seconds hand: sixteen escape wheel turns per minute here.',
    ],
    kaypohFact: 'The escape wheel is so light that a tooth broken off it can weigh less than a grain of sand. It is often the only wheel in a watch made of steel, not brass, because the tips must not wear.',
  },
  banking: {
    id: 'banking',
    name: 'Banking pins',
    tagline: 'Two posts that tell the fork where to stop.',
    role: 'Two fixed pins either side of the lever. The fork rocks between them: against one pin the entry jewel is locked, against the other the exit jewel is. Their spacing sets how deep the jewels lock and how far the tooth drops.',
    details: [
      'Too close together and the wheel unlocks with the slightest knock. Too far apart and the teeth drop too far and waste energy as noise.',
      'The tap of the fork against a banking pin is part of the tick you hear.',
      'On many movements they are the edges of a cut-out in the plate, not pins, but the job is identical.',
    ],
    kaypohFact: 'Watchmakers set the banking by ear and by eye under a microscope: 0.01 mm either way changes the sound. Old repairers would bend the pins, which is why modern ones are cut solid.',
  },
  plate: {
    id: 'plate',
    name: 'Plate & bridges',
    tagline: 'The chassis. Holds every pivot to a hundredth of a millimetre.',
    role: 'The main plate underneath, and a bridge (a “cock”) over each arbor, hold the ruby bearings that locate the balance, fork and escape wheel. Get one of these positions wrong by a few hundredths and the escapement stops or gallops.',
    details: [
      'The balance cock also carries the hairspring stud and the regulator, so it is the one bridge you can adjust from outside.',
      'Everything here is brass, plated with rhodium or gilded, and finished by hand on movements you can see through the case back.',
      'Hide the plate in the view controls to see the arbors passing through their jewels.',
    ],
    kaypohFact: 'The balance cock is the most decorated part of a watch because it is the one you see through the case back, and the one the watchmaker touches most. Eighteenth-century ones were pierced and engraved by hand for months.',
  },
}

export const ESCAPEMENT_PART_LIST: EscapementPartId[] = ['balance', 'hairspring', 'regulator', 'roller', 'fork', 'pallets', 'escapeWheel', 'banking', 'plate']

export interface EscapementStepInfo {
  id: EscapementStep
  step: number
  title: string
  nick: string
  headline: string
  body: string
  bullets: string[]
  /** What "Show in 3D" does for this step. */
  action: { viewMode: EscapementViewMode; speed?: 0.1 | 0.5 | 1 }
}

export const ESCAPEMENT_STEP_INFO: Record<EscapementStep, EscapementStepInfo> = {
  swing: {
    id: 'swing',
    step: 1,
    title: 'Free swing',
    nick: 'Swing',
    headline: 'For most of every beat the balance is on its own, and that is the point.',
    body: 'The hairspring pulls the balance back toward centre with a push proportional to how far it has twisted. A bigger swing means a harder pull, so a big swing and a small swing take the same time: this is what makes it a clock. The impulse pin is far from the fork, the fork rests on its banking pin, and the escape wheel is locked dead by one pallet jewel. Nothing in the gear train can move. The mainspring waits.',
    bullets: ['Rate set by balance inertia and spring stiffness', 'Amplitude does not change the rate', 'Fork banked, wheel locked', 'Free for all but ~55° of each swing'],
    action: { viewMode: 'cutaway' },
  },
  unlock: {
    id: 'unlock',
    step: 2,
    title: 'Unlock',
    nick: 'Unlock',
    headline: 'The pin enters the notch and uses the balance’s momentum to lift a jewel off a tooth.',
    body: 'About 25° before centre the impulse pin slides into the fork’s notch and starts pushing the lever across. The locking face of the pallet jewel is slightly angled (“draw”), so lifting it forces the escape wheel backwards by a fraction of a degree against the whole mainspring. That is the price of unlocking, and the reason a watch will not unlock itself when knocked.',
    bullets: ['Pin meets fork: the lift angle begins', 'Lever moves 1.5° of its 10°', 'Wheel recoils ≈ 0.75° (draw)', 'Balance pays energy here, gets it back next'],
    action: { viewMode: 'pallet', speed: 0.1 },
  },
  impulse: {
    id: 'impulse',
    step: 3,
    title: 'Impulse',
    nick: 'Impulse',
    headline: 'The tooth slides down the jewel’s slope and gives the balance its kick.',
    body: 'Once the locking corner clears, the tooth tip rides down the inclined impulse face. The mainspring, through the wheel, now pushes the fork, and the fork pushes the impulse pin. The balance gets back the energy it lost to friction and air in the last swing, and a little extra to cover the unlock. This happens right around the centre of the swing, where the balance is moving fastest, so it disturbs the timing least.',
    bullets: ['Wheel turns ≈ 10.5° down the slope', 'Lever moves 6.5°, pin pushed ≈ 35°', 'Energy: mainspring → wheel → fork → balance', 'Centred on the dead point for best timekeeping'],
    action: { viewMode: 'pallet', speed: 0.1 },
  },
  lock: {
    id: 'lock',
    step: 4,
    title: 'Drop & lock',
    nick: 'Lock',
    headline: 'The tooth falls off the jewel, the wheel runs free for a degree, and another tooth slams into the other jewel. Tick.',
    body: 'At the let-off corner the tooth leaves the impulse face. Nothing holds the wheel, so it leaps forward (“drop”) until a tooth two and a half pitches back lands on the locking face of the other pallet. That impact, plus the fork tapping its banking pin, is the tick you hear. The draw then pulls the fork snug against the pin, the impulse pin leaves the notch, and the balance carries on out to its full swing with nothing touching it. Twelve degrees of wheel, one beat of time, 28,800 times an hour.',
    bullets: ['Drop ≈ 1.5° of free wheel', 'Landing is the tick', 'Half a tooth pitch per beat, pallets alternate', 'Fork runs to banking, pin leaves the notch'],
    action: { viewMode: 'pallet', speed: 0.5 },
  },
}
