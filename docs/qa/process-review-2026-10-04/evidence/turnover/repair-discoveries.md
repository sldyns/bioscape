# Turnover supplementary repair discoveries

25 original 960x640 stage WebPs; default conditions and first registered root. Supplementary findings; immutable Phase A unchanged.

Root explicitly authorized these four repairs after rendered review.

Source: `docs/qa/process-review-2026-10-04/resolutions/turnover-rendered.md`. Original reviewed frame names, bounds measurements and limitations remain there.

## 20261004-turnover-R01 · P2 · rnaSilencing

RNA labels use layout offsets and cap/target labels outlive their geometry. Cap, target, guide, AGO and effector anchors miss real geometry; cap and target label remain active at p=1 with no cap or target backbone.

Authorized repair: Bind prebuilt labels to real moving proteins and visible RNA/cap/tail; suppress absent targets.

## 20261004-turnover-R02 · P2 · proteasome

Proteasome molecular and product labels miss their targets. Rpn11 label is 0.562 units outside its actual domain bounds; core/motor/product anchors retain layout offsets.

Authorized repair: Bind to actual Rpn11, ATPase, core/catalytic site, residue, ubiquitin and peptide geometry; use actual product visibility.

## 20261004-turnover-R03 · P2 · crispr

Cas9/PAM/nuclease labels do not follow molecular identity. HNH and RuvC anchors are respectively 2.007 and 1.184 units outside real world domain bounds at p=0; PAM label misses DNA PAM cubes.

Authorized repair: Track current domains through parent transforms and anchor PAM to DNA; strand/RNA labels to their own rails.

## 20261004-turnover-R04 · P2 · bacterialRepair

SOS locus and growing transcript anchors retain text offsets. Response RNA label is 1.948 units outside visible backbone bounds at p=.795; operator/LexA/RecA/strand labels displaced.

Authorized repair: Bind labels to actual translated, rotated and scaled molecular objects and currently visible transcript. Keep damage-gap description explicitly regional.


## 20261004-turnover-R05 · P2 · Shared Chinese capture-label layout

The repaired `full-b1` frames show CCR4–NOT's right box covering its orange lobe (RNA p=.575), the long damage-gap box covering the SOS right DNA flank, and the RecA box covering left DNA (SOS p=.795). Exact frame names and approximate pixel regions are preserved in `resolutions/turnover-rendered-final.md`.

Root authorized recording this new issue with status `pending_root_repair` and is assigning shared `sceneCapture` layout to regulation. Turnover does not modify shared layout; actual object anchors must be preserved.
