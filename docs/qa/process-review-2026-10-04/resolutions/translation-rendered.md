# Translation group — rendered stage-frame review

Scope: English, default conditions, first registered roots only: translation/cell, proteinFolding/cell (complete), alternativeSplicing/cell (include), nitrogenFixation/bacterium (protected). Reviewed all four sheets in `evidence/browser/gallery-index.json` (28 indexed stage/end frames), plus seven original 960×640 WEBP frames. These are static samples from the integrated capture. The reviewer did not operate the browser or manually watch the entire videos. Alternate conditions, other roots, Chinese labels, different viewports and intervening frames are outside this visual review.

## Translation

[Sheet](../evidence/browser/sheets/full-a-retry-010-translation-cell.jpg) · [Original end frame](../evidence/browser/full-a-retry-010-translation-cell-end.webp)

The post-release tRNA and release factor remain clearly visible at progress 1; the released peptide stays intact above the exit path. The experimental ribosome remains fully visible and visually separate from the reaction enlargement. No model or label box is clipped by the image boundary.

PTC points into the reaction region. Several legacy positions still serve as label-layout offsets rather than targets: A/P/E leaders end below the mRNA site coordinates; the exit-path leader ends to the right of its two guide lines; the release-factor leader ends to the right of the actual factor. These are additional anchor-quality concerns, not recurrence of the repaired terminal disappearance. The text `Inside the ribosome · separate reaction enlargement` and coordinate/color legend are explanatory captions and should not be mistaken for atom-specific targets.

## Protein folding

[Sheet](../evidence/browser/sheets/full-a-retry-011-proteinFolding-cell.jpg) · [Original start](../evidence/browser/full-a-retry-011-proteinFolding-cell-start.webp) · [Original end](../evidence/browser/full-a-retry-011-proteinFolding-cell-end.webp)

The client remains visible during local folding, Hsp70 retention and release; the final compact fold and Hsp70 lid retain detail. No model cropping or vanished chain is visible in these samples. Handedness cannot be certified from this one projection: its actual-geometry regression remains the evidence for chirality.

Confirmed label-target defect: at progress 0, `N terminus emerges first` uses [2.7,.8,.5], whereas the actual terminal bead is [2.56,-.56305,.27060], a distance of 1.38929. `Exposed hydrophobic segment` uses [-.04,.6,.5], whereas highlighted chain bead 40 is [.08667,-.32691,-.05625], a distance of 1.08840. In the original image the labels/leaders point into empty space above the chain. The fold title at progress 1 also anchors above the fold instead of on it. Client/Hsp70/J/NEF labels must follow actual object positions; text-box placement should be left to the shared layout.

## Alternative splicing

[Sheet](../evidence/browser/sheets/full-a-retry-012-alternativeSplicing-cell.jpg) · [Original p=.585](../evidence/browser/full-a-retry-012-alternativeSplicing-cell-stage-4.webp) · [Original end](../evidence/browser/full-a-retry-012-alternativeSplicing-cell-end.webp)

At p=.585 the exon ends are apposed, rather than joined by the previous giant tether. At p=.785 and the end, the mature 6–7–8 RNA is distinct from two branched lariats with tails. No unintended model cropping is visible. These samples do not by themselves cover the precise .59 chemical switch or the skip branch.

Confirmed label-target defect: `Exon 6`, `Exon 7`, `Exon 8` and `Mature RNA` leaders end in empty space beneath the actual RNA. For example, end-frame exon 6 label is [-1.65,-1.3,.4], while its bead 7 is [-1.65,-.75,.1]; exon 8 has the same .55 vertical/.3 depth offset. The branch label is close to the orange branch marker but retains an avoidable positional offset. The start-frame intron labels likewise point above their RNA sections. The molecule captions and exon-color boundaries are readable, but leader targets should be derived from the same current RNA coordinates.

## Nitrogen fixation

[Sheet](../evidence/browser/sheets/full-a-retry-013-nitrogenFixation-bacterium.jpg) · [Original p=.845](../evidence/browser/full-a-retry-013-nitrogenFixation-bacterium-stage-6.webp) · [Original end](../evidence/browser/full-a-retry-013-nitrogenFixation-bacterium-end.webp)

Products are present at .845 and separated at 1; no persistent N2 substrate is visibly duplicated in those product frames. The original [.8,.81) fault interval is not sampled here and remains covered by the actual-identity regression. Fe/MoFe domains, cluster detail and donor stay inside the image.

Confirmed leader defects: `P cluster` visibly points into the lower beta-domain interior rather than its metal cluster at the alpha/beta interface. `FeMo inside alpha` uses [.1,1.24,.65] while actual left FeMo group center is [.1,.64,.05] (distance .84853). The .845 `2 NH3` target remains [3.3,.5,.2] in right-side empty space although the two nitrogen atoms are at approximately [.699,.9025,.34875] and [.8854,.715,.34875]. Fe-protein and H2 labels also keep old presentation offsets rather than exact targets.

At the end the upper NH3 is partly covered by the `FeMo inside alpha` label box. This is visible label occlusion, not image-edge clipping; the cluster label's incorrect target contributes to the misleading arrangement. Correct targets first, then let shared collision/label layout place text boxes.

## Disposition

The sampled repair behaviors are consistent with the four completed code fixes; this does not close continuous-video visual acceptance. Additional label-target corrections are needed across this group. Root has been notified, and authorized design/test preparation while product writes are held until the shared capture run moves to a non-HMR acceptance port. No product or test file was changed during this rendered review.
