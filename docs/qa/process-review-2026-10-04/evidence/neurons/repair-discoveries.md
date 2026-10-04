# Neurons discoveries during integration frame review

## 20261004-neurons-04 · P2 · annotation targets

Reviewed the four seven-frame sheets and one original 960×640 frame per process. Native playback was recorded by root; this is not an independent viewing of every video frame or every root/condition.

**actionPotential** — Na/K leader endpoints float above the pore collars. Label coordinates (-3.57,1.52,.3)/(-1.33,1.52,.3) were display offsets; real pore centers are (-3.568,.2,.15)/(-1.332,.2,.15). The rendered Na label ends in background; the K line crosses above the pores. Evidence: `../browser/full-a-retry-026-actionPotential-cell-stage-3.webp`.

**synapse** — Ca-channel label endpoint at (-2.08,1.05,.4) is away from pore (-1.6,.55,.25); EAAT target (3.2,-2.04,.3) is below the membrane and transporter, whose drawn uptake ring is at (3.06,-.19,.25). AMPA annotation points below and between receptors instead of either complex. Evidence: `../browser/full-a-retry-027-synapse-cell-stage-4.webp`.

**muscle** — Both Z-disc leaders end below the actual discs; labels y=-1.55 versus disc extent +/-1.225. Actin and SR leaders also terminate in background, and static Ca-to-troponin text remains present when calcium markers are hidden. Evidence: `../browser/full-a-retry-028-muscle-cell-stage-5.webp`.

**ciliaryMotion** — Constrained-sliding target (-3.2,.5,.3) does not follow the bending cilium; the 9+2 and enlarged-section leaders terminate outside the transverse section. At p=0 and ATP absent the motion claim is still active even though geometry is arrested. Evidence: `../browser/full-a-retry-029-ciliaryMotion-paramecium-stage-3.webp`.

ProcessScene and export rendering interpret label.position as the leader target. These legacy text offsets do not identify the named molecular objects; static event labels also imply movement/binding in inactive conditions.

Correction plan: Anchor object-specific labels to existing pores, receptor/EAAT geometry, moving Z discs/actin/ions/nucleotide markers and deforming ciliary geometry; use region anchors for compartment descriptions and hide calcium-transfer/bending-event labels when inactive.

Acceptance: Append geometric world-anchor and active-condition regressions to owned science.test.mjs; preserve roots, labels in both languages, existing scientific geometry and original Phase A findings. Root renders follow-up frames.

Original Phase A audit files remain unchanged.

## 20261004-neurons-05 · P2 · state-band back-face culling

The actionPotential sheet shows the inner axon without a readable repolarization band at p=.435. A ray from the default camera [0,3.6,12.5] to band 2 at [2.3602,.25,-.532] has zero intersections under its original FrontSide material despite its correct gold c49b5d state. Changing only that instance to DoubleSide yields one intersection. Both surrounding axonal wall materials already use DoubleSide. Root authorized the same material-side correction for the six existing state bands. Geometry, colors, phase order and stimulus control must remain unchanged.
