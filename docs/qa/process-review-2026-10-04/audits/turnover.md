# Turnover Phase A · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product/test files remain unchanged. Four models, six registered process/root pairs, 20 complete root/condition combinations reviewed. Roots were evaluated from `processesByRoot`; no specialized neuron/muscle/erythrocyte routes register these four models.

| Model | Verdict | Finding |
| --- | --- | --- |
| rnaSilencing | confirmed_issue | P2 `20261004-turnover-01`: TNRC6/CCR4-NOT pop in at full size at p=.38. |
| proteasome | confirmed_issue (validation) | P2 `20261004-turnover-02`: smoke requires motion in the intentionally static untagged control and stops early. Scientific geometry qualified-passes. |
| crispr | qualified_pass | No confirmed mechanism/continuity defect; root rendered playback review remains. |
| bacterialRepair | confirmed_issue | P2 `20261004-turnover-03`: RecA/RNAP pop in; a 2.23-unit-wide stationary set of LexA fragments disappears at p=.84. |

No new P1 biological falsehood was confirmed. Molecular identities, organism scope, antiparallel register, actual covalent/paired attachments, causal order and the branch-specific outcomes are consistent with the opened primary sources listed in the JSON. Protein folds remain schematic, with no assertion of atomic coordinate fidelity or exact kinetics.

The two playback issues are finite-size on-scene assembly changes (21 effector meshes in RNA silencing; 18 RNAP and 20 LexA meshes in SOS), not automatically flagged bond breaks or indicator toggles. The proposed repair preserves the same geometry and biology while adding finite entrance/clearance intervals.

Validation:

- `node src/processes/modules/turnover/science.test.mjs` passed actual nucleotide endpoints, scissile register, pore/Rpn11 contact, triangle-tested core closure, axial peptide volume, 20-position Cas9 register, SOS template hybrid and continuously attached nascent RNA. Its existing bubble test also passed 1001 frames per condition in Cas9/SOS (5 branches); no science tests changed.
- `node docs/qa/process-review-2026-10-04/evidence/turnover/diagnostics.mjs` passed 2020 additional frames across all 20 contexts, finite arrays, stable inventories and repeated irregular seeks. Boundary geometry measurements are in `evidence/turnover/diagnostics.json`.
- `node src/processes/modules/turnover/smoke.mjs` failed at line 112 for untagged proteasome. Strengthen that branch with intact-substrate/no-product assertions; do not animate the inhibited branch just to satisfy the old test. Also enumerate both controls.

Primary sources were opened on this audit. PMC access was intermittently challenged, so verified publisher versions and the author-hosted proteasome PDF were used. Exact support and scope are recorded per model in the JSON. No browser, full-workspace suite, publication or performance claim is included.

Await root Phase B release before repair.
