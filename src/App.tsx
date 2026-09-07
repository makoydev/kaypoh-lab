import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CatalogModule } from './types/simulation'
import { EngineSimulationProvider } from './hooks/useEngineSimulation'
import { TurbofanSimulationProvider } from './hooks/useTurbofanSimulation'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useHashRoute } from './hooks/useHashRoute'
import { V8EngineCanvas } from './components/canvas/V8EngineCanvas'
import { TurbofanCanvas } from './components/canvas/TurbofanCanvas'
import { Header } from './components/layout/Header'
import { SidebarLeft } from './components/layout/SidebarLeft'
import { SidebarRight } from './components/layout/SidebarRight'
import { StatusBar } from './components/layout/StatusBar'
import { Modal } from './components/layout/Modal'
import { MobileDock, type Sheet } from './components/layout/MobileDock'
import { Panel } from './components/ui/Panel'
import { WorkshopHub } from './components/workshop/WorkshopHub'

/** Turbofan simulation view. HUD panels arrive with the module's controls (plan step 5). */
function TurbofanSimulation() {
  return (
    <div className="absolute inset-0">
      <TurbofanCanvas />
    </div>
  )
}

function Simulation() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const closeSheet = useCallback(() => setSheet(null), [])
  useKeyboardShortcuts()

  return (
    <div className="absolute inset-0">
      <V8EngineCanvas />
      {isDesktop ? (
        <>
          <aside className="pointer-events-none absolute bottom-4 left-4 top-[5.5rem] z-20 w-[300px] xl:w-[320px]">
            <Panel className="scroll-thin pointer-events-auto max-h-full overflow-y-auto">
              <SidebarLeft />
            </Panel>
          </aside>
          <aside className="pointer-events-none absolute bottom-4 right-4 top-[5.5rem] z-20 w-[320px] xl:w-[340px]">
            <Panel className="scroll-thin pointer-events-auto max-h-full overflow-y-auto">
              <SidebarRight />
            </Panel>
          </aside>
          <StatusBar />
        </>
      ) : (
        <>
          <MobileDock onOpen={setSheet} />
          <Modal open={sheet === 'controls'} onClose={closeSheet} title="Simulation & mechanics">
            <SidebarLeft />
          </Modal>
          <Modal open={sheet === 'visuals'} onClose={closeSheet} title="Visuals & explainer">
            <SidebarRight explainerOpen={false} />
          </Modal>
        </>
      )}
    </div>
  )
}

function Shell() {
  const { route, navigate } = useHashRoute()
  const openModule = useCallback((m: CatalogModule | string) => navigate({ name: 'sim', moduleId: typeof m === 'string' ? m : m.id }), [navigate])
  const browse = useCallback(() => navigate({ name: 'hub' }), [navigate])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink-950 font-sans text-fog-100">
      <AnimatePresence mode="wait" initial={false}>
        {route.name === 'sim' ? (
          <motion.div key={`sim-${route.moduleId}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            {route.moduleId === 'turbofan' ? <TurbofanSimulation /> : <Simulation />}
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
      <Header variant={route.name === 'sim' ? 'sim' : 'hub'} onBrowse={browse} onOpenModule={openModule} />
    </div>
  )
}

export default function App() {
  return (
    <EngineSimulationProvider>
      <TurbofanSimulationProvider>
        <Shell />
      </TurbofanSimulationProvider>
    </EngineSimulationProvider>
  )
}
