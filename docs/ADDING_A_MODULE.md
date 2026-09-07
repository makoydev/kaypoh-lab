# Adding a simulation module

Use this as the playbook. The V8 (`v8-engine`) is the reference implementation; mirror its shape.

## 0. Decide what the learner should walk away knowing

Write the three `learn` objectives first. Everything else serves them. If a feature doesn't help one of
the three, it can wait.

## 1. Catalog entry — `src/lib/modules.ts`

Add or update the `CatalogModule`: `code` (next `HLD-00x`), `tagline`, `description`, `category`,
`difficulty`, `minutes`, `concepts`, `learn`, `accent`. Keep `status: 'upcoming'` until step 9.
`src/lib/__tests__/content.test.ts` checks completeness.

## 2. Pure model — `src/lib/<module>Config.ts` + `src/lib/<module>Kinematics.ts`

- Config: every dimension, count, ratio, and derived value in one typed object (like `GEOMETRY`).
- Kinematics: pure functions from "master angle / time" to the state of every moving part. Return plain
  objects (`Vec3`, angles, 0-1 progress values). No Three.js imports here.
- Tests in `src/lib/__tests__/`: invariants (lengths constant, things that must coincide do coincide,
  phases cover the cycle), boundary values, and one "each part" sweep across the full cycle.

## 3. Store integration

Copy the pattern in `hooks/useEngineSimulation.tsx` (see `useTurbofanSimulation.tsx` for the second
instance): a mutable store advanced by a driver in `useFrame` at negative priority, a snapshot hook for the
UI, and React state for settings. Each module gets its own provider and part-id type (decision 010); mount it
at the app root next to the others so state persists across routes. Share behaviour through the generic
helpers (`usePartInteraction`, `applyHighlight`, `useFlyTo`) rather than by widening another module's types.

## 4. Geometries and materials — `components/3d/`

- Singleton geometries in a `geometries.ts` style module (`once(() => ...)`).
- Materials built per view mode; reuse `MaterialSet` conventions (cutaway PBR, xray wireframe) so view
  modes and highlighting work for free. Map `PartId`s to material keys in `PART_MATERIALS`.

## 5. Procedural meshes

One component per part family. Each reads the store in its own `useFrame` and only sets transforms.
Wire clickable parts with `usePartInteraction(partId)`. Anything translucent in front of internals gets
`raycast={() => null}`.

## 6. Scene and camera

An `Assembly` component (materials provider + driver + parts) used by the sim scene and, if you want a
live preview on the Workshop sheet, by a small turntable canvas. Add camera framings to `CameraRig`
(default and any focus modes) and check portrait aspect ratios.

## 7. Controls and explainers

Put controls in `components/controls/`, education in `components/education/`. Explainer copy is data in
`src/lib/` (see `partInfo.ts`, `strokeInfo.ts`). Every explainer gets a "kaypoh fact" that is true.

## 8. Tests

- Unit tests for the model (step 2).
- RTL tests for controls and explainers: query by role/text, use `renderWithEngine`, use `findBy*` after
  content swaps inside `AnimatePresence`.
- Content tests for the new copy.

## 9. Visual QA and release

Run through `docs/TESTING.md` → "Visual QA checklist" in the browser. Then flip `status: 'active'`,
add the module id to `useHashRoute` if routing needs anything module-specific (it usually doesn't), add a
`ModuleSchematic` if it doesn't have one, update `README.md` and the Roadmap in `CLAUDE.md`, and add a
`docs/DECISIONS.md` entry for any lasting choice you made.
