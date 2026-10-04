# Turnover integrated stage-frame review · 2026-10-04

Read-only follow-up. **Four additional P2 annotation findings need repair/review; no new mechanism-geometry or hard-cropping defect was confirmed in these default-condition frames.** Product and test files were not modified during this review.

## Evidence boundary

All **25 original 960 × 640 WebP stage images** were inspected through `view_image` at original resolution, directly rather than relying on reduced contact sheets. Selection came from `evidence/browser/gallery-index.json`:

| Process / root / condition | Capture key | Reviewed progress |
| --- | --- | --- |
| rnaSilencing / cell / seed | `full-a-retry-014-rnaSilencing-cell` | 0, .195, .395, .575, .795, 1 |
| proteasome / cell / ubiquitin + cutaway | `full-a-retry-015-proteasome-cell` | 0, .175, .355, .535, .735, .915, 1 |
| crispr / bacterium / matched | `full-a-retry-016-crispr-bacterium` | 0, .195, .375, .575, .775, 1 |
| bacterialRepair / bacterium / wildtype | `full-a-retry-017-bacterialRepair-bacterium` | 0, .195, .395, .585, .795, 1 |

Images are English, first registered root, default branch. The corresponding case JSONs report native playback at 1.5×, `result: complete`, empty errors, monotonic live progress and respectively 1288 / 1451 / 1289 / 1369 recorded updates. Those are root-collected playback records. **This review is manual inspection of the listed stage frames, not manual review of an entire native-play video.** It does not cover other conditions, other roots, Chinese rendered labels, devices or unrecorded intermediate frames.

The capture leader starts at the projected `label.position` (`src/scene/sceneCapture.js:167-196`); it is the same source anchor supplied to live annotations. The defects below come from model-side label coordinates that still behave like old text placement offsets, or from missing visibility synchronization. Text boxes are legible and inside the frame, but their leaders often stop in empty space.

## 20261004-turnover-R01 · P2 · RNA silencing anchors and disappeared-target labels

Evidence: `full-a-retry-014-rnaSilencing-cell-start.webp`, `...-stage-4.webp`, `...-stage-5.webp`, and `...-end.webp` under `evidence/browser/`.

The cap leader terminates below the cap; the target-mRNA and poly(A) leaders terminate below the RNA. TNRC6's leader ends above its protein scaffold. CCR4-NOT's fixed anchor stops tracking the enzyme as it moves left during tail shortening. The Argonaute title anchor also lies above the actual complex rather than on it.

More seriously for the terminal frame, **both “5′ cap” and “mRNA · 3′ UTR target” remain visible after the cap and every target-backbone segment have disappeared**. The frame can imply that the retained guide/protein is still accompanied by a target whose visible geometry is absent. The lone final poly(A) marker is a separate schematic residual noted in Phase A; this review does not classify that marker as a new molecule-conservation defect.

Code evidence: `rnaSilencingProcess.js:254-276` initializes displaced coordinates; `414-430` toggles the cap mesh but never ties labels 1/3 to cap/target visibility. Only the effector/cut labels have explicit active updates. Label 0's y coordinate follows a displaced title position and label 7 follows a displaced guide text position.

Read-only geometry checks confirm that this is not merely a nearest-vertex interpretation:

- At p=0, cap anchor `[-3.9,-0.5,0.3]` lies **0.326 scene units outside the cap's entire world bounding box**.
- At p=.575, target anchor `[0.2,-0.7,0.3]` lies **0.417 units outside the union of all 28 target-backbone bounds**.
- At p=.575, TNRC6 anchor `[2.2,1.85,0.2]` lies **0.232 units outside the complete scaffold bounds**.
- At p=1, target-backbone visible count is zero while cap and target label active values both remain effectively true (`undefined` active is displayed).

Proposal: anchor cap to its actual moving position; guide/AGO to a retained named structure; target and tail to actual currently visible backbone/tail points; effectors to their actual translated groups. Set cap/target/tail label activity from actual target visibility, preserving the two RNA-degradation branches. Labels for deleted targets must vanish with their targets.

## 20261004-turnover-R02 · P2 · Proteasome leaders miss the named structures

Evidence: `full-a-retry-015-proteasome-cell-start.webp`, `...-stage-4.webp`, `...-stage-5.webp`, and `...-end.webp`.

Rpn11's leader stops above/right of the orange catalytic domain. The beta-chamber leader stops outside the left side of the barrel, rather than in the exposed catalytic cavity. The motor/core leaders terminate to the right of their structures. Peptide-release and recycling anchors likewise remain at displaced text positions rather than following a representative visible product/ubiquitin.

Code evidence: `proteasomeProcess.js:427-445` defines these offsets. Rpn11 label is `[0.6,1.65,0.2]`; the named `Rpn11 catalytic domain` is centered at `[-0.14,1.35,0.1]`. At p=.535 the label anchor is **0.562 units outside that domain's entire world bounds**. The beta chamber label at `[-1.65,-0.8,0.4]` is outside the drawn axial lumen. The dynamically updated substrate/ubiquitin labels still add text-position offsets rather than using the actual residue/unit anchor.

