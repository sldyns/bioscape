# Chromatin Phase A review — 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and test files remain unchanged. This review covers four models and **13 actual registered root/control combinations**, queried from `processesByRoot`; no specialized neuron/muscle/erythrocyte root adds another chromatin model.

| Model | Roots and conditions | Verdict |
| --- | --- | --- |
| chromatinAccess | cell/plant/yeast × active/disabled hydrolysis | qualified_pass |
| tad | cell × normal/boundaryDeleted/cohesinDepleted | qualified_pass |
| plantGenome | plant × intact/removed targeting peptides | qualified_pass |
| plantRdDM | plant × active/inactive DRM2 | confirmed_issue |

## Confirmed issue

**20261004-chromatin-01 · P1 · plantRdDM: detached growing RNA and uncoupled producer polymerases.**

`plantRdDMProcess.js:204–223,262–292` grows the first RNA strand along a remote line while Pol IV remains on the source DNA. At progress .10, the actual visible 3′ tube end is **2.1232 scene units outside the entire Pol IV object bounding box**; at .15 the conservative gap is **3.1373**. RDR2 independently translates from x=.84 to −2.4. This does not depict the connected Pol IV–RDR2 precursor-production machine. The [opened primary RDR2 paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC8713982/) describes physical association, RNA engagement and coupled synthesis before dsRNA release to DCL3.

Repair should preserve detail, connect the producer complex and actual growing RNA ends, then explicitly release and move the same completed precursor to DCL3. Both DRM2 conditions need actual-port/actual-buffer regressions. A disclaimer about the source/target layout would not repair the attachment.

## Qualified passes and limits

- **chromatinAccess:** retained histone octamer, left-handed nucleosomal superhelix/right-handed duplex, unchanged sequence coordinate, ATP dependence and post-exposure binding are consistent with the limited illustration. Plant and yeast wording is supported by [Arabidopsis CHR11/17 experiments](https://onlinelibrary.wiley.com/doi/10.1111/tpj.12499) and [ISW1 structures](https://www.nature.com/articles/s41594-019-0199-9). Root should inspect the sharply turning wrapping seam in playback.
- **tad:** constant material contour, attached CTCF loci and condition changes are coherent. Contact-domain wording avoids membranes, guaranteed activation and absolute CTCF walls; the [opened primary CTCF experiment](https://pmc.ncbi.nlm.nih.gov/articles/PMC10132984/) supports those qualifications. A rapid duplex-frame turn near the loop mouth needs rendered inspection. Refining the timestep makes its displacement converge, so it is **not recorded as a proven discontinuity**.
- **plantGenome:** compartment locations, NPC path, cytosolic translation attachment/release, targeting-dependent protein import and local organelle products are coherent. Nuclear RNA does not enter protein translocases. [TOC/TIC research](https://pubmed.ncbi.nlm.nih.gov/30464337/) and [Arabidopsis mitochondrial import experiments](https://pubmed.ncbi.nlm.nih.gov/14730085/) support the illustrated scope. Full transcription machinery and every import route remain deliberately omitted.
- **plantRdDM downstream:** guide/passenger distinction, antiparallel scaffold relationship, original-cytosine/sugar continuity and DRM2-active-only new methylation were traced. Passing these checks does not cure the upstream defect.

## Evidence

- Fresh independent diagnostic: **432 state/seek checks across 13 combinations**, finite buffers/bounds and stable node/material/geometry inventories; **1,089 uniform motion samples across nine distinct geometry branches**. See [diagnostics.json](../evidence/chromatin/diagnostics.json), [diagnose.mjs](../evidence/chromatin/diagnose.mjs).
- Focused motion investigations: [fine-motion.json](../evidence/chromatin/fine-motion.json), [strand-jump.json](../evidence/chromatin/strand-jump.json), [jump-convergence.json](../evidence/chromatin/jump-convergence.json). At the TAD mouth, 0.05060 movement over Δp=1e−6 narrows to 0.0000671 over Δp=1e−9; this distinguishes a steep turn from a finite state jump.
- Existing owned scientific suite rerun: passed, **13 combinations / 161 stage/seek states**, including actual NPC and constant-contour checks. Log: [science-baseline.log](../evidence/chromatin/science-baseline.log). Read-only review and new diagnostics found an issue beyond that suite.
- Both languages, every declared stage/control/label and the plant/yeast context overrides were read. None of these four models declares a legend. No full-workspace tests, browser actions, product edits or historical-audit rewrites were performed.

Root still owns rendered continuous-playback review, visual legibility and performance acceptance. No release or publication claim is made.
