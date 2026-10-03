# Renderer polish — 2026-10-03

## Evidence and changes

- Inspected the actual Studio download `/Users/kun/Downloads/BioScape-动物细胞 (5).png`: a colored, blocky semicircle below the cell was present on transparency. Source tracing identified `CellScene`'s decorative gradient floor, a separate seven-unit plane at y = -3.1. Transparent CellScene captures now hide only this plane and restore its original visibility in the existing `finally` path. Biological transparent materials remain untouched. Solid-background exports and live display retain their floor.
- `sceneCapture` previously drew every leader with `rgba(74,80,93,.65)`. On Studio's `#141b26` this was weak. Export leaders now select light/dark ink from linear background luminance. Transparent labels use dark ink over a white halo so an eventual dark or light placement remains legible. Label source anchors/layout remain unchanged.
- Whole-neuron presentation normalizes its longest extent to 5.4, but assembled camera fitting previously enforced the round-cell distance floor of 9.8. Only the whole-neuron root now uses the existing perspective bounds fitter at separation zero, with the existing controls minimum distance. Rotated captures supply camera axes; exploded fitting still includes separated parts. All other root/detail base distances are unchanged.

## Validation

- `node --test tests/scene-capture.mjs`: 7/7 passed. Covers saved-view validation, camera immutability, aspect/turn behavior, label placement/word wrapping, leader contrast exceeding 4.5:1 on dark/light Studio themes, and 36 aspect/turn/separation corner-projection configurations.
- Actual browser fixture `http://127.0.0.1:5174/tests/scene-bridge-browser.html` reached PASS via CUA after a clean reload. Includes phageTail, animal cell, neuron and process; initial camera restoration, silent setView, resized fit-relative zoom, real model pose changes and exact restoration, repeated target release/capture, disposal/null readiness. Added solid capture before/after transparent calls to assert exact restoration of decorative floor visibility.
- Inspected fixture output canvases: animal-cell transparent results no longer show the ground semicircle; neuron normal/exploded results retain anchored labels.
- `node tests/specialized-cells.mjs` stopped at existing/model-lane centreline assertion line 140 before framing assertions. Reported to root for routing to the neuron owner; not claimed passing.

## Remaining visual gate

Studio owner supplied the integrated 2560 × 2560 transparent download `/Users/kun/Downloads/BioScape-动物细胞 (6).png`; both owners inspected it on black. The floor artifact is absent and the dual-tone leaders remain legible. Dark solid-background PNG verification remains with the Studio owner. Whole-neuron stage framing should be reviewed again on root's stable final preview after the model lanes finish. This is a scoped renderer result, not whole-project or device acceptance.
