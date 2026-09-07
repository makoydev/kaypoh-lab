# HowLikeDat — working guide for Claude (and humans)

Read this first in every session. It says what this project is, how we build and verify things, what is
already decided, and where you are free to be creative. Deeper detail lives in `docs/`.

## What this is

**HowLikeDat** ("See how things actually jalan inside") is an educational web app of interactive 3D
simulations that show how machines work from the inside out. Repo: `makoydev/kaypoh-lab`.

- **Audience:** curious people with no engineering background. Assume zero prior knowledge, never talk down.
- **Voice:** sleek, professional UI with a subtle, witty Singaporean touch ("jalan", "kaypoh", "lah", "lor")
  used sparingly, in copy, never in code identifiers. One wink per screen is plenty.
- **Look:** dark, engineering/CAD-inspired (Linear, Apple product pages, Sketchfab, blueprint sheets).
  Cyan `#22d3ee` is the CAD accent, ember `#fb923c` is combustion, amber is selection.

Two views, hash-routed: the **Workshop** (`#/`, browsable catalog of modules as engineering drawing sheets)
and a **Simulation** (`#/sim/<module-id>`). First and only live module: the V8 engine.

## Start here (every session)

1. `npm install && npm run check` — lint, typecheck, tests, build. Everything must be green before and after your work.
2. Skim `docs/DECISIONS.md` for *why* things are the way they are. Do not relitigate settled decisions
   without a reason; do add a new entry when you make a real decision.
3. Read the **Roadmap** at the bottom of this file for what is next and what is open.
4. To see it: `npx vite --port 5179 --strictPort` (port 5173 is usually taken on the owner's machine).

## The system: how things are built here

These are the load-bearing rules. Follow them unless a decision entry says otherwise.

1. **Procedural, offline, no external assets.** Every 3D part is built from Three.js primitives at runtime.
   No `.gltf`, no HDR downloads, no runtime network calls. Lighting comes from `StudioEnvironment`.
2. **Physics is pure math in `src/lib/`, and it is tested.** Kinematics never live in components. A mesh
   reads pre-computed state and positions itself; it does not compute. New mechanisms get a `lib/*.ts`
   module with unit tests before they get meshes.
3. **High-frequency state lives outside React.** The sim store (`useEngineSimulation.tsx`) is mutated once
   per frame by `SimulationDriver` (negative `useFrame` priority so it runs first). UI reads it through
   `useSimSnapshot(fps)`, which re-renders only when the angle moved. Settings (rpm, view mode, selection)
   are ordinary React state. Never put per-frame values in React state.
4. **Config drives geometry.** Dimensions, firing order, and derived values (pin offsets, journal
   positions) come from `lib/engineConfig.ts`. Meshes and math read the same constants so they can't drift.
5. **Shared materials and geometries.** Materials are built per view mode in `components/3d/materials.tsx`;
   geometries are singletons in `components/3d/geometries.ts`. Highlighting is done by mutating the shared
   material, not by cloning per mesh.
6. **Content is data.** Module catalog, part explainers, stroke explainers live in `lib/*.ts` as typed
   objects and are validated by tests. Copy changes never require touching components.
7. **Interactivity is explicit.** Clickable parts use `usePartInteraction(partId)`. Anything translucent
   that sits in front of internals must be click-transparent (`raycast={() => null}`) so clicks reach
   what the user is actually looking at.
8. **Responsive by default.** Desktop gets floating side panels; below `lg` the same panels live in bottom
   sheets. The camera backs off for portrait aspect ratios. Test both.
9. **Accessible controls.** Real buttons, `role="radio"`/`switch`/`slider` where appropriate, `aria-label`
   on icon buttons, `aria-expanded` on toggles. Tests query by role, so this is enforced.
10. **TypeScript strict, `verbatimModuleSyntax`, no enums, no unused locals.** Lint is `oxlint`; warnings
    about fast-refresh-only-exports and ref access in providers are known and tolerated, errors are not.

## Testing: what gets tested, how

- **Pure math and content** (`src/lib`): Vitest unit tests. Geometry invariants (TDC at fire angle,
  constant rod length, pins 90° apart), content completeness, routing. This is the cheapest, highest-value
  layer. Add tests here first.
- **HUD components** (`src/components/**` except `3d/` and `canvas/`): React Testing Library with the
  `renderWithEngine` helper. Test behaviour through roles and visible text, not implementation.
  `AnimatePresence mode="wait"` means use `findBy*` after a click that swaps content.
- **3D and canvas code**: not unit tested (WebGL in jsdom is not worth it). Verify visually in the browser
  after any change: all three view modes, casing states, click-to-select on a piston and the crank, piston
  focus labels, and the Workshop live preview. Check the console for THREE/WebGL errors.
- `npm run check` is the definition of done. CI (`.github/workflows/ci.yml`) runs the same.

See `docs/TESTING.md` for the environment stubs and the visual QA checklist.

## Creative latitude: where to be bold

The rules above protect the skeleton. Everything else is open, and better ideas are welcome:

- **Visuals and effects.** Materials, lighting moods, combustion, motion blur, particles, post-processing,
  new view modes. Keep 60 fps on a laptop GPU; profile before adding per-frame allocations.
- **Explainers and pedagogy.** Better metaphors, diagrams, step-throughs, quizzes, "kaypoh facts".
  Plain language first, correct second-to-none. Metric units.
- **Interactions.** New ways to poke at the machine (drag the crank, tap a valve, race two cylinders).
- **Workshop and catalog.** The drawing-sheet metaphor is a starting point, not a cage.
- **Tone.** Witty is good, cringe is not. If a joke needs explaining, cut it.

When you make a creative choice with lasting consequences (a new pattern, a dropped constraint, a
dependency), write two lines in `docs/DECISIONS.md`. Small taste calls don't need an entry.

## Adding a module

Follow `docs/ADDING_A_MODULE.md`. Short version: catalog entry → pure kinematics + tests → geometry
config → procedural meshes → scene + camera framing → controls and explainers → tests → visual QA → route.

## Known environment quirks

- Port 5173 is often occupied on the owner's machine; use `--port 5179 --strictPort`.
- When Claude drives Chrome through the browser tools, that tab is usually hidden: `requestAnimationFrame`
  does not fire, so the sim only advances when a screenshot forces a frame and Framer transitions stall.
  Judge motion by comparing successive screenshots; don't diagnose it as a bug.
- Vite 8 uses rolldown: `manualChunks` must be a function (see `vite.config.ts`).

## Roadmap (keep this current)

**Done:** V8 simulation (kinematics, four-stroke, three view modes, inspector, explainer, stepper, firing
order, keyboard shortcuts, mobile layout), Workshop hub with drawing sheets and live preview, hash routing,
tests + CI.

**Next, in rough priority:**
1. Deploy (GitHub Pages or Vercel) and add the URL to the README.
2. Manual Transmission module (HLD-004): constant-mesh gearbox, synchro animation, gear-ratio readout.
3. Turbofan (HLD-002): continuous-flow cycle, bypass ratio slider, station temperatures.
4. Escapement (HLD-003): balance wheel + pallet fork + escape wheel; needs its own timing model.
5. Nice-to-haves: quiz mode per module, shareable "crank angle" links, optional bloom post-processing,
   a "compare two cylinders" view.

**Open questions (owner's call):** license, deploy target, whether the app should open on the Workshop or
straight into the last-used simulation.
