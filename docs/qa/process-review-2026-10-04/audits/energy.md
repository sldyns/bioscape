# Energy Phase A audit · 2026-10-04

Baseline `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Four models, fifteen registered root/condition contexts. Three models have confirmed issues; glycolysis is a qualified pass. No product or test files changed. Awaiting integrator Phase B release.

| Model | Roots and controls | Verdict | Findings |
| --- | --- | --- | --- |
| respiration | cell / plant / yeast / paramecium × coupled / leak | confirmed_issue | P1 01; P2 02 |
| glycolysis | cell / plant / yeast; no control | qualified_pass | none |
| bacterialEnergetics | bacterium × NDH-I–bo3 / NDH-II–bd-I | confirmed_issue | P1 03; P2 04 |
| bacterialPhotosynthesis | bacterium × light / dark | confirmed_issue | P1 05; P2 06 |

## Confirmed issues

### 20261004-energy-01 · P1 · respiration · misleading membrane transport topology

`src/processes/modules/energy/respirationProcess.js` lines 79-83, 145-149, 253-256.

Pumped H+ centers follow (pumpX+0.32,y,z=0.6). CI/III/IV holes have z radii 0.54/0.52/0.48. Ellipse metrics at crossing are 1.485/1.559/1.901 (>1 means intact bilayer). Exact distances from actual particle centers to transformed lipid-head triangles are 0.01145/0.00200/0.04829, below H+ radius 0.085. The model therefore visibly routes energy-conserving proton pumping through lipid heads beside the protein; yeast retains the III/IV defect. See docs/qa/process-review-2026-10-04/evidence/energy/diagnostics.json.

Protein-mediated translocation must cross the protein membrane footprint; the pictured intact lipid layer should not serve as the normal pump route. Correct matrix-to-IMS direction alone does not establish correct topology.

Repair: Route the H+ trajectory and corresponding directional annotation through each modeled membrane protein footprint, keeping both aqueous endpoints, yeast Ndi1 nonpumping, and the separate intentional leak route.

Verification: At both leaflet crossings, assert that actual H+ centers/radii are inside the matching protein opening with clearance and do not intersect lipid-head triangles; retain all root/condition direction tests.

Sources: [Structure and function of the S. pombe III–IV–cyt c supercomplex](https://pmc.ncbi.nlm.nih.gov/articles/PMC10655221/), [The structure of the yeast NADH dehydrogenase (Ndi1) reveals overlapping binding sites for water- and lipid-soluble substrates](https://pmc.ncbi.nlm.nih.gov/articles/PMC3458368/).

### 20261004-energy-02 · P2 · respiration · continuous playback carrier discontinuity

`src/processes/modules/energy/respirationProcess.js` lines 236-239.

At p=1/3 +/- 1e-7 the single fully visible Q jumps 1.14999931 scene units (diameter 0.32), and cyt c jumps 1.02999938 (diameter 0.38). Both have opacity 1 and no hidden reset. Source uses (p*3)%1. This is not permutation of indistinguishable particle cohorts.

Following an individual soluble or membrane carrier during continuous playback is interrupted by a large endpoint-to-origin teleport. Biological carriers shuttle by movement/diffusion.

Repair: Use smooth periodic shuttle paths that retain Q in the membrane and cyt c in the IMS, or an explicitly occluded/faded recycle interval; preserve arbitrary-seek determinism. Inspect the analogous supply marker reset at the same boundary.

Verification: Numerically compare actual visible carrier world positions immediately around each former wrap boundary; the displacement must converge to zero as epsilon shrinks, and source/target compartment must remain invariant.

Sources: [Structure and function of the S. pombe III–IV–cyt c supercomplex](https://pmc.ncbi.nlm.nih.gov/articles/PMC10655221/).

### 20261004-energy-03 · P1 · bacterialEnergetics · misleading membrane transport topology

`src/processes/modules/energy/bacterialEnergeticsProcess.js` lines 24-27, 216-230.

NDH-I and bo3 pumped H+ cross at z=0.52 outside holes with z radius 0.5; ellipse metrics are 1.196 and 1.406. Their actual lipid-triangle distances are 0.01196 and 0.04499 versus H+ radius 0.087. Chemical proton uptake at x=0.5,z=0.57 also lies outside the oxidase hole (metric 1.353) and intersects a lower-leaflet head by the same exact triangle test (distance 0.01887). This affects NDH-I/bo3 pumping and chemical uptake in both branches.

Both active pumping and cytoplasmic substrate-proton uptake require the corresponding protein pathway. The alternative bd-I branch correctly avoids labeling itself a pump, but its depicted chemical protons pass through intact lipid beside bd-I.

Repair: Move pump paths/arrows into matching NDH-I/bo3 protein openings and route chemical protons from the cytoplasm into the oxidase footprint/reduction site. Keep NDH-II peripheral and bd-I nonpumping.

Verification: Measure both bilayer crossings from actual transformed geometry for pumped particles and membrane entry for chemical particles in both branch settings; reject lipid overlap while preserving correct sides and branch visibility.

Sources: [Maintenance and thermal stabilization of NADH dehydrogenase-2 conformation upon elimination of its C-terminal region](https://pubmed.ncbi.nlm.nih.gov/23089137/), [Homologous bd oxidases share the same architecture but differ in mechanism](https://www.nature.com/articles/s41467-019-13122-4).

### 20261004-energy-04 · P2 · bacterialEnergetics · continuous playback carrier discontinuity

`src/processes/modules/energy/bacterialEnergeticsProcess.js` lines 208-209.

The single Q/QH2 mesh remains fully visible at p=0.5 +/- 1e-7 and jumps 1.85945777 scene units including membrane curvature, over five carrier diameters; no fade/occlusion is implemented.

A unique visible membrane carrier teleports across its track instead of returning continuously, interrupting playback tracking.

Repair: Replace the sawtooth with a smooth reversible membrane-bound shuttle or hidden recycle; retain the curved membrane y coordinate and both respiratory branches.

Verification: Former wrap-boundary position difference must converge to zero; Q remains within the curved membrane in both conditions and under arbitrary seeking.

Sources: [Homologous bd oxidases share the same architecture but differ in mechanism](https://www.nature.com/articles/s41467-019-13122-4).

### 20261004-energy-05 · P1 · bacterialPhotosynthesis · misleading membrane transport topology

`src/processes/modules/energy/bacterialPhotosynthesisProcess.js` lines 29-33, 253-256.

b6f-associated protons cross the top membrane at x=-0.82,z=0.55; the b6f cutout has z radius 0.5. Its ellipse metric is 1.210. At actual progress 0.408008658, the H+ particle intersects an upper-leaflet head: exact distance to transformed triangles 0.02708 < radius 0.08. The b6f protein is behind this lipid crossing.

Q-cycle-associated proton transfer should be spatially connected to b6f/quinone handling, not depict passage across the intact neighboring lipid bilayer.

Repair: Place the cross-membrane b6f proton-transfer path through the existing b6f opening and connect endpoints to the cytoplasm/lumen while retaining dark-condition suppression and PSII lumenal proton release.

Verification: Actual H+ trajectory must pass through the b6f opening with particle clearance and avoid both lipid leaflets; direction stays cytoplasm-to-lumen. Dark mode remains without this flux.

Sources: [Synechocystis PCC 6803 cytochrome b6f with native plastoquinone and lipids](https://www.rcsb.org/structure/7ZXY).

### 20261004-energy-06 · P2 · bacterialPhotosynthesis · continuous playback carrier discontinuity

`src/processes/modules/energy/bacterialPhotosynthesisProcess.js` lines 250-251.

The unique PQ and PC/c6 carrier meshes are visible on both sides of p=0.5 and jump 1.34999946 scene units, respectively 4.22 and 4.50 carrier diameters. This also occurs in dark mode because carrier positions and visibility are not light-gated. Passive carrier mobility in darkness itself is not an error.

Visible carrier teleportation breaks continuity; distinct membrane and lumen compartments should remain legible throughout continuous shuttling.

Repair: Use continuous periodic shuttles retaining PQ in the membrane and PC/c6 in the lumen; preserve the distinction between carrier mobility and light-driven electron/proton flux.

Verification: For light and dark branches, former wrap-boundary world-position discontinuities converge to zero and carriers never change compartment; downstream flux remains off in dark mode.

Sources: [Synechocystis PCC 6803 cytochrome b6f with native plastoquinone and lipids](https://www.rcsb.org/structure/7ZXY).

## Qualified pass and retained boundaries

Glycolysis preserves six carbons, two three-carbon products, two investment phosphates and two later inorganic phosphates. The first transferred phosphates arise during GAP oxidation; the inherited C3 phosphates relocate to C2 before PEP donation. Actual bond endpoints and four output phosphate positions passed the existing geometry regression. Both languages state cytosolic scope, the omitted plastid route, net ATP/NADH accounting and the need to regenerate NAD+. The small 0.02-depth handoff and intentional covalent-bond removal are not classified as defects. Protein folds, nucleotide shapes, timing and omitted mutase intermediates remain schematic.

## Evidence and limits

`node src/processes/modules/energy/science.test.mjs` passed the owned scientific checks and owned smoke/browser-target compilation. `node docs/qa/process-review-2026-10-04/evidence/energy/diagnose.mjs` checked 121 samples plus irregular/boundary seeks in all 15 current catalog contexts, with finite transforms and stable resources. The new membrane measurements use nearest **triangle surface** distance after instance/world transforms, not a vertex proxy. Unique carrier jumps are 1.03–1.86 scene units and remain opaque/visible on both sides.

Detailed measurements and reproducible script: [diagnostics.json](../evidence/energy/diagnostics.json), [diagnose.mjs](../evidence/energy/diagnose.mjs), [science-test.log](../evidence/energy/science-test.log).

No browser was operated. Numerical and source checks do not replace root continuous-playback/rendered acceptance. Repeated flux markers, discrete reservoir counts and reaction visibility switches were not treated as defects without specific evidence. Reference sources were opened; failed PMC/DOI endpoints were replaced with opened publisher/deposition/author copies where available. The blocked 2025 plant paper remains an explicit source-access limit; no plant c count is assigned.
