# Testing

`npm run check` = `lint` → `typecheck` → `test` → `build`. That is the definition of done, locally and in CI.

## Layers

| Layer | Tool | Where | What |
| --- | --- | --- | --- |
| Pure math & content | Vitest | `src/lib/__tests__` | Kinematic invariants, config derivation, catalog/explainer completeness |
| Hooks | Vitest + RTL `renderHook` | `src/hooks/__tests__` | Store semantics, routing parse/round-trip |
| HUD components | Vitest + RTL + user-event | `src/components/__tests__` | Behaviour via roles and visible text |
| 3D / canvas | Manual, in browser | — | See checklist below |

3D code is deliberately not unit-tested: WebGL under jsdom costs more than it catches. The maths it
depends on is fully tested one layer down.

## Environment (`src/test/setup.ts`)

- `@testing-library/jest-dom/vitest` matchers, automatic `cleanup`.
- Stubs: `matchMedia` (non-matching), `requestAnimationFrame`, `IntersectionObserver` (always in view, for
  Framer `whileInView`).
- `renderWithEngine` (`src/test/utils.tsx`) wraps in `EngineSimulationProvider`.

## Conventions

- Query by role and accessible name first, visible text second, `getByTitle` only for icon-only step
  buttons. Never query by class or test id unless nothing else is possible.
- After a click that swaps content inside `AnimatePresence mode="wait"`, use `await screen.findBy…`.
- Collapsibles expose `aria-expanded`; assert on it rather than on the animated content.
- Keep tests describing behaviour a learner would notice ("steps the crank by 1° and 10° when paused"),
  not implementation.

## Visual QA checklist (run after touching `3d/`, `canvas/`, materials, or the Workshop)

1. `npx vite --port 5179 --strictPort`, open `#/`.
2. Workshop: hero, live V8 preview rotating, three draft sheets with schematics, learning path, no console errors.
3. Open simulation. Engine running, contact shadow and grid visible, HUD panels scroll.
4. View modes `1` `2` `3`: cutaway (casing hidden/ghost/solid via `C`), x-ray wireframe, piston focus
   with TDC/BDC rings and labels that don't overlap the panels.
5. Click a piston, the crank, a spark plug, a valve: correct part highlights and card appears. Ghost casing
   must not steal the click. Esc clears.
6. Space pauses; `←`/`→` step; drag the crank slider; click a stroke band; "Jump crank here".
7. Throttle to redline: firing chips race, combustion flashes on each power stroke.
8. Back arrow returns to the Workshop with the engine state preserved.
9. Narrow the window below 1024 px: dock appears, sheets open, camera backs off.
10. Console: only Three's `THREE.Clock` deprecation warning from the fiber library is expected.
