# Plan: Turbofan Jet Engine (HLD-002)

Status: **in progress — step 1 done (model + config + tests, 2026-09-08)**; next: step 2 store. Follow `docs/ADDING_A_MODULE.md`; the V8 is the
reference implementation. Update this file as steps complete, and flip the module to `active` only at step 9.

## Learning objectives (write these into `lib/modules.ts` `learn` if they change)
1. Where thrust actually comes from — mostly the fan / bypass air, not the hot core.
2. Why compressor blades shrink stage by stage as the air is squeezed.
3. How the turbine steals energy from the exhaust to spin the front end.

Teaching hook: same four ideas as the V8 (suck, squeeze, bang, blow) but *continuous* — nothing reciprocates.

## Model (pure math, `src/lib/turbofanConfig.ts` + `src/lib/turbofanModel.ts`)
- **Two spools.** LP spool = fan + booster + LP turbine; HP spool = HP compressor + HP turbine. Throttle is
  N1 (% LP speed). N2 follows N1 through a simple monotonic map (e.g. N2 = 60 + 0.4·N1). Both spin the same
  direction for simplicity (note it in DECISIONS if you keep it that way).
- **Stations along the axis:** 0 ambient → 2 fan face → 13 bypass exit / 25 booster exit → 3 HP compressor
  exit → 4 combustor exit → 45 HP turbine exit → 5 LP turbine exit → 8 core nozzle. Store pressure ratio and
  temperature at each from ideal-gas relations; accuracy target is "honest and teachable", not CFD.
- **Bypass ratio (BPR)** slider 2–12 redistributes mass flow; thrust = core + bypass contributions.
- **Outputs per tick:** spool angles (for rotation), N1/N2, station P/T arrays, thrust split, fuel flow proxy.
- **Tests:** temperatures rise through compression and combustion then fall through turbines; pressure
  ratios multiply to overall PR; thrust increases monotonically with N1; bypass + core mass flow = total;
  spool angles advance at the right relative rates; BPR extremes still produce sane numbers.

## Visual time scale
Real N1 is ~3,000 rpm and fan blades blur. Reuse the 1:40 idea (`VISUAL_TIME_SCALE`) or pick a value that
keeps individual blades readable at 100% N1; state it in the UI like the V8 does.

## Procedural 3D (`components/3d/turbofan/`)
- Nacelle + core casing as cutaway shells (ghost/solid/hidden, reuse `MaterialSet` conventions).
- Fan disc with ~20 twisted blades (extruded airfoil or twisted box), spinner cone.
- Booster + HP compressor: blade rings whose radius and blade length shrink stage by stage.
- Annular combustor with emissive flame glow that scales with N1.
- HP + LP turbine stages, exhaust cone, core nozzle, bypass duct.
- **Flow visualisation** (the "combustion flash" of this module): particles or streamlines through bypass
  and core, coloured by station temperature, speed ∝ N1. Keep it to one instanced mesh for performance.
- View modes: reuse cutaway / x-ray. Focus mode = **Stage focus**: isolate one stage, show its P and T.

## HUD
- Throttle as N1 %, BPR slider, N1/N2 readouts, thrust split bar (bypass vs core), a **station strip**
  showing P and T along the engine, and a "How like dat work?" explainer walking suck–squeeze–bang–blow
  continuously with a schematic that highlights the active region.
- Part inspector entries: fan, booster, HP compressor, combustor, HP turbine, LP turbine, nozzle, nacelle.
  Each gets a true kaypoh fact.

## Workshop / routing
- `useHashRoute` already allows any `active` module. `CameraRig` needs a turbofan framing (long axis, so a
  wider default and portrait back-off). Consider a `V8LivePreview`-style live preview on the sheet.
- The module selector and Workshop already read `lib/modules.ts`; the schematic exists in `ModuleSchematic`.

## Order of work
1. Config + model + tests (green before any mesh).
2. Store: extend settings (N1, BPR, focusStage) or generalise `useEngineSimulation` if it gets awkward — if you
   generalise, write a decision entry.
3. Geometries + materials, then meshes, then flow particles.
4. Scene + camera framings.
5. HUD controls + explainer content (data in `lib/`).
6. RTL tests for HUD, content tests.
7. Visual QA checklist (`docs/TESTING.md`).
8. README, `CLAUDE.md` roadmap, decisions.
9. Flip `status: 'active'`, `progress` removed, push; CI deploys.
