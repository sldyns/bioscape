# Chromatin Phase B resolution — 2026-10-04

**20261004-chromatin-01 is fixed in code and covered by actual-geometry regressions.** Root rendered review remains outstanding.

Pol IV and RDR2 now remain together at the source DNA with enzyme-owned RNA ports and a connecting corridor. The first RNA strand grows with its 3′ end in Pol IV, transfers that same end to RDR2, and threads through RDR2 while the complementary 3′ end stays attached to its production port. Only the completed duplex is released. Its curved path then unbends into the existing DCL3 site without swapping molecules or crossing the two strands. Bilingual descriptions and an [opened primary RDR2 reference](https://pmc.ncbi.nlm.nih.gov/articles/PMC8713982/) explain the coupled sequence.

The three qualified-pass product modules are untouched. From progress .34 onward, downstream RNA vertex buffers, draw ranges and visibility are identical to the original in 12 comparison states across both DRM2 conditions. Base identity and methylation behavior remain unchanged.

## Verification

- New `upstream.test.mjs`: **242 attachment/handoff checks, 24,624 strand-separation checks, 32 phase-boundary checks**, both DRM2 branches. The original baseline fails the new physical nascent-end attachment assertion. See [upstream-after.log](../evidence/chromatin/upstream-after.log) and [baseline rejection](../evidence/chromatin/upstream-baseline-rejection.log).
- `science.test.mjs` imports the new test and retains every original regression: **13 root/control combinations / 161 stage-and-seek states**, passed. [Log](../evidence/chromatin/science-after.log).
- `plantSmoke.test.mjs`, `refinementSmoke.test.mjs` and `smoke.test.mjs` passed. Owned-file formatting and whitespace checks passed.
- Fresh [diagnostics-after.json](../evidence/chromatin/diagnostics-after.json): **432 state/seek checks; 1,089 uniform motion samples**; stable inventories, finite geometry and deterministic arbitrary seeking. [Downstream preservation](../evidence/chromatin/preservation.json) records exact buffer equality.

The plant smoke test initially failed because its old assertion still expected seven methyl marks. The original baseline fails identically ([evidence](../evidence/chromatin/plant-smoke-baseline.log)): the existing scientific model modifies one retained cytosine. With explicit root authorization, the stale assertion was corrected to one and strengthened with actual methyl-carbon count, retained cytosine-parent identity, and active/inactive visibility checks. No seven-marker geometry was restored, and no valid scientific regression was removed.

## Changed files and remaining limits

Changed only `plantRdDMProcess.js`, added `upstream.test.mjs`, imported it in `science.test.mjs`, and repaired the authorized stale assertion in `plantSmoke.test.mjs`, all within the owned module. New evidence and resolution files are in this dated review directory; Phase A and historical audit evidence remain unchanged.

Root should inspect the connected producer, release/unbending legibility and labels in continuous playback, and retain the earlier chromatinAccess/TAD rapid-contact-turn checks. No browser, full-workspace suite, deployment or physical-device claim is included here.

## Authorized follow-up: integrated-render annotation repairs

The initial rendered batch exposed genuine leader-target errors. Four additional P2 issues were recorded in [repair-discoveries.json](../evidence/chromatin/repair-discoveries.json), preserving Phase A and the original captures. Product writes waited until root moved acceptance playback to the dedicated no-HMR service.

| Issue | Model | Correction |
| --- | --- | --- |
| 20261004-chromatin-02 | chromatinAccess | Histone/remodeler/factor anchors use actual rendered subunits; the sequence marker follows its own real centerline. |
| 20261004-chromatin-03 | tad | CTCF leaders target the green proteins or deleted-site marker; cohesin targets its hinge and the contact caption targets the dashed connector. |
| 20261004-chromatin-04 | plantGenome | Genome and translocase anchors target their actual DNA/pore positions; both cytosolic ribosomes have body anchors; cargo labels follow the visible precursor, including retained cytosolic controls. |
| 20261004-chromatin-05 | plantRdDM | Enzyme anchors use the actual drawn domains and follow movement; DNA/scaffold anchors track the original flipped cytosine and actual transcript midpoint. |

All four new issues are fixed in code and accounted for once in `chromatin.json`. Contextual region captions remain area descriptions; object anchors are no longer used as text-layout offsets. Existing scratch vectors/objects are reused and no scene geometry/material/node is allocated during update.

New `labelAnchors.test.mjs`, imported by the scientific suite, passes **1,015 target checks over 195 non-monotonic states / all 13 root-control combinations**. Each of the four pre-repair source fixtures is rejected on its real misplaced-leader invariant: ISWI misses its subunit by .7385 scene units, left CTCF by .8902, the upper cytosolic ribosome by 1.0754, and DCL3 by .7906. [Baseline rejection evidence](../evidence/chromatin/label-anchor-baseline-rejections.json).

Mechanism geometry is unchanged by these annotation edits: position/normal/instance buffers, transforms, visibility and draw ranges are identical in **104 scene states across all 13 combinations**. [Preservation evidence](../evidence/chromatin/label-geometry-preservation.json). All four owned suites and formatting/whitespace checks pass again; logs end in `-labels-after.log` under the chromatin evidence directory.

The earlier statement that three product modules were untouched describes the first RNA-mechanism repair. They now contain only their authorized annotation fixes. Root must rerender the updated four models before accepting label layout; the previously reviewed stage sheets remain pre-fix evidence.
