# Homepage hero lifecycle review

Scope: `src/home/HeroScene.jsx`. No renderer changes, production build, generated `dist` files, or commits in this review.

## Delivered behavior

- One lazily imported `CellScene` instance handles animal cell, plant cell, and neuron. Switching models preserves its internal cache; clicking the selected model does nothing.
- A poster remains until `CellScene` publishes a ready API after rendering. The callback is stable across model and language changes. The renderer publishes `null` before requesting a different model and when its WebGL context is lost.
- The stage exposes `data-ready` so homepage CSS can hide only its canvas during preparation. This is needed because a previously rendered canvas otherwise remains visible above the next model's poster. Do not hide the entire `.model-canvas`: its WebGL error and retry controls must remain available.
- Lazy-import/render failure is isolated to the preview. It retains the poster and bilingual model-entry controls, shows a retry action, and creates a fresh React lazy type on retry so React's rejected-promise cache is not reused. Browser-level failed-module caching may still require a page reload; retry success under a network fault has not been demonstrated.
- Automatic rotation follows the system's reduced-motion preference, including live preference changes. The user can pause/resume with a named pressed-state button; direct pointer interaction pauses rotation. Reduced motion disables that button with an explanatory accessible name and tooltip.
- Rotation stops below 5% hero intersection and resumes only if the user has not paused it. Observer/media-query subscriptions are cleaned up on unmount. Browsers without IntersectionObserver retain rotation controls without crashing.
- The shared renderer already skips animation work while `document.hidden` and idles once movement settles. Offscreen handling disables rotation; it does not destroy the renderer or claim zero animation callbacks.
- `allowZoom={false}` avoids desktop wheel interception by OrbitControls. Coarse-pointer CSS remains the integrator's responsibility so touch scrolling is not captured.
- The model preview is a named region; model selection uses native buttons with `aria-pressed`; decorative button icons are hidden from assistive technology. Language values normalize to English or Chinese.
- Main caption opens `#/{selected}`. Structure clicks open `#/{selected}/{id}`, consistent with `CellScene` restricting hits to the selected model's immediate children.

## Checks performed

- Inspected `CellScene` renderer setup, request/cancellation/cache path, readiness publication, rendering loop, retry overlay, pointer hit validation, and teardown.
- `esbuild.transform` parsed/transformed the final HeroScene JSX successfully without writing build output.
- The three referenced posters exist and are nonempty: animal cell 593812 bytes; plant cell 251054 bytes; neuron 32214 bytes.
- Component formatted with repository Prettier.
- Opened a background in-app browser at `http://127.0.0.1:5174/` with its existing viewport. At this point Vite displayed `Failed to resolve import "./home.css" from "src/home/HomePage.jsx"`, because the integrator was still creating that stylesheet. No rendered-interaction acceptance is claimed from that attempt.
- Follow-up after `home.css` landed: confirmed the stylesheet hides only the unready canvas, makes the poster noninteractive, leaves the retry overlay visible, and disables canvas pointer input for coarse pointers. The reduced-motion button's accessible name already matches the explanatory tooltip in both languages.
- The follow-up browser session could not run: both reloading the original tab and creating a fresh in-app tab reported that the browser was unavailable. An enabled-surface inventory returned no browsers (`browsers: []`). No viewport override or forced WebGL failure was applied. Actual poster-to-scene transition, model switching, drag, scroll, route navigation, and offscreen behavior remain unverified in a rendered browser by this reviewer.

## Integration checks still required

1. Source CSS integration is confirmed for `.home-hero-stage[data-ready="false"] canvas { visibility: hidden; }` and poster `pointer-events: none`; still verify WebGL retry overlays visually and interactively.
2. View each model, switch rapidly, and select the active model repeatedly. Confirm one canvas, matching caption/poster/scene, and no transient previous-model flash.
3. Exercise pause/resume, pointer drag, wheel scrolling over the canvas, and model/structure navigation. Confirm normal page scrolling on a coarse-pointer device.
4. Verify reduced-motion startup and runtime changes, offscreen idle behavior, browser-tab hiding, and resume behavior with user pause preserved.
5. Simulate lazy-import/network and WebGL failure; verify the poster, bilingual error/retry, and non-3D model entry remain usable. No forced failure was injected in the user's browser during this source review.
