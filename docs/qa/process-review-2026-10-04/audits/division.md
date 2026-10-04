# Division · independent Phase A · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Both registered roots are `cell` (enumerated from `processesByRoot`). Product/test files remain unchanged.

| Model | Verdict | Findings |
| --- | --- | --- |
| mitosis | qualified_pass | No confirmed new scientific defect in audited scope; rendered continuity remains open. |
| meiosis | confirmed_issue | P1 detached contraction belts; P2 synchronous membrane update cost. |

## Confirmed issues

- **20261004-division-01 · P1 · meiosis** — `meiosisProcess.js:111–119` independently shrinks the three actomyosin rings using the former membrane proportions, but `germCellMembrane.js:105–124` now builds a joined-lobe level set. At progress **0.495**, first-ring centreline points lie **0.387–0.518** world units inside the actual inner membrane; at **0.865**, both second-ring samples lie **0.343–0.444** units inside. These are nearest **triangle-surface** distances at rear, retained cutaway positions, vastly exceeding belt thickness. Normal furrowing therefore shows a detached intracellular contraction ring. Repair must derive the ring from the real cleavage contour, keep a small cortical inset, and preserve open bridge lumens. [Primary live-imaging evidence](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3001599) links ring/membrane detachment to defective cytokinesis; the experiment is in Drosophila, so its specific lipid mechanism is not transferred to the mouse specimen.
- **20261004-division-02 · P2 · meiosis** — Changing-membrane updates at 12 bounded poses around **0.48** cost **32.68 ms median / 53.84 ms max**, versus **0.30 / 0.39 ms** for stable membrane around **0.64**, before rendering. The path recalculates 70,395 field samples and two full marching-tetrahedron passes synchronously. Optimize exact repeated work while retaining grid resolution, geometry detail, bridge topology and arbitrary-seek determinism. This is a measured CPU-budget failure on the audit host; browser frame rate and effects of concurrent audit load remain separate gates.

## Verified scope and limits

Mitosis retains eight chromatid objects, four per final daughter. The unattached option leaves exactly seven actual microtubule/kinetochore contacts and arrests the geometry at 0.43 without sister separation or completed cytokinesis. Normal/default each retain eight contacts. Opposed interpolar half-bundles remain separate populations. [Rieder et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC2199954/) supports the checkpoint invariant. Mastronarde et al.'s primary abstract was retrieved through Europe PMC after publisher access failed, and preserved locally.

Meiosis retains two telocentric homologous pairs, common nonsister crossover junctions, I co-orientation and II sister biorientation, correct product allocation and no replication between divisions. The bridge scope is supported by Greenbaum et al.'s mouse TEX14 study; its primary abstract was retrieved through Europe PMC. [Ogushi et al.](https://pubmed.ncbi.nlm.nih.gov/34758289/) supports conserved orientation/cohesion mechanics using mouse oocytes, not male-specific cytokinesis. The [JAX karyotype resource](https://www.informatics.jax.org/silver/chapters/5-2.shtml) supports the telocentric/subset scope. Both languages, stage text, labels, legends and all condition choices were read.

Focused diagnostics passed **78 mitosis + 26 meiosis** irregular repeat seeks, finite geometry/normal/instance buffers, stable nodes/resources, inventory coverage and **22** actual endpoint-contact pose/condition cases. Invalid and out-of-range progress also remains finite. Full historical regression tests were read and preserved, not weakened or rerun at their expensive dense sampling.

No browser was operated. Localized visibility switches are recorded for rendered review, not automatically classified as defects. Scientific shapes/timing remain schematic; atomic structure, full karyotypes and sperm maturation are outside scope. A numeric pass does not constitute rendered or complete scientific acceptance.

## Evidence

- `evidence/division/diagnostics.mjs` — reproducible bounded diagnostic.
- `evidence/division/diagnostics.json` — contacts, repeated-seek counts, ring distances and short raw timing samples.
- `evidence/division/diagnostics.log` — compact successful result.
- `evidence/division/primary-source-abstracts.json` — primary abstracts from Europe PMC after blocked publisher opens.
- `audits/division.json` — per-model source support, exact locations, fixes and verification criteria.

Awaiting root Phase B release before any repair.
