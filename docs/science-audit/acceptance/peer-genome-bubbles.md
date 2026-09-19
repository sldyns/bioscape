# Independent follow-up: genome DNA opening collisions

Reviewer: `/root/p_bacterial_core`. Product files were read only. No browser was used. This focused follow-up tests the newly established bubble-interpolation failure class; it does not replace the earlier audit.

**Initial pre-fix verdict: confirmed issue in both `dnaRepair` and `replication` (P1).** Both opposite DNA backbone surfaces intersect during their illustrated opening transition. Repair also intersects during reclosure onto the newly synthesized patch. The results were sent to `/root/p_translation` and `/root` before writing this note.

## Post-fix independent acceptance

**Current verdict: both `genome-peer-bubble-01` and `genome-peer-bubble-02` are closed with qualified passes.** This supersedes the historical defect findings below. The author changed `nuclearModels.js`; the reviewer only reran probes and updated this document.

The repaired replication model transports helical phase with the moving fork so that the separation vector points toward the outgoing branches during opening. The repair model interpolates an unwrapped angular phase and a strictly positive separation radius, keeping the incision interval fully open. These changes preserve distinct backbone routes rather than interpolating opposite Cartesian vectors through zero.

The original independent `/tmp/peer-genome-bubbles.mjs` sweep was rerun in full: **2,418 states**, all three roots, both controls, opening/moving-fork/filling/closure stages and intermediate times. No distinct-chain pair had centerline distance below its actual tube-radius sum. Minimum conservative surface clearances were **0.27272208** for repair and **0.20357260** for replication. The original different-index nearest-pair search also returned zero actual triangle intersections in all three witness frames.

A second pinned-witness test retained the exact originally failing indices, rather than letting the minimum search select different segments:

| Original witness                                        | Post-fix centerline distance | Actual triangle-edge hits |
| ------------------------------------------------------- | ---------------------------: | ------------------------: |
| Repair .225, damaged 139 / intact 139                   |                   1.05674034 |                         0 |
| Repair .225, damaged 99 / intact 100                    |                   1.05442857 |                         0 |
| Repair .785, intact 100 / patch 100                     |                   1.05838060 |                         0 |
| Repair .785, intact 100 / patch 99                      |                   1.05607990 |                         0 |
| Replication .265, leading parent 64 / lagging parent 63 |                   1.07931773 |                         0 |

The reviewer also executed the updated `node src/processes/modules/genome/science.test.mjs`: PASS for the original 120 scientific cases, finite/stable/deterministic checks in all eight control branches, and **2,412 bubble/fork states, 9,062,661 cross-strand near-neighbor pairs, including 7,759,980 unequal-index pairs**. Minimum reported conservative tube clearance was 0.2035725966, consistent with the separate probe.

Recheck commands:

- `node /tmp/peer-genome-bubbles.mjs > /tmp/peer-genome-bubbles-recheck.log`
- `node /tmp/peer-genome-offdiagonal.mjs > /tmp/peer-genome-offdiagonal-recheck.log`
- `node /tmp/peer-genome-pinned-witnesses.mjs`
- `node src/processes/modules/genome/science.test.mjs`

Limits: these checks cover the sampled frames and the actual rendered backbone surfaces, with intended covalent joins excluded. They do not certify atomic unwinding mechanics, torsional stress, every unsampled real-valued time, or rendered visual acceptance. No remaining instance of the two reported bubble-collision defects was observed.

## Historical pre-fix evidence and reproduction

The probe imports the real models and reconstructs every visible backbone cylinder's endpoints and transforms from `instanceMatrix`. It minimizes distance over independently varying parameters on every relevant pair of segments, including different indices; it does not compare only equal-t samples. Pairs separated too far in x are safely rejected because x is monotonic and their x separation alone exceeds the tube diameters. Candidate collisions are then confirmed using triangle-edge intersections of the actual transformed indexed `CylinderGeometry` meshes. Reported hit counts count edge/triangle hits, not unique spatial intersections.

Coverage: cell/plant/yeast × both controls; all stage starts/midpoints, special incision/filling/closure times and a uniform .005 progress grid. This is 202 frames per repair combination and 201 per replication combination, totaling 2,418 model states. The findings are identical across the three roots. Near-neighbor segments of the same covalent chain and intended RNA/DNA or repair-junction connections are not treated as illegal duplex crossings.

