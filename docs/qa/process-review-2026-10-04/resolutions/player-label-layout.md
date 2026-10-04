# Shared export-label layout repair — 2026-10-04

Shared repair reference: **20261004-turnover-R05**. The issue remains registered once under turnover; this document supplies the shared implementation/verification receipt. Root explicitly transferred `src/scene/sceneCapture.js` and `tests/scene-capture.mjs` to this reviewer for this repair. Other shared modules were not edited.

## Confirmed problem and repair

The original 960 × 640 RNA stage-4 and SOS start/stage-5 WebPs confirm that readable label boxes cover peripheral CCR4–NOT and DNA geometry. The exact molecular anchors are correct; simply moving those anchors would undo prior repairs.

Capture now uses the transparent RGBA pixels already read from its existing render pass. Alpha above 8/255 marks a conservative coarse occupancy grid, whose integral image supports constant-time rectangle costs. Each already-selected left/right label column is placed with ordered dynamic programming: first minimize occupied model cells, then minimize squared displacement from the projected anchor heights. The result keeps all existing selected captions, their font size, original text/wrapping, box dimensions, anchor coordinates and column assignment. It never modifies model pixels, the camera, geometry or output resolution, and adds no GPU pass or readback.

The solver searches pixel-aligned vertical positions in O(captions × min(logical canvas height, 4096)); the grid has about 480 columns. Box clearance and conservative cell coverage keep captions away from thin visible geometry. If a fully occupied frame has no free layout, the solver retains every selected caption and chooses the least-overlap ordered layout. It cannot invent blank space under that constraint.

## Verification completed

- `tests/scene-capture.mjs`: **14/14 PASS**. All original tests remain; six new checks cover the three concrete peripheral-overlap arrangements, top-down alpha with scale mapping/thin translucent pixels, retaining captions when the whole frame is occupied, and bounding work even when a tiny labelScale makes logical coordinates very large.
- In each of the three meaningful layout fixtures, the original placement intersects occupied regions, the new placement has zero model-cell overlap, all labels/text/font/anchors/box dimensions remain identical, input RGBA remains byte-identical, and rectangles remain inside the canvas and mutually disjoint.
- Comparison capture test, browser-target bundle, formatting and owned-file diff check: **PASS**.
- Synthetic dense-mask Node CPU benchmark (12 labels): median/p95 **1.64/2.36 ms** at 960 × 640, **4.36/5.22 ms** at 1920 × 1080, **15.57/16.98 ms** at 3840 × 2160. These measure the new CPU work only, not browser or GPU frame rate.

Evidence lives in `../evidence/player/capture-layout-*.log` and `capture-label-cpu.json`. The retained before source is `../evidence/player/baseline-sceneCapture.mjs`.

## Original-pixel replay

Root provided three original transparent, unlabeled PNGs at the exact requested 960 × 640 size and default camera, plus actual in-app Chromium Canvas2D font measurements. Projection was reconstructed using the unchanged ProcessScene 36-degree camera and its full-progress sampled visible bounds, target/direction and zoom=1. Both the retained original layout and the repaired layout ran against the same RGBA buffers and exact font metrics.

| Original pose | Model pixels covered before | After | Labels retained |
| --- | ---: | ---: | ---: |
| RNA silencing, p=.575 | 3,205 | **0** | 7 / 7 |
| SOS response, p=0 | 1,761 | **0** | 5 / 5 |
| SOS response, p=.795 | 2,770 | **0** | 8 / 8 |

The measurement counts alpha above 8/255 inside each caption's rectangular bounds (a conservative envelope for the rounded box). Every original label/text/font/wrapped line/box dimension/anchor and side matches the old layout; only its vertical box position changes. All new boxes remain inside the canvas and are mutually disjoint. Original RGBA SHA-256 values are unchanged. Detailed per-label bounds and costs are in `../evidence/player/capture-label-original-pixel-replay.json`; the input, including browser metrics, is `../evidence/browser/capture-label-replay-browser-input.json`.

For the specifically reported boxes: CCR4–NOT moves vertically from y=363.65 to 314; the SOS damage-gap caption from 178.71 to 223; the stage-5 RecA caption from 142.57 to 120. Box widths/heights and leader anchors stay unchanged.

## Native rendered signoff — PASS for the reported cases

All three root-produced post-repair Chinese WebPs were inspected directly at original 960 × 640 resolution:

- `../evidence/browser/label-zh-final-000-rnaSilencing-cell-stage-4.webp` (p=.575): the CCR4–NOT box sits above/right of the visible enzyme; its green and orange lobes are exposed. All seven captions are readable, and none masks RNA/protein geometry.
- `../evidence/browser/label-zh-final-001-bacterialRepair-bacterium-start.webp` (p=0): the long damage-gap caption sits below the upper DNA flank; both strand captions clear the lower duplex. All five captions remain readable.
- `../evidence/browser/label-zh-final-001-bacterialRepair-bacterium-stage-5.webp` (p=.795): RecA sits above the upper DNA and the damage-gap box below/right of it. All eight labels, including LexA, polymerase and nascent RNA, remain present and readable.

This resolves the three confirmed R05 label-box/model overlaps without changing label anchors, font size, image resolution, model framing or geometry. Thin leader lines continue to reach their original model points; the repair concerns the opaque caption boxes. The shared source and tests are frozen at the hashes in the JSON companion. Root may update the existing turnover R05 status using this receipt; no duplicate issue record was added.

The rendered signoff covers these three Chinese poses/default conditions and cameras. Root retains broader 235-combination integration. Live DOM annotations are outside this repair. If another scene has no blank space at all, least-overlap placement retains captions instead of dropping them; the three reported R05 cases have the verified zero-overlap arrangement above.
