import type { Pallet } from '../../types/escapement'

let ctx: AudioContext | null = null

function context() {
  if (ctx) return ctx
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null
  try {
    ctx = new window.AudioContext()
  } catch {
    ctx = null
  }
  return ctx
}

/**
 * A synthesised tick: a short bright click for the tooth landing on the jewel and a lower thud for the
 * fork meeting its banking pin. Entry and exit differ slightly, so it goes tick-tock, not tick-tick.
 * No samples, no network; silently does nothing where Web Audio is unavailable.
 */
export function playTick(pallet: Pallet, volume = 0.5) {
  const ac = context()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  const t = ac.currentTime
  const out = ac.createGain()
  out.gain.value = volume
  out.connect(ac.destination)

  const click = ac.createOscillator()
  click.type = 'triangle'
  click.frequency.setValueAtTime(pallet === 'entry' ? 2600 : 2100, t)
  click.frequency.exponentialRampToValueAtTime(900, t + 0.02)
  const clickGain = ac.createGain()
  clickGain.gain.setValueAtTime(0.6, t)
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  click.connect(clickGain).connect(out)
  click.start(t)
  click.stop(t + 0.035)

  const thud = ac.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(pallet === 'entry' ? 520 : 430, t + 0.006)
  const thudGain = ac.createGain()
  thudGain.gain.setValueAtTime(0.0001, t)
  thudGain.gain.linearRampToValueAtTime(0.35, t + 0.008)
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  thud.connect(thudGain).connect(out)
  thud.start(t)
  thud.stop(t + 0.07)
}
