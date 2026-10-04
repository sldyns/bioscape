# Genome fresh Phase A audit — 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and test files unchanged.

| Process | Registered roots | Conditions | Verdict |
|---|---|---|---|
| replication | cell, plant, yeast | active/absent ligase | qualified_pass |
| dnaRepair | cell, plant, yeast | active/blocked incision | qualified_pass |
| transduction | phage, bacterium | P1/lambda | confirmed_issue |
| bacterialSporulation | bacterium | normal/blocked engulfment | confirmed_issue |

## Confirmed findings

### 20261004-genome-01 — P1: misleading membrane-transfer topology

`src/processes/modules/genome/transductionProcess.js`, tail shaft construction 170-177; update 267-292; envelopeDetail.js rodCutaway 4-77.

During injection at p=0.8, both branches have tube-tip world position [2.65,1.04,0], while actual recipient triangle ray intersections are y=0.9 and y=0.8325. The tube stops 0.14 above the outer surface. DNA crosses the intact cutaway envelope at the same axis; no receptor/trans-envelope aperture or connecting conduit is drawn. See evidence/genome/diagnostics.json (p=0.8).

The displayed transfer is through the bare envelope after leaving a disconnected tail. P1 must engage and penetrate the outer envelope; lambda requires an attached receptor-triggered entry apparatus. Exact inner-membrane molecular composition need not be invented to preserve a continuous schematic route.

Correction: Join each route’s tail/entry apparatus to an explicit recipient entry opening before injection. Provide a bounded schematic trans-envelope conduit consistent with P1 vs lambda morphology; open only that envelope region and preserve the cutaway, DNA continuity and cargo identity. Do not assert that the ordinary LamB maltose pore itself passes DNA.

Verification: At sampled injection states for both roots and routes, actual transformed cargo endpoints traverse a connected tail-to-envelope route, recipient membrane triangles do not intersect the cargo path outside the intended entry opening, and DNA reaches cytoplasm while capsid stays outside. Repeated arbitrary seeks retain resources.

Sources: [primary source](https://pubmed.ncbi.nlm.nih.gov/21745674/), [primary source](https://www.nature.com/articles/s41467-024-48686-3.pdf).

### 20261004-genome-02 — P2: visible extraction discontinuity

`src/processes/modules/genome/transductionProcess.js`, update 238,253-266,299-311; envelopeDetail.js nucleoidDuplex present().

At p=0.23 the donor locus disappears by a binary present() test and a separate straight cargo contour appears at another pose. The computed extract=ease(p,0.16,0.33) is unused. Across 0.23 +/- 1e-7, every donor gold rail-center sample has a positive distance to the nearest gold cargo segment center: P1 min/mean/max 0.194/0.439/0.610, lambda 0.484/0.591/0.694 world units (evidence/genome/continuity.json).

The highlighted material the user is tracking switches directly from a donor chromosomal arc to a spatially separated straight line; this is an object handoff jump, not nucleotide-scale growth or a biologically intentional pause. The model explicitly teaches movement from donor locus into transferred cargo.

Correction: Use one continuous, identity-preserving extraction-to-packaging path. Start transferred cargo on the donor locus, detach/morph continuously over the extraction interval, and hand off between contour representations only at matching positions without duplicated donor DNA.

Verification: Dense samples around extraction start/end and the former 0.23 threshold must have no finite displacement as delta-progress tends to zero; ensure the donor locus and cargo are neither both present as duplicated substrate nor simultaneously absent. Check P1 and lambda color identity and world-space contour continuity.

Sources: [primary source](https://journals.asm.org/doi/full/10.1128/jb.186.21.7032-7068.2004).

### 20261004-genome-03 — P1: incorrect nested spore layer topology

`src/processes/modules/genome/bacterialSporulationProcess.js`, 146-168 and update 240-250; sporulationTopology.js 171-182.

Mature inner/outer membrane rear radii are 0.72/0.87, but cortex/coat rear surfaces are at 0.70/0.85. Actual triangle ray intersections at p=1 from spore center along -z are inner 0.72000003, cortex 0.70000000, outer 0.87000000, coat 0.85000000. 47/1025 cortex vertices lie inside the inner ellipsoid and 41/1025 coat vertices lie inside the outer ellipsoid. At p=0.58 the cortex rear is already only 0.594 while inner membrane remains 0.72. See evidence/genome/diagnostics.json and continuity.json.

The labeled cortex must lie between the forespore membranes and the coat outside the outer membrane. Different y/z aspect ratios cause actual surface crossing on the retained rear half of the cutaway, reversing radial order; this is not a camera-only occlusion or nearest-vertex proxy.

Correction: Derive all visible membrane, cortex, coat shells and edge details from compatible nested profiles throughout maturation. Keep the cortex outside the inner membrane and inside the outer membrane at every visible point; keep coat outside the outer membrane. Preserve continuous engulfment attachment and existing layer detail.

Verification: Actual transformed triangle or analytic surface containment/ray-order checks for multiple rear directions across p=0.57..1, plus arbitrary seeks and the blocked branch. Require inner < cortex < outer < coat with positive clearance whenever each is visible; old chromosome/translocase/engulfment invariants must remain passing.

Sources: [primary source](https://www.nature.com/articles/s41467-024-45770-6.pdf).

## Scope and evidence

All four full implementations and their shared local geometry helpers were read, including both languages, all controls, labels and registered roots. Fresh smoke and scientific regressions pass, but they did not cover the newly identified entry-route gap or nested-depth errors.

- `evidence/genome/smoke.json`: all 8 process/control pairs passed.
- `evidence/genome/science.log`: 120 targeted scientific cases; deterministic seeking/resource checks; 2,412 replication/repair strand states and 9,062,661 nearby segment pairs.
- `evidence/genome/diagnostics.mjs` and `diagnostics.json`: all 18 registered root/control combinations, 1,116 finite/resource states; actual injection endpoints and spore layer measurements.
- `evidence/genome/continuity.mjs` and `continuity.json`: donor handoff boundary and rearward triangle-ray intersections. Complete coordinate arrays stay in the artifact.

Replication and repair are qualified passes for the examined mechanistic invariants; atomic conformations, literal nucleotide stoichiometry, exact kinetics and rendered playback are not certified. Replication floor-based polymerase handoffs already fade to zero before repositioning. Repair uses an explicitly separated teaching sequence while primary experiments show incision and synthesis can overlap.

Primary sources actually opened include [CMG structural deposition](https://www.rcsb.org/structure/5U8T), [NER incision/synthesis experiments](https://pmc.ncbi.nlm.nih.gov/articles/PMC2683701/), [in-vivo excised oligonucleotide experiments](https://pubmed.ncbi.nlm.nih.gov/23749995/), [P1 genome study](https://journals.asm.org/doi/full/10.1128/jb.186.21.7032-7068.2004), [P1 infection tomography](https://pubmed.ncbi.nlm.nih.gov/21745674/), [lambda receptor cryo-EM paper](https://www.nature.com/articles/s41467-024-48686-3.pdf), [FisB fission experiments](https://rudnerlab.med.harvard.edu/assets/publications/Doan_2013_GD.pdf), and [B. subtilis sporangium cryo-ET](https://www.nature.com/articles/s41467-024-45770-6.pdf). Several original PMC/publisher URLs were challenged or inaccessible; accessible primary copies were used.

No browser was operated. Root must separately perform rendered and continuous-playback acceptance. Phase B remains pending explicit release.
