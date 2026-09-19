# Independent peer review — operons

Reviewer: `/root/p_rna`. Read-only product review; only this acceptance record was written. Reviewed the Phase A audit, Phase B resolutions, full relevant geometry and update paths. No browser was used. Current verdict after owner corrections and independent retest: **qualified pass for the reviewed defects**. The initially discovered `peer-operons-01` and the three root-requested regulation/transcription residuals are closed by the actual-geometry evidence in the final section below. Initial failing measurements are retained as history; they are not the current model state.

## Initially confirmed additional issue: peer-operons-01 (P1; now closed)

`src/processes/modules/operons/structuralDetails.js:79–109`, particularly the coordinate blend at 85–90, forces strand 0 toward fixed +y and strand 1 toward fixed −y regardless of their helical phase. At negative phase, the moving bubble shoulder collapses the two original sugar-phosphate paths into each other. Both chain instances retain their identities, but their actual geometry crosses; this is not an acceptable melting/unwinding trajectory.

Independent probe reads `DNA backbone 0/1` cylinder instance matrices, reconstructs both segment endpoints, and minimizes the linear separation along the segment interior. It does **not** use `userData`, nearest vertices, or the declared bubble center.

Reproduction: `lacOperon`, `{lactose: "present", glucose: "low"}`, progress **0.7385**, segment **97**, interpolation fraction **0.5471743208**:

- Strand 0 axis point: `[1.5966983950, -0.5000242871, -0.00005282152]`.
- Strand 1 axis point: `[1.5966983950, -0.4999757427, 0.00005282152]`.
- Axis separation: **0.0001162627** scene units.
- Each rendered backbone cylinder radius: **0.026**; combined radius **0.052**. This is substantial overlapping geometry, not rounding-level contact.

The existing science suite verifies separation beneath each RNAP, so it misses the transition shoulders. Its old-defect mutation rejection also does not exercise strand intersection. Required correction: preserve both material strand identities using a continuous local frame/unwinding phase and maintain positive backbone clearance throughout bubble opening, migration, overlap and closure. Do not solve it by closing the template, hiding a strand, or removing productive RNA. Add segment-interior and different-parameter segment clearance checks at moving bubble shoulders, all lactose/glucose conditions, including intermediate frames.

Shared the exact coordinates and `/tmp/peer-operons-probe.mjs` with `/root/p_plant_signals` and `/root`; root registered this residual as `peer-operons-01`. Product was not edited by this reviewer. The independent re-review after the owner correction is recorded below.

## Original correction checks

| Original issue | Peer finding |
| --- | --- |
| operons-01 | Each visible RNAP now drives an opening, including later RNAPs after RNAP 0 disappears. Original defect fixed; the subsequent shoulder-intersection fix also passes the independent retest below. |
| operons-02 | Qualified pass. Both languages explicitly define `low` as severe starvation that limits charged tRNA; they distinguish modest free-Trp reduction. Four actual amino-acid/ribosome/RNA branches agree. |
| operons-03 | Qualified pass. In a 1001-frame independent sweep, stressed normal Hog1 enters at p=.591 with both Pbs2-P and Hog1-P visible; exits at p=.930 after both marks disappear. Other three conditions never enter. |
| operons-04 | Qualified pass. Both languages specify nonphosphorylatable activation sites rather than generic catalytic inhibition; upstream signaling remains distinguishable. |
| operons-05 | Qualified pass for this cutaway. The selected pore has actual indexed annular and cut-edge gaps. Independent full-cargo transverse vertex extent is at most .25967473 during its channel traverse against an actual .30000000 inner radius. Import and export follow the same radial route. |

The lac RNA bridge connects the growing drawn RNA end to its own moving RNAP rather than RNAP 0. Across p=.55/.605/.68/.72/.80/.88/.92, the gap between the draw-range RNA endpoint and bridge start is at most .007563, smaller than the RNA/bridge tube radii (.043/.024); no disconnected chain was established there. The bridge terminates at that RNAP's depicted cleft/exit location. This is a schematic endpoint association; this review does not certify an atomically resolved RNA–DNA hybrid from unlabeled protein motifs.

The trp independent branch results at p=.55/.90 were:

