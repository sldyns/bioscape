# Independent acceptance: bacterialExpression bubble extension

Reviewer: `/root/p_bacterial_core`. **bubble-extension-01: closed, qualified pass.** The original opposite-backbone solid intersection is corrected. This follow-up used read-only imports and in-memory geometry probes; no product files, prior audit evidence or resolution records were edited. No browser was used.

## Original defect and corrected geometry

The original finding in `peer-bubble-extensions.md` was a strict solid intersection at p=.521, sigma present, `DNA-strand-0-31` / `DNA-strand-1-31`: axis distance 0.0000643364 versus radius sum .094. The midpoint lay inside both actual 16-sided cylinder solids. This was not just projected overlap or a same-t spacing concern.

Source inspection confirms that the corrected `dnaFrame` defines one orthogonal Y/Z frame, a positive radius `.2 + .15 * bubble`, and local angular unwinding. The two strands retain opposite radial identities. DNA thickness and visibility are preserved. `hybridPoint` follows that same template frame, and the RNA 3′ active-end connection is retained.

## Independent actual-geometry results

`node /tmp/peer-bacterialExpression.mjs` imports the actual model and reconstructs every cylinder from its world transform. It minimizes full finite-segment distances with separate parameters on both segments, including unequal indices. The independent time set includes endpoints, the original p=.521 witness, and 1,000 offset samples `(i+.37)/1000`, rather than merely repeating the author's exact progress grid.

| Branch        | States | Minimum opposite-tube clearance | Opposite-phosphate clearance | Phosphate-to-opposite-tube clearance |
| ------------- | -----: | ------------------------------: | ---------------------------: | -----------------------------------: |
| sigma present |  1,003 |                     .2995053041 |                  .2959999200 |                          .2942520637 |
| sigma absent  |  1,003 |                     .3005807423 |                  .2959999203 |                          .2982904823 |

These clearances subtract actual cylinder world radii or phosphate-instance bounding radii. Positive clearance bounds the complete cross-strand tube/sphere surfaces, not only their centers. Each branch checked **577,728 unequal-index tube pairs**, in addition to same-index pairs. Safe x-range rejection was used only where coordinate separation already exceeded all relevant radii.

The independent probe additionally checked actual transformed triangle surfaces of nonadjacent same-strand capsule candidates on an offset subset of frames. All **772 candidates** in the active branch produced **zero triangle-edge hits**; the inactive branch had no such candidates. The full nonadjacent self-strand acceptance is also supported by the author's exact convex-prism SAT sweep described below, which handles flat cylinder caps rather than treating rounded capsule proximity as a collision.

Pinned original witness after repair:

| Condition, p=.521 | Same original segments 31 / 31 axis distance | Actual triangle-edge hits |
| ----------------- | -------------------------------------------: | ------------------------: |
| sigma present     |                                  .4564327872 |                         0 |
| sigma absent      |                                  .3945807423 |                         0 |

## Regressions actually executed

- `node src/processes/modules/bacterialCore/bubble.science.test.mjs` — PASS. Both sigma conditions, 1,001 frames each; all nearby cross-strand pairs, both self-strands excluding intended adjacent joints, phosphate envelopes and RNA 3′ attachment. The full sweep performed 7,565 exact 16-sided prism SAT checks including its negative control. The test restores the old formula into the two in-memory witness cylinders, reproduces distance .0000643364, proves strict containment in both solids and correctly rejects it.
- `node /tmp/peer-bacterialExpression.mjs` — PASS. Independent 2,006-state offset scan and direct triangle-surface checks; results saved to `/tmp/peer-bacterialExpression-results.json`.
- `node src/processes/modules/bacterialCore/science.test.mjs` — PASS. Existing 466 geometry-state checks, finite buffers, stable resources, deterministic seeks, local bundles and all seven original-class defect injections. In particular, RNA–template/active-end and peptide-exit invariants remain intact.

## Boundary and reviewed versions

This acceptance closes the reported bubble-collision class at the sampled states. It does not certify atomic torsional mechanics, continuous-time dynamics, all other possible protein–nucleic-acid contacts or final visual quality. A negative same-strand _capsule_ gap alone is not a remaining defect when the actual flat-capped polygonal solids are separated. Root retains visual acceptance.

SHA-256 of the reviewed frozen files:

```text
fce2865fce0d526098b9f8c0d85c1ae37e5f34592687f1fe1d05d052a5470987  bacterialExpressionProcess.js
2556101f3b51dc403cfa2f84c4f5cb188b5da64ca94bfb3e57ff018cf0c5eb0e  bubble.science.test.mjs
```
