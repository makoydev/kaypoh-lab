import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock, Lock, Sparkles } from 'lucide-react'
import type { CatalogModule } from '../../types/simulation'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { ModuleSchematic } from './ModuleSchematic'

interface DrawingSheetProps {
  module: CatalogModule
  onOpen?: (module: CatalogModule) => void
  /** Featured sheets are wider and can carry a live preview. */
  featured?: boolean
  preview?: ReactNode
  index?: number
}

function Field({ label, value, mono = true, className }: { label: string; value: ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={cn('min-w-0 border-l border-white/10 px-3 py-2 first:border-l-0', className)}>
      <div className="text-[9px] uppercase tracking-[0.16em] text-fog-700">{label}</div>
      <div className={cn('mt-0.5 truncate text-[11px] text-fog-100', mono && 'font-mono')}>{value}</div>
    </div>
  )
}

function Difficulty({ level, accent }: { level: 1 | 2 | 3; accent: string }) {
  return (
    <span role="img" className="flex items-end gap-0.5" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className="w-1.5 rounded-sm" style={{ height: 4 + i * 3, backgroundColor: i <= level ? accent : 'rgba(255,255,255,0.12)' }} />
      ))}
    </span>
  )
}

/**
 * A module presented as an engineering drawing: bordered frame with tick marks, a schematic (or live
 * preview) in the body, and a title block along the bottom edge.
 */
export function DrawingSheet({ module: m, onOpen, featured, preview, index = 0 }: DrawingSheetProps) {
  const live = m.status === 'active'
  const accent = m.accent

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-[#0a1018] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] transition-colors',
        live ? 'border-white/15 hover:border-accent/50' : 'border-white/[0.08] hover:border-white/20',
      )}
      style={{ ['--sheet-accent' as string]: accent }}
    >
      {/* Drawing frame: outer border ticks */}
      <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/[0.06]" />
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-2 opacity-40"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 24px)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-3 left-0 w-2 opacity-40"
        style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 24px)' }}
      />
      {/* Corner registration marks */}
      {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-2', 'right-2 bottom-2'].map((pos) => (
        <span key={pos} className={cn('pointer-events-none absolute size-3 border border-white/20', pos)} />
      ))}

      {/* Sheet header strip */}
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] tracking-wider text-fog-500">{m.code}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-fog-500">{m.category}</span>
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: `${accent}66`, color: accent, backgroundColor: `${accent}14` }}>
            <span className="size-1.5 animate-hld-pulse rounded-full" style={{ backgroundColor: accent }} />
            Live simulation
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fog-500">
            <Lock className="size-3" /> In drafting
          </span>
        )}
      </header>

      {/* Body */}
      <div className={cn('grid flex-1 gap-5 px-5 py-5', featured && 'lg:grid-cols-[1.15fr_1fr]')}>
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border border-white/[0.06]',
            featured ? 'min-h-[300px] lg:min-h-[360px]' : 'aspect-[16/10]',
          )}
          style={{
            backgroundColor: '#0b1622',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {preview ?? <ModuleSchematic moduleId={m.id} accent={accent} className="absolute inset-0 h-full w-full p-3" />}
          {!live && (
            <>
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)' }}
              />
              <div className="pointer-events-none absolute right-3 top-3 rotate-[8deg] rounded border-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ borderColor: `${accent}99`, color: accent }}>
                Draft · {m.progress}%
              </div>
            </>
          )}
          {/* scanline sweep on hover */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[hld-scan_2.4s_linear_infinite]" style={{ backgroundColor: accent, boxShadow: `0 0 12px 2px ${accent}80` }} />
        </div>

        <div className="flex flex-col">
          <h3 className="text-xl font-semibold tracking-tight text-fog-100">{m.name}</h3>
          <p className="mt-0.5 text-sm italic" style={{ color: accent }}>
            {m.tagline}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-fog-300">{m.description}</p>

          <div className="mt-4">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-fog-700">You will learn</div>
            <ul className="space-y-1.5">
              {m.learn.map((l, i) => (
                <li key={l} className="flex gap-2.5 text-xs leading-snug text-fog-300">
                  <span className="mt-px font-mono text-[10px]" style={{ color: accent }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {m.concepts.map((c) => (
              <span key={c} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-fog-500">
                {c}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-5">
            {live ? (
              <Button variant="accent" size="lg" className="w-full rounded-lg sm:w-auto" onClick={() => onOpen?.(m)}>
                Open simulation <ArrowUpRight className="size-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${m.progress ?? 0}%`, backgroundColor: accent }} />
                </div>
                <span className="flex items-center gap-1 text-[11px] text-fog-500">
                  <Sparkles className="size-3" /> being drafted
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title block */}
      <footer className="grid grid-cols-2 border-t border-white/10 bg-[#080d14] sm:grid-cols-5">
        <Field label="Drawing no." value={m.code} />
        <Field label="Rev" value={live ? 'A' : '—'} />
        <Field label="Difficulty" value={<Difficulty level={m.difficulty} accent={accent} />} mono={false} />
        <Field
          label="Est. time"
          value={
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-fog-500" /> ~{m.minutes} min
            </span>
          }
        />
        <Field label="Status" value={live ? 'Released' : `Draft ${m.progress}%`} className="col-span-2 sm:col-span-1" />
      </footer>
    </motion.article>
  )
}
