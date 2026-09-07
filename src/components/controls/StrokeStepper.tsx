import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause } from 'lucide-react'
import { useMemo } from 'react'
import { STROKE_META, STROKE_ORDER, cylinderByNumber } from '../../lib/engineConfig'
import { STROKE_PHASE_START, mod } from '../../lib/kinematics'
import { useEngine, useSimSnapshot } from '../../hooks/useEngineSimulation'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import { Kbd } from '../ui/Kbd'

export function StrokeStepper() {
  const { settings, update, setAngle, stepAngle } = useEngine()
  const { playing, focusCylinder } = settings
  const snap = useSimSnapshot(30)
  const angle = snap.angle
  const spec = cylinderByNumber(focusCylinder)
  const state = snap.cylinders[focusCylinder - 1]

  /** The 720° timeline for the focus cylinder, cut into four stroke bands that may wrap. */
  const bands = useMemo(() => {
    const out: { stroke: (typeof STROKE_ORDER)[number]; from: number; to: number }[] = []
    for (const stroke of STROKE_ORDER) {
      const start = mod(spec.fireAngle + STROKE_PHASE_START[stroke], 720)
      const end = start + 180
      if (end <= 720) out.push({ stroke, from: start, to: end })
      else {
        out.push({ stroke, from: start, to: 720 })
        out.push({ stroke, from: 0, to: end - 720 })
      }
    }
    return out.sort((a, b) => a.from - b.from)
  }, [spec])

  const rev = angle < 360 ? 1 : 2

  return (
    <div className="relative">
      <div className="mb-2 flex items-end justify-between">
        <div className="font-mono text-xl tabular-nums leading-none text-fog-100">
          {Math.round(angle).toString().padStart(3, '0')}
          <span className="text-fog-500">°</span>
          <span className="ml-2 text-[11px] text-fog-500">rev {rev} of 2</span>
        </div>
        {state && (
          <span className="text-[11px]" style={{ color: STROKE_META[state.stroke].color }}>
            Cyl {focusCylinder}: {STROKE_META[state.stroke].label} · {Math.round(state.strokeProgress * 100)}%
          </span>
        )}
      </div>

      {/* Stroke timeline for the focus cylinder */}
      <div className="relative mb-1.5 flex h-2 w-full overflow-hidden rounded-full bg-ink-700">
        {bands.map((b, i) => (
          <button
            key={i}
            type="button"
            title={`Jump to ${STROKE_META[b.stroke].label}`}
            className="h-full transition-opacity hover:opacity-100"
            style={{
              width: `${((b.to - b.from) / 720) * 100}%`,
              backgroundColor: STROKE_META[b.stroke].color,
              opacity: state?.stroke === b.stroke ? 0.95 : 0.4,
            }}
            onClick={() => {
              update({ playing: false })
              setAngle(mod(spec.fireAngle + STROKE_PHASE_START[b.stroke] + 90, 720))
            }}
          />
        ))}
        <span className="pointer-events-none absolute top-0 h-full w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" style={{ left: `calc(${(angle / 720) * 100}% - 1px)` }} />
      </div>

      <Slider
        ariaLabel="Crank angle"
        min={0}
        max={719}
        step={1}
        value={Math.floor(angle)}
        onChange={(v) => setAngle(v)}
        disabled={playing}
        marks={[
          { value: 0, label: '0°' },
          { value: 180, label: '180°' },
          { value: 360, label: '360°' },
          { value: 540, label: '540°' },
          { value: 719, label: '720°' },
        ]}
      />

      <div className={cn('mt-1 grid grid-cols-4 gap-1.5', playing && 'pointer-events-none opacity-40')}>
        <Button size="sm" onClick={() => stepAngle(-10)} title="−10° (Shift+←)">
          <ChevronsLeft className="size-3.5" /> 10°
        </Button>
        <Button size="sm" onClick={() => stepAngle(-1)} title="−1° (←)">
          <ChevronLeft className="size-3.5" /> 1°
        </Button>
        <Button size="sm" onClick={() => stepAngle(1)} title="+1° (→)">
          1° <ChevronRight className="size-3.5" />
        </Button>
        <Button size="sm" onClick={() => stepAngle(10)} title="+10° (Shift+→)">
          10° <ChevronsRight className="size-3.5" />
        </Button>
      </div>

      {playing ? (
        <button
          type="button"
          onClick={() => update({ playing: false })}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-2 text-[11px] text-fog-500 transition-colors hover:border-accent/50 hover:text-accent"
        >
          <Pause className="size-3.5" /> Pause to step degree-by-degree
        </button>
      ) : (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-fog-700">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> step 1°, hold <Kbd>Shift</Kbd> for 10°. Click a colour band to jump to that stroke.
        </p>
      )}
    </div>
  )
}