Proposal: bind labels to the actual Rpn11 domain, a representative ATPase and core subunit, an exposed catalytic-site/cavity point, and an actual currently visible peptide or ubiquitin. Keep active conditions coupled to the relevant object. The cutaway geometry itself is readable: four rings, axial feeding, catalytic cavity and exported peptides remain visible without hard cropping.

## 20261004-turnover-R03 · P2 · Cas9 nuclease/PAM/strand anchors misidentify locations

Evidence: `full-a-retry-016-crispr-bacterium-start.webp`, `...-stage-3.webp`, `...-stage-4.webp`, and `...-end.webp`.

The early “RuvC · non-target” leader ends near the orange HNH region rather than the RuvC domain because the protein group is initially elevated while the RuvC label stays at a static world position. “HNH · target” remains far below the nuclease and near the tracrRNA loop. “PAM · 5′-NGG-3′” points above the DNA PAM bases, toward empty space adjacent to the gold PAM-interacting domain. These are molecular identity labels, so their geometrical anchors matter. The crRNA, tracrRNA, DNA-strand and displaced-strand leaders also retain offsets that place their tips outside the named nucleic-acid rails.

Code evidence: `crisprProcess.js:290-308` sets the offsets; `512-526` moves HNH/RuvC and the parent Cas9 group but only adjusts the y coordinates of labels 0/4/5. The nuclease and PAM label positions do not track their actual objects.

Exact bounding-envelope exclusions:

- p=0 HNH label `[0.65,-1.25,0.4]`: **2.007 units outside HNH world bounds**.
- p=0 RuvC label `[0.75,1,0.4]`: **1.184 units outside RuvC world bounds**.
- p=.575 PAM label `[2.1,.94,.2]`: **0.687 units outside the union of the three actual DNA PAM cubes**.
- p=.575 tracrRNA label `[1.65,-2.4,.2]`: **0.417 units outside its actual backbone bounds**.

Proposal: use current world positions of HNH/RuvC, the DNA PAM cubes (not the PAM-interacting protein pocket), a native scaffold point for tracrRNA, and actual strand/guide phosphate positions for direction labels. Propagate parent Cas9 transforms into protein/RNA anchors. Both nuclease domains must keep their own labels during docking and R-loop formation. The R-loop and distinct native RNA scaffolds are visible and uncut by framing; the final small cleavage gaps are partly adjacent to/occluded by the nuclease, so exact gap legibility should be reassessed after anchor repair rather than assumed from the numerical geometry tests.

## 20261004-turnover-R04 · P2 · SOS response-RNA and other locus anchors remain displaced

Evidence: `full-a-retry-017-bacterialRepair-bacterium-start.webp`, `...-stage-4.webp`, `...-stage-5.webp`, and `...-end.webp`.

The “Response RNA · 5′ → 3′” leader at p=.795 ends far to the right of the short transcript. At p=1 it still ends below the RNA. The SOS-box leader ends below the gold operator rectangle; LexA, RecA and strand captions are also positioned at text offsets rather than on the named geometry. The RNAP leader, by contrast, already follows `pol.position.x` and happens to land near its upper lobe in the examined transcription frames; it is not evidence of the same large mismatch.

Code evidence: `bacterialRepairProcess.js:289-313` initializes the displaced anchors. `522-529` updates LexA label x/y with a +.65 y offset, RNAP x only, and RNA label activity only; response-RNA position remains `[2.5,-2.67,.1]` throughout growth.

- At p=.795, the visible RNA-backbone union extends only to x=.638. Its label anchor is **1.948 units outside the complete visible RNA bounds**.
- At p=1, the same label remains **0.569 units outside the visible RNA bounds**.

Proposal: anchor the RNA label to a currently visible transcript node/segment and the operator to the actual SOS-box mesh. Use actual RecA and LexA geometry for molecular labels, and an explicit within-gap ssDNA point for the damage-region annotation. DNA direction labels should terminate on their own strand. Keep the noncleavable condition and before-transcription RNA-label absence unchanged.

## What the stage images do support

- All four default mechanisms remain inside the recorded frame; no model, RNA scaffold, substrate or output was hard-clipped by the viewport in these 25 images.
- RNA binding, the central bulge and progressive tail shortening are readable. At p=.395 the newly repaired effectors are partially visible, consistent with their finite entrance interval.
- Proteasome translocation passes through the exposed core and peptides emerge below it. Ubiquitin remains separate from the peptide products.
- Cas9 opening visibly propagates to a full R-loop; the target/guide and displaced strand are distinguishable, subject to the label identity problem above.
- SOS shows the upper damage-associated region and lower promoter as separate loci; LexA fragments visibly disperse/fade at p=.795, and the RNAP bubble and nascent transcript remain connected in the stage frames.

## Suggested verification after model-side anchor repair

Use direct anchor-to-named-object/point assertions at the recorded progress values and at docking/clearance transitions. A bounding box exclusion proves a miss; being inside a broad box alone must not be treated as proof of a correct surface or identity anchor. Assert cap/RNA label activity against actual visibility, and follow moving group transforms and nascent RNA growth. Then re-capture the same native-resolution stage frames in both languages, including branch/root exceptions. The existing scientific geometry, disposal, repeated-seek and motion regressions should remain unchanged.

These four rendered findings supplement the immutable Phase A and its completed repairs. They have been sent to root for authorization/assignment; this follow-up itself remains read-only for product/test files.
