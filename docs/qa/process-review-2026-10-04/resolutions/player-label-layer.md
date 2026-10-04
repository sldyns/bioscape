# Exported caption leader-layer repair

Issue `20261004-shared-capture-leader-layer-01` is fixed and verified in six native original exports covering English, Chinese and transparency. Its regression rejects the retained old implementation. This is a separate shared annotation issue from turnover R05's geometry-avoidance layout repair. `evidence/player/repair-discoveries.json` registers the issue for reconciliation and references the original `evidence/player/leader-layer-discovery.json`; `resolutions/player-label-layer.json` records the current verification and source hashes.

## Confirmed defect and repair

Root reported, and this reviewer directly confirmed at original 960 × 640 resolution, that `evidence/browser/conditions-final-a-037-plantGenome-plant-stage-4.webp` contains later TOC/TIC and TOM/TIM leaders crossing previously painted English transit-peptide/presequence captions. The pose is plantGenome / plant, `targeting=removed`, progress .585. The exported drawing loop painted each leader, then its box and text, so a later leader could cover earlier text.

`src/scene/sceneCapture.js` now draws every leader and transparent-background halo first, then draws every caption background, border and text. The same projected label data and layout are used. Label selection, anchors, strings, font, wrapping, dimensions, geometry avoidance, camera, scene geometry and model progress are unchanged. No GPU pass or readback was added. The only other source edit exports this real draw function for direct regression testing.

## Verification

- `tests/scene-capture.mjs`: **15/15 pass**, including a real draw-function recording of Canvas2D operations for both opaque and transparent backgrounds. All four test captions and original strings remain present; every leader stroke, including a transparent halo stroke, precedes the first caption fill and text call.
- The retained old implementation, with only an export shim for test access, **fails** that same assertion with “No later leader may be painted over any caption background”. The source and failure log are `evidence/player/baseline-sceneCapture-before-leader-layer.mjs` and `capture-leader-layer-negative.log`.
- Comparison capture, browser bundling without output, formatting and owned-file diff checks pass. Full logs use the `evidence/player/capture-leader-layer-` prefix.
- R05's replay against original native transparent PNGs and native Chromium font measurements still passes: covered model-alpha pixels remain **3,205 / 1,761 / 2,770 → 0 / 0 / 0**, retaining **7 / 5 / 8** labels. This confirms that the separate layout repair's actual-pixel invariant is preserved.

## Native image verification and impact

The reviewer directly inspected the new original `conditions-final-b-010-plantGenome-plant-stage-4.webp` and `-end.webp`. In both English exports the two long removal captions are readable, and the later TOC/TIC and TOM/TIM leaders disappear underneath their caption backgrounds rather than striking through the letters. Both samples pass for the reported layer defect. Root also reports the chromatin owner's scoped signoff for these frames and the early RdDM samples; that is a separate reviewer result, not a claim that this reviewer inspected those additional originals.

The reviewer also directly inspected the Chinese originals `conditions-final-c-019-plantGenome-plant-stage-4.webp` and `-end.webp`; their case JSON confirms `targeting=removed`, language `zh`. Both long removal captions remain readable, with TOC/TIC and TOM/TIM leaders below the caption layer and all ten active captions retained. These samples pass.

The reviewer then inspected original transparent PNGs `label-transparent-final-001-plantGenome-plant-stage-4.png` and `-end.png`; their run JSON confirms Chinese and removed targeting. All ten captions remain clear, and both the dark leader cores and white halos are beneath the caption backgrounds and text. No strike-through remains. These two originals pass. Their RGBA alpha ranges are 0–255, with 404,408 / 404,419 fully transparent pixels, confirming that the black image-viewer backdrop is not baked into the export. Exact hashes and alpha counts are retained in `evidence/player/capture-leader-transparent-alpha.json`.

The targeted native layer gate is closed. The product source/test hashes still match the versions used by the passing regressions; no product code changed during this final image review.

This paint-order change does not invalidate earlier geometry, root/condition or irregular-seek evidence from the 235-case collection. Its old images cannot prove the final annotation layer. Targeted recapture of the reported plantGenome pose in English/Chinese, a dense-label pose and a transparent-halo pose is sufficient to validate this shared drawing change; rerunning all scientific diagnostics or uninterrupted playback is not warranted by it. If every retained gallery image must depict the final shared code, those images need re-exporting, which is a separate artifact-consistency requirement.
