# HowLikeDat

**See how things actually jalan inside.**

**Live:** https://makoydev.github.io/kaypoh-lab/

Interactive 3D simulations of mechanical systems, built to show how things work from the inside out.
Live modules: a procedurally generated crossplane V8 engine with a full four-stroke cycle, a two-spool
high-bypass turbofan with a live thermodynamic cycle, and a five-speed manual gearbox with working synchros.

## Stack

- Vite + React 19 + TypeScript
- Three.js via `@react-three/fiber` and `@react-three/drei`
- Tailwind CSS v4, Lucide icons, Framer Motion

No external 3D assets: every part of the engine is built from Three.js primitives at runtime, and the
environment lighting is generated from procedural light panels, so the app works fully offline.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run check          # lint + typecheck + tests + build (what CI runs)
npm test               # vitest
npm run test:coverage
npm run build          # production bundle in dist/
```

## Docs

- `CLAUDE.md` — the working guide: how things are built, tested, what's decided, where to be creative, roadmap
- `docs/ARCHITECTURE.md` — data flow, kinematics, 3D layer, routing
- `docs/ADDING_A_MODULE.md` — playbook for a new simulation
- `docs/TESTING.md` — test layers, conventions, visual QA checklist
- `docs/DECISIONS.md` — decision log
- `docs/plans/` — approved plans per module (turbofan, manual transmission)

## The Workshop

The app opens on **the Workshop** (`#/`), a browsable home where every module is presented as an
engineering drawing sheet: frame ticks, a blueprint schematic (the live module shows the actual running
3D engine), what you'll learn, concept tags, and a title block with drawing number, difficulty, and time.
"Open simulation" takes you to `#/sim/v8-engine`; the back arrow in the header returns to the Workshop.
Engine state (rpm, crank angle, view mode) persists between the two.

## What the Manual Transmission module does

- **Model** — a five-speed + reverse, three-shaft, constant-mesh box in pure, tested maths. Ratios come from
  tooth counts; pitch radii from one centre distance so every pair really touches; a single mesh-phase rule
  keeps every tooth interleaved for all time (reverse idler included). Gear changes are a scripted timeline
  (clutch out → sleeve out → synchronise → dog teeth lock → clutch in) stepped by `stepGearbox`; the car keeps
  rolling while the synchro drags the input cluster to speed, and the clutch rewrites engine rpm when it
  bites. Torque × ratio, speed ÷ ratio, power conserved. Reverse refused while rolling.
- **Controls** — engine rpm, H-pattern lever with shift-phase readout and slip rpm, synchro on/off with a crunch
  counter, torque/speed/km-h readout, ratio table (click to shift), part inspector, mesh–neutral–synchro–lock
  explainer with an animated schematic and "Show in 3D".
- **3D** — half-sectioned case and bell housing, clutch (flywheel, disc, pressure plate that back off), input
  shaft, countershaft cluster, freewheeling speed gears with cones and dog teeth, three synchro hubs with
  sliding sleeves and brass blocker rings that glow on contact, reverse idler, shift rail and forks. View
  modes: cutaway, x-ray, synchro focus (one hub with live rpm labels). Torque path lights up cyan.
- **Time scale** — 1:40 like the V8.

Keyboard: `Space` play/pause · `↑` `↓` shift · `N` neutral · `←` `→` engine ∓/± 100 rpm (`Shift` for 500) ·
`1` `2` `3` view modes · `C` casing · `P` torque path · `S` synchro · `R` reset camera · `Esc` clear selection.

## What the Turbofan module does

- **Cycle model** — a two-spool Brayton cycle in pure, tested maths: fan / booster / HP compressor pressure
  ratios that scale with spool speed, ideal-gas temperature rises, a combustor scheduled with N1, and
  turbines that take back exactly the work their compressors spent. Outputs pressure and temperature at
  every station, the bypass/core thrust split, jet velocities, fuel flow and fuel-per-kN.
- **Controls** — throttle as N1 %, bypass ratio 2–12 (watch fuel-per-kN fall), thrust split, station strip
  (temperature bars + pressure multiples along the engine), part inspector, suck–squeeze–bang–blow explainer.
- **3D** — nacelle and casings sectioned through 270° like a museum cutaway, 22-blade fan, booster, 8-stage
  HP compressor, annular combustor with a live flame, HP + LP turbines, exhaust cone, and one instanced
  streak field showing the air, coloured by temperature. View modes: cutaway, x-ray, stage focus.
- **Time scale** — 1:60 so the fan turns about once a second at takeoff.

Keyboard: `Space` play/pause · `←` `→` N1 ∓/± 1 % (`Shift` for 5 %) · `1` `2` `3` view modes · `C` casing ·
`F` air flow · `R` reset camera · `Esc` clear selection.