| Free Trp / charging | Trp attached to tRNA | Ribosome x at .55 | Final RNA branch | Readthrough |
| --- | --- | --- | --- | --- |
| high / normal | yes | −2.213236 | 3:4 terminator | no |
| high / limited | no | −3.48 | 2:3 antiterminator | yes |
| severely depleted / normal | no | −3.48 | 2:3 antiterminator | yes |
| severely depleted / limited | no | −3.48 | 2:3 antiterminator | yes |

This does not claim quantitative thresholds or charging chemistry, and the lower trp view remains explicitly conditional on an initiated transcript. `yeastGal` had no dedicated correction; its helper-dependent regression passed, but it was not subjected to an expanded independent biological audit in this bounded peer request.

## Commands and sources

- `node src/processes/modules/operons/science.test.mjs` — PASS, five original invariants and 16 conditions.
- `node src/processes/modules/operons/science.mutations.test.mjs` — PASS, all five old defects rejected. These passing tests coexist with the new confirmed defect.
- `node /tmp/peer-operons-probe.mjs` — independently measures the shoulder intersection and RNA bridge attachment.
- `node /tmp/peer-operons-hog-trp.mjs` — 1001 frames per HOG condition plus actual trp branch observations above.

Opened during this review: [Cooper, Transcription in Prokaryotes](https://www.ncbi.nlm.nih.gov/books/NBK9850/) supports local strand separation, template-directed 5′→3′ RNA synthesis, and release at termination. [Ferrigno et al., 1998](https://pubmed.ncbi.nlm.nih.gov/9755161/) supports phosphorylation-dependent Hog1 import, including phosphorylated catalytically inactive Hog1, and export of dephosphorylated Hog1. [Yanofsky et al., 1984](https://pubmed.ncbi.nlm.nih.gov/6233264/) supports distinct starvation ranges for repression and attenuation. Defect coordinates and measured clearances are direct code/geometry evidence, not values taken from those sources.

## Root-requested extension: same geometric defect in regulation / transcription

Root requested a narrowly bounded read-only check for the same double-strand intersection. This is not a new full audit of those models. `/root/p_genome` received all measurements and acknowledged implementing corrections.

| Process / condition | Progress and actual mesh segments | Measured axis gap | Sum of backbone radii | Finding |
| --- | --- | --- | --- | --- |
| promoterRegulation / intact | p=.660, segment244, common fraction .58285253 | .021991394 | .088 | confirmed intersection during opening |
| original transcription | p=.570, segment111, common fraction .99460450 | .000727504 | .084 | confirmed bubble-shoulder intersection |
| enhancerRegulation / competent | p=.855, linker7 strand1 segment25 fraction .79287101, strand2 segment19 fraction .11470683 | .000169334 | .032 | confirmed intersection between different material positions |
| enhancerRegulation / impaired | p=1, linker7 strand1 segment51 fraction .33678652, strand2 segment45 fraction .92677005 | .004754137 | .032 | closed-linker path also intersects; not solely the new bubble blend |

Promoter points: `[.0801999193,.0596968638,-.0848490942]` and `[.0801999194,.0379685332,-.0882404125]`. Original transcription points: `[-.4501517606,-.0002750160,.0609307409]` and `[-.4501517606,.0002750160,.0614068996]`.

Enhancer competent points: `[2.0518081318,-.6007586546,-.3791143258]` and `[2.0517217618,-.6007581281,-.3789686755]`. Enhancer impaired points: `[2.5216188668,-.1065778536,-.3450876242]` and `[2.5224521249,-.1067283664,-.3497657482]`.

`/tmp/peer-bubble-crossings.mjs` reconstructs actual tube ring means or cylinder instance endpoints across 201 frames. Its initial same-parameter scan did not find enhancer overlap; `/tmp/peer-enhancer-segment-probe.mjs` then compares **all pairs of actual strand segments**, including interior–interior minima, across 201 frames in both enhancer branches and confirms the reported collisions. This distinction is important: comparing only matching nucleotide indices would incorrectly pass the enhancer. Its two separately controlled cubic rails plus rotating difference vector require a consistent centerline/orthogonal frame as well as a topology-preserving bubble transition.

No regulation/transcription implementation, tests, audit records or resolution records were modified. These findings were subsequently corrected by their owner and independently retested below; no visual acceptance is claimed.


## Independent closure retest after owner corrections

Only owners changed the product. This reviewer read the corrected constructions and reran the **unchanged original probes**, then independently expanded to all pairs of different-parameter segments. All distances below are between actual reconstructed cylinder axes or dynamic-tube ring centerlines; each segment-pair comparison considers four endpoint projections plus the interior–interior minimum. A segment AABB bound only skips pairs that cannot improve the current minimum. The test does not substitute nearest vertices or matching indices for full segment distance.

### peer-operons-01 — closed, qualified pass

The owner replaced Cartesian strand blending with one x-axis centerline, a shared y/z frame, positive radial distances and an integrated nonnegative twist density. Both strand instances stay visible and productive bubbles remain open. No closed-template or hidden-strand workaround was used. The downstream phase change is a schematic torsional relaxation, not a fixed-end torque simulation.

- Unchanged `/tmp/peer-operons-probe.mjs`: 841 dense samples over .53–.95 now have minimum matching-segment separation **.284977699**, compared with the previous **.000116263**; required combined tube radius is **.052**. The RNA–bridge attachment measurements remain unchanged and within rendered tube thickness.
- Exact original witness was separately rerun at **p=.7385**, segment **97**, original fraction **.5471743208**: corrected axes are `[1.5966983950,-.6334496151,.1914800029]` and `[1.5966983950,-.3665504147,-.1914800029]`, separation **.4667906911** versus .052. Full different-index segment comparison at that exact time (`/tmp/peer-lac-witness-retest.mjs`) gives minimum **.2850179024** in present/low; all four lac conditions pass.
- New independent `/tmp/peer-operons-fullclearance.mjs`: 201 progress samples per condition, all 16 control combinations across the four models sharing this helper, and **all pairs** of differently indexed strand segments. Lac minima: present/low **.284977740**; present/high **.284996738**; both absent-lactose conditions **.285015003**. Each exceeds **.052**.
- Shared-helper checks also pass: trp minimum **.270746896**, yeast GAL minimum **.270740084**, HOG local DNA minimum **.114007164**, all above **.052**.
- `node src/processes/modules/operons/science.test.mjs` was rerun on this corrected state and passes the original five invariants, actual RNAP bubbles, all 16 conditions, HOG transport ordering/aperture geometry, finite buffers, resource stability and deterministic seeks.

These are bounded frame-sampled geometry regressions, not proof of all biological statements or a claim of continuous-time atomistic dynamics. No residual blocking issue remains from this review's lac strand-crossing finding.

### Root-requested regulation / original transcription extension — three residuals closed

The promoter and original transcription now separate opposite radial strand identities with a shared center and positive radii, interpolating opening phase instead of Cartesian strand positions. Enhancer linker rails now derive from a shared centerline/frame; opening changes the frame phase and radius rather than blending two independently bending cubic rails. All eight linkers retain their attached wrapped-DNA endpoints.

The unchanged `/tmp/peer-bubble-crossings.mjs` and `/tmp/peer-enhancer-segment-probe.mjs` pass after those owner corrections. The stronger independent `/tmp/peer-regulation-fullclearance.mjs` additionally checks **all cross-strand segment pairs**, 201 progress samples per condition, both promoter and enhancer controls, and all eight enhancer linkers:

| Model / condition | Minimum full segment-to-segment axis distance | Combined tube radius | Result |
| --- | --- | --- | --- |
| promoter / intact | .205490952 | .088 | pass |
| promoter / altered | .257504954 | .088 | pass |
| original transcription | .276734794 | .084 | pass |
| enhancer linker 1 / both controls | .056334203 | .032 | pass |
| enhancer linker 2 / both controls | .074360537 | .032 | pass |
| enhancer linker 3 / both controls | .060879727 | .032 | pass |
| enhancer linker 4 / both controls | .052208026 | .032 | pass |
| enhancer linker 5 / both controls | .045732322 | .032 | pass |
| enhancer linker 6 / both controls | .055879915 | .032 | pass |
| enhancer linker 7 / both controls | .044991929 | .032 | pass |
| enhancer linker 8 / both controls | .048761222 | .032 | pass |

`node src/processes/modules/regulation/science.test.mjs` was rerun on the corrected state: original catalytic-end/short template contact, RNA cleavage partition, active bubble and deterministic-seek tests pass; its appended owner regression reports 201 frames per control, full segment distances and all eight linker endpoints passing. That owner result is kept distinct from the independent all-pairs measurements above.

No implementation, original audit or resolution files were modified by this reviewer. The narrowly scoped crossing residuals are closed; this does not replace root visual acceptance or expand the peer review into a new full scientific audit of regulation/transcription.
