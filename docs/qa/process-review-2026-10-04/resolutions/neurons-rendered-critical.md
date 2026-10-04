# Neurons critical-frame review · 2026-10-04

## Scope and result

Read-only review of the four requested **original 960×640** actionPotential frames from `../evidence/browser/critical-final-gallery-index.json`: cell root, stimulus on, default English view, p=.435/.48/.55/.655. All four originals were visually inspected at their stored resolution; no browser or product file was changed. This is a targeted still-image acceptance, not independent continuous-playback acceptance or coverage of all roots and conditions.

**Issue 05, hidden axon state bands: visually resolved in these four frames.** The restored interior colored regions are now plainly visible in the axon overview, including the teal sodium/depolarization interval at .48 and the gold later regions. The enlarged bilayer and axon overview fit inside every image. Issue 04's sodium/potassium leaders now terminate on the visible channel collars. No new defect is confirmed by these four frames.

## Original-frame observations

All paths below are relative to `../evidence/browser/`.

| Progress | Original file | State colors and membrane/channel visibility |
| --- | --- | --- |
| .435 | `critical-final-006-actionPotential-cell-stage-4.webp` | A gold region is clear in the axon overview. The enlarged bilayer, pore collars, selected overview region and corresponding connector remain readable. Both displayed channels are in their compact state. The cytoplasmic-side label is entirely inside the image. |
| .480 | `critical-final-006-actionPotential-cell-critical-480.webp` | The teal active region is clearly distinct from the preceding gold region. The sodium complex is more spread/open than at .435; its outer geometry and collar are visible. The cyan/green bilayer remains visible behind it. The cytoplasmic-side label fits inside the image. |
| .550 | `critical-final-006-actionPotential-cell-critical-550.webp` | The selected overview region is gold. The potassium complex is more spread/open, with a more distinct dark central opening; the sodium complex has compacted. The cytoplasmic-side label fits inside the image. |
| .655 | `critical-final-006-actionPotential-cell-stage-5.webp` | The gold region has advanced farther along the overview. The enlarged section remains fixed at its selected location, and both displayed channels are compact again. The cytoplasmic-side label is entirely inside the image. |

## Pixel verification and correction

The initial interpretation that **“Cytoplasmic side · channel exit”** was clipped at .48 and .55 was incorrect and is withdrawn for both files. Root independently inspected the originals and found the label intact. A subsequent read-only PIL check of all four exact files finds the first dark text pixels at **x=17** in y=456–475, with no text at the left image edge. The leading glyph has the same per-column dark-pixel counts in all four states. The original pixels do not support a clipping defect. Full filenames, SHA-256 hashes, examined coordinates and pixel measurements are retained in `../evidence/neurons/critical-label-pixel-check.json`. No issue is registered from the mistaken interpretation, and no product change is warranted by it.

## Evidence boundaries

- These frames establish that the axon color bands are rendered and legible in the requested active windows. They also show the qualitative open/compact direction of channel geometry.
- The actual internal gating discs are partly beneath/behind the enlarged membrane. Their exact occlusion state and every ion trajectory cannot be certified from these stills. Ion markers are small and partly occluded; this report does not claim visually verified continuous transmembrane travel.
- Sparse frames do not establish continuous interpolation, end-to-start behavior, repeated seeking, alternate roots, inactive controls, or every language/layout combination. The previously recorded science and numeric replay evidence remains separate.
- The pending all-condition root gallery has not been included in this targeted report.

**Acceptance:** issue 05 passes this targeted rendered review. Issue 04's channel target accuracy is improved and visible; the inspected channel-exit annotation remains inside the image. Continuous playback and all-condition rendered acceptance remain separate gates.
