import type { GearId, GearboxPartId, GearboxStep, GearboxViewMode } from '../types/gearbox'

export interface GearboxPartInfo {
  id: GearboxPartId
  name: string
  tagline: string
  role: string
  details: string[]
  kaypohFact: string
}

export const GEARBOX_PART_INFO: Record<GearboxPartId, GearboxPartInfo> = {
  clutch: {
    id: 'clutch',
    name: 'Clutch',
    tagline: 'The off switch between the engine and everything else.',
    role: 'A friction disc squeezed between the engine’s flywheel and a spring-loaded pressure plate. Pedal down, the squeeze lets go and the engine spins free of the gearbox — which is the only reason you can change gear at all.',
    details: [
      'The flywheel and pressure plate are bolted to the engine; the disc is splined to the gearbox input shaft.',
      'Pedal down moves the plate back only a few millimetres, but that is enough for the disc to stop dragging.',
      'Every gear change in this model starts with the clutch out and ends with it coming back in.',
    ],
    kaypohFact: 'Holding the clutch half-way at a traffic light turns engine power straight into heat in the disc. Do it for a minute and the smell will tell you.',
  },
  inputShaft: {
    id: 'inputShaft',
    name: 'Input shaft & gear',
    tagline: 'Engine speed comes in here, always.',
    role: 'Carries the clutch disc and one gear that is permanently meshed with the countershaft. With the clutch in, this shaft turns at engine speed no matter which gear you are in.',
    details: [
      'Its front end sits in a small bearing in the middle of the flywheel; the output shaft’s nose sits inside its gear.',
      'The input gear also has a ring of dog teeth on its back face: 4th gear locks the output shaft straight onto it.',
      'Input → countershaft is 21 : 32 teeth here, so the countershaft already turns slower than the engine.',
    ],
    kaypohFact: 'In 4th (direct drive) the power never touches the countershaft. Input and output become one shaft, so nothing multiplies and almost nothing is lost — that is why it was the cruising gear for decades.',
  },
  countershaft: {
    id: 'countershaft',
    name: 'Countershaft',
    tagline: 'One long lump of gears, spinning backwards.',
    role: 'A single shaft below the main axis with a gear for every speed fixed to it. Driven by the input gear, it turns opposite to the engine and drives every speed gear on the output shaft at once.',
    details: [
      'All its gears are locked to it — no freewheeling here. Its speed is always input-shaft speed ÷ 1.52, which is engine speed whenever the clutch is in.',
      'Each of its gears is a different size, and each partner on the output shaft is sized to match: that pairing is the ratio.',
      'Also called the layshaft or cluster gear. On many boxes it is machined from one piece of steel.',
    ],
    kaypohFact: 'The whole countershaft keeps spinning in neutral. That faint rattle at idle with your foot off the clutch is the countershaft gears jiggling in their backlash.',
  },
  speedGears: {
    id: 'speedGears',
    name: 'Speed gears',
    tagline: 'Always meshed, but free to spin — until they are not.',
    role: 'The gears for 1st, 2nd, 3rd, 5th and reverse ride on the output shaft on needle bearings, like rings on a finger. They spin whenever the countershaft does, but none of them drives the shaft until a sleeve locks it in.',
    details: [
      'Each one has a cone and a ring of dog teeth on the side facing its synchro hub.',
      'Big output gear ÷ small counter gear = a short gear (1st: 29 ÷ 14 teeth). Small output gear ÷ big counter gear = a tall gear (5th: 17 ÷ 31).',
      'Drawn straight-cut so you can watch the teeth interleave; real ones are helical (angled) so several teeth share the load and they hum instead of whine.',
    ],
    kaypohFact: 'In most road cars only reverse uses straight-cut gears, which is why reversing sounds different from driving forward — that whine is the same sound a rally car makes in every gear.',
  },
  synchro: {
    id: 'synchro',
    name: 'Synchroniser',
    tagline: 'A brass brake that stops you crunching.',
    role: 'Each hub is splined to the output shaft with a sleeve that slides along it. Between the sleeve and the gear sits a brass blocker ring on a cone. Push the sleeve and the ring rubs the gear up (or down) to the shaft’s speed before the teeth are allowed to meet.',
    details: [
      'Three hubs serve six speeds: 1-2, 3-4 and 5-R. Sleeve left or right picks one of the two gears.',
      'While the speeds differ, the ring sits slightly turned and physically blocks the sleeve. Speeds match, it lines up, the sleeve slips through.',
      'Switch the synchro off in the gear panel to hear what a 1930s driver heard: the crunch of dog teeth meeting at different speeds.',
    ],
    kaypohFact: 'That slight resistance you feel just before the lever drops into gear is the blocker ring doing its job. Force it and you are asking the dog teeth to do the synchro’s work with their corners.',
  },
  reverseIdler: {
    id: 'reverseIdler',
    name: 'Reverse idler',
    tagline: 'A third wheel, purely to turn things around.',
    role: 'Reverse needs the output to turn the other way, so a small extra gear sits between the countershaft and the reverse gear on the output shaft. Two meshes instead of one flips the direction.',
    details: [
      'The idler’s own tooth count cancels out of the ratio: it only changes direction. Its size is picked to bridge the gap.',
      'Here it is always meshed. In many older boxes it slides into mesh, with no synchro, which is why reverse crunches if the car is still rolling.',
      'Reverse (13 : 31 teeth on the counter and output) ends up shorter than 1st — you rarely reverse at 40 km/h.',
    ],
    kaypohFact: 'Because reverse has no proper synchro in most cars, the box will not let you select it while rolling forward. Try it in this model: it will politely tell you to stop first.',
  },
  shiftForks: {
    id: 'shiftForks',
    name: 'Shift forks & rails',
    tagline: 'The H pattern, made of metal.',
    role: 'Each sleeve has a groove, and a fork rides in it. The forks sit on rails: the lever’s side-to-side move picks a rail, its forward-back move pushes it. Only one rail can move at a time.',
    details: [
      'Three forks, three rails, six gears. Left rail 1-2, middle 3-4, right 5-R — the same layout as the knob in your hand.',
      'An interlock plate blocks the other rails while one is out of neutral; two gears at once would lock the box solid.',
      'The fork’s shoes are the only part of the shift mechanism that touches the spinning sleeve, so they wear first.',
    ],
    kaypohFact: 'The H pattern is not a design choice, it is the rails: three rods side by side, each pushed forward or back. Dog-leg boxes pair the gears differently on the rails, putting 1st out on its own so that 2nd to 3rd is one straight pull.',
  },
  outputShaft: {
    id: 'outputShaft',
    name: 'Output shaft',
    tagline: 'Whatever gets locked to this goes to the wheels.',
    role: 'Carries the three synchro hubs (splined, so they always turn with it) and the freewheeling speed gears (which do not). Its back end leaves the case and drives the propshaft, then the differential, then the wheels.',
    details: [
      'In every gear but 4th it turns slower or faster than the engine by exactly the ratio of the locked pair.',
      'Coaxial with the input shaft: its nose spins inside the input gear on a small pilot bearing.',
      'The final drive after it multiplies torque another 3.9×, so 1st gear is ×12 at the wheels.',
    ],
    kaypohFact: 'The output turns slower than the engine in 1st to 3rd, matches it in 4th and beats it in 5th, and the final drive makes the wheels slower still. The whole point of a gearbox is to trade engine speed for wheel torque.',
  },
  casing: {
    id: 'casing',
    name: 'Casing & bell housing',
    tagline: 'Aluminium tub full of oil, sectioned for your viewing pleasure.',
    role: 'Holds the bearings that locate every shaft to within a fraction of a millimetre, keeps the gears sitting in an oil bath, and bolts to the engine through the bell housing that wraps the clutch.',
    details: [
      'The bearings in the end walls take the tooth loads, which try to push the shafts apart with real force.',
      'The bell housing is open to the engine side; the clutch runs dry in there while the gears run wet.',
      'This model is cut along the centre plane, like a display gearbox at a motor show, so nothing hides.',
    ],
    kaypohFact: 'Gear oil is not engine oil. It is thicker and packed with extreme-pressure additives because teeth meet along a line, at pressures that would weld steel. The sulphur smell is those additives.',
  },
}

