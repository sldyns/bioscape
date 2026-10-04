# Regulation and secretion: final registered-case rendered review

**Qualified pass for all five registered cases.** No new model, attachment or annotation defect was confirmed in the supplied English stage exports. This is a read-only review by `review_regulation`; no browser operation or product edit was performed for this case review.

## Coverage and evidence

The reviewer rechecked `processesByRoot` in the current catalog: secretion, promoterRegulation and enhancerRegulation each occur only under `cell`. The two regulation definitions each have one two-option control. The selection therefore covers every registered root and condition combination for these three processes.

| Process and parameters                      | Gallery key                                      | Stage progress values                    | Native seek assertions |
| ------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | ---------------------- |
| secretion, `{}`                             | `conditions-final-a-000-secretion-cell`          | 0, .135, .215, .435, .685, .795, .915, 1 | 19/19                  |
| promoterRegulation, `bindingSite=intact`    | `conditions-final-a-023-promoterRegulation-cell` | 0, .185, .355, .535, .675, .825, 1       | 18/18                  |
| promoterRegulation, `bindingSite=altered`   | `conditions-final-a-024-promoterRegulation-cell` | 0, .185, .355, .535, .675, .825, 1       | 18/18                  |
| enhancerRegulation, `coactivator=competent` | `conditions-final-a-025-enhancerRegulation-cell` | 0, .185, .365, .545, .675, .815, 1       | 18/18                  |
| enhancerRegulation, `coactivator=impaired`  | `conditions-final-a-026-enhancerRegulation-cell` | 0, .185, .365, .545, .675, .815, 1       | 18/18                  |

Root's source index is `evidence/browser/conditions-final-gallery-index.json`. Selected records are preserved in `evidence/regulation/final-case-gallery-selection.json`. The compact verified manifest, per-case JSON hashes, original-image hashes and exact close-inspection list are in `evidence/regulation/final-case-review-summary.json`.

All five complete contact sheets were inspected, covering 36 stage images. Eighteen necessary original WebPs were viewed at their original 960 × 640 resolution: six secretion, four intact-promoter, three altered-promoter, three competent-enhancer and two impaired-enhancer frames. The altered-promoter .675, .825 and end images are byte-identical; the end original was inspected once and the equality recorded by SHA-256 rather than displaying duplicate copies.

All 91 native seek assertions returned exactly their requested progress; all five records report `complete`, terminal progress 1 and no errors. There are 86 actual model updates in these records. These are **irregular seeks**, including deliberately backward steps; `monotonicLive=false` is expected. Their roughly 1.8–2.05 second runs and capture intervals are neither full 24/32/34 second playback nor an FPS measurement. Previous default-condition continuous-playback evidence remains a separate gate.

## Rendered observations

**Secretion.** The complete sheets preserve the ER/cisternal and plasma-membrane cutaways. Original .135 shows the ER connection; .215 shows cargo within its incoming carrier; .685 shows the trans-side neck before free transport. The .435 and .795 sheet frames retain lumen/cargo compartment order. At original .915 the cargo remains inside the docked vesicle on the cytoplasmic side, and the end image shows extracellular cargo with the incorporated orange membrane patch. Cis/trans leaders now terminate on the named membrane faces. All six captions are readable; extracellular/cytosolic captions are intentional region notes. No hard cropping or caption box masking of important model geometry was confirmed.

**Intact promoter.** TFIID bends the highlighted upstream site, Pol II and XPB assemble, and the bubble remains local. The .825 original shows the short RNA with its 5-prime leader at the free endpoint; the end original shows an extended released end and a downstream polymerase. The TFIID, Pol II and XPB leaders terminate on their actual protein surfaces; +1 points to its marker, and coding/template annotations agree with the rendered strands. Label activation follows the visible assembly and RNA. No stale caption or confirmed clipping remains in these samples.

**Altered promoter.** The early sheet frames show transient TFIID approach; by original .535 it has retreated. Pol II and XPB remain unassembled, and no bubble, nascent RNA or active RNA/XPB caption appears. The scoped “Altered site: no stable PIC” annotation is readable. The last three images are identical, consistent with this completed unsuccessful attempt; it is not evidence that the native seek failed. Original-size inspection confirms the left DNA labels remain inside the canvas despite the smaller contact sheet making their margins harder to judge.

**Competent enhancer.** All seven nucleosome cores and their continuous linkers remain distinguishable. Activators bind, Mediator approaches, and the .675 original shows nascent RNA with the leader at its real free endpoint. At .815 the first released product persists while the polymerase recycles; the inactive nascent-RNA caption is appropriately absent. The end original contains two released orange products without an active nascent-RNA caption. The Pol II surface anchor follows the transformed complex. No extra topology or labeling defect was confirmed.

**Impaired enhancer.** Mediator remains detached and elevated while promoter machinery remains visible. No nascent or released RNA appears across the seven supplied stages, and no nascent-RNA label is active. The readable “Recruitment impaired: no burst this window” annotation states the modeled observation without claiming universal absence of basal transcription. Chromatin still changes conformation, as described for both conditions. No caption clipping or important box/model overlap was confirmed.

## Acceptance boundary

The English registered-case static/seek review passes within this scope. It adds alternate-condition coverage to the earlier default-only rendered review. It does not certify Chinese placement, uninterrupted motion comfort, physical devices or sustained rendering performance. In particular, sampled secretion frames cannot replace the focused .20/.90 continuity regressions, and enhancer .79–.82 recycling still requires its separate continuous-playback evidence.

The later shared caption leader-layer repair postdates these `conditions-final-a` images. It changes only export paint order, so it does not invalidate their geometry, condition or native-seek observations. Final shared-layer visual evidence is separately recorded in `resolutions/player-label-layer.md`; no assertion here treats the older images as proof of that final paint order. Immutable Phase A findings remain unchanged.
