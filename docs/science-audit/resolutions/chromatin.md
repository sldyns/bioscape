# Chromatin Phase B correction record

All eight Phase A issue IDs have implemented fixes and local geometry regressions. Phase A evidence is unchanged. Only `src/processes/modules/chromatin/` and these resolution files were edited in this phase. Rendered visual acceptance remains with the root reviewer; no browser or full-workspace checks were run.

| Issue | Implemented correction | Actual-geometry evidence |
| --- | --- | --- |
| chromatin-01 | Left-handed nucleosome superhelix; right-handed locally framed DNA | Signed winding/twist from tube buffers; fixed sequence site arclength through sliding |
| chromatin-02 | Right-handed DNA on bent TAD arms and loop | Signed local twist and transverse separation, all three conditions |
| chromatin-03 | Constant material contour, consumed from arms as loop grows | 41 times × 3 conditions; rendered polyline within 0.375% of length 12; CTCF loci stay fixed on sequence |
| chromatin-04 | Correct handedness for all three plant genomes | Nuclear, plastid and mitochondrial strand buffer checks |
| chromatin-05 | Per-contour-point threading through NPC corridor | Both RNAs and controls; crossing checks at both envelope surfaces include tube/base clearance |
| chromatin-06 | Local RNA in ribosome groove; nascent C end attached until termination | Channel-edge and exit-ring mesh measurements; product release and compartment checks |
| chromatin-07 | One original cytosine flips; methyl bond attaches at its C5 | Replaced original base instance; retained sugar/backbone; actual catalytic-pocket contact; inactive control stays unmarked |
| chromatin-08 | Right-handed source/target DNA in RdDM | Both actual duplex buffers, including after base flip and return |

Changed implementation files: `geometry.js`, `structure.js`, `chromatinAccessProcess.js`, `tadProcess.js`, `plantGenomeProcess.js`, `plantRdDMProcess.js`. Added `science.test.mjs`.

`node src/processes/modules/chromatin/science.test.mjs` passes: 13 root/control combinations, 161 stage/reverse-seek/condition-switch states, fixed resource inventories and finite buffers, plus focused intermediate sweeps. The four process modules also bundle successfully with esbuild. Owned JavaScript files were formatted with Prettier. `git diff --check` was unavailable because this workspace is not a Git repository.

The regressions test the reported geometry and branch invariants; they do not establish every scientific statement or substitute for visual review. Protein shapes remain schematics. Localized piecewise DNA contact bends have no single differential tangent, so twist checks examine their adjoining smooth segments; the analytic TAD contour is constant, while polygonal rendering introduces the stated small chord error. No new scientific sources were needed beyond the authoritative sources recorded in the immutable Phase A audit.
