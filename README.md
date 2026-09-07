# HowLikeDat

**See how things actually jalan inside.**

**Live:** https://makoydev.github.io/kaypoh-lab/

Interactive 3D simulations of mechanical systems, built to show how things work from the inside out.
First module: a procedurally generated crossplane V8 engine with a full four-stroke cycle.

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

## The Workshop

The app opens on **the Workshop** (`#/`), a browsable home where every module is presented as an
engineering drawing sheet: frame ticks, a blueprint schematic (the live module shows the actual running
3D engine), what you'll learn, concept tags, and a title block with drawing number, difficulty, and time.
"Open simulation" takes you to `#/sim/v8-engine`; the back arrow in the header returns to the Workshop.
Engine state (rpm, crank angle, view mode) persists between the two.

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
│   ├── layout/      Header, SidebarLeft, SidebarRight, StatusBar, Modal, MobileDock, ModuleSelector
│   ├── canvas/      V8EngineCanvas, EngineScene, EngineAssembly, Lighting, CameraRig, SimulationDriver
│   ├── 3d/          Crankshaft, Piston, ConnectingRod, EngineBlock, SparkPlug, Valves, SparkEffect,
│   │                FocusLabels, materials (per-view-mode material sets), geometries (shared buffers)
│   ├── controls/    PlaybackControls, ThrottleSlider, StrokeStepper, FiringOrder, ViewModes, PartInspector
│   ├── education/   HowLikeDatWork, StrokeDiagram
│   ├── workshop/    WorkshopHub, DrawingSheet, ModuleSchematic, LearningPath, V8LivePreview
│   └── ui/          Panel, Button, Slider, SegmentedControl, Toggle, Badge, MetricCard, Tooltip, Kbd
├── hooks/           useEngineSimulation (store + provider), useKinematics, usePartInteraction,
│                    useKeyboardShortcuts, useFullscreen, useMediaQuery, useHashRoute
├── lib/             engineConfig (geometry, firing order), kinematics (pure math), partInfo, strokeInfo, modules
├── types/           simulation.ts
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
