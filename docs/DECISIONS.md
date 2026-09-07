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
