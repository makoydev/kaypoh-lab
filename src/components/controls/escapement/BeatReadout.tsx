import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { ACTION, ESCAPEMENT_VISUAL_TIME_SCALE, PALLET_META, PHASE_META } from '../../../lib/escapementConfig'
import { LIFT_ANGLE, otherPallet } from '../../../lib/escapementModel'
import { useEscapement, useEscapementSnapshot } from '../../../hooks/useEscapementSimulation'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import { Kbd } from '../../ui/Kbd'

const SEGMENTS = [
  { key: 'unlock', from: 0, to: ACTION.unlockEnd },
  { key: 'impulse', from: ACTION.unlockEnd, to: ACTION.impulseEnd },
  { key: 'drop', from: ACTION.impulseEnd, to: ACTION.dropEnd },
  { key: 'lock', from: ACTION.dropEnd, to: 1 },
] as const

function formatWatch(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`
}

/** A small seconds dial whose hand moves with the escape wheel, eight tiny steps a second at 28,800. */
function SecondsDial({ angle }: { angle: number }) {
  const r = 30
  const a = (angle - 90) * (Math.PI / 180)
  return (
    <svg viewBox="0 0 72 72" className="size-[72px] shrink-0" role="img" aria-label={`Seconds hand at ${(((angle % 360) + 360) % 360 / 6).toFixed(1)} seconds`}>
      <circle cx={36} cy={36} r={r + 4} fill="#0b0e13" stroke="#2b3341" />
      {Array.from({ length: 60 }, (_, i) => {
        const t = (i / 60) * Math.PI * 2 - Math.PI / 2
        const major = i % 5 === 0
        const r0 = major ? r - 5 : r - 2.5
        return <line key={i} x1={36 + Math.cos(t) * r0} y1={36 + Math.sin(t) * r0} x2={36 + Math.cos(t) * r} y2={36 + Math.sin(t) * r} stroke={major ? '#8b919c' : '#3b4351'} strokeWidth={major ? 1.2 : 0.8} />
      })}
      <line x1={36 - Math.cos(a) * 6} y1={36 - Math.sin(a) * 6} x2={36 + Math.cos(a) * (r - 3)} y2={36 + Math.sin(a) * (r - 3)} stroke="#22d3ee" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={36} cy={36} r={2} fill="#22d3ee" />
    </svg>
  )
}

/** What the escapement is doing right now, the tick count, the time it has kept, and a stepper for when it is paused. */
export function BeatReadout() {
  const { settings, step } = useEscapement()
  const snap = useEscapementSnapshot(30)
  const { phase, pallet, s, beats, watchSeconds, balanceAngle } = snap
  const meta = PHASE_META[phase]
  const inNotch = phase !== 'free'
  const paused = !settings.playing

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <SecondsDial angle={snap.secondsAngle} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-fog-500">Now</span>
            <span className="font-mono text-sm" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-fog-300">
            {inNotch ? (
              <>
                {PALLET_META[pallet].label} releasing{phase === 'lock' ? `, tooth caught by the ${PALLET_META[otherPallet(pallet)].label.toLowerCase()}` : ''}.
              </>
            ) : (
              <>
                Pin clear of the fork, balance at{' '}
                <span className="font-mono text-fog-100">
                  {balanceAngle >= 0 ? '+' : ''}
                  {balanceAngle.toFixed(0)}°
                </span>
                . Lift angle is only ±{(LIFT_ANGLE / 2).toFixed(0)}°.
              </>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between text-[11px]">
            <span className="text-fog-500">
              Ticks <span className="font-mono text-fog-100">{beats.toLocaleString()}</span>
            </span>
            <span className="text-fog-500">
              Watch time <span className="font-mono text-fog-100">{formatWatch(watchSeconds)}</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-fog-700">
          <span>One beat, lever travel 0 → 10°</span>
          <span>{inNotch ? `${Math.round(s * 100)} %` : 'waiting'}</span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label="Beat progress" aria-valuenow={inNotch ? Math.round(s * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
          {SEGMENTS.map((seg) => (
            <div
              key={seg.key}
              className={cn('absolute inset-y-0 transition-opacity', inNotch && phase === seg.key ? 'opacity-100' : 'opacity-30')}
              style={{ left: `${seg.from * 100}%`, width: `${(seg.to - seg.from) * 100}%`, backgroundColor: PHASE_META[seg.key].color }}
            />
          ))}
          {inNotch && <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_1px_rgba(255,255,255,0.8)]" style={{ left: `calc(${s * 100}% - 1px)` }} />}
        </div>
        <div className="mt-1 flex text-[9px] uppercase tracking-[0.12em] text-fog-700">
          {SEGMENTS.map((seg) => (
            <span key={seg.key} style={{ width: `${(seg.to - seg.from) * 100}%` }} className="truncate text-center">
              {seg.key}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-ink-900/50 px-2 py-1.5">
        <span className="text-[11px] text-fog-500">{paused ? 'Step the balance' : 'Pause to step'}</span>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" disabled={!paused} onClick={() => step(-0.125)} aria-label="Step back an eighth of a beat" title="Step back ⅛ beat (,)">
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" disabled={!paused} onClick={() => step(0.125)} aria-label="Step forward an eighth of a beat" title="Step forward ⅛ beat (.)">
            <ChevronRight className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" disabled={!paused} onClick={() => step(1)} aria-label="Next tick" title="Jump one whole beat (Shift + .)">
            <SkipForward className="size-3.5" /> Next tick
          </Button>
        </div>
      </div>
      <p className="text-[11px] leading-snug text-fog-700">
        <Kbd>,</Kbd> <Kbd>.</Kbd> step while paused. Scene runs at 1 : {ESCAPEMENT_VISUAL_TIME_SCALE}, so 28,800 an hour looks like one tick a second.
      </p>
    </div>
  )
}
