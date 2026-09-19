# Regulation corrections — Phase B

All three audit IDs have code fixes and actual-geometry regressions. Phase A evidence is unchanged; final rendered acceptance remains with root.

| Issue | Correction | Evidence |
|---|---|---|
| regulation-01 | RNA 3′ now starts at the Pol II catalytic center; a short RNA segment remains alongside the opened template before exiting. | Four initiation/escape times: endpoint error < 1e-6; template proximity checked from real backbone vertices; altered-site output absent. |
| regulation-02 | Productive promoter DNA opens locally. Pol II progresses across template nucleotide instances, with its catalytic RNA anchor following the same frame. Two burst products release continuously and remain distinct. | Six burst times check opened pairing, template location and endpoint contact. Both bursts advance across at least seven nucleotide instances. Product handoff error < 1e-5. Impaired branch remains closed and produces no RNA. |
| regulation-03 | Cleavage partitions an existing RNA at a defined cut coordinate; the released product no longer duplicates the downstream fragment. Existing nucleotide markers remain with their respective products. | At cleavage, cut ends coincide < 1e-6, total arc length is conserved within .0002 scene units, and all existing markers preserve position < 1e-6. Downstream synthesis keeps its 3′ anchor. |

Local command: `node src/processes/modules/regulation/science.test.mjs` — passed. It also checks finite geometry, fixed resource identities and deterministic forward/reverse seeks across both control settings. An additional in-memory mutation harness restored four failure modes independently: two detached RNA ends, a closed productive template and the copied cleavage segment. All four were rejected by the tests without changing source files.

Changed product files: `modules/regulation/promoterRegulationProcess.js`, `enhancerRegulationProcess.js`, `chromatinGeometry.js`, `geometry.js`, and `src/processes/transcriptionProcess.js`. Added `modules/regulation/science.test.mjs`. Added [PDB 5C44](https://www.rcsb.org/structure/5C44) to both regulation processes’ sources; its topology evidence was already opened during Phase A.

Limits: these are continuous molecular schematics, not atomistic dynamics or exact sequence/energy accounting. RNA processing after release remains outside the enhancer lesson. No browser, thumbnail, global catalog/renderer, other group, or full-workspace test was touched. Root still needs to review rendered legibility and the global integration.

## Peer-review follow-up

`p_membrane` identified a remaining termination-tail defect: the enzyme began rising/backing away while the downstream RNA 3′ anchor still used fixed world y/z. Corrected the event order: downstream RNA resolves by p=.98 while Pol II stays template-engaged; only then does Pol II depart and the bubble close. The test now follows the **complete actual Pol II matrixWorld**, including y/z, at .861/.88/.91/.95/.97, and checks absence of attached RNA during .98/.99/1. Local suite passes; a fifth in-memory regression restoring early departure fails this anchor assertion. This supersedes the earlier narrower x-coordinate-only check.

## DNA strand-crossing follow-up

`p_rna` independently found DNA tubes intersecting at bubble edges in promoter regulation and original transcription, and at different parameter positions of enhancer linker 7 even with its impaired/closed control. Corresponding-vertex checks would miss the latter. Replaced Cartesian two-strand interpolation with a shared duplex frame, positive radial separation and phase-based opening. Enhancer linkers now derive both strands from one axis and frame; they retain exact endpoint connections to their respective nucleosomal strands. Routing and bending angles remain schematic.

Added `duplexGeometry.test.mjs` and imported it from the main science test. It checks **exact finite-segment distances**, including different parameters, for all 201 timeline frames and both controls: promoter clearance ≥ .088, original transcription ≥ .084, and every one of eight enhancer linkers ≥ .032. Each linker endpoint must remain within 1e-6 of the correct wrapped strand. The test and complete regulation science suite pass. Re-running the independent original Linker-7 probe now gives minimum .04499193 for both controls, replacing the prior .000169/.004754 intersections. This preserves the peer finding and supersedes the earlier insufficient corresponding-point-only confidence.