export const GEARBOX_PART_LIST: GearboxPartId[] = ['clutch', 'inputShaft', 'countershaft', 'speedGears', 'synchro', 'reverseIdler', 'shiftForks', 'outputShaft', 'casing']

export interface StepInfo {
  id: GearboxStep
  step: number
  title: string
  nick: string
  headline: string
  body: string
  bullets: string[]
  /** What "Show in 3D" does for this step. */
  action: { viewMode: GearboxViewMode; gear?: GearId | 'next'; torquePath?: boolean }
}

export const STEP_INFO: Record<GearboxStep, StepInfo> = {
  mesh: {
    id: 'mesh',
    step: 1,
    title: 'Always meshed',
    nick: 'Mesh',
    headline: 'Every gear pair in the box is turning all the time. None of them is the problem.',
    body: 'With the clutch in, the input gear spins the countershaft, and every gear on the countershaft spins its partner on the output shaft. Those partners are free to spin on the shaft, like a ring on your finger, so all that whirring reaches nothing. Old “crash” boxes slid gears in and out of mesh; a constant-mesh box never does.',
    bullets: ['Input → countershaft: 21 : 32 teeth', 'Five pairs plus reverse, all meshed', 'Speed gears ride on needle bearings', 'Nothing reaches the wheels yet'],
    action: { viewMode: 'xray' },
  },
  neutral: {
    id: 'neutral',
    step: 2,
    title: 'Neutral',
    nick: 'Neutral',
    headline: 'In neutral the whole box is spinning and delivering nothing.',
    body: 'All three sleeves sit centred on their hubs, touching no gear. The engine turns the input shaft, the input shaft turns the countershaft, the countershaft turns every speed gear — and the output shaft only turns if the car is rolling and turning it from the other end. Gears touching does not mean gears driving.',
    bullets: ['Three sleeves, all centred', 'Countershaft still turning', 'Output shaft driven by the wheels, if at all', 'Torque through the box: zero'],
    action: { viewMode: 'cutaway', gear: 'N', torquePath: true },
  },
  synchro: {
    id: 'synchro',
    step: 3,
    title: 'Synchronise',
    nick: 'Synchro',
    headline: 'Before the teeth can meet, the gear has to be turning at the shaft’s speed.',
    body: 'The fork pushes the sleeve, the sleeve pushes a brass ring onto the gear’s cone, and friction drags the gear (and the whole clutch-out cluster behind it) up or down to match the output shaft. While they differ the ring sits slightly twisted and blocks the sleeve. The moment they match it lines up and the sleeve slides on through. Watch the slip number fall to zero.',
    bullets: ['Cone friction does the matching, not teeth', 'Slip → 0 in a fraction of a second', 'Blocker ring stops an early entry', 'No synchro: crunch (try the switch)'],
    action: { viewMode: 'synchro', gear: 'next' },
  },
  lock: {
    id: 'lock',
    step: 4,
    title: 'Lock & drive',
    nick: 'Lock',
    headline: 'Sleeve over the dog teeth: that gear is now part of the shaft, and the maths is fixed.',
    body: 'Power runs engine → input gear → countershaft → the locked pair → sleeve → hub → output shaft. A small gear driving a big one turns it slower but with more force: 1st gear here divides speed by 3.16 and multiplies torque by 3.16. Power in equals power out (minus a little friction), it is only traded between speed and force. 4th locks the shafts straight together, and 5th flips the sizes round (small gear driven) for an overdrive.',
    bullets: ['1st: speed ÷ 3.16, torque × 3.16', '4th: direct drive, 1 : 1', '5th: overdrive, × 0.84', 'Power in = power out'],
    action: { viewMode: 'cutaway', torquePath: true },
  },
}
