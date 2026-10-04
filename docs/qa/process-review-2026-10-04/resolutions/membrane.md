# Membrane Phase B resolution — 2026-10-04

All **10 owned issues are repaired**; shared condition-note issue **05 was fixed by root**. The first six rows and Phase B receipts below cover the original audit; the appended follow-up covers rendered discoveries 07–11. Existing scientific tests remain unchanged. Rendered and continuous-playback acceptance remains with root.

| Issue | Repair | Focused evidence |
| --- | --- | --- |
| 01 · P1 | Right-handed shared alpha helices; detail and geometry reuse preserved in diffusion, pump and wall | Actual transformed centerlines pass signed-chirality tests in all three consumers |
| 02 · P2 | Intact ATP approaches the site, then phosphate transfers at identical position/scale after occlusion | p=.29±1e-7 displacement **1.98×10⁻¹²**, versus original **.533760** |
| 03 · P2 | Existing water tracers fade at distant reservoir ends before recycling | Every periodic seam in both roots/all three tonicities: **264 cases**, opacity at ±1e-6 at most **1.45×10⁻⁹**; transport remains fully visible |
| 04 · P1 | PBP2 cleft visits both reacting stems, with its curved stalk attached to the fixed membrane anchor | Donor/real-enzyme surface distance **.056**; acceptor **.00468/.00463**, all within substrate radius **.064** |
| 05 · P2 | Root split water-activity and oxygen-concentration condition notes in both languages | Root's shared condition-note receipt passes **84 definitions / 155 options** |
| 06 · P1 | Open the carbonyl C–N edge and connect active-site serine to that carbonyl; retain C=O | Actual covalent endpoint error **5.55×10⁻¹⁷**; no bond into the ring center |

Changed owned files: `membraneGeometry.js`, `diffusionProcess.js`, `activeTransportProcess.js`, `osmoticBalanceProcess.js`, `bacterialCellWallProcess.js`; added `process-review.test.mjs`. The PBP2 binding-lip detail and explicit drug C/N/O features add detail rather than remove it. Water material instances are allocated once at construction and remain attached to their existing tracer meshes.

Validation:

- `node src/processes/modules/membrane/process-review.test.mjs`: **5/5 pass**. New checks inspect actual geometry and visibility, not declared scientific metadata.
- The same regression against archived baseline `be81aa5…` modules: **0/5 pass, 5/5 expected failures** for the five original defects. Baseline source copies are evidence artifacts; working-tree files were never replaced.
- `science.test.mjs`: **pass unchanged**, preserving 16 diffusion root/control combinations, exclusive pump gates and transport counts, exact area preservation and volume response, and 402 wall conservation/attachment states.
- `refinement.test.mjs`: **pass unchanged** for all four models, finite buffers/bounds, deterministic seeks, stable resources and browser-target esbuild bundles.
- Prettier check on changed owned files: **pass**.

[Structured issue accounting](./membrane.json), [new regression log](../evidence/membrane/phase-b-process-review.log), [baseline rejection log](../evidence/membrane/phase-b-baseline-challenge.log), [old scientific regression log](../evidence/membrane/phase-b-science-test.log), [refinement log](../evidence/membrane/phase-b-refinement-test.log), [numeric measurements](../evidence/membrane/phase-b-measurements.json).

The alpha-helix reference remains [experimental AQP1 PDB 1J4N](https://www.rcsb.org/structure/1J4N); pump ordering follows [the human-pump structural study](https://www.nature.com/articles/s41467-022-32990-x). PBP2 contact is supported by [the E. coli RodA–PBP2 study](https://www.nature.com/articles/s41467-023-40483-8), and the added [primary acyl-PBP3 structures](https://pmc.ncbi.nlm.nih.gov/articles/PMC3025346/) support common carbonyl–serine acylation chemistry. PBP2 domain motion and the cleft lip remain illustrative, without a claim of atomic reconstruction or measured kinetics.

No browser, full-suite run, shared runner edit or publication was performed. Phase A reports and evidence were retained unchanged.


## Rendered follow-up repairs 07–11

The original 26-state default gallery produced five additional findings, preserved in [repair-discoveries.json](../evidence/membrane/repair-discoveries.json). Root authorized repair; the prior source was saved under `evidence/membrane/pre-rendered-repair/` before editing.

| Issue | Repair | Evidence |
| --- | --- | --- |
| 07 · P2 | Aquaporin callout attaches to a real front-right helix vertex | 64 samples across all roots/routes/gradients touch the actual target mesh |
| 08 · P2 | Pump domains, nucleotide, phosphate and conformation callouts follow real transformed objects; no-ATP status targets the gate | 26 states across both energy branches; actual surfaces, centers and marker visibility |
| 09 · P2 | Cell, cortex and arrow callouts follow the front membrane vertex, deformed cortical junction and scaled arrow heads | 36 states across both roots and all tonicities, including irregular seeks |
| 10 · P2 | RodA/PBP2/NAM callouts track actual structures; product/occupied-site label activates only after the corresponding event | 28 states across both antibiotic branches and exact event boundaries |
| 11 · P1 | Keep nonreacting D-Ala4 and leaving D-Ala5 clear of the mDAP3 crosslink branch while preserving residue identities and every stem bond | 414 states; minimum bond-to-nonendpoint-sphere clearance **−.119 → +.071**; unrelated D-Ala sphere clearance **−.028 → +.060891** |

All **10 current focused tests pass**. The five added tests reject the five defects in the archived pre-follow-up source (**0/5 pass as expected**); the P1 failure explicitly reports negative cylinder-to-nonendpoint-sphere clearance. Old `science.test.mjs` and `refinement.test.mjs` remain unchanged and pass. Scene node/geometry counts are unchanged by this follow-up. Formatting passes.

[Current regression](../evidence/membrane/rendered-repair-process-review.log), [pre-fix challenge](../evidence/membrane/rendered-repair-baseline-challenge.log), [old science receipt](../evidence/membrane/rendered-repair-science.log), [old refinement receipt](../evidence/membrane/rendered-repair-refinement.log), [before/after measurements](../evidence/membrane/rendered-repair-measurements.json), [reproducible measurement script](../evidence/membrane/rendered-repair-measurements.mjs).

A mutable-array alias in the read-only phosphate coordinate diagnostic was corrected by reading each value from the saved pre-fix source; its previously computed distances, findings and screenshots were unchanged. The original Phase A audit remains untouched. Product code is frozen. New rendering, bilingual layout and continuous-playback acceptance remain with root.
