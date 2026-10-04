# plantGrowth — final all-case rendered review

**Review complete for all 7 supplied root/control cases. No new model-mechanism, identity, or biological-anchor defect was confirmed in the reviewed samples.** Shared capture leader/box layering remains with the integrator and is not re-registered here.

This is a read-only review of [conditions-final-gallery-index.json](../evidence/browser/conditions-final-gallery-index.json). Every case's full stage sheet was inspected: **7 sheets, 61 captured states**. **18 key original 960×640 WebP images** were additionally inspected at original resolution. No browser was operated, product file edited, or additional test run for this review.

## Scope and capture boundary

All seven case JSON files report `kind=irregular-seeks`, `lang=en`, `speed=1.5`, `result=complete`, `errors=[]`; all images are 960×640. These are native irregular-seek samples, not seven complete uninterrupted playback runs. Their recorded frame intervals are not accepted as animation FPS. The earlier default-Chinese `full-b3` sample review is documented separately in [plantGrowth-rendered-final.md](plantGrowth-rendered-final.md).

| Case | Root/control | Reviewed sheet | Captured states | Result within sampled-state scope |
| --- | --- | --- | ---: | --- |
| 156 plantDivision | plant / no control | [sheet](../evidence/browser/sheets/conditions-final-a-156-plantDivision-plant.jpg) | 7 | Final chromosome-name correction visible; division/plate states coherent. |
| 157 cellWallGrowth | plant / yielding | [sheet](../evidence/browser/sheets/conditions-final-a-157-cellWallGrowth-plant.jpg) | 7 | CESA/fiber retention and wall extension visible. |
| 158 cellWallGrowth | plant / restrained | [sheet](../evidence/browser/sheets/conditions-final-a-158-cellWallGrowth-plant.jpg) | 7 | Fiber deposition retained while axial extension is restricted. |
| 159 doubleFertilization | plant / frontEgg | [sheet](../evidence/browser/sheets/conditions-final-a-159-doubleFertilization-plant.jpg) | 10 | Contact, internal paternal nuclei and final 2n/3n outcomes coherent. |
| 160 doubleFertilization | plant / frontCentral | [sheet](../evidence/browser/sheets/conditions-final-a-160-doubleFertilization-plant.jpg) | 10 | Same valid recipient outcomes under the alternate paternal assignment. |
| 161 fungalHyphae | yeast / normal | [sheet](../evidence/browser/sheets/conditions-final-a-161-fungalHyphae-yeast.jpg) | 10 | Tip extension, pore/cluster positions and retained wall material coherent. |
| 162 fungalHyphae | yeast / reduced | [sheet](../evidence/browser/sheets/conditions-final-a-162-fungalHyphae-yeast.jpg) | 10 | Reduced transport/deposition and reduced extension remain distinct. |

## Findings by model

### plantDivision — issue 07 visually confirmed in English

The initial sheet frame correctly says “Duplicated chromosomes.” The original [p=.175](../evidence/browser/conditions-final-a-156-plantDivision-plant-stage-2.webp) and [p=.335](../evidence/browser/conditions-final-a-156-plantDivision-plant-stage-3.webp) images both correctly say **“Daughter chromosomes”** once separation has begun. The leader remains on the actual moving chromosome geometry. At .445 that early chromosome label is absent, while the later phragmoplast/plate/nuclear labels remain stage appropriate.

The .635, .915 and terminal sheet frames show an expanding cell plate, its connection to the parent boundary, and two daughter nuclei. No new orphaned carrier or misplaced biological leader was identified. The .915 marginal phragmoplast endpoint still projects against the parental wall in this view; this is a visibility limit for the individual selected cylinder, not evidence of an incorrect coordinate.

This fresh batch confirms the **English rendered wording** after the final correction. The corrected Chinese wording and backwards-seek restoration are supported by the already-passing bilingual regression; the old default-Chinese `full-b3` captures predate issue 07's text correction, so they are not a fresh Chinese visual confirmation. [Failing old code](../evidence/plantGrowth/phase-b-chromosome-label-red.log) and [passing final science suite](../evidence/plantGrowth/phase-b-science-label-final.log) remain the red/green evidence.

### cellWallGrowth — both extensibility controls

Both sheets retain the same layered arrangement, moving CESA complexes and persistent deposited cellulose. The yielding sequence extends vertically as it progresses. The restrained sequence retains deposition with a much smaller axial change. The original [yielding endpoint](../evidence/browser/conditions-final-a-157-cellWallGrowth-plant-end.webp) and [restrained endpoint](../evidence/browser/conditions-final-a-158-cellWallGrowth-plant-end.webp) expose the final fibers and complexes clearly.

CESA and newly deposited-fiber leaders terminate on their corresponding moving structures; wall, membrane and cortical-microtubule labels remain assigned to the correct layer/object. The force-region leader remains in the wall. No additional anchor or mechanism defect was found in either control.

The fitted object occupies different areas of the two captures. Cross-case pixel height is therefore not used as a quantitative strain measurement; the reviewed evidence is the within-case state progression and visible control-dependent behavior.

### doubleFertilization — both assignment controls and all three added critical states

For **each** assignment, original images at .49, .515, .61 and .72 were inspected:

