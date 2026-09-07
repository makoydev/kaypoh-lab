# Architecture

## Stack

Vite 8 · React 19 · TypeScript (strict) · Three.js via `@react-three/fiber` + `@react-three/drei` ·
Tailwind CSS v4 · Framer Motion · Lucide icons · Vitest + Testing Library · oxlint.

## Views and routing

`useHashRoute` parses `location.hash`:

| Hash                 | View        | Component      |
| -------------------- | ----------- | -------------- |
| `#/` (or anything unknown) | Workshop    | `WorkshopHub`  |
| `#/sim/v8-engine`    | Simulation  | `Simulation` in `App.tsx` |

Only modules with `status: 'active'` are routable. `App.tsx` switches views inside `AnimatePresence
mode="wait"` so two WebGL canvases never coexist. `EngineSimulationProvider` wraps both views, so engine
state persists across navigation and the Workshop's live preview shows the real engine.

## Data flow in the simulation

```
engineConfig.ts ──► kinematics.ts (pure) ──► computeAllCylinders(angle)
                                                     ▲
   SimulationDriver (useFrame, priority -10) ────────┘  writes sim.angle, sim.cylinders once per frame
                                                     │
        ┌────────────────────────────────────────────┼─────────────────────────────┐
        ▼                                            ▼                             ▼
 3D meshes (useFrame)                    useSimSnapshot(fps) → HUD           applyHighlight(materials)
 Piston / ConnectingRod / Crankshaft /   StrokeStepper, FiringOrder,
 Valves / SparkEffect / FocusLabels      StatusBar, HowLikeDatWork
```

- **`SimStore`** (`hooks/useEngineSimulation.tsx`): `{ angle, cylinders, listeners }`, mutable, outside React.
- **Settings** (rpm, playing, speed, viewMode, casingMode, autoRotate, selected/hovered part, focusCylinder)
  are React state in the provider. `settingsRef` mirrors them for use inside `useFrame` without stale closures.
- **`setAngle`** (stepper, "jump crank here") recomputes cylinders immediately and notifies listeners so
  the UI updates without waiting for the next frame.

### Time scale

Real engines are too fast to watch. `SimulationDriver` advances the crank at
`rpm / VISUAL_TIME_SCALE * 6 * speed` deg/s (`VISUAL_TIME_SCALE = 40`). The UI states this. Frame delta
is capped at 0.1 s so a hidden tab never produces a giant jump.

## Kinematics (`lib/kinematics.ts`)

Slider-crank: with crank pin at angle α and bore axis at β,
`s = r·cos(α−β) + √(l² − r²·sin²(α−β))` is the wrist-pin distance from the crank axis. Everything else
(travel 0-1, rod angle, piston velocity, world positions) derives from it.

Cycle bookkeeping per cylinder: `phase = (crankDeg − fireAngle) mod 720`; power 0-180, exhaust 180-360,
intake 360-540, compression 540-720. `combustionIntensity(phase)` is a fast rise then exponential decay.

## Engine configuration (`lib/engineConfig.ts`)

- Cylinders 1-8; odd = left bank (+45°), even = right bank (−45°); pairs share a crank throw (journal).
- `FIRING_ORDER = [1, 8, 4, 3, 6, 5, 7, 2]`, one firing every 90°. `fireAngle = index × 90`.
- `PIN_OFFSETS_DEG` are **derived** from the firing order so each cylinder is at TDC exactly when it fires.
  Result: 45°, 135°, 315°, 225° — a 90° cross, i.e. a crossplane crank. Tests assert this.
- All mesh dimensions come from `GEOMETRY`, so meshes and math share one source of truth.

## 3D layer (`components/3d`, `components/canvas`)

- `EngineAssembly` = materials provider + driver + block + crank + pistons/rods/flashes. Used by both
  `EngineScene` (full sim) and `V8LivePreview` (Workshop).
- `materials.tsx` builds a `MaterialSet` per view mode (`cutaway` PBR with ghost/solid casing, `xray`
  wireframe). `applyHighlight` lerps emissive/colour on the shared materials for hover/selection.
- `geometries.ts` holds singleton geometries; crank webs and counterweights are `ExtrudeGeometry` shapes.
- `EngineBlock` draws crankcase, banks, heads, covers, liners, plugs, valves. Ghost/wireframe casing is
  click-transparent; only a solid casing is selectable by clicking.
- `CameraRig` flies the camera to a framing per view mode / focus cylinder / reset token and backs off for
  portrait aspect ratios. A user grabbing the controls cancels the fly-to.
- `Lighting` = `StudioEnvironment` (procedural Lightformers in a drei `Environment`, no HDR files) + grid +
  contact shadows + fog.

## HUD (`components/layout`, `controls`, `education`, `ui`)

Floating glass panels on desktop (`Panel`, `PanelSection`); bottom sheets (`Modal`) behind a `MobileDock`
below `lg`. `ui/` holds the primitives (Button, Slider, SegmentedControl, Toggle, Badge, MetricCard,
Tooltip, Kbd). `controls/` are the simulation controls, `education/` the four-stroke explainer with an
animated SVG `StrokeDiagram`.

## Workshop (`components/workshop`)

`WorkshopHub` renders the hero, a featured `DrawingSheet` for the live module (with `V8LivePreview`), a
grid of draft sheets with `ModuleSchematic` blueprints, `LearningPath`, and a how-it-works strip. All
content comes from `lib/modules.ts`.

## Styling

Tailwind v4 via `@tailwindcss/vite`; tokens in `src/index.css` under `@theme` (ink/fog neutrals, accent,
ember, stroke colours). `.glass`, `.scroll-thin`, `.hld-range`, `.cad-backdrop` are the few custom classes.
