# Plant water — Phase B resolution

All four confirmed Phase A issues are fixed in the owned module. The Phase A reports remain unchanged.

| Issue | Status | Result |
|---|---|---|
| 20261004-plantWater-01 | fixed | Bath-gap marker centers now derive from the current complete outer-leaflet head silhouette and fixed inner wall. Their full disks stay extracellular with a positive margin at every visible time. |
| 20261004-plantWater-02 | fixed | Ion species/color is independent of guard-cell side. Both guard cells now receive and release potassium and counter-anion tracer cohorts. Four bilingual legend entries identify K+, counter-anions, water and H+. |
| 20261004-plantWater-03 | fixed | The liquid delivery branch exits through an actual membrane-backed lateral pit and reaches a curved wet film on the lower upper-right mesophyll wall. All 15 prebuilt vapor paths originate on that wall, then cross air space and the stomatal opening. |
| 20261004-plantWater-04 | fixed | Removed the hard closure<0.7 visibility cutoff. Independently prebuilt tracer materials continuously fade the extra cohort as the integrated flow slows. Route birth/exit fades hide modulo recycling seams. |

## Verification

### 20261004-plantWater-01

- 401 progress samples for each bath condition compare actual instanced membrane-head world bounds and wall vertex bounds to full marker radius; minimum clearance 0.1301.
- Negative control restores original x=+/-2.05 at p=0.325 and fails the same actual geometry check.

### 20261004-plantWater-02

- Actual visible mesh colors and positions contain both species on both sides during inward and ABA outward phases; small forward-step displacement checks verify transport directions.
- Negative control segregates colors by side again and fails.

### 20261004-plantWater-03

- Exact point-to-triangle checks: every vapor birth intersects the wet film and is within 0.0024 of the actual mesophyll wall. Every original empty-air birth fails attachment.
- Actual final liquid-delivery mesh ring reaches the wet wall; sampled branch centerline through the vessel-wall radial band has minimum radius-aware clearance 0.0289 from lignified wall triangles.
- Both stomatal conditions sampled over 181 progress points: finite vapor spheres remain exterior to the guard-cell volumes and clear actual guard-cell triangles by at least 0.0099 while crossing the aperture.

### 20261004-plantWater-04

- Actual visible/material-opacity weights sampled immediately either side of the former cutoff are continuous; the original binary gate has a unit jump and fails the negative control.
- 2,001 progress samples in both conditions keep opacity finite/bounded and change gradually; every open-flow recycling seam fades to zero on both sides.
- Irregular seeks reproduce transforms, visibility and opacities exactly; smoke confirms stable nodes/geometries/material identities, finite buffers and bounds. All independently cloned tracer materials remain referenced in the scene for disposal.

- Existing full chloroplast geometry regression remains intact and passes: 404 inputs × 2 genotypes × 16 complete plastids; wall clearance 0.0678 and conservative vacuole distance 1.0455.
- Owned smoke passes all four models, both control options, finite resources/bounds and arbitrary seeking.
- Formatted only the changed owned JS/MJS files; `git diff --check` passes.

## Changed files

- `src/processes/modules/plantWater/plasmolysisProcess.js`
- `src/processes/modules/plantWater/stomataProcess.js`
- `src/processes/modules/plantWater/plantLongDistanceTransportProcess.js`
- `src/processes/modules/plantWater/waterFlux.test.mjs`
- `src/processes/modules/plantWater/science.test.mjs`

## Evidence and limits

Logs: `evidence/plantWater/science-phase-b.log` and `smoke-phase-b.log`. New meaningful regressions are in the owned `waterFlux.test.mjs`, imported by the existing science entrypoint. Every issue has a legacy negative control.

Added [Wheeler and Stroock primary experiment](https://www.nature.com/articles/nature07226) for evaporation-driven continuity; Phase A lists the other opened primary evidence.

No browser, shared-file edits or full suite. Root still owns normal-speed rendered acceptance. The model remains a tissue schematic with compressed radial-root anatomy and illustrative tracer counts; these tests establish the stated geometry/continuity invariants rather than comprehensive biological or visual acceptance.

## Rendered-review additions

Root-supplied 28 stage-frame contact-sheet views and four native originals revealed three further annotation issues. They were recorded in `evidence/plantWater/repair-discoveries.json/.md` before repair; Phase A remains immutable.

### 20261004-plantWater-05 — fixed

Guard-cell, thick-wall and vacuolar-water leaders now follow actual current mesh vertices. Ion annotation explicitly names a membrane flux region and is active only while ion tracers are shown. Light/ABA anchors and visibility follow their actual icons.

- Actual triangle-surface contact checked for deforming guard body, thick wall and vacuole over 14 stage/boundary/intermediate samples in both conditions.
- Ion label visibility equals actual ion-tracer visibility; icon anchors and visibility equal their objects.
- Original thick-wall offset is a negative control and fails the surface-contact invariant.

### 20261004-plantWater-06 — fixed

Root-region leader targets a root-cell face; continuous-liquid leader targets the actual column surface; wet-wall leader targets a rendered wet-film vertex. Outlet region tracks the midpoint of the actual guard-cell pair. Air-space remains explicitly a region annotation.

- Actual triangle-surface contact for root tissue, liquid and wet film in both conditions over 14 progress inputs.
- Outlet region stays between the guard cells and outside their volumes; old liquid and wet-wall offsets fail exact surface-contact checks.

### 20261004-plantWater-07 — fixed

Cortical-plastid leader follows the real top surface of a representative instanced granum through the whole plastid transform. Periclinal and anticlinal region anchors lie on actual floor/wall planes. Vacuole anchor lies on its actual ellipsoid, and light-direction anchor follows a persistent arrow.

- Actual instanced granum triangle contact checked across both genotypes, including accumulation, corner transit and avoidance; the label moves with the organelle.
- Floor, wall and vacuole surface contact; arrow tracking; original fixed cortical offset fails the same attachment check.
- All label positions/active states reproduce exactly under repeated irregular seeks. Existing complete-plastid containment/resource regression remains unchanged and passes.

The resolution JSON now accounts for seven unique issue IDs. Additional owned files are `labelAnchors.js`, `labelAnchors.test.mjs`, and the annotation-only update to `chloroplastMovementProcess.js`. All local science/smoke tests still pass. See `plantWater-rendered.md` for per-model image findings and the post-repair recapture boundary.
