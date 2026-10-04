# Plant water — rendered stage review and annotation repair

Reviewed the root-supplied gallery at `evidence/browser/gallery-index.json`: four contact sheets with all seven stages each (28 frames), plus these original **960×640** images using `view_image` without resampling:

- `full-a-stable-030-plasmolysis-plant-stage-4.webp`
- `full-a-stable-031-stomata-plant-stage-4.webp`
- `full-a-stable-032-plantLongDistanceTransport-plant-stage-4.webp`
- `full-a-stable-033-chloroplastMovement-plant-stage-3.webp`

The source originals and sheets were not changed. These images precede the annotation repairs below. Native continuous playback was performed by root; this reviewer's visual evidence is the supplied stage images.

| Model | Native-frame observations | Additional action |
|---|---|---|
| plasmolysis | Fixed wall, continuous shrinking membrane, vacuolar cut rim and nucleus remain clear and uncropped. During maximal shrinkage the bath-gap solutes sit between membrane and wall. Recovery frames restore the larger protoplast. Lumen and bath/gap labels name regions appropriately. | No additional confirmed rendered defect; no new edit. |
| stomata | Both potassium/counter-anion colors are visible at both guard cells. Cutaway vacuoles, chloroplasts, radial detail and open/narrow pore remain legible and uncropped. Thick-wall/pair/flux/water label endpoints were misplaced; ion label also persisted when tracers were absent. | Discovery 05 fixed: real deforming mesh anchors, vacuolar-water wording, explicit membrane-flux region and tracer-derived visibility. Light/ABA track their icons. |
| plantLongDistanceTransport | The narrow liquid branch remains visible from vessel pit to wet film; vapor now begins at the upper-right mesophyll wall. Continuous column, pit/helical wall detail, root tissue and leaf cells remain intact and uncropped. Later frames retain a smaller vapor cohort. Several leaders still targeted former caption offsets. | Discovery 06 fixed: actual root-cell, water-column and wet-film surfaces; pore midpoint for outlet region; air-space kept as a region. |
| chloroplastMovement | Periclinal accumulation, cortical transit and anticlinal avoidance are clear, with envelope/granum detail preserved and no visible clipping. The static cortical-chloroplast leader remained at empty side wall during accumulation; orientation/light leaders also used offsets. | Discovery 07 fixed: actual granum surface follows representative plastid; physical floor/wall/vacuole surfaces and moving light arrow supply the other anchors. |

## Verification after repair

- New `labelAnchors.test.mjs`: PASS. Actual world triangle-surface contact for deforming guard-cell walls/vacuoles, water column, wet film and instanced granum; explicit region checks; ion/icon visibility; both branches; repeated irregular seeks. Original offsets are negative controls.
- Full owned `science.test.mjs`: PASS, including unchanged 404-input × 2-genotype × 16-complete-plastid containment regression and all four prior flux/continuity repair regressions.
- Owned `smoke.mjs`: PASS for all four processes and both options, finite buffers/bounds and stable scene resources.
- Owned files formatted; `git diff --check` passes.
- Logs: `evidence/plantWater/science-rendered-labels.log` and `smoke-rendered-labels.log`.

## Completion boundary

Seven unique issues are closed in `resolutions/plantWater.json` (the four Phase A issues and three appended rendered discoveries). Source-backed process motion and geometry were preserved during these annotation repairs. The reviewer used no browser and ran no full-workspace suite. The supplied frames establish visibility of the earlier four fixes; **fresh root native captures are still required to accept the screen layout of the repaired annotations**. Static frames do not alone prove continuously smooth playback or alternate-condition rendered acceptance.

Owned source files are frozen for root integration; see `evidence/plantWater/frozen-files.json` for the exact file hashes.
