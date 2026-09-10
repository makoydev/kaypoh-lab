import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Eye, Gauge, MousePointerClick, Route } from 'lucide-react'
import type { CatalogModule } from '../../types/simulation'
import { MODULES } from '../../lib/modules'
import { Badge } from '../ui/Badge'
import { DrawingSheet } from './DrawingSheet'
import { LearningPath } from './LearningPath'
import { V8LivePreview } from './V8LivePreview'
import { TurbofanLivePreview } from './TurbofanLivePreview'
import { GearboxLivePreview } from './GearboxLivePreview'
import { EscapementLivePreview } from './EscapementLivePreview'

/** Live modules get the real running assembly on their sheet. */
const LIVE_PREVIEWS: Record<string, () => ReactNode> = {
  'v8-engine': () => <V8LivePreview />,
  turbofan: () => <TurbofanLivePreview />,
  'manual-transmission': () => <GearboxLivePreview />,
  escapement: () => <EscapementLivePreview />,
}

const HOW_IT_WORKS = [
  { icon: Eye, title: 'Look inside', text: 'Every machine is built from scratch in 3D and cut open. Ghost the casing, go X-ray, or isolate one part.' },
  { icon: Gauge, title: 'Slow it down', text: 'Real machines are too fast to see. Scrub degree by degree, run at 0.1×, or let it rip and watch the pattern.' },
  { icon: MousePointerClick, title: 'Poke at it', text: 'Click any component for a plain-language explainer. No prior knowledge assumed, only a bit of kaypoh.' },
]

export function WorkshopHub({ onOpen }: { onOpen: (m: CatalogModule) => void }) {
  const featured = MODULES.filter((m) => m.status === 'active')
  const rest = MODULES.filter((m) => m.status !== 'active')
  const liveCount = featured.length

  return (
    <main className="cad-backdrop relative min-h-full">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(34,211,238,0.14),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            <span className="h-px w-8 bg-accent/60" /> The workshop · drawing index
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fog-100 sm:text-5xl lg:text-6xl">
            See how things <span className="text-accent">actually</span> jalan inside.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-fog-300 sm:text-lg">
            Pick a machine. We tear it open, slow it down, and let you poke at it until it makes sense. No PhD required, no grease under
            the fingernails.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Live simulations', String(liveCount)],
              ['In drafting', String(MODULES.length - liveCount)],
              ['External 3D assets', '0'],
              ['Procedural', '100%'],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-white/10 pl-3">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-fog-700">{k}</dt>
                <dd className="mt-0.5 font-mono text-xl text-fog-100">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.section>

        {/* Featured + catalog */}
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-fog-300">Drawing sheets</h2>
              <p className="mt-1 text-[13px] text-fog-500">One sheet per machine. The live ones are really running — that is the actual machine, not a video.</p>
            </div>
            <Badge tone="muted" className="hidden sm:inline-flex">
              {MODULES.length} sheets
            </Badge>
          </div>
          <div className="grid gap-5">
            {featured.map((m, i) => (
              <DrawingSheet key={m.id} module={m} onOpen={onOpen} featured index={i} preview={LIVE_PREVIEWS[m.id]?.()} />
            ))}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((m, i) => (
              <DrawingSheet key={m.id} module={m} onOpen={onOpen} index={featured.length + i} />
            ))}
          </div>
        </section>

        {/* Learning path */}
        <section className="mt-20">
          <div className="mb-5 flex items-center gap-2">
            <Route className="size-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-fog-300">Suggested route</h2>
          </div>
          <LearningPath modules={MODULES} onOpen={onOpen} />
        </section>

        {/* How it works */}
        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
              <s.icon className="size-5 text-accent" />
              <h3 className="mt-3 text-sm font-semibold text-fog-100">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fog-500">{s.text}</p>
            </motion.div>
          ))}
        </section>

        <footer className="mt-20 flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-6 text-[11px] text-fog-700 sm:flex-row sm:items-center">
          <span className="font-mono">HowLikeDat · Kaypoh Edition · all drawings procedural, no external assets</span>
          <span>Built with Three.js, React and a healthy amount of curiosity.</span>
        </footer>
      </div>
    </main>
  )
}