| Model / condition                                           | Progress | Actual rail segments                  | Independent closest-point distance | Tube radii sum | Actual triangle intersection |
| ----------------------------------------------------------- | -------: | ------------------------------------- | ---------------------------------: | -------------: | ---------------------------- |
| dnaRepair, active and blocked                               |     .225 | damaged 139 / intact 139              |                        .0113951113 |           .074 | Yes, 126 edge/triangle hits  |
| dnaRepair, active and blocked, explicitly different indices |     .225 | damaged 99 / intact 100               |                        .0269731808 |           .074 | Yes, 54 hits                 |
| dnaRepair, active, closing onto patch                       |     .785 | intact 100 / repair patch 100         |                        .0145866688 |           .074 | Yes, 106 hits                |
| dnaRepair, active, explicitly different indices             |     .785 | intact 100 / repair patch 99          |                        .0281499640 |           .074 | Yes, 52 hits                 |
| replication, active and absent ligase                       |     .265 | leading parent 64 / lagging parent 63 |                        .0298976762 |           .074 | Yes, 80 hits                 |

For replication at .265, the closest actual points are `(-1.8666666914, .0076253135, -.0133121088)` and `(-1.8694397798, -.0121662331, .0089247008)`, respectively at local segment parameters 0 and .9168063468. This explicitly demonstrates the defect beyond an equal-parameter test. Repair at .225 likewise intersects between damaged segment 99's endpoint and intact segment 100 at parameter .5694217974.

## Root causes and requested fixes

**genome-peer-bubble-01 — dnaRepair.** In `src/processes/modules/genome/nuclearModels.js:308–322`, both helices are interpolated toward fixed ±y offsets using `local * opening`; the original transverse separation can cancel against those offsets before full opening. The same geometry generator is reused when the patch and template reclose. Opening p=.225 is affected in both incision controls; active p=.785 additionally reproduces the failure during reclosure. `blocked` stops before that closing phase, rather than avoiding the earlier opening defect.

**genome-peer-bubble-02 — replication.** In `src/processes/modules/genome/nuclearModels.js:86–111`, the two parent strands interpolate from the rotating duplex vector to separated daughter-axis offsets. The moving fork sweeps this blend through phases where the vectors cancel. The leading-strand straightening near CMG does not protect the parental fork junction; the confirmed pair lies between different parent segment indices. This is separate from the corrected CMG-protein threading invariant.

Fix both by preserving a nonzero, oriented strand-separation vector while unwinding and moving the centerlines; unwrap/transport phase and then separate, rather than linearly blending opposed vectors through zero. Preserve right-handed closed DNA, material identity, incision/patch endpoints and the existing CMG leading-template/excluded-strand geometry. Confirm clearance using independently parameterized cross-strand segment pairs and the actual tube radii or actual triangle surfaces through dense opening, moving-fork and closing sweeps. An equal-t separation assertion alone is insufficient.

This concern is about the actual strand surfaces passing through one another, not a claim that the scene must simulate atomic dynamics. The established [NER description](https://www.ncbi.nlm.nih.gov/books/NBK26879/) retains the intact complementary template, removes the damaged segment, and fills/seals that same gap. The primary [CMG-fork structure 5U8T](https://www.rcsb.org/structure/5U8T) supports separate leading-template threading and excluded lagging template. Both sources were freshly opened during this follow-up; neither implies cross-strand backbone passage during ordinary unwinding.

## Checks not promoted to findings

The broad distance screen also reports legitimate damaged-strand/patch contact at the repaired junction: damaged segment 79 meets patch segment 80 at x=−4/3. This was manually excluded as intended covalent continuity. It also reports a nearby lagging-DNA/RNA pair at distance .05615, but its finite cylinder meshes have **zero** triangle intersections and those parts belong to one chain; it is not reported as a defect. These examples show why a radius-only capsule proximity screen is not sufficient evidence by itself.

The existing `genome/science.test.mjs` checks CMG/protein intersections but has no repair import or opposite-DNA bubble-surface test. Its earlier passing status therefore does not cover this newly discovered class.

Commands/artifacts:

- `node /tmp/peer-genome-bubbles.mjs` — completed the 2,418-state geometry sweep and wrote `/tmp/peer-genome-bubbles-results.json`.
- `node /tmp/peer-genome-offdiagonal.mjs` — confirmed the three explicitly different-index witness pairs and their actual cylinder triangle intersections.
- No product/test/model files, prior audit evidence, or existing resolution records were modified. Only this follow-up acceptance note was added.
