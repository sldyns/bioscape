# Signals · Phase A audit · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and tests remain unchanged. Four models and every declared condition are covered; live `processesByRoot` confirms all four are **cell-only**. Specialized neuron, muscleFibre and erythrocyte roots do not add coverage here.

| Process | Verdict | New finding |
| --- | --- | --- |
| signalTransduction | confirmed_issue | P1 `20261004-signals-01`: ERK crosses unbroken nuclear-envelope rims despite the displayed pore. |
| apoptosis | qualified_pass | No new confirmed scientific/topological issue; membrane rebuilding remains a playback-performance risk. |
| differentiation | confirmed_issue | P1 `20261004-signals-02`: GATA1 body and zinc-finger features protrude outside/cross the nuclear envelope. |
| immuneResponse | confirmed_issue | P1 `20261004-signals-03`: loaded peptide/MHC groove intersects static ER membrane, then crosses it during export; loading endpoint also snaps. |

## Actual geometry evidence

- **ERK import:** triangle/triangle BVH tests show rim collisions at p = .82, .835, .85, .86 and .88; four mesh-pair intersections at .85. Existing complete TorusGeometry rims have no pore opening. Both inactive control branches remain outside.
- **GATA1:** at p = 0 its center has normalized nuclear radius 1.1053; **2,329 / 2,332** GATA1 assembly vertices are outside the nuclear ellipsoid. Actual body/NE triangle intersections persist through p = .15; small zinc-finger protrusions persist even after docking. The earlier DNA containment regression does not inspect this regulator.
- **MHC-I:** **three peptide-residue meshes** intersect ER-wall triangles at p = .46, .49, .50, .52 and .54. This is not just expected transmembrane-stalk contact. The immutable ER boundary remains while the carrier departs. At .46 the peptide origin changes from (−.84, .70, .12) to (−.90, .73, .12), a .0671-unit jump (bead radius .04).

Evidence: [diagnostic script](../evidence/signals/diagnostic.mjs), [measurements](../evidence/signals/diagnostic.json), [compact diagnostic log](../evidence/signals/diagnostic.log). Every finding's exact source location, biological rationale, fix and regression invariant is in [signals.json](signals.json).

## Coverage and primary evidence

All zh/en stages, introductions, controls, labels, entries, related-structure mappings and condition notes were read. There are no per-root overrides or legends in these four definitions. The nine option states are signal ligand/noLigand/kinaseInactive, apoptosis stress/noStress, differentiation competent/impaired, immune matched/unmatched. Create/update formulas were traced over the entire interval, including branching boundaries, visibility thresholds and final states; no loop modulus is present in these update functions.

Independently opened primary sources include [Ras–SOS 1BKD](https://www.rcsb.org/structure/1BKD), [full-length PDGFR](https://pmc.ncbi.nlm.nih.gov/articles/PMC4663128/), [ERK nuclear entry](https://pmc.ncbi.nlm.nih.gov/articles/PMC124259/), [mammalian apoptosome](https://pmc.ncbi.nlm.nih.gov/articles/PMC4691890/), [GATA1 nuclear expression](https://academic.oup.com/ajcp/article/147/4/420/3072332), [TCR–pMHC 1AO7](https://www.rcsb.org/structure/1AO7), [CD8–MHC 1AKJ](https://www.rcsb.org/structure/1AKJ) and [COPII 1M2V](https://www.rcsb.org/structure/1M2V). Exact claim support and access limitations are recorded per model. The mouse enucleation full-text endpoint was challenged; its accessible abstract supports scope/polarization, but this review does not add force-specific mechanistic claims from an unread full text.

## Focused verification and limits

`node src/processes/modules/signals/smoke.mjs` and `node src/processes/modules/signals/science.test.mjs` passed ([smoke log](../evidence/signals/smoke.log), [science log](../evidence/signals/science.log)). Existing tests cover deterministic mutable buffers, stable resource identities, condition branches, SOS/Ras contacts, closed plasma membrane topology, real nuclear containment and groove attachment. They do **not** detect the three new failures above.

A bounded eight-sample CPU diagnostic found mean update costs of **19.67 ms apoptosis** and **12.70 ms differentiation**; eight calls at identical state still cost **18.70 / 12.70 ms**. `continuousMembrane.update` unconditionally remeshes even unchanged lobes. This is an evidence-backed optimization target; concurrent-machine timing is not browser FPS acceptance. Root also owns the shared player, whose progress publication currently runs at >=30 ms intervals (`ProcessExperience.jsx:263`).

No browser or full suite was run. Normal-camera readability, continuous rendered playback, physical devices and sustained performance remain root acceptance gates. Repairs wait for explicit Phase B release.
