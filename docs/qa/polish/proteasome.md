# Proteasome individual refinement

## Evidence and scope

Before: `process-evidence/proteasome-01.jpg`, independently reproduced at `http://127.0.0.1:4197/#/cell?view=process&process=proteasome`. The four contiguous un-beveled annular layers project as three long flat walls. Ring boundaries and heptameric subunits are not readable at normal distance.

Only `src/processes/modules/turnover/proteasomeProcess.js` and `tests/proteasome-polish.mjs` changed for this model. The six stages, 36-second duration, original tag selector, cytosolic compartment, roots and public process ID remain.

## Changes

- Four opaque α7–β7–β7–α7 rings, individual grooved wedge envelopes with closed contact faces, slightly narrower β rings and expanded β catalytic cavity. Outer grooves articulate each subunit and ring; the lumen-facing wall remains continuous between rings and neighboring subunits. Surface folds terminate at each subunit and ring rather than spanning the barrel.
- Finite two-subunit front-sector cutaway (20 visible core subunits); a new viewing selector restores the same 28 physical subunits for full exterior inspection. No transparent stand-in walls.
- Six ATPase domains, inward pore loops, asymmetric lid, receptor and Rpn11 retained. β catalytic sites aligned to inward-facing subunit surfaces with β1/β2/β5 identity.
- Final translocation travel corrected from 5.23 to 6.5 scene units: the earlier animation left the last four residues present at its endpoint. Peptide appearance now follows the same chain-travel variable, and all 42 schematic chain beads are consumed at completion.
- Surface folds moved outside their protein envelopes after actual whole-view inspection; substrate and ubiquitin labels track their carriers, and the consumed substrate label is hidden. Internal chamber label is hidden in whole view.
- Reused temporary vectors remove allocations in per-residue and ubiquitin update loops. Two shared, closed annular-sector BufferGeometries replace 28 unique extrusions.

## Scientific basis and omissions

[Dong et al., Nature 2019](https://www.nature.com/articles/s41586-018-0736-4) and [de la Peña et al., Science 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6519459/) support substrate-engaged 26S architecture, a six-ATPase translocation motor, Rpn11 coupling and axial passage into the proteolytic core.

This is a schematic singly capped eukaryotic proteasome, not an atomic reconstruction. Subunit envelopes, fold decorations, time, residue count and peptide size are illustrative. Cutaway sectors are a viewing aid. The receptor is generalized; not every receptor, lid subunit or nucleotide state is individually resolved. E1/E2/E3 tagging, detailed allosteric cycles, downstream peptidases and the enzyme disassembling recycled ubiquitin are omitted. The untagged branch describes this selected substrate only.

## Validation

`node tests/proteasome-polish.mjs` passes: 4 × 7 core subunits; six ATPases; both tag branches × both view branches; finite geometry/bounds; repeated forward/backward seeks; stable resource identities; no substrate residue remains after tagged completion; untagged chain remains intact. Inventory: 500 nodes, 406 meshes, 28 shared/unique geometries, 14 materials, 163,364 triangles including hidden cutaway pieces. The original HEAD module measured 532 nodes, 470 meshes, 54 geometries and 191,988 triangles; the revised geometry reduces all of these, while the independent original endpoint check confirmed four residual substrate beads.

Rendered check on stable4200 completed: all six stage buttons, both tag branches, both core views, orbit and reset. An uninterrupted 36-second playback reached 0:36 / 0:36 and showed no remaining substrate; mid/end captures in `proteasome-images/`. Browser console returned no warnings/errors. Actual inspection prompted two final source refinements (surface fold depth and live label positioning), which still require a final-build render check. Tests alone do not establish visual acceptance.

### Final science-regression repair

The integration suite caught a real defect in the first refinement: visual seams had been modeled as full-thickness gaps. The final source changes these to external grooves with continuous radial/axial contact faces. The body meshes retain the original `20S protein volume` identity. The triangle-ray regression still scans the entire axial height, including ring boundaries; it now also scans the whole-view circumference, excludes hidden ancestor groups correctly, and verifies the selected front cutaway is actually open. The α lumen (0.47) and expanded β cavity (0.66) are separately bounded to a tighter 0.004 tolerance; product exit confinement is tightened to 0.47. The complete `node src/processes/modules/turnover/science.test.mjs` passes, including all other turnover models and swept-chain checks.

Final-source preflight on the existing development preview at 5174 confirmed the repaired closed-wall geometry remains visually articulated in both whole and cutaway views. Surface folds are now outside the volume, and the stale substrate annotation is absent during proteolysis. Screenshots: `proteasome-images/final-source-whole-5174.jpg` and `proteasome-images/final-source-cutaway-5174.jpg`. Final stable4201 review remains pending.

The final source was additionally reviewed at all six stage entries on 5174 (six saved `final-source-stage-0N-5174.jpg` files), with an untagged endpoint, whole/cutaway, and a second uninterrupted 36-second playback through `1000 / 0:36`. Final-source browser warnings/errors: none. The late empty substrate label is gone; the untagged substrate remains intact. These development-preview observations do not substitute for the queued stable4201 integration confirmation.

## Final integrated review — 4201

Completed on the final stable build at `http://127.0.0.1:4201/#/cell?view=process&process=proteasome`: six stage entries at normal framing, a magnified whole barrel, magnified catalytic cutaway, exact tagged endpoint (timeline 1000 / 0:36), and exact untagged endpoint. All saved images were visually inspected. The final build contains the closed-wall geometry, exposed surface folds, tracking labels and late-label removal. The whole barrel is closed; the cutaway visibly exposes the substrate path and β chamber; no substrate remains at the tagged endpoint, while the untagged substrate stays intact. No browser warnings/errors. No additional source changes after this review.

Final evidence: `proteasome-images/final4201-stage-01.jpg` through `final4201-stage-06.jpg`, `final4201-whole.jpg`, `final4201-cutaway-detail.jpg`, `final4201-cutaway-end.jpg`, `final4201-untagged-end.jpg`.

Continuous playback was already verified on both 4200 and the final source on 5174; it was not redundantly rerun during the final4201 integration confirmation. Final4201 resolves the earlier pending integration notes above.
