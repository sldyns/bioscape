# Neurons all-root/control stored-frame review · 2026-10-04

## Coverage and outcome

Reviewed **14 case sheets containing 106 frames** for actionPotential, synapse, muscle and ciliaryMotion in `../evidence/browser/conditions-final-gallery-index.json`. Every case sheet was visually inspected. Seven additional **original 960×640** images were opened for the changed labels and inactive branches; four previously reviewed AP critical originals were reused only after confirming that their new gallery counterparts are byte-identical. All 106 source images exist and are 960×640. Their hashes, exact names, dimensions, original-view flags and cross-root comparisons are retained in `../evidence/neurons/rendered-all-cases-check.json`.

**All 14 cases pass the scoped check of sampled scientific state, model framing and repaired anchor/state behavior. No new module defect was confirmed.** Shared leader lines drawn through earlier label boxes remain the root integrator's separate layout repair; this report neither duplicates that issue nor certifies its final fix. No browser or product file was changed.

These are default-English stored canvas frames from the root's native irregular-seek run. They are **not evidence that every case was watched through full playback**. Case transitions between the sampled times, other camera poses, mobile layouts and other languages remain outside this manual check.

## Every case

The case number below is the number in `conditions-final-a-NNN-…`; exact sheet/image paths are in the gallery and audit JSON. “Pass” applies only to the sampled-state scope above.

| Case | Process / root | Control | Frames reviewed on sheet | Observed result and limit |
| --- | --- | --- | ---: | --- |
| 134 | actionPotential / cell | stimulus on | 9 | Pass: traveling teal/gold regions are visible; .48/.55 include the selected Na/K windows; .915 and end return to resting colors. Precise ion transit and buried gate discs cannot be resolved from sparse stills. |
| 135 | actionPotential / cell | stimulus off | 9 | Pass: resting bands and compact channels persist, with no traveling arrow. All nine original files are byte-identical, supporting the sampled inactive state. |
| 136 | actionPotential / neuron | stimulus on | 9 | Pass: same visible activation/recovery sequence and framing as 134. All corresponding images are byte-identical to 134; the root switch adds no canvas discrepancy. Same ion/gate visibility limit. |
| 137 | actionPotential / neuron | stimulus off | 9 | Pass: all nine resting samples are identical; corresponding images equal 135. This does not independently validate root-selection UI. |
| 138 | synapse / cell | calcium available | 7 | Pass: docked full vesicle, Ca-associated stage, camera-facing fused shell, cleft glutamate and later uptake/clearance are distinguishable. Sparse .275→.395 frames do not prove a continuous fusion transition. |
| 139 | synapse / cell | calcium blocked | 7 | Pass: incoming signal at .155 remains visible, but the vesicle stays full and no cleft release appears at the later sampled stages. This branch has three distinct images; it is not incorrectly described as wholly static. |
| 140 | synapse / neuron | calcium available | 7 | Pass: all corresponding images equal 138, including repaired shell orientation and leaders on the Ca channel, AMPA complex and glial uptake complex. Same fusion/trajectory limit. |
| 141 | synapse / neuron | calcium blocked | 7 | Pass: all corresponding images equal 139. Native .575 confirms a full docked vesicle and empty cleft while channel/receptor structures remain present. |
| 142 | muscle / cell | calcium released | 7 | Pass: calcium approaches the thin filaments, heads attach/stroke/withdraw, and later images retain increased overlap. Labels target actual Z discs, SR, filaments and nucleotides; .865 says calcium leaves troponin. Stills do not independently prove smooth reach/withdrawal at the repaired boundaries. |
| 143 | muscle / cell | calcium low | 7 | Pass: no shortening, no transferred calcium or calcium-transfer label; text explicitly says “no shortening.” All seven source images are identical. |
| 144 | muscle / muscleFibre | calcium released | 7 | Pass: corresponding images equal 142. Native .865 confirms the late calcium label follows a departing purple ion, with all major structures within the canvas. Same continuity limit. |
| 145 | muscle / muscleFibre | calcium low | 7 | Pass: corresponding images equal 143. Native .445 confirms the detached/resting head configuration, retained ADP + Pi and absence of the calcium-transfer annotation. |
| 146 | ciliaryMotion / paramecium | ATP available | 7 | Pass: successive sampled bends are visible, base stays anchored, moving label follows the cilium, and enlarged 9+2 cross-section remains legible. The extreme end pose fits in the native image. Exact dynein attachment is below reliable still-image resolution. |
| 147 | ciliaryMotion / paramecium | ATP absent | 7 | Pass: all seven source images are identical; straight cilium and enlarged 9+2 section remain visible, while the sliding/bending annotation is absent. Native .525 confirms this arrest state. |
| **Total** | **4 processes / 14 root-control cases** | | **106** | **14 sheets reviewed; no newly confirmed module defect.** |

