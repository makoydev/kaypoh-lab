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

### Turbofan (`#/sim/turbofan`)

11. Engine running: fan and both spools turning (HP visibly faster), flow streaks moving left → right,
    bypass streaks blue, core streaks warming to ember through the combustor, plume behind the nozzle.
12. View modes `1` `2` `3`: cutaway with 270° sectioned casings (hidden/ghost/solid via `C`, orange cut
    faces only when solid), x-ray wireframe coloured by stage, stage focus isolating one stage with in/out
    pressure + temperature labels that don't hide behind the header.
13. Click a fan blade, the combustor liner, a turbine row, the exhaust cone, the solid nacelle: correct chip
    lights in the inspector. Ghost/wireframe casing never steals the click. Esc clears.
14. Throttle to takeoff (`Shift+→`): status bar climbs (thrust, ×pressure, burner °C), flame and plume
    brighten, station strip bars grow. Slide bypass ratio 2 → 12: fan share and fuel-per-kN move the right way.
15. Station strip: click a station → stage focus on the stage that ends there. Explainer "Show in 3D" does
    the same for a phase; "Follow the 3D focus" switches tabs with the focus stage.
16. `F` hides the streaks; back arrow returns to the Workshop with both live previews turning and the
    turbofan state preserved.
17. Narrow the window below 1024 px: dock appears, both sheets open, camera backs off.

### Manual Transmission (`#/sim/manual-transmission`)

18. Box running in 1st: input shaft and clutch disc at engine speed, countershaft turning the other way, every
    speed gear meshing with its partner, output shaft slower. Torque path lit cyan from clutch disc to output.
19. Shift 1 → 2 (`↑` or the gate): clutch disc backs off, 1-2 sleeve slides out, brass ring glows ember while
    the slip number falls, sleeve slides onto the dogs, clutch closes, engine rpm drops. Fork follows the sleeve.
20. Switch the synchro off (`S`) and shift: "Crunch!" phase, sleeve chattering, crunch counter increments.
21. View modes `1` `2` `3`: cutaway (half case with orange cut strips only when solid, hidden/ghost/solid via
    `C`), x-ray wireframe, synchro focus isolating one hub with gear/shaft rpm and status labels. Focus follows
    the hub of the latest shift.
22. Click the clutch, a speed gear, a sleeve, the idler, a fork, the solid case: correct chip lights. Ghost /
    wireframe case never steals the click. Esc clears. `P` toggles the torque path.
23. Reverse from rolling is refused with a note; from a standstill (N, wait) it engages and the output turns
    backwards, speed shows as negative. Neutral: sleeves centred, output coasts down.
24. Explainer tabs; "Show in 3D" on Synchro flies to the hub and performs a shift. Ratio table row click shifts.
25. Back arrow: Workshop shows three live previews turning; gearbox state preserved. Below 1024 px both sheets open.

### Mechanical Watch Escapement (`#/sim/escapement`)

26. Ticking: balance swinging ≈ 270° each way, hairspring coils breathing, fork flicking between the banking pins about
    once a second, escape wheel indexing 12° per tick, a yellow flash on the landing jewel, tick counter climbing.
27. View modes `1` `2` `3`: bench view (plate and cocks hidden/ghost/solid via `C`), x-ray wireframe, pallet focus looking
    down on the jewels with entry/exit/wheel/fork labels that stay clear of the header and panels.
28. Pallet focus at 0.1×: a tooth recoils on unlock, slides down the jewel, drops, and the next tooth lands on the other
    jewel with the flash; labels say unlocking → impulse → drop → locked; "Now" in the status bar follows.
29. Click the balance rim, the hairspring, the fork, a jewel, the escape wheel, a banking pin, the solid plate: correct chip
    lights in the inspector. Ghost / wireframe plate never steals the click. Esc clears.
30. Mainspring `←`/`→`: amplitude readout and the swing change, frequency and beat period do not. Beat rate 18,000 → 36,000:
    ticks speed up, escape rpm changes. Regulator ±: the regulator arm walks along the outer coil, rate error shows s/day.
31. Pause, then `,` `.` and "Next tick" step the balance; the seconds dial and watch time advance in 0.125 s steps.
    Explainer tabs; "Show in 3D" on Impulse switches to pallet focus at 0.1×; "Follow" tracks the live phase.
32. `S` turns the tick sound on (click + thud, alternating pitch). Back arrow: Workshop shows four live previews turning,
    escapement state preserved. Below 1024 px both sheets open, camera backs off.
