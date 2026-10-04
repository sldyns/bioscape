# plantGrowth — final default rendered review

Status: **default Chinese stage samples reviewed; transition supplements and fresh post-label-fix capture remain open**.

This was a read-only review of the integrator's saved `full-b3` artifacts, followed by the explicitly authorized issue 07 label-text correction. No browser was operated. Phase A evidence was not changed. All four stage sheets (28 samples total) were visually inspected; 12 original 960×640 WebP images were inspected at original resolution. The source of the image list is [gallery-index.json](../evidence/browser/gallery-index.json).

## Captured scope

| Model | Saved key | Parameters | Sample progress |
| --- | --- | --- | --- |
| plantDivision | `full-b3-009-plantDivision-plant` | `{}` | 0, .175, .335, .445, .635, .915, 1 |
| cellWallGrowth | `full-b3-010-cellWallGrowth-plant` | `extensibility=yielding` | 0, .165, .335, .515, .695, .895, 1 |
| doubleFertilization | `full-b3-011-doubleFertilization-plant` | `assignment=frontEgg` | 0, .185, .345, .515, .745, .895, 1 |
| fungalHyphae | `full-b3-012-fungalHyphae-yeast` | `delivery=normal` | 0, .175, .335, .505, .685, .885, 1 |

All four JSON records say `kind=full-playback`, `lang=zh`, `speed=1.5`, and contain an empty `errors` array. The corresponding update-record counts are 1371, 1211, 1451 and 1291. These records establish what was captured; the reviewer inspected saved still images, not every playback frame. Neither update counts nor still images establish sustained FPS or sub-frame continuity.

## Model observations

### plantDivision

- [All-stage sheet](../evidence/browser/sheets/full-b3-009-plantDivision-plant.jpg) shows separated chromosome groups, a central forming cell plate, outward expansion, and a terminal wall joining the parental boundary. The final frame retains two nuclei and has no obvious orphan vesicle at the completed wall.
- Original images reviewed: [p=.335](../evidence/browser/full-b3-009-plantDivision-plant-stage-3.webp), [p=.635](../evidence/browser/full-b3-009-plantDivision-plant-stage-5.webp), [p=.915](../evidence/browser/full-b3-009-plantDivision-plant-stage-6.webp).
- The parental-wall, chromosome, plate, microtubule and daughter-nucleus leaders now end on their intended structures rather than the old word-placement positions. At .915 the selected marginal phragmoplast point projects against the parental wall; this view alone does not expose that individual cylinder clearly.
- **New issue 07 confirmed:** at .335, visibly separated daughter chromosomes still carried the Chinese name “已复制的染色体.” This was fixed after capture by switching the existing bilingual text object to “子染色体 / Daughter chromosomes” when `separation > 0`, restoring the earlier name on backwards seeks. Geometry, visibility and the actual anchor were preserved. The old implementation fails the new regression at .130001; the fixed implementation passes the boundary, arbitrary-seek, stable-text-object and anchor checks. Fresh capture is required to confirm the corrected wording in the rendered view.
- The .5/.7 modulo-boundary rim continuity is covered by the actual-triangle regression, not by these sparse stage samples.

### cellWallGrowth

- [All-stage sheet](../evidence/browser/sheets/full-b3-010-cellWallGrowth-plant.jpg) shows the membrane/wall layer arrangement, CESA complexes moving laterally, deposited fibers retained behind them, and vertical extension of the yielding wall.
- Original images reviewed: [p=.515](../evidence/browser/full-b3-010-cellWallGrowth-plant-stage-4.webp), [p=.895](../evidence/browser/full-b3-010-cellWallGrowth-plant-stage-6.webp).
- CESA and newly deposited-fiber leaders follow actual structures, and the membrane/wall/cortical-microtubule labels identify their respective visible layer or object. The wall-force region label ends in the wall rather than at its former text-placement coordinate.
- No additional mechanism or anchor defect was identified in the default yielding-wall samples. The stiff-wall branch and English layout are outside this saved set.

### doubleFertilization

- [All-stage sheet](../evidence/browser/sheets/full-b3-011-doubleFertilization-plant.jpg) shows pollen-tube approach, the two paternal carriers near their recipient sites, a two-contribution egg outcome, a three-contribution central-cell outcome, then embryo/endosperm-lineage separation.
- Original images reviewed: [p=.515](../evidence/browser/full-b3-011-doubleFertilization-plant-stage-4.webp), [p=.745](../evidence/browser/full-b3-011-doubleFertilization-plant-stage-5.webp), [p=1](../evidence/browser/full-b3-011-doubleFertilization-plant-end.webp).
- At .515 the contact-region protrusions are visible. At .745 the contributions are visibly inside the female structures, and distinct intact sperm shells are no longer depicted there. The terminal image retains separate embryo and endosperm locations. Egg, maternal central nucleus, receiving synergid and later lineage leaders point to their intended current entities.
- Sparse .515→.745 samples cannot establish a fully open fusion neck, the whole-body path through it, or the .72 handoff's continuity. Planned .49/.61/.72 supplements remain required for rendered transition review; actual-triangle/containment/identity regressions already cover both assignment branches numerically.

### fungalHyphae

- [All-stage sheet](../evidence/browser/sheets/full-b3-012-fungalHyphae-yeast.jpg) shows an extending hypha, retained septa with visible pores, transported carriers, a tip-localized Spitzenkörper, and wall material retained along the elongated tube.
- Original images reviewed: [p=.505](../evidence/browser/full-b3-012-fungalHyphae-yeast-stage-4.webp), [p=.685](../evidence/browser/full-b3-012-fungalHyphae-yeast-stage-5.webp), [p=.885](../evidence/browser/full-b3-012-fungalHyphae-yeast-stage-6.webp), [p=1](../evidence/browser/full-b3-012-fungalHyphae-yeast-end.webp).
- The pore leader points into the septal opening; the Spitzenkörper leader follows the tip cluster; the force leader points to the force arrow. The membrane-fusion/wall-synthesis leader stays at the advancing apical region.
- In the late original images, right-side text boxes partially cover the apical region. This is the shared capture-label layout issue being handled by the integrator; moving correct biological anchors would not resolve it appropriately. Fresh images after the shared layout correction are needed to reassess contact readability.
- The .685 still supports the expected spatial arrangement but cannot prove the .68 incoming/outgoing path join is continuous. Fusion opening, extracellular cargo transfer and invisible carrier reuse are small at this default overall framing. Planned .68/.9/.97 supplements remain open for rendered review; their geometry/trajectory regressions are already passing.

## Final local correction and evidence

Issue 07 is recorded separately in [repair-discoveries/plantGrowth.json](../repair-discoveries/plantGrowth.json) and reconciled once in [resolutions/plantGrowth.json](plantGrowth.json). It does not rewrite Phase A.

- [Failing old-code regression](../evidence/plantGrowth/phase-b-chromosome-label-red.log): expected daughter-chromosome wording at .130001, actual duplicated-chromosome wording.
- [Final owned science suite](../evidence/plantGrowth/phase-b-science-label-final.log): exit 0 after the correction, including the new boundary/seek test and all prior plantGrowth mechanism tests.
- [Final owned smoke suite](../evidence/plantGrowth/phase-b-smoke-label-final.log): exit 0 for all four models after the correction.

The owned product files are frozen again for fresh integration capture. This review does not accept alternate controls, English labels, mobile screens, exported views at other resolutions, uninterrupted visual motion at every boundary, sustained browser performance, or deployment. No such claims are inferred from the 28 reviewed default-zh stage samples.