Sampling positions: actionPotential = 0, .135, .255, .435, .655, .915, .48, .55, 1 (the critical frames occur late in sheet order); synapse = 0, .155, .275, .395, .575, .795, 1; muscle = 0, .165, .325, .445, .665, .865, 1; ciliaryMotion = 0, .185, .355, .525, .715, .905, 1. Scientific sequence was assessed by progress, not by the AP sheet's nonchronological ordering.

## Additional original-size views

All paths below are relative to `../evidence/browser/`. These seven originals were individually opened in this review; their sheet appearances are not counted again as new frames.

| Original image | Reason for native inspection |
| --- | --- |
| `conditions-final-a-135-actionPotential-cell-critical-480.webp` | Stimulus-off state at the otherwise active sodium time; resting overview, no arrow, channel-exit label and full membrane fit. |
| `conditions-final-a-140-synapse-neuron-stage-5.webp` | Released branch at .575; fused cutaway faces viewer, glutamate is in the cleft and repaired leaders reach actual complexes. |
| `conditions-final-a-141-synapse-neuron-stage-5.webp` | Blocked branch at the same .575 time; full docked vesicle and no released glutamate. |
| `conditions-final-a-144-muscle-muscleFibre-stage-6.webp` | .865 departing calcium, revised “leaves troponin” wording, increased overlap retained, and actual moving anchors. |
| `conditions-final-a-145-muscle-muscleFibre-stage-4.webp` | .445 low-calcium branch, no shortening or transferred-calcium annotation, entire sarcomere visible. |
| `conditions-final-a-146-ciliaryMotion-paramecium-end.webp` | Strong final bend, moving annotation target, anchored base and entire transverse view still in frame. |
| `conditions-final-a-147-ciliaryMotion-paramecium-stage-4.webp` | .525 ATP-absent branch, straight cilium, hidden motion annotation and complete 9+2 section. |

The four AP active originals at .435/.48/.55/.655 already reviewed in `neurons-rendered-critical.md` exactly match their case-134 replacements; all case-136 counterparts also match. Similarly, the six cell/alternate-root pairs across AP, synapse and muscle are byte-identical at every corresponding sample. The report therefore reuses native image evidence where the pixels are unchanged, while still reviewing every requested case sheet.

## Repair acceptance and limits

- **Issue 01 — ciliary dynein attachment:** longitudinal and transverse structures remain visible after repair. Exact surface attachment and nonintersection remain supported by the prior geometric tests, not by magnifying these small still-image details into a stronger claim.
- **Issue 02 — muscle head reach/withdrawal:** displayed attachment and withdrawal states are coherent; the prior numerical continuity test remains the evidence at the exact transition boundaries. Irregular seeks and seven-frame sheets cannot replace full-motion review.
- **Issue 03 — synaptic cutaway orientation:** the available-calcium branch shows the docked and fused lumens facing the camera; blocked calcium retains a full docked vesicle. This supports the intended orientation repair, while the topology switch remains a schematic convention.
- **Issue 04 — real label anchors and branch visibility:** rendered leaders now reach the intended structures, calcium wording changes during departure, and transfer/motion labels hide in low-calcium/ATP-absent branches. Final shared label-box/leader layering acceptance is reserved for the root's fix and its new renders.
- **Issue 05 — AP interior state bands:** active-state colors are plainly visible in both roots; stimulus-off remains at resting colors. The earlier purported AP label clipping was withdrawn after original-pixel verification; this review does not re-register it.

No claim is made here about whole-project release readiness, full playback of all 14 conditions, mobile acceptance, publication or deployment.
