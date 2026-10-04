# plantSignals Phase A review · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Read-only product/test audit. Both registered models occur only under `plant`. Both verdicts are **confirmed_issue**, high confidence. Five unique findings: three P1, two P2. Repairs await root Phase B release.

## Confirmed findings

| ID | Process | Priority | Finding |
|---|---|---|---|
| 20261004-plantSignals-01 | auxin, plantDefense; also root photosynthesis | P1 | `structures.js:23–30` produces left-handed protein helices. Generated path triple product is negative; deposited 2P1Q class-1 alpha-helix CA torsions are positive. Fix the owned shared helper while preserving endpoints/extents. Root cross-references this same issue. |
| 20261004-plantSignals-02 | auxin | P1 | Initial Aux/IAA body and ARF PB1 have identical center `[-1.44,-1.29,0.02]`; 1700/1700 sampled PB1 lobe vertices are inside Aux/IAA. Place separate touching surfaces while preserving the experimental bound pose. |
| 20261004-plantSignals-03 | auxin | P2 | At `p≈0.635883`, the substrate thread appears at length 1.1674; at `p≈0.694117`, it vanishes at length 0.9515. Reveal/consume an anchored strand continuously. |
| 20261004-plantSignals-04 | plantDefense | P1 | Final FLS2/BAK1 ectodomain main solids overlap through 0.35 units, all of BAK1 local depth on a measured ray. The overlap starts during approach; kinase-only regressions miss it. Retain real peptide/interface contact and membrane topology while separating solids. |
| 20261004-plantSignals-05 | plantDefense | P2 | Active electron markers jump 1.24 units across the membrane at modulus resets while fully visible. Make resets happen at zero visible size/opacity. |

## Evidence and checks

- [Structured report](plantSignals.json) contains exact lines, evidence, source support, correction proposals and meaningful verification invariants.
- [Numeric diagnostics](../evidence/plantSignals/diagnostics.json), [reproducible diagnostic script](../evidence/plantSignals/diagnostics.mjs) and [log](../evidence/plantSignals/diagnostics.log).
- [Existing local scientific regression log](../evidence/plantSignals/science-baseline.log): all pass, including deposited-coordinate contacts, conserved ubiquitin, cytosolic interfaces, membrane containment/refill, finite buffers, stable resources, deterministic seeks and esbuild.
- Four full condition branches were additionally sampled at 101 progress values each and 11 irregular seek targets each. Finite transforms/instances, fixed node/resource inventory and repeatable transforms/labels passed.
- Fresh deposited `2P1Q.pdb` and `4MN8.pdb` are retained in the evidence directory. All 288 selected TIR1/IAA/degron heavy atoms exactly match the former source; the original common experimental transform and contacts are valid.
- Reviewed both languages in directory metadata, all intros/stages/controls/labels; no root override or legend is defined. No unsupported numerical kinetic claim or fixed molecular marker stoichiometry is asserted.

## Opened primary evidence

- [2P1Q / Tan et al.](https://www.rcsb.org/structure/2P1Q): species, chain/ligand identity, shared molecular-glue pocket and experimental alpha-helix coordinates.
- [Korasick et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3986151/): ARF/Aux-IAA complementary PB1 surface interactions and derepression mechanism.
- [Spartz et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC4079373/): downstream SAUR/PP2C-D/proton-pump contribution to cell expansion.
- [de la Peña et al.](https://www.lander-lab.com/pdfs/30309908.pdf): substrate engagement, unfolding, translocation and ubiquitin removal by proteasomes.
- [4MN8 / Sun et al.](https://www.rcsb.org/structure/4MN8): distinct FLS2/BAK1/flg22 interacting ectodomains.
- [Li et al.](https://pubmed.ncbi.nlm.nih.gov/24629339/): direct BIK1 phosphorylation of RbohD and induced ROS branch.

Normal-camera rendered playback and bilingual label review remain root gates. Existing unit tests do not establish absence of these defects, visual smoothness, full scientific acceptance or deployment readiness. No product or test file was changed during Phase A.
