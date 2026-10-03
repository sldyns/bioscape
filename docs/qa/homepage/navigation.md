# Homepage navigation verification

Date: 2026-10-03. Scope: homepage routing integration in `src/main.jsx`, `src/App.jsx`, `src/home/HomeRouter.jsx`, and `src/home/routes.js`.

## Executed checks

All five commands passed in the local checkout:

```sh
node tests/home-navigation.mjs
node tests/exploration-state.mjs
node tests/history-session.mjs
node tests/process-session.mjs
node tests/comparison.mjs
```

- Empty hash, `#`, and `#/` classify as homepage. Explicit scene, legacy scene, query-only legacy share, and unknown nonempty hashes remain routed through the existing scene parser.
- Resume fragments reject external URLs, whitespace, duplicate fragments, and overlong values. Hash navigation preserves both `/` and `/bioscape/` deployment bases.
- Portable snapshots retain camera direction/target/zoom, mode, explode amount, labels, process progress/speed/conditions, structure origin, and both independent comparison pane views.
- Per-entry history remembers edits without conflating separate visits to the same model. A separate Resume entry does not overwrite an earlier Back entry.
- Existing process-definition guards and comparison normalization tests pass.

These are automated state/data checks, not rendered browser acceptance.

## Source inspection

`HomePage.jsx` keeps real scene anchor `href` values. Its `follow` handler only intercepts a primary click without Meta, Ctrl, Alt, or Shift; native modifier navigation remains available. Section navigation uses `scrollIntoView` and focus without rewriting the current hash.

The App logo saves and flushes the current snapshot before HomeRouter pushes `#/`. Browser traversal to a homepage hash saves the outgoing scene without replacing the new homepage URL. The outer router retains the scene history session across scene unmounts. The scene-active guard and timer cleanup prevent late scene callbacks from writing after exit.

## Browser verification blocker

An independent background tab was requested through CUA at `http://127.0.0.1:5174/` with `visible: false`. The tool returned `Browser is not available: iab`. A subsequent `cua.listBrowsers()` returned `[]`. No browser tab was created or modified; the existing user tab and viewport were untouched.

The following checks remain for the root agent's connected browser surface:

| Scenario | Browser status |
| --- | --- |
| Base URL opens homepage; model card opens correct model | Not run here |
| Deep model + settings + camera → logo → homepage → Resume | Not run here |
| Browser Back and Forward across homepage and scenes | Not run here |
| Process progress + conditions + speed → homepage → Resume | Not run here |
| Comparison with different camera views → homepage → Resume | Not run here |
| Immediate homepage click or reload while URL debounce is pending | Not run here |
| Delayed scene callbacks do not replace homepage hash | Not run here |

One source-observed stress case warrants attention: `CompareWorkspace` publishes camera updates on the next animation frame, while App snapshots consume the most recently published comparison state. Leaving before that frame may omit the final camera micro-update. This is not a reproduced browser failure; no out-of-scope comparison changes were made.

No build, dist update, commit, or viewport override was performed for these checks.

## Immediate process-control reload follow-up

The independent live worker subsequently reproduced an annotation-toggle loss when a native click was immediately followed by reload; see `navigation-live.md`. The focused fix changes `ProcessExperience` to update its latest snapshot synchronously in each control event, and tells App to write the URL immediately for annotation, speed, seek/chapter/restart, replay-reset, and condition changes. A condition change and its progress reset publish together. Playback ticks and camera updates continue using the existing debounce. No state setters or publication side effects were added to render.

After the fix, `home-navigation.mjs`, `process-session.mjs`, and `process-continuity-c.mjs` passed. The live worker's browser connection then became unavailable too. Three repetitions of immediate annotation-toggle/reload, plus homepage/Resume regression, remain pending on an available browser surface; the source fix is not recorded as browser-verified here.

The root agent subsequently reported three immediate native toggle/reload repetitions passed on its live CUA surface: true → false, false → true, and true → false, with each expected annotation value retained in the URL. The browser evidence belongs to that root run rather than this worker's unavailable surface.

## Homepage language and Resume

The root agent reproduced an English Photosynthesis session restoring English after the homepage was explicitly changed to Chinese. `resumeSceneHash` now applies the homepage language when constructing a new Resume URL while retaining the complete sanitized scene snapshot and other query parameters. Direct shared-link handling and stored Back/Forward entries are unchanged.

The new regression test first failed because the helper did not exist, then passed after implementation. It checks language override, preservation of process/camera/structure-origin/comparison state, unchanged original English hash, retained process and unrelated query parameters, and rejection of invalid Resume input. `home-navigation.mjs`, `exploration-state.mjs`, and `history-session.mjs` passed. Live language/Resume follow-up is requested from the root agent.