| Assignment | Contact .49 | Fusion interval .515 | Internal migration .61 | Handoff .72 |
| --- | --- | --- | --- | --- |
| frontEgg | [original](../evidence/browser/conditions-final-a-159-doubleFertilization-plant-critical-490.webp) | [original](../evidence/browser/conditions-final-a-159-doubleFertilization-plant-stage-4.webp) | [original](../evidence/browser/conditions-final-a-159-doubleFertilization-plant-critical-610.webp) | [original](../evidence/browser/conditions-final-a-159-doubleFertilization-plant-critical-720.webp) |
| frontCentral | [original](../evidence/browser/conditions-final-a-160-doubleFertilization-plant-critical-490.webp) | [original](../evidence/browser/conditions-final-a-160-doubleFertilization-plant-stage-4.webp) | [original](../evidence/browser/conditions-final-a-160-doubleFertilization-plant-critical-610.webp) | [original](../evidence/browser/conditions-final-a-160-doubleFertilization-plant-critical-720.webp) |

At .49 the two paternal carriers are at the female contact regions. At .515 the local fusion protrusions are visible. At .61 the small paternal nuclei are inside the egg and central-cell silhouettes and no longer carried by distinct intact spherical sperm shells. At .72 the egg outcome shows two nuclear contributions and the central outcome three; labels switch to the embryo and endosperm lineages. Terminal sheet frames retain the separate embryo and endosperm positions.

The two assignment branches produce the same correct biological recipient outcomes. Their similarly colored paternal bodies do not make a stable lineage ID visually trackable in these stills; the existing exclusive-identity regression establishes that each of the two paternal identities is used once. No assignment-dependent duplicate, external nucleus or erroneous target label was observed.

The narrow annular channel is small and translucent at this overall framing. These originals establish the sampled contact/internal states, but do not alone prove open membrane topology, whole-body passage through the channel, or zero displacement exactly across the .72 boundary. The already-passing actual-triangle, whole-nucleus containment and small-epsilon handoff regressions provide that separate evidence. No uninterrupted visual-transition acceptance is inferred from irregular seeks.

### fungalHyphae — both delivery controls and all three added critical states

For **each** delivery control, original .68, .9 and .97 images were inspected:

| Delivery | .68 | .9 | .97 |
| --- | --- | --- | --- |
| normal | [original](../evidence/browser/conditions-final-a-161-fungalHyphae-yeast-critical-680.webp) | [original](../evidence/browser/conditions-final-a-161-fungalHyphae-yeast-critical-900.webp) | [original](../evidence/browser/conditions-final-a-161-fungalHyphae-yeast-critical-970.webp) |
| reduced | [original](../evidence/browser/conditions-final-a-162-fungalHyphae-yeast-critical-680.webp) | [original](../evidence/browser/conditions-final-a-162-fungalHyphae-yeast-critical-900.webp) | [original](../evidence/browser/conditions-final-a-162-fungalHyphae-yeast-critical-970.webp) |

Both controls keep the septa/pore locations, nuclei, transport zone and Spitzenkörper in coherent positions. The growing tip retains its wall/membrane organization. Normal delivery has more visible carriers and retained wall material; the reduced-delivery sequence has fewer carriers, a smaller tip cluster and less extension. The final geometry remains contained within the image.

The pore leader still identifies an actual septal opening, the Spitzenkörper leader follows its moving cluster, the fusion label stays at the apical membrane region, and the force leader identifies the arrow. The late capture boxes are moved away from the central apical detail compared with the earlier default set. Some leaders cross another box or its text area because of the known shared draw-order issue; this is explicitly left with the integrator and is not treated as a new plantGrowth finding or corrected by moving a biological anchor.

The .68/.685 samples are spatially consistent, but static snapshots cannot show a discontinuity smaller than their sampling interval. A small fusion lumen or individual cargo release is also not cleanly separable at this overall 960×640 view. The actual-membrane-opening, extracellular-cargo, invisible-reuse and trajectory-continuity regressions remain the evidence for those fine transitions. No full-playback or close-up topology claim is made from these images.

## Disposition

- All supplied root/control cases and stage sheets are reviewed; no further product repair was requested or made in this pass.
- Issue 07's final English rendered state is confirmed. Bilingual boundary/seek correctness remains covered by the final local regression.
- The planned double-fertilization .49/.61/.72 and fungal .68/.9/.97 supplements have now been reviewed in both controls; they are no longer missing artifacts. Their static and spatial-resolution limits are described above.
- Shared leader/box layering needs its integrator-owned correction and any targeted final recapture; no duplicate discovery or biological-anchor change is made here.
- This report does not extend acceptance to uninterrupted motion for every case, a fresh post-07 Chinese layout, mobile layouts, arbitrary export resolutions, sustained browser FPS, or deployment.

The owned plantGrowth product files remain frozen. The read-only all-case review's sole new artifact is this report.

## Addendum — issue 07 Chinese rendered confirmation

The fresh [Chinese capture record](../evidence/browser/conditions-final-c-020-plantDivision-plant.json) reports `kind=irregular-seeks`, `lang=zh`, `parameters={}`, `result=complete`, and `errors=[]`. Its two requested original 960×640 images were inspected:

- [Stage 2, p=.175](../evidence/browser/conditions-final-c-020-plantDivision-plant-stage-2.webp): the rendered label clearly reads **子染色体**.
- [Stage 3, p=.335](../evidence/browser/conditions-final-c-020-plantDivision-plant-stage-3.webp): the rendered label clearly reads **子染色体**.

Combined with the English originals reviewed above, **issue 07's post-separation wording is now visually confirmed in both Chinese and English**. This addendum closes the earlier specific limitation about missing fresh Chinese confirmation for issue 07. It adds two original-image inspections (20 originals across this report and addendum), without repeating the model-geometry review or extending any continuous-playback, other-language-layout, performance or release claim. No product or browser change was made.
