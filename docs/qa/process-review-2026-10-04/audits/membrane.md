# Membrane Phase A — 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and test files remain unchanged. All **4 models / 26 registered root-condition combinations** were reviewed; all four have confirmed issues. There are **6 unique issues: 3 P1 and 3 P2**. Shared helper issue 01 applies to three models and is counted once.

| Process | Actual roots | Conditions | Verdict |
| --- | --- | --- | --- |
| diffusion | cell, plant, bacterium, yeast | water/oxygen × outside/equal = 16 | confirmed_issue |
| activeTransport | cell | atp/none = 2 | confirmed_issue |
| osmoticBalance | cell, **erythrocyte** | hypotonic/isotonic/hypertonic = 6 | confirmed_issue |
| bacterialCellWall | bacterium | none/betaLactam = 2 | confirmed_issue |

## Confirmed issues

- **20261004-membrane-01 · P1 · Shared alpha helices are mirrored.** `membraneGeometry.js:109–120` generates `(cos(t), +t, sin(t))`, a left-handed helix around +y. The actual centerline's signed consecutive-displacement triple product is negative. The same measurement on the opened [AQP1 primary structure 1J4N](https://www.rcsb.org/structure/1J4N), chain A residues 5–34, is positive in 27/27 windows. Positive scaling/rotation preserves the defect across aquaporin, pump and RodA/PBP2. Reverse angular sense while retaining all detail; regress the actual geometry's handedness.
- **20261004-membrane-02 · P2 · Phosphate jumps at transfer.** `activeTransportProcess.js:298–313` switches the tracked phosphate at p=.29 from `(-.41,-1.59,.45)` to `(.12,-1.61,.39)`, a **0.533760-unit** jump, and changes its diameter from .23 to .30. Counts remain conserved; position does not. Preserve a continuous transfer and the existing occlusion sequence supported by [Nguyen et al.](https://www.nature.com/articles/s41467-022-32990-x).
- **20261004-membrane-03 · P2 · Water tracers pop in exterior fluid.** `osmoticBalanceProcess.js:347–361` resets radius 3.3 ↔ 1.1 using `%1`. All 60 first-reset samples (20 particles × 3 tonicities) jump **2.199999 units** across p±1e-7. Every exterior endpoint is unobstructed by the opaque membrane from the configured camera, with full opacity. Add continuous motion with a hidden/faded recycling interval; retain directional flux and cell geometry.
- **20261004-membrane-04 · P1 · PBP2 catalyzes while substrates are detached.** `bacterialCellWallProcess.js:388–426` creates the two normal crosslinks at p=.69/.82 with donor-center-to-PBP2-triangle-surface distances **1.048551 / 0.477390**, versus donor radius .064. Moving the glycan near the general region does not bring either donor into the actual cleft. [The primary RodA–PBP2 study](https://www.nature.com/articles/s41467-023-40483-8) places the reacting stem at the TP site. Move the flexible domain/substrate continuously into contact without breaking anchors or old bonds.
- **20261004-membrane-05 · P2 · Shared equal-gradient note changes the measured quantity.** `src/exploration/conditionNotes.js:882–895` says “Equal concentrations” / “两侧浓度相等” for the water branch, whose control and introduction explicitly specify **water activity**. This is an **integrator-owned shared-code fix**: make the bilingual note route-aware or explicitly name both relevant quantities.
- **20261004-membrane-06 · P1 · Beta-lactam covalent topology is disconnected.** `bacterialCellWallProcess.js:333–359,437` opens the ring's left edge although the explicitly drawn carbonyl is at its upper-right corner, then ends the “covalent” bond at the empty ring center, **0.169706 units from that carbonyl**. Both carbonyl-incident ring edges remain intact. [Primary acyl-PBP structures](https://pmc.ncbi.nlm.nih.gov/articles/PMC3025346/) support attachment from active-site serine to the carbonyl of the opened cyclic amide. Identify C/N, open the incident amide bond, and derive covalent endpoints from the actual molecular objects.

## Checked properties that passed

Both current local tests pass: `science.test.mjs` and `refinement.test.mjs`. They establish useful but narrower invariants, not the absence of the above defects.

- Diffusion: actual 32 molecule identities; four separate monomer pore paths; oxygen stays in lipid paths; net 8 inward under outside-high and net 0 under equal; final 16 particles per side; four balanced return pairs. The p=.85 return seam is position-continuous. Both languages and root-specific wall/envelope omissions were read.
- Pump: one ATP, three Na out, two K in; mutually exclusive access gates; correct gate/occlusion ordering in the existing dense scan; no-ATP stalls with sodium bound. The displayed phosphate is not duplicated.
- Osmosis: real triangle area conserved to 1e-6 relative in all conditions, monotonic volume response with final V/V0 **1.624757 / 1 / .637394**; inner leaflet/skeleton/attachments deform together. Mature-cell scope and both navigation roots are explicit. [Linderkamp & Meiselman's primary measurements](https://pubmed.ncbi.nlm.nih.gov/7082818/) support area preservation as osmolality changes; [Li et al.](https://pubmed.ncbi.nlm.nih.gov/37044097/) supports skeleton placement beneath the lipid membrane.
- Wall: four sugar identities conserved, NAM–PP attachments, donor-carrier release and one retained anchor; D-Ala4→mDAP3 crosslink endpoints and two terminal D-Ala releases; zero cleavage/new links under beta-lactam. Existing mesh remains intact.
- New diagnostic coverage uses actual `processesByRoot`, all 26 combinations, finite buffers, stable node/geometry inventories, and repeated irregular seeking. No browser, full-suite run or product/test mutation occurred.

## Evidence and limits

Complete findings, fixes and verification invariants: [`membrane.json`](./membrane.json). Compact numeric output: [`diagnostics.json`](../evidence/membrane/diagnostics.json), [`beta-lactam-diagnostics.json`](../evidence/membrane/beta-lactam-diagnostics.json). Reproducible geometry diagnostic: [`diagnostics.mjs`](../evidence/membrane/diagnostics.mjs). Current test logs: [`science-test.log`](../evidence/membrane/science-test.log), [`refinement-test.log`](../evidence/membrane/refinement-test.log).

Primary AQP1 coordinates and relevant RodA/PBP/acylation full texts are retained in the group's evidence directory. Some publisher/PMC HTML routes failed; the primary full texts were successfully opened through Europe PMC's XML endpoint, and the RBC primary abstract through its API. The report does not infer an exact minimum natural glycan length or quantitative kinetics from those sources.

Camera-ray visibility is numeric evidence, not browser acceptance. Root must review rendered and continuous playback after corrections. Protein folds, lipid thickness, volumes, flow and timing remain explicit schematics. Awaiting root's Phase B release.
