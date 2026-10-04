# Turnover repaired Chinese stage-frame review · 2026-10-04

**The repaired molecular anchors and inactive-target labels are substantially corrected. Rendered acceptance remains qualified: one new shared text-box/model overlap finding is confirmed, and the proteasome catalytic-chamber leader still needs a default-view visibility adjustment.** No product file, test file, shared renderer or browser state was changed by this review.

## Exact evidence boundary

Only the four `full-b1-` turnover entries from `evidence/browser/gallery-index.json` were used. All **25 original 960 × 640 WebP images** were inspected directly using `view_image` with original detail. Old `full-a` frames and reduced contact sheets were not used for this follow-up.

| Process / root / condition | Capture key | Progress values inspected |
| --- | --- | --- |
| rnaSilencing / cell / seed | `full-b1-008-rnaSilencing-cell` | 0, .195, .395, .575, .795, 1 |
| proteasome / cell / ubiquitin + cutaway | `full-b1-009-proteasome-cell` | 0, .175, .355, .535, .735, .915, 1 |
| crispr / bacterium / matched | `full-b1-010-crispr-bacterium` | 0, .195, .375, .575, .775, 1 |
| bacterialRepair / bacterium / wildtype | `full-b1-011-bacterialRepair-bacterium` | 0, .195, .395, .585, .795, 1 |

Each key has `-start.webp`, numbered `-stage-N.webp` files and `-end.webp` in `evidence/browser/`. These captures are Chinese with the first registered root and default condition. Other roots/conditions, the later 235-combination terminal-frame review, English post-repair layout, devices and arbitrary camera angles are outside this manual image review.

The corresponding root-collected `.json` records show complete native playback at 1.5×, terminal progress 1, monotonic live progress and no recorded errors. Recorded update counts are 1288 / 1450 / 1289 / 1368; median intervals are 16.6 / 16.6 / 16.7 / 16.7 ms, with p95 intervals 18.1 / 18.4 / 18.1 / 17.9 ms. These are playback instrumentation records. **This reviewer manually inspected the listed still frames, not every native-playback video frame; update cadence is not a direct GPU/display-FPS measurement.**

## Confirmed correction of the original label defects

### RNA silencing · R01

AGO now points into its retained protein lobe; the guide leader terminates on the purple guide backbone. The cap leader reaches the cap. The mRNA/UTR leader follows a real target-backbone segment, including its central bulge. TNRC6 and CCR4–NOT leaders follow the recruited proteins; the CCR4–NOT anchor moves with the enzyme from p=.575 to .795 and 1. At p=.395 the partially appeared effectors remain unlabeled, consistent with the chosen visibility threshold.

At the terminal frame the cap and target mRNA have disappeared, and their two labels are absent. The poly(A) label terminates on the remaining single schematic tail marker. It is not a label for an absent object; interpretation of that residual marker remains the pre-existing model boundary, not a new conservation claim. R01's wrong molecular anchors and ghost cap/UTR labels pass these six default-branch frames. Text-box overlap at p=.575 is separately recorded below.

### Proteasome · R02

Rpn11 now terminates on the orange catalytic domain; the ATPase title points into the upper motor. The core label reaches a real barrel subunit. Substrate and ubiquitin leaders follow their moving molecules. Once the original substrate is gone, its label is absent; the recycling label terminates on retained ubiquitin, and the peptide-release leader reaches an actual released peptide below the barrel. These aspects pass the seven inspected frames.

**The catalytic-chamber label remains visually ambiguous in the default view; do not treat R02 as fully rendered-accepted yet.** Its geometrically valid internal catalytic-site anchor is hidden behind the right beta wall from this camera. Details follow below.

### Cas9 · R03

HNH and RuvC leaders now remain attached to their own orange and blue domains, including the elevated starting complex and docked/R-loop states. The crRNA and tracrRNA leaders terminate on their own RNA curves; direction labels reach the two DNA rails. The displaced-strand leader follows the raised non-target rail. No ghost labels or mutually overlapping text boxes were seen in the six frames.

The PAM leader follows the DNA recognition region and no longer remains in the old detached location. At docked stages the DNA PAM cubes overlap the PAM-interacting protein pocket in projection, so these pixels alone do not distinguish a buried DNA-base point from the foreground protein surface. The prior exact-geometry regression verifies the chosen DNA PAM cube, while this review preserves that occlusion limit. The terminal DNA cleavage gaps are small and adjacent to domains; these stills do not justify a new claim of easily legible cut gaps at every frame.