## What the V8 module does

- **Kinematics** — 8 pistons driven by exact slider-crank math (`s = r·cos θ + √(l² − r²·sin²θ)`) off a
  rotating crank with four throws 90° apart. Pin offsets are *derived* from the firing order
  (1-8-4-3-6-5-7-2) so every cylinder is at TDC exactly when it fires.
- **Four-stroke cycle** — 720° crank cycle per cylinder, live stroke per cylinder, valves that open on the
  right strokes, and an additive combustion flash + point light at each power stroke.
- **View modes** — Cutaway (ghost / solid / hidden casing), X-Ray wireframe, and Piston Focus which
  isolates one cylinder with TDC/BDC markers and live labels.
- **Controls** — play/pause, 0.1× / 0.5× / 1× speed, throttle 800–7,000 rpm, degree-by-degree crank
  stepper when paused, firing-order visualiser, part inspector, and a four-stroke explainer with an
  animated diagram that can follow the live engine.
- **Time scale** — the scene runs at 1:40 real time so the crank is watchable at any rpm.

Keyboard: `Space` play/pause · `←` `→` step 1° (`Shift` for 10°) · `1` `2` `3` view modes · `C` casing ·
`R` reset camera · `Esc` clear selection.

## Layout

```
src/
├── components/
│   ├── layout/      Header, SidebarLeft, SidebarRight, StatusBar, Modal, MobileDock, ModuleSelector,
│   │                turbofan/ and gearbox/ sidebars + status bars
│   ├── canvas/      V8EngineCanvas, EngineScene, EngineAssembly, Lighting, CameraRig, SimulationDriver,
│   │                TurbofanCanvas, TurbofanScene, TurbofanAssembly, TurbofanCameraRig, TurbofanDriver, useFlyTo,
│   │                GearboxCanvas, GearboxScene, GearboxAssembly, GearboxCameraRig, GearboxDriver
│   ├── 3d/          Crankshaft, Piston, ConnectingRod, EngineBlock, SparkPlug, Valves, SparkEffect,
│   │                FocusLabels, materials (per-view-mode material sets), geometries (shared buffers)
│   │   ├── turbofan/  Casings, Spools, BladeRow, FlowParticles, CombustionGlow, StageLabels,
│   │   │              materials, geometries, bladeGeometry
│   │   └── gearbox/   Gears, Synchros, Clutch, Casing, Forks, SynchroLabels, materials, geometries, gearGeometry
│   ├── controls/    PlaybackControls, ThrottleSlider, StrokeStepper, FiringOrder, ViewModes, PartInspector
│   │   ├── turbofan/  N1Throttle, BypassRatioSlider, ThrustSplit, StationStrip, TurbofanViewModes, …
│   │   └── gearbox/   EngineRpmSlider, GearSelector, TorqueReadout, RatioTable, GearboxViewModes, …
│   ├── education/   HowLikeDatWork, StrokeDiagram · turbofan/ HowTurbofanWork, FlowSchematic ·
│   │                gearbox/ HowGearboxWork, GearboxSchematic
│   ├── workshop/    WorkshopHub, DrawingSheet, ModuleSchematic, LearningPath, V8LivePreview, TurbofanLivePreview,
│   │                GearboxLivePreview
│   └── ui/          Panel, Button, Slider, SegmentedControl, Toggle, Badge, MetricCard, Tooltip, Kbd
├── hooks/           useEngineSimulation + useTurbofanSimulation + useGearboxSimulation (stores + providers),
│                    useKinematics, usePartInteraction, useKeyboardShortcuts, useTurbofanKeyboardShortcuts,
│                    useGearboxKeyboardShortcuts, useFullscreen, useMediaQuery, useHashRoute
├── lib/             engineConfig, kinematics, partInfo, strokeInfo, modules,
│                    turbofanConfig, turbofanModel, turbofanInfo, flowVis, airfoil,
│                    gearboxConfig, gearboxModel, gearboxInfo
├── types/           simulation.ts, turbofan.ts, gearbox.ts
└── App.tsx
```

### How the simulation is wired

High-frequency state (crank angle, per-cylinder kinematics) lives in a mutable store outside React.
`SimulationDriver` advances it once per frame at negative `useFrame` priority; meshes read from it in
their own `useFrame`. UI components subscribe through `useSimSnapshot(fps)`, which polls at a gentle
rate and only re-renders when the angle actually moved. Settings (rpm, view mode, selection…) are
ordinary React state in `EngineSimulationProvider`.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which tests, builds with `VITE_BASE=/kaypoh-lab/`,
and publishes `dist/` to GitHub Pages. Hash routing means no server-side rewrites are needed.

## License

MIT — see `LICENSE`.
