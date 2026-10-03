# Exploration, Studio and Comparison

Approved direction: the user selected roadmap items 2, 3 and 4, explicitly requested full implementation in goal mode on 2026-10-03. Proceed with the complete implementation and verification in this task.

## Product

- Structure/process continuity: discover relevant processes from a structure; retain the originating structure and camera; return to it; contextual location trail and related structure destinations. Cover the existing catalogue using explicit biological mappings, not name guesses. Keep Structure / Biological processes as the two primary views.
- Studio: actual model capture, landscape/portrait/square composition, light/dark/transparent still backgrounds, optional labels and title, BioScape project credit and teaching context without an author-name watermark, high resolution PNG, short animation recording with browser-supported video format, replay/download preview, scene links restoring camera and relevant state. Cancellation, errors and resource cleanup must work. No screenshot of controls in output.
- Comparison: two independently selectable structures with independent orbit, zoom and reset, whole/cutaway/exploded controls where available, reset, swap, bilingual difference notes, desktop and narrow-screen layouts, shareable comparison. Include refined human erythrocyte, representative neuron and skeletal muscle fibre alongside existing models. Explain illustrative scale and subtype scope.

## Shared renderer contract

CellScene and ProcessScene expose optional `onSceneReady(api | null)`, `initialView`, and `onViewChange(view)` props. Optional props must not change existing callers.

View: `{ direction: [x,y,z], target: [x,y,z], zoom: number }`. Direction is a unit vector from target to camera; zoom is distance / current fitted distance. Preserve fit across aspect changes. Set-view guards nonfinite/extreme inputs.

API:
- `getView()` returns the serializable View.
- `setView(view)` restores it and requests a render.
- `captureFrame({width,height,background,labels,turn,progress})` synchronously returns a detached HTMLCanvasElement containing the real rendered model. Background is a CSS color or `transparent`; turn is optional radians relative to present camera; progress applies only to processes. Capture preserves live renderer/camera/model settings after rendering and throws while not ready.
- `ready` boolean or accessor.

Label capture must use actual visible label data, maintain readable placement, and exclude unrelated UI. WebGL/context loss, navigation disposal and export failure must release resources.

## File ownership

- Renderer bridge: src/CellScene.jsx, src/processes/ProcessScene.jsx, src/scene/sceneCapture.js and focused tests.
- Studio: src/studio/** plus studio tests; consumes the renderer contract. Root integrates its launcher.
- Comparison/specimens: src/compare/** plus specimen tests. Root integrates routing. No changes to shared renderers.
- Structure/process mapping: src/exploration/relationships.js and tests; inspect all current definitions. Root integrates UI/navigation.
- Root: App, ProcessExperience, navigation/session state, shared styles/integration and final checks.

## Execution and acceptance

1. Establish validated state serialization and biological relationship contracts.
2. Implement independent renderer, studio, comparison and relationship lanes.
3. Integrate both existing experiences, related routes, exact return state and sharing.
4. Review code and correct findings; run formatting, model/science and release checks.
5. Browser review: structure to process and back, history, share/reload, both languages, both comparison panes and independent cameras, PNG and complete recorded video, cancellation and repeated open/close, narrow layout. Retain an evidence record distinguishing viewport emulation from real hardware.

Use current React / Three.js / Vite dependencies. Preserve scientific source data, model fidelity, previous tests and full media. Do not publish remotely until the implementation has been reviewed in this task. Keep temporary exports outside the repository and remove regenerable test captures when no longer needed.

## Completion record

Implemented and locally verified on 2026-10-03. See [acceptance and limits](qa/exploration-upgrade-2026-10-03.md). Specialized cells are also standalone roots and connect to applicable existing processes. Ordinary structure navigation retains the scene cache; browser history restores per-entry state. Publication remains a separate action.

## 逐项精修交付

功能初版之后完成逐项精修，记录见 [精修验收索引](qa/polish/README.md)。新增 19 结构视图、既有 163 结构、84 过程的阶段与连续播放分别留存证据。该轮本地构建位于 4201，完整 check 与 22/22 科学回归通过；未部署。后续体验审查与当前预览见下节。


## Second usability audit · 2026-10-03

The second goal-mode pass removes camera linking entirely, including legacy shared links, and reviews the new 19 structural views, navigation, comparison and Studio workflows again. Current results and limitations: [round-two acceptance](qa/round2/README.md). Earlier synchronization acceptance entries are historical and no longer describe the product.