### SOS response · R04

LexA, RecA, operator, RNAP and both strand leaders now terminate on their respective visible structures. The damage-gap caption points into the intended gap region rather than at a displaced molecular center. The RNA label at p=.795 reaches the visible transcript's left 5-prime endpoint; at p=1 it remains attached to the elongated RNA. The RNA and RNAP labels are absent before transcription. At p=1 the dispersed LexA domains and autocleavage label are both absent. R04's molecular-point and absent-transcript-label repairs pass these six default-branch frames. Peripheral text-box overlap remains separate.

## 20261004-turnover-R05 · P2 · Text boxes overlap peripheral model geometry

This is a **new rendered layout finding**, sent to root before any further modification. The label boxes themselves are readable, remain inside the frame and do not overlap one another, but the margins used for label placement are also occupied by model geometry.

Direct examples:

- `full-b1-008-rnaSilencing-cell-stage-4.webp` (p=.575): the right `CCR4–NOT` box begins near x=858, y=360 and covers the outer portion of the enzyme's orange right lobe. Its molecular leader is now correct; the box placement causes the occlusion.
- `full-b1-011-bacterialRepair-bacterium-start.webp` and the subsequent SOS frames: the long right-hand `损伤相关 ssDNA 间隙` box, approximately x=795–950 and y=178–212, covers part of the right DNA flank/end near x=800–870. This is consistently visible across the series.
- `full-b1-011-bacterialRepair-bacterium-stage-5.webp` (p=.795): the long left `RecA* 核蛋白丝状体` box extends over the left portion of the upper DNA rail. Its leader follows the protein correctly; the box masks the rail beneath it.

Pixel coordinates above are approximate readings from the native images, not a programmatically segmented overlap measurement. The visible white-box occlusion is clear. This is not a new molecular topology error or viewport crop. A shared placement/layout correction should reserve space for long Chinese labels or avoid occupied peripheral geometry while retaining exact object anchors; moving the leader back to an arbitrary text offset would undo the molecular repair. Root owns shared annotation layout and can decide the repair approach. **No shared or model code was edited here.**

## R02 remaining rendered check · Catalytic-chamber leader is behind the beta wall

Across `full-b1-009-proteasome-cell-start.webp` through `...-end.webp`, the `β 催化腔` leader terminates around the right barrel wall (approximately x=540, y=401 in these captures), while the open axial cavity and visible orange catalytic sites lie to its left. The point selected in the model is the real `beta catalytic site 2 (beta5)`; the default-view ray reaches a foreground beta subunit before that internal point. Thus exact 3D identity alone did not make this region leader visibly identify the exposed chamber.

The rest of the R02 repair is supported above. This is a **remaining visual qualification of the same chamber-label issue**, not an additional duplicate issue ID. Suggested follow-up is to bind the chamber's regional caption to the visible cut-open cavity or an actually exposed catalytic-site point in the default view, retain its whole-shell inactive behavior, and re-capture one early and one product-release stage. Root has been notified; no authorized follow-up repair was assumed.

## Overall visual limits and next verification

No model was hard-cropped by the viewport, and no label box was clipped by an image edge in these 25 captures. Protein detail and RNA/DNA paths remain present; the previously repaired RNA factor entry and LexA fading are visible in the relevant intermediate stages. No new mechanism-geometry failure was established from these frames.

The model-point/visibility repairs for R01/R03/R04 have qualified rendered support for the listed default-condition Chinese frames. R02 retains the chamber-view caveat; R05 records a new layout overlap. Final approval must keep these observations separate from other conditions, the 235-combination terminal-frame set, English post-repair captures and full native-playback visual inspection. The root was informed before this report was saved. Product/test files remain frozen.


## Authorized follow-up after this image review

Root subsequently authorized a focused R02 correction. The chamber anchor was moved to the existing, actually exposed `beta catalytic site 1 (beta2)`. A default-camera ray test now verifies that its molecular surface is the first visible triangle hit; the old `beta5` point instead hits the right beta wall. The full default-view evidence and regression are recorded in `resolutions/turnover.json` under the same R02 ID and in `evidence/turnover/proteasome-chamber-ray.json`. This follow-up has not been re-rendered in the above `full-b1` images, which remain the preserved before-follow-up evidence.

R05 has been added to `evidence/turnover/repair-discoveries.json` and the resolution ledger as `pending_root_repair`, assigned by root to regulation for shared capture layout. Its visual acceptance remains open.
