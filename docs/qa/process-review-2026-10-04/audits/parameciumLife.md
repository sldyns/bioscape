# parameciumLife Phase A audit

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and tests remain unchanged.

Coverage: four models, four actual paramecium root cases, five condition combinations. Verdicts: **4 confirmed_issue**, 0 qualified_pass, 0 unresolved. Issues: **3 P1 topology/route defects + 3 P2 motion discontinuities**.

Current local science tests all pass, but their covered invariants do not reject these six defects. No browser/full-suite run.

## parameciumFeeding

P. multimicronucleatum, oral uptake, one food-vacuole maturation and cytoproct egestion; one scenario.

### 20261004-parameciumLife-01 · P1 · membrane topology

Code: `src/processes/modules/parameciumLife/parameciumFeedingProcess.js` — egestion geometry at lines 204-214, 338-397; scientificGeometry.js lines 60-99.

The egestion neck is a capped k.segment between fixed points; fusionVacuole opens only during acidosome/lysosome phases and restores a closed positive pole during p >= 0.88. Actual triangle rays from vacuole center toward the cytoproct intersect membrane at p=0.89/0.92/0.95 (0.368095/0.252957/0.099441 units). The vacuole shrinks independently while new residue markers travel outside.

The stage explicitly claims a fused open vacuole-to-surface route, but the model never opens or joins that egestion membrane boundary. This is a topology defect separate from the intentional front viewing cut.

Fix: Create an actual paired-membrane egestion opening whose boundary remains joined to the cytoproct as the vacuole empties. Move tracked lumen cargo through that opening and recover membrane on the cytosolic side.

Verify: Assert shared world-space boundary curves and an unobstructed ray through the actual exit aperture during expulsion, closed membrane before fusion, tracked cargo staying in lumen until transit, and no detachment as vacuole shrinks.

