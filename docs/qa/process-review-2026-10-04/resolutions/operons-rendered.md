# Operons integrated rendered review · 2026-10-04

**All four supplied process galleries reviewed; four new annotation issues repaired and frozen for root recapture.** The original six Phase A issues remain fixed. All ten issue IDs appear exactly once in `resolutions/operons.json`.

## Evidence inspected

Four contact sheets from `evidence/browser/gallery-index.json` cover every supplied start, stage and end frame (28 images total). Original-resolution 960×640 stage-5 frames for each model were separately inspected; no source images were resized or replaced.

| Model | Supplied progress states reviewed | Original inspected | Visual finding |
| --- | --- | --- | --- |
| lacOperon | 0, .175, .375, .545, .735, .935, 1 | `full-a-stable-036-lacOperon-bacterium-stage-5.webp` | LacI/CAP, DNA sites and RNA leaders retained old text offsets. The rendered transcript output itself remains connected at sampled late stages. |
| trpOperon | 0, .155, .325, .505, .675, .885, 1 | `full-a-stable-037-trpOperon-bacterium-stage-5.webp` | Protein, RNA-region and hairpin leaders miss the structures. Default gallery shows the stalled/readthrough branch; terminating-branch release wording was separately checked in code and regressions. |
| yeastGal | 0, .185, .385, .575, .745, .935, 1 | `full-a-stable-038-yeastGal-yeast-stage-5.webp` | Gal80/Gal3/coactivator and DNA/RNA leaders miss their actual geometry. At start, ligand-complex wording appears before ligand meshes. Nuclear-detail annotation is regional. |
| yeastOsmoregulation | 0, .165, .335, .505, .695, .915, 1 | `full-a-stable-039-yeastOsmoregulation-yeast-stage-5.webp` | Pbs2/Ssk2/22 leaders visually approach glycerol, while Hog1/Fps1/glycerol/GPD1-response leaders use empty offsets. The sampled late adaptive glycerol stays inside the membrane. |

Original sheet paths and every image path are preserved in `evidence/operons/repair-discoveries.json`. The diagnosis was recorded before product edits in that file and `repair-discoveries.md`; Phase A files were not changed.

## Repairs

- **20261004-operons-07 / lac:** real protein-surface, DNA-instance and visible-RNA anchors; actual substrate-to-bound-inducer target handoff; state annotation distinguished from molecule labels.
- **20261004-operons-08 / trp:** actual RNAP/ribosome/repressor/codon/hairpin targets, visible colored-RNA targets and growing 3′ endpoint; release wording follows actual RNAP departure.
- **20261004-operons-09 / GAL:** moving Gal3/Gal80, activation domain, repression complex and coactivator ring surfaces; DNA and visible RNA; ligand wording follows drawn occupancy; nuclear region kept regional.
- **20261004-operons-10 / HOG:** actual sensor, relay, kinase, channel, glycerol and nuclear RNA surfaces; Hog1 and shrinking-cell targets follow their trajectories; nucleus/whole-cell state/volume reference remain regional.

Named structures now store their biological leader endpoint. Shared text layout remains untouched. RNA anchors use vertices referenced by the current draw range, so hidden or not-yet-drawn RNA cannot leave a visible label. Active flags reset deterministically before branch gating.

## Verification

- `labelAnchors.test.mjs`: **4,707 actual target checks**, 16 control combinations, all supplied stage times plus boundary states, translated/rotated scene geometry, an independently moved Pbs2 lobe, positive active-state requirements and irregular seeks.
- Four negative controls reject the original LacI and Pbs2 offsets, premature GAL ligand-complex wording and premature trp release wording.
- Owned full science/mutation run passed after product edits, including historical duplex/pore/causal checks, the six prior playback fixes and all 14 old-code mutants.
- Bacterial, yeast and refinement smoke suites passed; all prior detailed geometry, resource inventories and deterministic seeking remain intact.
- Owned formatting and whitespace checks passed. No shared files or browser were modified/operated.

## Acceptance boundary

The supplied gallery is **pre-annotation-repair evidence**. This reviewer inspected all its stage images and repaired confirmed targets, but has not seen a new screenshot of the revised labels. Root must recapture/review the four models for final rendered acceptance. The gallery covers default scenarios; condition coverage beyond those images is source and actual-geometry regression coverage, not additional rendered-condition evidence. Still images do not independently establish continuous-playback smoothness.
