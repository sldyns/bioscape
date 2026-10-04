# Regulation exported-frame review — 2026-10-04

Reviewer: review_regulation. Root supplied completed native-playback stage exports indexed by `evidence/browser/gallery-index.json`. This reviewer read both full contact sheets and inspected the promoter end frame and enhancer stage-5 original WebPs at their original 960 × 640 size. No browser was opened by this reviewer.

## Evidence and scope

- `sheets/full-a-retry-000-promoterRegulation-cell.jpg`: cell, default intact TATA, English, progress 0 / .185 / .355 / .535 / .675 / .825 / 1.
- `sheets/full-a-retry-001-enhancerRegulation-cell.jpg`: cell, default competent recruitment, English, progress 0 / .185 / .365 / .545 / .675 / .815 / 1.
- Original close inspection: `full-a-retry-000-promoterRegulation-cell-end.webp` and `full-a-retry-001-enhancerRegulation-cell-stage-5.webp`.

All paths above are relative to `evidence/browser/`. The sheets include every supplied stage image. This is default-condition English rendered geometry/annotation review, not a claim that this reviewer watched uninterrupted playback or reviewed the alternate conditions/Chinese in a browser.

## Confirmed findings

**20261004-regulation-labels-01:** Promoter leader endpoints use fixed text-layout coordinates. At the end frame, TFIID and Pol II leaders terminate well above their complexes; TATA and +1 leaders terminate below the DNA/marker; TFIIH and RNA 5-prime leaders also terminate in empty space rather than the purple complex or free RNA endpoint. The coding/template labels sit away from the named strands. This is confirmed in both the original image and source coordinates.

**20261004-regulation-labels-02:** Enhancer activator, Pol II, nucleosome, Mediator and nascent-RNA leader endpoints retain offsets from their target geometry. The original stage-5 frame makes the RNA and nucleosome gaps especially clear. The activator annotation also points away from the actual moving activator complex. The proximity statement is an explanatory statement, so it remains a spatial note.

The scientific structures themselves remain distinguishable: the promoter gallery shows the two DNA backbones, upstream highlighted site, TFIID approach, PIC assembly, local bubble and escaped polymerase/RNA; the enhancer gallery retains all seven wrapped nucleosomes, connected linkers, distinct activator/Mediator/Pol II complexes and released RNA. No additional shape/topology defect was confirmed from these samples. Overlap within the assembled promoter complex is consistent with its schematic assembly and is not evidence of an extra defect.

## Repair and current boundary

Both label issues are fixed locally and recorded in `evidence/regulation/repair-discoveries.json`; immutable Phase A reports were not edited. Protein/core labels now follow cached vertices of the existing real meshes through the full transform; DNA annotations follow the named backbones, +1 attaches to the existing marker ring, and RNA 5-prime points to the actual distal centerline endpoint. Bilingual text and active predicates are retained.

`tests/regulation-label-review.mjs` passes 1,045 actual-surface/backbone/endpoint assertions across both conditions, arbitrary seeks and burst boundaries. Before-source negative controls fail. Existing science/201-frame duplex tests pass. Actual object poses, visibility, vertex/normal/instance buffers and material states match the pre-label-repair models in the separate geometry-preservation diagnostic.

**Post-repair rendered acceptance remains pending:** the supplied gallery predates these anchor changes and cannot certify the resulting text placement, collision suppression or export visibility. Root should re-export promoter p=.675/1 and enhancer p=.675/.815 plus alternate conditions/Chinese as needed for its integration gate. Enhancer's p=.79–.82 recycling remains a continuous but fast motion interval that contact-sheet samples cannot adjudicate.