Sources: [Allen EM Fig. 2: open cytoproct](https://www6.pbrc.hawaii.edu/allen/ch07/02-pmcyp820525-17.html)

Checked: Full formula review including arrival handoffs, p=0.28/0.34/0.47/0.51/0.62 fusion changes, digestive phases and p=0.88-1 egestion; targeted membrane triangle tests at 0.89/0.92/0.95.

Limits: No browser or rendered playback was performed by this reviewer; root owns visual acceptance. Schematic sizes, times, chromatin counts and protein silhouettes are not quantitative molecular/kinetic models. Finite sampling complements full update-formula review; it is not a proof over every real-valued progress.

## contractileVacuole

One magnified P. multimicronucleatum CVC; osmotic=freshwater and mild, all 2 combinations.

### 20261004-parameciumLife-02 · P1 · membrane route alignment

Code: `src/processes/modules/parameciumLife/contractileVacuoleProcess.js` — radial arm construction line 147; inlet updates lines 334-336; scientificGeometry.js port orientation.

Collecting canals/ampullae/water paths use angle i*pi/3+0.22, while bladder ports/inlets use i*pi/3. At radius 0.94, distal inlet and radial-arm centerlines differ by 0.206383 units; inlet outer half-width is only 0.075. Existing tests only compare inlet with bladder port and miss the distal mismatch.

The supposed continuous collecting-canal/ampulla/inlet route is misaligned, and fluid follows the offset arm path instead of the drawn inlet. Primary microscopy requires open connected lumens during filling.

Fix: Use one shared radial-arm frame for collecting canals, ampullae, inlet boundaries, bladder ports and fluid paths; connect lumen boundaries through the ampulla.

Verify: Check distal inlet/ampulla alignment and continuous lumen paths across all six arms and both conditions throughout connected intervals; retain existing bladder-port and isolation checks.

Sources: [Allen EM Fig. 12: collecting canal attachment to CV](https://www6.pbrc.hawaii.edu/allen/ch09/12-pmcvc800321-13.html), [Tominaga, Naitoh and Allen (1999), CVC structure and cycle, original Fig. 8](https://www6.pbrc.hawaii.edu/allen/ch09/29-pmcvc.html)

### 20261004-parameciumLife-03 · P2 · continuous motion

Code: `src/processes/modules/parameciumLife/contractileVacuoleProcess.js` — water loops lines 342-364.

The %1 reset of a full-sized radial-water marker jumps it from the bladder to the distal canal while visible on both sides. At p=0.306184936 freshwater and p=0.414078675 mild, +/-1e-7 samples move the 0.08-diameter marker 2.09160 units. Entry-water and jet loops also reuse fully visible particles at modulo resets.

The repeated loop is legitimate, but these fully visible end-to-start jumps are discontinuities, not continuous fluid motion.

Fix: Fade or shrink each flow marker at the path ends before deterministic reuse, with the reset occurring only while visually absent; preserve the condition-dependent flow and cycle.

Verify: Check particle visibility-weighted positions or sizes at every modulo reset in both conditions; any large reset must have negligible visible size/opacity.

Sources: [Tani/Allen in-vivo P. multimicronucleatum CVC filling and expulsion](https://www6.pbrc.hawaii.edu/allen/ch09/video/vid-1/)

Checked: 61 samples per each condition plus exact radial-water modulo boundaries, all cycle branches and terminal states. Both fresh/mild conditions have full-visible 2.0916-unit marker jumps.

Limits: No browser or rendered playback was performed by this reviewer; root owns visual acceptance. Schematic sizes, times, chromatin counts and protein silhouettes are not quantitative molecular/kinetic models. Finite sampling complements full update-formula review; it is not a proof over every real-valued progress. The listed osmotic-stress PubMed page and Tani DOI could not be reliably opened as full text in this run; no precise osmotic rate or timing was validated. The qualitative condition branch is plausible and explicitly illustrative.

## parameciumDivision

P. caudatum with one diploid micronucleus and one polyploid macronucleus; one transverse fission scenario.

### 20261004-parameciumLife-04 · P2 · continuous motion

Code: `src/processes/modules/parameciumLife/parameciumDivisionProcess.js` — mother/daughter body visibility switch at lines 207-213.

At p=0.91 the pinched mother is replaced instantaneously by two fixed daughter shapes. With +/-1e-7 samples, each polar y extent moves from +/-3.385500 to +/-3.167934 (0.217566 units) and sampled boundary Hausdorff distance is 0.400519. The latter is a vertex-sample diagnostic, not triangle-surface distance.

The shape mismatch creates a visible body contraction/pop at the terminal fission handoff even though the daughter counts and transverse orientation are correct.

Fix: Deform the connected envelope continuously into the daughter silhouettes and ensure the final connected-state halves coincide with the initial daughter surfaces before visibility changes. Preserve cortical rows and cilia.

Verify: Check matched body boundary positions and extrema immediately before/after the switch; test intermediate arbitrary seeks and stable resources. Rendered playback remains root acceptance.

Sources: [Allen EM Fig. 48: P. caudatum micronucleus in division](https://www6.pbrc.hawaii.edu/allen/ch10a/48-pca740125-46.html)

Checked: Full update formula review including p=0.54/0.59/0.76 nuclear replacements and p=0.91 body replacement; exact body extrema measured on both sides of 0.91. Nuclear replacement contours should be checked during Phase B smoothing.

Limits: No browser or rendered playback was performed by this reviewer; root owns visual acceptance. Schematic sizes, times, chromatin counts and protein silhouettes are not quantitative molecular/kinetic models. Finite sampling complements full update-formula review; it is not a proof over every real-valued progress.

## parameciumConjugation

Compatible P. caudatum pair, meiosis, reciprocal pronuclear exchange, synkaryon divisions and nutrient-supported nuclear selection; two later cell fissions explicitly omitted.

### 20261004-parameciumLife-05 · P1 · conjugation passage topology

Code: `src/processes/modules/parameciumLife/parameciumConjugationProcess.js` — passage construction lines 212-224; migrant positions lines 312-324.

The passage has axis y=0,z=0.35 and radius 0.19. At p=0.61 both migrant centers are at y=+/-0.12,z=0.57: axis distance 0.250599, already outside the passage before their 0.18 radius is counted. The passage primitive also has closed end caps.

The reciprocal exchange is shown outside the very cytoplasmic passage that is supposed to carry it, falsely separating the depicted nuclear route from the cell-cell communication.

Fix: Build a connected open passage in the exchange plane, align each nuclear trajectory with its lumen, and accommodate nucleus dimensions without crossing membrane walls; retain separate partners and parental colors.

Verify: Measure world-space nuclear vertices/centers against actual passage lumen and openings across the exchange interval; verify endpoints remain joined to each partner as cells approach and separate.

Sources: [Vivier and Andre (1961), Structural and ultrastructural observations on P. caudatum conjugation](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1550-7408.1961.tb01237.x)

### 20261004-parameciumLife-06 · P2 · continuous motion and lineage

Code: `src/processes/modules/parameciumLife/parameciumConjugationProcess.js` — postzygotic descendant count/positions lines 276-293.

The 1->2->4->8 sequence is implemented by hard visibility/count thresholds at p=0.82,0.85,0.89. At p=0.89 four radius-0.15 nuclei appear abruptly in the anterior half (y=0.608544 and 0.951286); their four precursors remain in the posterior half. At p=0.82 the radius-0.26 synkaryon disappears and two radius-0.15 descendants appear coincident at another z.

Final counts match the species, but the animation does not show the continuity of daughter nuclei from their dividing parents and visibly adds distant nuclei instantaneously.

Fix: Represent each postzygotic division with preallocated nuclei that begin at parent positions and separate/grow through a deterministic continuous transition; carry both parental origins through all descendants.

Verify: Boundary samples must show no full-sized distant newborn nuclei; verify each division originates from its parent, produces 2/4/8 nuclei, and keeps the terminal four posterior anlagen plus one anterior micronucleus.

Sources: [Yang and Takahashi (2000), Nutrient supply induces germinal nuclear selection in exconjugants of P. caudatum](https://www.jstage.jst.go.jp/article/pjab1977/76/7/76_7_87/_article/-char/en)

Checked: Full update-formula review for all p branches, 61 regular samples, targeted p=0.61 exchange cross-section, and +/-1e-7 around postzygotic divisions 0.82/0.85/0.89.

Limits: No browser or rendered playback was performed by this reviewer; root owns visual acceptance. Schematic sizes, times, chromatin counts and protein silhouettes are not quantitative molecular/kinetic models. Finite sampling complements full update-formula review; it is not a proof over every real-valued progress.

## Evidence and remaining gates

- `evidence/parameciumLife/science-baseline.log`: all four existing focused regressions pass.
- `evidence/parameciumLife/diagnostic.mjs` and `.json`: 305 regular progress cases plus irregular seeks, exact boundary and world-space route measurements.
- Node/material/geometry identities and finite transforms/buffers remain stable under the diagnostic.
- Actual registered roots were computed from `processesByRoot`; all four occur only in `paramecium`.
- Opened primary sources and their exact supporting observations are listed per model in the JSON.
- Await Phase B release. Root owns rendered continuous playback, integration and final scientific acceptance.
