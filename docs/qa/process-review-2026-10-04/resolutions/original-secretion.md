# Original secretion resolution — 2026-10-04

Both assigned issues are fixed in `src/processes/secretionProcess.js`, with focused new regression coverage in `tests/original-secretion-review.mjs`. Original audits and peer measurements remain unchanged.

| Issue | Repair | Actual geometry verification |
| --- | --- | --- |
| 20261004-original-01 | Preserve budding orientation at departure; rotate the closed carrier smoothly before Golgi docking | Visible lipid displacement at 0.20 ±1e-8 falls from 0.4562253 to 3.23e-14; real mouth/neck polygons stay aligned |
| 20261004-original-02 | Share carrier/fusion triangles and material coordinates, open a matched receiver annulus gradually, retain persistent lipid identities | Visible lipid displacement at 0.90 ±1e-8 falls from 0.7516005 to 5.03e-14; handoff surface error ≈1.31e-8; tested lipid midpoint-to-triangle error <1.5e-8 |

The pore opens during 0.90–0.925 from a closed first frame; cargo begins outward travel after it is open. The full lipid count remains (840 heads / 1680 tails). The membrane boundary now uses 96 segments to match the existing receiving aperture; surface detail was preserved/increased. Carrier lipids keep one local frame, including their two tail branches. Later flattening and final incorporation remain, with continuous opacity at both visible shell handoffs.

Validation:

- New `original-secretion-review.mjs`: PASS for head/tail world-coordinate continuity, common shell vertices, polygonal neck/pore boundaries, exact point-to-triangle attachment at 14 checkpoints, physical cargo passage, finite buffers, deterministic irregular seeks and fixed resource inventory.
- Both retained baseline negative controls fail independently at the original geometric jump, as required; no old test was weakened.
- Existing `secretion-refinement.mjs`: PASS for cargo containment, complete cisternal fades, recycling and seeking.
- Focused browser bundle: PASS. Only the two owned code/test files were formatted; diff whitespace check passes.

Artifacts are in `../evidence/regulation/`: `secretion-after.json`, `secretion-regression-final.log`, `secretion-existing-regression.log`, `negative-controls.json`, the two negative logs and the browser-bundle log. The retained baseline source only changes its helper import path so the old implementation can execute from the evidence directory.

No biological claims or sources were changed. Browser playback and visual acceptance remain with root; no whole-workspace test, publication, GPU benchmark or physical-device acceptance is claimed.

## Supplementary membrane-label repair

`20261004-original-secretion-labels-01` was confirmed during the authorized actual-object anchor sweep after Phase A. ER, cis/trans-face and plasma-membrane leaders were positioned off their membranes. They now attach to existing membrane vertices; cis/trans face labels follow the currently visible outer sacs through maturation and recycling. Cytosolic/extracellular labels remain spatial annotations. No mechanism, bilingual text, geometry or trajectory changed.

`tests/original-secretion-label-review.mjs` passes 444 actual membrane-vertex assertions and arbitrary-seek reconstruction. The retained pre-label-repair source fails at its detached ER anchor. Original continuity and secretion-refinement tests still pass. Twelve before/after geometry-preservation samples match exactly. Post-repair rendered label placement/visibility remains with the root integration gate.
