# Plant connections · Phase A independent audit · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. All four registered IDs resolve only to `plant`; eight total condition combinations were reviewed. Product and test files remain unchanged. No browser, full-workspace suite or subagents were used.

| Model | Scope and conditions | Verdict | Findings |
| --- | --- | --- | --- |
| plantTransport | Arabidopsis companion cell; ATP available / absent with no initial gradient | Qualified pass | No confirmed defect within the stated schematic scope |
| plasmodesmata | One widened-sleeve Arabidopsis root PD; open / callose | Confirmed issue | 20261004-plantConnections-01, P1 |
| photorespiration | Arabidopsis main C2 salvage; GLYK active / absent | Confirmed issue | 20261004-plantConnections-02, P1 |
| c4cam | Main maize NADP-ME C4 / mature K. fedtschenkoi CAM | Confirmed issue | 20261004-plantConnections-03, P1 |

Three model-specific issues arise from two geometric causes. Issues 02 and 03 share the owned `anatomy.js` helper and can be repaired together, with verification in both processes.

## 01 · Callose crosses into the membrane and sleeve

`plasmodesmataProcess.js:312–331,386–405` independently deforms the pore with a fifth-power neck profile and expands the callose torus. At `gate=callose,p=.6` and `p=1`, actual cytosolic-leaflet vertex 649 is `(0.6625000238, 0.7549144030, -0.2841519415)`. It lies **inside the closed, indexed callose mesh**: an outward ray intersects once, and the nearest collar triangle is 0.0747897835 away. At p=.35 the same vertex is outside. This is actual triangle-based evidence, not a nearest-vertex proxy.

Callose is wall-side material; it should displace the membrane boundary, not engulf it and protrude into its cytoplasmic side. The stage text explicitly says wall-side callose narrows the sleeve. Couple both leaflet profiles to the collar's actual inner surface and verify nonintersection throughout accumulation, preserving early passage and later exclusion.

Support: [Arabidopsis CALS3 experiment](https://pubmed.ncbi.nlm.nih.gov/22172675/) links callose accumulation to reduced aperture and traffic. [Opened cryo-ET primary study](https://www.nature.com/articles/s41477-026-02294-9) locates the cytosolic sleeve between ER and PM and callose-rich deposits in the wall around the neck. Its moss-specific complete-sealing result is not extrapolated to this Arabidopsis schematic.

## 02 and 03 · Drawn crista necks terminate short of inner membrane

`anatomy.js:233–265`, used by `photorespirationProcess.js:19` and the CAM branch at `c4camProcess.js:282`, draws ten short neck cylinders. Eight complete rendered neck meshes are strictly separated from the inner envelope. In inner-envelope local coordinates, every envelope triangle lies outside radius 0.9970928723; central neck 5 has maximum rendered vertex radius 0.8516170022, proving a gap of at least 0.1454758702. The bound applies to the whole neck mesh, including triangle interiors, because a ball is convex.

The intended necks therefore do not establish their claimed attachment to the inner boundary membrane. Derive junction endpoints and continuous membrane/lumen contours from the actual envelope surface. Verify all ten junctions in both scenes, including double-envelope separation and the central negative-control witness.

Support: [Perkins et al., primary electron tomography](https://pubmed.ncbi.nlm.nih.gov/9245766/) resolves cristae as inner-membrane invaginations connected through narrow junctions. Only this conserved membrane-continuity observation is used; neuronal dimensions and organization are not imposed on plants.

## Mechanism and bilingual review

- **plantTransport:** Cytosolic ATP-dependent H+ export precedes SUC2-mediated return and sugar uptake. There is one tracked ATP hydrolysis and one proton; the background gradient is qualitative. No-ATP/no-gradient blocks net uptake. SUC helices have alternating-side loops and a dynamic cytoplasmic linker; unsupported pump connectors remain omitted. Both languages, all stages, labels and conditions agree with this scope. [Opened AHA2 structural paper](https://www.esalq.usp.br/lepse/imgs/conteudo_thumb/Crystal-structure-of-the-plasma-membrane-proton-pump-1.pdf), [SUC1 family structural evidence](https://pmc.ncbi.nlm.nih.gov/articles/PMC10281868/), and [AtSUC2 complementation](https://pubmed.ncbi.nlm.nih.gov/18650401/) were checked. The sugar icon and protein motions are schematic; no atomistic stereochemistry or steric acceptance is claimed.
- **plasmodesmata:** Actual small-solute positions occupy the sleeve outside the desmotubule. The first particle crosses before callose narrows the neck, while three later particles stop in the restricted condition. The bulky probe is excluded in both branches. Text correctly avoids a universal protein/RNA mass cutoff; [primary ultrastructure evidence](https://pubmed.ncbi.nlm.nih.gov/28604682/) also cautions that sleeve morphology varies with differentiation.
- **photorespiration:** Four persistent carbon nodes follow two 2C substrates to a 3C product and a CO2 carbon. Compartment order and nitrogen-reassimilation caveat are consistent; accompanying initial 3-PGA is explicitly outside the pool. GLYK absence prevents final phosphorylation while active GLYK transfers ATP-derived phosphate. [Opened Arabidopsis GLYK primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC1182498/) supports the cycle and mutant effect. Front-section transport paths are schematic; transporter-scale crossings are unresolved.
- **c4cam:** The maize branch places initial PEPC capture in mesophyll cytosol, malate reduction in mesophyll chloroplast, decarboxylation by the bundle-sheath chloroplast, and pyruvate return for PPDK regeneration. Whole-carbon-sphere radii fit both drawn PD sleeves and rims in a new 1001-frame sweep. CAM preserves nocturnal capture/storage followed by daytime mitochondrial decarboxylation and chloroplast refixation. [Maize primary study](https://pubmed.ncbi.nlm.nih.gov/24254314/) supports the explicitly limited main-branch treatment; [K. fedtschenkoi mature-leaf mitochondrial experiment](https://pubmed.ncbi.nlm.nih.gov/12228671/) supports NAD-ME. The [2020 PPC1 experiment](https://pubmed.ncbi.nlm.nih.gov/32051209/) is in K. laxiflora and was used only for broader CAM context, not as direct species evidence.

## Motion and verification boundary

`node src/processes/modules/plantConnections/smoke.mjs` passed all four models and both conditions: finite buffers/bounds, repeated irregular seeks, stable node/material/geometry identities and standalone bundles. A separate diagnostic sampled 412–414 positions per condition, including stage epsilon neighbors. No concrete visible-node teleport was established. Carbon positions remain continuous across reaction-bond visibility changes; the day/night icon change and excluded-cargo stop are intentional switches, not automatically defects.

These checks do not constitute rendered or smooth-playback acceptance. Root must inspect the actual scenes and condition transitions; no GPU/frame-time, physical-device or release claim is made.

Evidence: [diagnostic script](../evidence/plantConnections/diagnostic.mjs), [numeric evidence](../evidence/plantConnections/diagnostic.json), [smoke results](../evidence/plantConnections/smoke.log). The [JSON report](plantConnections.json) contains full per-model scope, sources, findings, verification invariants and limits.

**Phase B is pending explicit root release.**
