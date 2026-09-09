import { useCallback, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CatalogModule } from './types/simulation'
import { EngineSimulationProvider, useEngine } from './hooks/useEngineSimulation'
import { TurbofanSimulationProvider, useTurbofan } from './hooks/useTurbofanSimulation'
import { GearboxSimulationProvider, useGearbox } from './hooks/useGearboxSimulation'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { TURBOFAN_SHORTCUTS, useTurbofanKeyboardShortcuts } from './hooks/useTurbofanKeyboardShortcuts'
import { GEARBOX_SHORTCUTS, useGearboxKeyboardShortcuts } from './hooks/useGearboxKeyboardShortcuts'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useHashRoute } from './hooks/useHashRoute'
import { V8EngineCanvas } from './components/canvas/V8EngineCanvas'
import { TurbofanCanvas } from './components/canvas/TurbofanCanvas'
import { GearboxCanvas } from './components/canvas/GearboxCanvas'
import { Header, V8_SHORTCUTS } from './components/layout/Header'
import { SidebarLeft } from './components/layout/SidebarLeft'
import { SidebarRight } from './components/layout/SidebarRight'
import { StatusBar } from './components/layout/StatusBar'
import { TurbofanSidebarLeft, TurbofanSidebarRight } from './components/layout/turbofan/TurbofanSidebars'
import { TurbofanStatusBar } from './components/layout/turbofan/TurbofanStatusBar'
import { GearboxSidebarLeft, GearboxSidebarRight } from './components/layout/gearbox/GearboxSidebars'
import { GearboxStatusBar } from './components/layout/gearbox/GearboxStatusBar'
import { Modal } from './components/layout/Modal'
import { MobileDock, type Sheet } from './components/layout/MobileDock'
import { Panel } from './components/ui/Panel'
import { WorkshopHub } from './components/workshop/WorkshopHub'

interface SimulationLayoutProps {
  canvas: ReactNode
  left: ReactNode
  /** Right panel; receives whether the explainer should start open (desktop yes, bottom sheet no). */
  right: (explainerOpen: boolean) => ReactNode
  statusBar: ReactNode
  playing: boolean
  onTogglePlay: () => void
}

/** Desktop: floating side panels. Below `lg`: the same panels live in bottom sheets behind a dock. */
function SimulationLayout({ canvas, left, right, statusBar, playing, onTogglePlay }: SimulationLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const closeSheet = useCallback(() => setSheet(null), [])

  return (
    <div className="absolute inset-0">
      {canvas}
      {isDesktop ? (
        <>
          <aside className="pointer-events-none absolute bottom-4 left-4 top-[5.5rem] z-20 w-[300px] xl:w-[320px]">
            <Panel className="scroll-thin pointer-events-auto max-h-full overflow-y-auto">{left}</Panel>
          </aside>
          <aside className="pointer-events-none absolute bottom-4 right-4 top-[5.5rem] z-20 w-[320px] xl:w-[340px]">
            <Panel className="scroll-thin pointer-events-auto max-h-full overflow-y-auto">{right(true)}</Panel>
          </aside>
          {statusBar}
        </>
      ) : (
        <>
          <MobileDock onOpen={setSheet} playing={playing} onTogglePlay={onTogglePlay} />
          <Modal open={sheet === 'controls'} onClose={closeSheet} title="Simulation & mechanics">
            {left}
          </Modal>
          <Modal open={sheet === 'visuals'} onClose={closeSheet} title="Visuals & explainer">
            {right(false)}
          </Modal>
        </>
      )}
    </div>
  )
}

function V8Simulation() {
  const { settings, update } = useEngine()
  useKeyboardShortcuts()
  return (
    <SimulationLayout
      canvas={<V8EngineCanvas />}
      left={<SidebarLeft />}
      right={(open) => <SidebarRight explainerOpen={open} />}
      statusBar={<StatusBar />}
      playing={settings.playing}
      onTogglePlay={() => update({ playing: !settings.playing })}
    />
  )
}

function TurbofanSimulation() {
  const { settings, update } = useTurbofan()
  useTurbofanKeyboardShortcuts()
  return (
    <SimulationLayout
      canvas={<TurbofanCanvas />}
      left={<TurbofanSidebarLeft />}
      right={(open) => <TurbofanSidebarRight explainerOpen={open} />}
      statusBar={<TurbofanStatusBar />}
      playing={settings.playing}
      onTogglePlay={() => update({ playing: !settings.playing })}
    />
  )
}

function GearboxSimulation() {
  const { settings, update } = useGearbox()
  useGearboxKeyboardShortcuts()
  return (
    <SimulationLayout
      canvas={<GearboxCanvas />}
      left={<GearboxSidebarLeft />}
      right={(open) => <GearboxSidebarRight explainerOpen={open} />}
      statusBar={<GearboxStatusBar />}
      playing={settings.playing}
      onTogglePlay={() => update({ playing: !settings.playing })}
    />
  )
}

/** Which simulation, camera reset and shortcut list belong to a module id. */
const SIMULATIONS: Record<string, { view: () => ReactNode; shortcuts: [string[], string][] }> = {
  turbofan: { view: () => <TurbofanSimulation />, shortcuts: TURBOFAN_SHORTCUTS },
  'manual-transmission': { view: () => <GearboxSimulation />, shortcuts: GEARBOX_SHORTCUTS },
}

function Shell() {
  const { route, navigate } = useHashRoute()
  const engine = useEngine()
  const turbofan = useTurbofan()
  const gearbox = useGearbox()
  const openModule = useCallback((m: CatalogModule | string) => navigate({ name: 'sim', moduleId: typeof m === 'string' ? m : m.id }), [navigate])
  const browse = useCallback(() => navigate({ name: 'hub' }), [navigate])
  const moduleId = route.name === 'sim' ? route.moduleId : undefined
  const simulation = moduleId ? SIMULATIONS[moduleId] : undefined
  const resetCamera = moduleId === 'turbofan' ? turbofan.resetCamera : moduleId === 'manual-transmission' ? gearbox.resetCamera : engine.resetCamera

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink-950 font-sans text-fog-100">
      <AnimatePresence mode="wait" initial={false}>
        {route.name === 'sim' ? (
          <motion.div key={`sim-${route.moduleId}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            {simulation ? simulation.view() : <V8Simulation />}
          </motion.div>
        ) : (
          <motion.div
            key="hub"
            className="scroll-thin absolute inset-0 overflow-y-auto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <WorkshopHub onOpen={openModule} />
          </motion.div>
        )}
      </AnimatePresence>
      <Header
        variant={route.name === 'sim' ? 'sim' : 'hub'}
        onBrowse={browse}
        onOpenModule={openModule}
        currentModuleId={moduleId}
        onResetCamera={resetCamera}
        shortcuts={simulation?.shortcuts ?? V8_SHORTCUTS}
      />
    </div>
  )
}

export default function App() {
  return (
    <EngineSimulationProvider>
      <TurbofanSimulationProvider>
        <GearboxSimulationProvider>
          <Shell />
        </GearboxSimulationProvider>
      </TurbofanSimulationProvider>
    </EngineSimulationProvider>
  )
}
