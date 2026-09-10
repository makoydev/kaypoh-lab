# Plan: Mechanical Watch Escapement (HLD-003)

Status: **released (2026-09-10)**. All nine steps done; visual QA checklist (`docs/TESTING.md` items 26–32) passed
on desktop; `status: 'active'`, deployed by CI on push to `main`.

## Learning objectives (`lib/modules.ts` `learn`)
1. Why the balance wheel swings at a steady rate no matter the spring tension (Hooke's law: bigger swing, harder pull, same period).
2. What the pallet fork does on every single tick (unlock, take the impulse, drop, lock: one tooth, no more).
3. Where the tick sound actually comes from (a tooth landing on a jewel, the fork tapping a banking pin).

## Mechanism
Straight-line Swiss lever escapement, laid flat like a watch on the bench (plane of motion XZ, arbors along +Y):
- **Balance wheel** with three arms and a **hairspring** (inner end on the collet, outer end at a fixed stud, curb pins of
  the **regulator** on the outer coil). **Safety roller** with a D-shaped ruby **impulse pin** and a crescent for the guard pin.
- **Pallet fork**: lever with notch and horns, guard pin, two pallet arms carrying the **entry** and **exit** ruby jewels,
  rocking 10° between two **banking pins**.
- **Escape wheel**: 15 club teeth; the pallets embrace 2.5 teeth, so the wheel advances half a pitch (12°) per beat.
- **Plate and bridges** (casing analogue: hidden / ghost / solid).

## Model (`src/lib/escapementConfig.ts` + `src/lib/escapementModel.ts`)
- The oscillator phase is the master: θ = A·sin(φ). Frequency from the beat rate (18,000–36,000 vph) times the regulator's
  rate error; amplitude from the mainspring wind. Rate never depends on amplitude, by construction.
- Fork angle from the impulse pin position, clamped by the banking pins; beyond the lift angle (found by bisection,
  ≈ 55°) the fork stays on whichever pin it was left on.
- Each beat is one lever travel 0 → 1 (`s`): unlock (wheel recoils 0.75°, the draw), impulse (linear, 10.5°), drop (1.5°,
  free), lock (drawn forward 0.75° into the other jewel). Even beats release the exit pallet, odd beats the entry pallet.
- The **pallet jewel outlines are generated from the path the tooth tip traces in the fork frame**, so the geometry and the
  animation cannot disagree; a toe extends the locking face for lock depth and safety.
- `stepEscapement` eases amplitude, advances the phase, counts landings (ticks) at the end of each drop, keeps watch time
  and the seconds-hand angle (escape wheel ÷ train ratio), and reports a tick event for the flash and the optional sound.
- Tests: plane helpers match Three's `rotation.y`; fork monotone and symmetric; lift angle plausible; wheel advances exactly
  12° per beat and 24° per swing, continuous, never backwards by more than the draw; landings once per beat; jewels touch
  the tooth throughout the action and clear it on the other banking; rate unchanged by amplitude; regulator scales phase.

## Visual time scale
1:8 (`ESCAPEMENT_VISUAL_TIME_SCALE`): 28,800 vph looks like one tick a second; 0.1× gives ten seconds per beat.

## Procedural 3D (`components/3d/escapement/`)
- Balance rim (lathe), arms, staff, rim weights; safety roller with crescent; D-shaped impulse pin.
- Hairspring as a ribbon along an Archimedean spiral, positions rewritten per frame (no allocations) so the coils breathe.
- Fork (boss, arm, forked head, pallet arms), guard pin, jewels extruded from the model's outlines, banking pins.
- Club-tooth escape wheel with crossing and arbor; rounded plate; three cocks on feet with ruby bearings.
- Tick flash (additive ring at the landing point), impulse energy path glow (cyan) through wheel → jewel → fork → pin.
- View modes: bench (cutaway) / x-ray / **pallet focus** (top-down on the jewels with live labels).

## HUD
- Playback, mainspring wind (amplitude, reserve), beat rate + regulator (s/day), "This beat" readout with a seconds dial,
  beat progress bar, tick count, watch time and a paused stepper (⅛ beat, next tick).
- View modes, plate control, tick sound toggle, auto-rotate; the numbers table; part inspector; swing–unlock–impulse–lock
  explainer with a live plan-view schematic, "Follow the live escapement" and "Show in 3D".
- Status bar: beat rate, frequency, amplitude, current phase, ticks, rate error, time scale.

## Order of work
1. Config + model + tests. 2. Store. 3. Geometries + materials + meshes. 4. Scene + camera. 5. HUD + content.
6. RTL + content tests. 7. Visual QA. 8. README, roadmap, decisions. 9. Flip `active`.
