import type { Stroke } from '../types/simulation'

export interface StrokeInfo {
  id: Stroke
  step: number
  title: string
  nick: string
  headline: string
  body: string
  bullets: string[]
  /** Crank angle range in degrees, relative to firing TDC of the cylinder. */
  crankRange: string
}

export const STROKE_INFO: Record<Stroke, StrokeInfo> = {
  intake: {
    id: 'intake',
    step: 1,
    title: 'Intake',
    nick: 'Suck',
    headline: 'Piston goes down, air and fuel come in.',
    body: 'The intake valve opens and the piston slides toward the bottom of the bore. The growing space drops the pressure, and atmospheric pressure shoves fresh air-fuel mixture in to fill it. Technically it is being pushed, but “suck” is the word everyone uses, so we also use lor.',
    bullets: ['Intake valve: open', 'Exhaust valve: closed', 'Piston: TDC → BDC', 'Pressure: slightly below atmospheric'],
    crankRange: '360° – 540°',
  },
  compression: {
    id: 'compression',
    step: 2,
    title: 'Compression',
    nick: 'Squeeze',
    headline: 'Both valves shut, piston rises, mixture gets squeezed.',
    body: 'With both valves closed, the piston climbs back up and packs the mixture into roughly a tenth of its original volume. Squeezing a gas heats it, so by the top the mixture is hot, dense, and very keen to burn.',
    bullets: ['Intake valve: closed', 'Exhaust valve: closed', 'Piston: BDC → TDC', 'Compression ratio: ~10 : 1'],
    crankRange: '540° – 720°',
  },
  power: {
    id: 'power',
    step: 3,
    title: 'Power',
    nick: 'Bang',
    headline: 'Spark fires, mixture burns, piston gets shoved down.',
    body: 'Just before TDC the spark plug fires. The mixture burns in a few milliseconds and pressure spikes to around 50 bar, driving the piston down hard. This is the only stroke that actually does work — the other three are just admin.',
    bullets: ['Spark: fires ~10–35° before TDC', 'Both valves: closed', 'Piston: TDC → BDC', 'Peak pressure: ~40–60 bar'],
    crankRange: '0° – 180°',
  },
  exhaust: {
    id: 'exhaust',
    step: 4,
    title: 'Exhaust',
    nick: 'Blow',
    headline: 'Exhaust valve opens, piston pushes burnt gas out.',
    body: 'The exhaust valve opens and the rising piston sweeps the spent gas out into the manifold. Then the whole thing starts again from Intake. At 7,000 rpm each cylinder runs this four-step dance 58 times every second.',
    bullets: ['Intake valve: closed', 'Exhaust valve: open', 'Piston: BDC → TDC', 'Gas temp: ~600–900 °C'],
    crankRange: '180° – 360°',
  },
}
