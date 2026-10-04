# parameciumLife Phase B resolution

All six Phase A issues have owned repairs and regressions imported by `science.test.mjs`. The three repair discoveries are also resolved below and in the JSON additionalRepairs entries; Phase A remains unchanged.

## 20261004-parameciumLife-01 — fixed

The tracked food vacuole now opens a paired-membrane aperture that shares both boundary curves with an open passage and the cytoproct surface. The original seven ingested particles pass through it as residues; membrane is retrieved toward the cytoplasm.

Verification: Actual shared outer/inner terminal curves, unobstructed exit rays at six egestion times, lumen-center transit for original cargo, and seven external end-state residues.

## 20261004-parameciumLife-02 — fixed

All six canals, ampullae, inlets, bladder ports and water routes use the same radial frame. Ampullae are open paired membrane tubes with fixed attached ends and a changing central bulge.

Verification: Both conditions, all six arms: distal inlet/ampulla boundary equality; ampulla/canal center and radius agreement with actual canal vertices; open-ended canal geometry. Previous bladder aperture/isolation regressions remain intact.

## 20261004-parameciumLife-03 — fixed

Entry, radial and discharged water shrink to zero before deterministic reuse. Radial rerouting around disconnection and cycle reset also occurs while markers are absent. Bladder rounding relaxes before cycle rollover; ampullary bulges vary smoothly.

Verification: Both conditions: every radial, entry and discharge modulo reset has negligible visible size; isolation/rerouting boundary samples reject visible teleports.

## 20261004-parameciumLife-04 — fixed

Two preallocated cortical hemispheres share the mother equator and deform into complete daughter cells. Their common ring closes to a pole before separation, avoiding the old whole-body swap. Cortical rows, basal bodies and cilia use the same map.

Verification: Same vertex buffers are continuous across p=.74/.9/.91/.95; actual seam rings match throughout constriction and daughter poles separate only after closure. Original closed micronuclear mitosis and macronuclear bridge tests remain passing.

## 20261004-parameciumLife-05 — fixed

The exchange channel now has open inner/outer half-cylinder walls and real cortical openings attached to both partner oral regions. The lumen and migrating nuclei share one spatial frame.

Verification: Seventeen exchange samples check actual complete nuclear-envelope vertices against the actual passage lumen; no cap blocks an axial ray; both opening positions match their partner attachment coordinates.

## 20261004-parameciumLife-06 — fixed

The same eight preallocated envelope patches deform from one synkaryon through two, four and eight nuclei. Daughter surfaces close before separation; detailed nuclear contents emerge at parent loci. Four posterior envelopes grow into anlagen and three anterior candidates shrink during nutritional selection.

Verification: Actual envelope vertices form generation-specific 1/2/4/8 sphere surfaces; fourteen old/new boundary samples reject vertex jumps; final geometry retains four anlagen and one micronucleus. Late irregular seeks hash identically after 1/0.13/NaN/0.54/0.

## 20261004-parameciumLife-07 — fixed

Bind specific labels to actual structure/lumen coordinates with full parent transforms and switch targets as nuclei divide or differentiate. Explicit environment/partner-region labels remain compartment anchors.

Verification: Owned review20261004.test.mjs compares actual food/nuclear/canal/pore world coordinates, moving donor lumen centers and changing conjugation targets at six stages. Imported by owned science.test.mjs.


## 20261004-parameciumLife-08 — fixed

Grow new meiotic nuclei from the parent locus; originate migratory pronuclei at the retained nuclear locus; shrink fusing pronuclei to zero; show the synkaryon from zero size; fragment the maternal macronucleus through continuous size transfer. Preserve haploid/diploid identities and persistent fragments.

Verification: Old nutrient/identity regressions remain; late arbitrary seeking and finite geometry checks pass. This smoothing changes illustration timing, not biological counts. Root rendered validation remains required.

## 20261004-parameciumLife-09 — fixed

For .14 <= p < .30, show 小核 · 减数分裂中 / Micronucleus · meiosis in progress. Show haploid meiotic products after the second division completes at p=.30. Geometry and actual anchor targets are unchanged.

Verification: Owned science regression checks Chinese/English identities at .14/.22/.30 boundaries and neighboring values, p=.155/.265/.335 and NaN, after resets 1/.725/0/.815/NaN. The original implementation failed at p=.14 after seek 1; the corrected owned science test passes.

Rendered boundary: Corrects stage identity to the already implemented two sequential meiotic divisions. Phase A remains unchanged. Existing full-b3 images predate this wording fix; new rendered capture is pending.

## Verification boundary

Local science and refinement/bundle smoke results are saved under `evidence/parameciumLife/`. These are geometry, determinism, finite-buffer/resource and browser-build checks. Root owns rendered and full native playback acceptance. No shared product code, full suite or browser was touched.

Additional fixes: `repair-discoveries/parameciumLife.json` records actual label/lumen endpoints and adjacent early nuclear transition smoothing.
