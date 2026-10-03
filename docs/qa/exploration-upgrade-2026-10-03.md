# Exploration, Studio and comparison acceptance

> This is the initial functional pass. The subsequent complete polish review and current acceptance record are in [polish/README.md](polish/README.md). Counts and unresolved gates below are historical.

Date: 2026-10-03. Local implementation branch: `codex/explore-studio-compare`. Base commit: `f049ae2f7705ecaa61884675e83da2cb54220270`. This record does not claim a production deployment.

## Delivered

- Structure-to-process links cover 84 processes, 114 supported root/process combinations and 455 validated destinations. Entry points use actual stage boundaries. Return restores the originating path, camera, mode, separation and labels; process parameters, speed and progress are retained.
- Versioned scene links restore standalone structures, processes and both comparison panes. Inputs are bounded and validated against model-specific controls. Each browser-history entry retains the latest local view independently of other visits to the same model.
- Studio captures the real rendered model, with landscape/portrait/square layout, 1920/2560 long-edge PNG, light/dark/transparent image backgrounds, labels, title and attribution. Browser-supported MP4 or WebM records orbit, process or disassembly. Cancel, close, retry and context-loss recovery release resources.
- Comparison offers independent model/mode/separation/label controls, linked or independent orbit, swapping, reset, part navigation and bilingual difference notes. Both scenes are independently fitted, not physically to scale.
- Mature human erythrocyte, representative myelinated multipolar neuron and skeletal muscle fibre add 16 structure nodes, including 13 parts. Sources and omitted anatomy are documented in the interface. Related processes preserve the specialized origin. The neuronal action-potential process explicitly describes its unmyelinated example; it does not claim to simulate saltatory conduction.

## Automated verification

`npm run check` exited 0. The final run included formatting, hierarchy/model transfer checks, all focused feature tests, existing scientific regressions, production build and release-asset checks. Result: 179 structure nodes, 257 routes, 176 detail transfers, zero model errors; 84 processes with 2679 seeks and zero process errors. Release validation checked 357 built files, localized media hashes, notices, subdirectory asset paths and development-file exclusions. `git diff --check` passed.

Log retained locally: `/tmp/bioscape-upgrade-final-check.log`.

## Real browser verification

Environment: Codex in-app Chromium, final production preview `http://127.0.0.1:4197/`, with source fixes additionally checked on `http://localhost:5174/`.

- Structure -> process -> original structure: exact saved camera vectors/zoom, exploded separation 100 and labels matched the departure state. Returning to the process restored progress 0.67, speed 0.5, proton-leak condition and hidden annotations. A full share-link reload restored these fields.
- Browser history: ordinary Back/Forward and changes made after revisiting an earlier entry restored the latest controls; visits to the same model are independently keyed. The regression was first reproduced before the fix.
- Specialized axon -> action potential retained `neuron/neuronAxon`, entered progress 0.42 and displayed the unmyelinated-process scope explanation.
- Comparison: synchronized camera vectors matched; disabling sync left the other model unchanged. Swap retained each model's controls. Share/reload restored separate directions, selection, separation and sync=false.
- PNG exports and four actual MP4 downloads were inspected. Dimensions, alpha, durations, decoded playback and distinct sampled frames are recorded in [export evidence](studio-export-evidence-2026-10-03.json). Source-scene state was preserved after export. Temporary rendered exports remain in `/tmp/bioscape-studio-acceptance/`.
- Cancellation, closing during recording, reopening and simulated WebGL context loss/recovery passed. Export download links disappeared when refreshed against an unavailable scene. Keyboard Tab/Shift+Tab remained inside Studio; Escape returned focus to its launcher.
- Narrow layout checked at 390x844 and 320x740: no horizontal page overflow; comparison panes stack; label rails avoid controls; Studio settings remain scrollable with the download footer visible. Process label-off hides both markers and annotation keys.
- Real GPU/browser fixtures: `tests/scene-capture-browser.html` and `tests/scene-bridge-browser.html` verified pixel preservation, repeated transparent capture, temporary process/disassembly poses, fitting, disposal and failure recovery.
- Independent code review reported no remaining actionable findings after history, focus, specialized-process routing and HTTP-LAN ID fallback fixes.

## Boundaries

Narrow browser viewports are not physical phone tests. Browser video format availability varies; Chromium produced MP4 in this run, while the tested codec-selection logic supports WebM fallback. No new fixed performance benchmark or scientific expert sign-off is claimed. Rendered review covered the new models and changed flows; it is not a fresh visual audit of all 257 routes. Existing source geometry, science records and formal bilingual films were retained.

![Comparison workspace](../media/exploration/comparison.jpg)
