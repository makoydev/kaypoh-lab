# Decisions

Lightweight ADR log. Newest at the bottom. Add an entry when a choice has lasting consequences; skip it for
taste calls. Format: context → decision → consequences.

## 001 · Procedural geometry, no external assets (2026-09-08)
Models must never be missing or blocked by a CDN. Everything is Three.js primitives built at runtime;
lighting uses procedural Lightformers instead of HDR files. Consequence: the app works offline and in
any sandbox; visual fidelity is bounded by what we can build from primitives.

## 002 · Kinematics as pure, tested functions (2026-09-08)
Slider-crank maths lives in `lib/kinematics.ts` with no Three.js dependency. Meshes only apply transforms.
Consequence: geometry correctness is unit-tested (TDC at fire angle, constant rod length); components stay thin.

## 003 · Crank pin offsets derived from the firing order (2026-09-08)
Rather than hard-coding a crossplane crank, pin angles are computed so each cylinder is at TDC when it
fires. Result is the classic 0/90/270/180 cross. Consequence: changing the firing order cannot desync the
model; tests assert the cross.

## 004 · Simulation state outside React (2026-09-08)
Per-frame values live in a mutable store advanced by a negative-priority `useFrame`. UI polls via
`useSimSnapshot(fps)` and re-renders only when the angle moved. Consequence: 60 fps with a live HUD;
anyone adding per-frame React state is doing it wrong.

## 005 · 1:40 visual time scale (2026-09-08)
Real rpm is unwatchable. The scene divides rotational speed by 40 and says so in the UI. Consequence:
the rpm figure is real, the on-screen speed is not; keep the label visible.

## 006 · Ghost casing is click-transparent (2026-09-08)
Translucent block/heads/liners use `raycast={() => null}` so clicks reach pistons and the crank. Only a
solid casing is selectable by clicking; the block explainer is always reachable from its chip.

## 007 · Workshop hub with drawing-sheet metaphor (2026-09-08)
The catalog is a browsable home screen, not a dropdown. Modules are engineering drawing sheets (frame
ticks, schematic, title block) and the live module embeds the running engine. Hash routing (`#/`,
`#/sim/<id>`) keeps both views shareable without a router dependency. Engine state persists across views.

## 008 · Test strategy: maths and HUD yes, WebGL no (2026-09-08)
Vitest + Testing Library for `lib/`, `hooks/`, and HUD components; 3D verified by a browser checklist.
Consequence: fast, reliable CI; anyone changing 3D code must run the visual checklist in `docs/TESTING.md`.

## 009 · MIT license, GitHub Pages deploy (2026-09-08)
Owner chose MIT and GitHub Pages. The build takes its base path from `VITE_BASE` (CI sets `/kaypoh-lab/`,
local dev stays `/`). Hash routing was kept on purpose: Pages cannot rewrite paths, and `#/sim/...` needs
no server support. Consequence: any future path-based router would break Pages; don't switch without a
redirect strategy.

## 010 · One store per module, same shape (2026-09-08)
The turbofan gets its own `TurbofanSimulationProvider` / `useTurbofan` / `useTurbofanSnapshot` rather than
extending `EngineSettings`. Part ids, view modes, and the "focus" concept are module-specific; a union type
would make every V8 component (materials, inspector, camera) handle turbofan cases. Both providers mount at
the app root so state persists across routes, and shared behaviour (part click/hover handlers, camera
fly-to, material highlighting) lives in generic helpers used by both. `docs/ADDING_A_MODULE.md` step 3 now
says this. Consequence: a third module copies the ~120-line provider; if that grows tiresome, generalise then.

## 011 · Turbofan axis, time scale, and spool direction (2026-09-08)
Engine axis is +X with air flowing −X → +X so the 3D view, the station strip, and the schematic all read
left to right. Visual time scale is 1:60 (`TURBOFAN_VISUAL_TIME_SCALE`): at 100 % N1 the fan turns about once
a second on screen, slow enough to count blades. Both spools turn the same way for simplicity (many real
engines counter-rotate; the model does not care). The cycle model is ideal-gas Brayton with polytropic
efficiencies and an exact work balance between each turbine and the compressors it drives; static thrust,
fuel mass ignored. Honest and teachable, not a performance deck.

## 012 · Turbofan casings are 270° sections, blade rows are instanced lofts (2026-09-08)
Instead of ghost-only casings, every turbofan shell (nacelle, core casing, nozzle, combustor liner) is a
`LatheGeometry` revolved through 270° with flat orange section caps, so a solid casing still shows the
machinery — the museum-cutaway look. Every blade row is a single `InstancedMesh` of one lofted airfoil
blade scaled per row, and the whole airflow is one instanced streak mesh (~1,100 instances) coloured by local
temperature. Consequence: ~40 draw calls for the whole engine and 60 fps on a laptop GPU; the wedge is fixed
to the engine (+Y/+Z quadrant), so the default camera and stage-focus framings sit on that side.

## 013 · Gearbox model: exact meshing from one rule, scripted shifts, car keeps rolling (2026-09-09)
Every wheel's angle is a linear function of the input angle with a reference phase from one generic
`meshedAngle` rule (a driver tooth at the line of centres meets a driven gap), so teeth interleave for all
time and the reverse idler chain needs no hand-tuned phases. Pitch radii derive from tooth counts and a single
centre distance, as real gearboxes vary module per pair. A gear change is a pure timeline (clutch out →
disengage → synchronise/grind → engage → clutch in) stepped by `stepGearbox`, which is unit-tested without React.
The engine rpm slider is the control; the car's speed persists through a shift and the clutch rewrites the
engine rpm when it bites (the rev drop). Reverse is refused while rolling. Consequence: the synchro's job is
visible as a real speed mismatch closing to zero, and the driver component is a two-line wrapper.

## 014 · Gearbox 3D: half-sectioned case, per-wheel materials, torque path glow (2026-09-09)
The case is cut along the centre plane with the near half removed (a body of revolution would be wrong for
a gearbox), with orange cut strips when solid. Each wheel, hub and sleeve has its own material key so the
torque path can light up per engaged gear through the same emissive channel as hover/selection
(`applyGearboxGlow`, priority selection > hover > path); the hot blocker ring is a separate additive mesh
because the six rings share one material. Gears are straight-cut extrusions so teeth are readable; the copy
says real ones are helical. Consequence: ~32 materials and ~40 draw calls; fine on a laptop GPU.
