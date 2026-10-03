# Homepage acceptance · 2026-10-03

Latest follow-up: [copy and hierarchy refinement](refinement.md), requested after the initial acceptance below. It reduces repeated visible text while preserving the composition, models and navigation. The newer report and screenshots describe the current presentation.

The local homepage is implemented and verified against the current production build. It follows the approved light composition and uses the application's actual rendered models and processes. This record closes the integration findings in the individual reports below; those reports retain their original observations.

## Delivered

- A live, draggable hero with animal cell, plant cell and neuron selections. Automatic motion gently reverses near ±0.38 radians so the cutaway remains visible; manual orbit remains unrestricted. Pause, reduced-motion preference, a loading poster and a retry path are provided.
- Nine model cards and catalog-derived totals: **9 model types, 182 structure nodes, 84 processes**. Nine transparent WebPs were captured from the actual structure renderer, with dimensions and SHA-256 values recorded in the [model manifest](model-capture-manifest.json).
- Six featured processes, eight category choices including Featured/All, bilingual search over all 84 processes, empty-state recovery and direct process links. Search normalizes subscripts, superscripts and accents: `C4`, `CO2`, `Ca2+` and `Kalanchoe` reach the relevant real catalog entries.
- Three genuine, silent process previews: transcription, mitosis and photosynthesis. Only one visible hovered/focused card plays at a time; videos load on demand, finish without looping, and are removed when inactive. Reduced-motion preference disables them. Capture settings, decoded frame checks and hashes are in the [motion report](process-motion.md) and [manifest](process-motion-manifest.json).
- Structure exploration, independent comparison and model creation entry points. Home/Continue preserves deep scene and comparison state, while existing shared deep links still open directly in their scene. Chinese and English are supported throughout.

## Integration findings closed

| Finding | Change and verification |
| --- | --- |
| Supporting card text was too small and pale | Model descriptions and process summaries now use 12px, darker text; category labels were also strengthened. Desktop and narrow layouts were visually rechecked. This is not a full-page contrast certification. |
| Wordmark ignored reduced-motion scrolling | Wordmark and section navigation now follow the same preference. At a 320px English emulated viewport with reduced motion, return-to-top was immediate and hero rendering settled idle. |
| Reduced-motion button had a misleading accessible name | Disabled control now explains the preference; normal rotation exposes a stable name and pressed state. Keyboard and reduced-motion browser observations passed. |
| Immediate reload could lose the latest process annotation toggle | Discrete process changes publish their latest state synchronously and immediately flush the share URL. The integrator performed three native annotation-click → immediate reload repetitions, without any intervening state observation: off, on, off all persisted. |
| Home language change was lost on Continue | Resume replaces only the saved language. Actual English photosynthesis → home → Chinese → Continue retained progress 0.66, speed 1.5, annotations false and camera zoom 0.84, with Chinese controls and `document.lang=zh-CN`. |
| New homepage assets were outside the release gate | The release checker now requires all nine model images and all three videos, exact manifest coverage, byte sizes and SHA-256 values. Incorrect hashes, sizes and missing files were rejected; the final built-asset check passed. |
| Long auto-rotation could leave the hero facing away | Preview-only automatic rotation is bounded and reverses; normal explorer rotation is unchanged. Live camera samples showed the hero returning toward the front. A production-preview manual drag reached `[7.750,6.028,-0.549]` and paused automatic motion, confirming manual orbit is not clamped. |

## Actual browser coverage

- Desktop 1280×720: all three hero choices, all nine model cards, six featured process cards, lower exploration section and footer. No observed overlap, clipped cards or page-wide horizontal overflow.
- 390px Chinese and 320px English viewports, including coarse-pointer and reduced-motion emulation. Model cards remain two columns and process cards become one column; the long category rail scrolls internally. Browser emulation is not a physical phone test.
- Skip link, destination focus, subsequent tab order, category selection with Space, search and clear focus, no-results recovery, document language and pause state were exercised by the accessibility reviewer.
- Dev navigation covered plant/chloroplast display and camera state, photosynthesis progress/settings/camera, an unattached-kinetochore mitosis branch, two independently adjusted comparison cameras, shared deep links, Continue, Back and Forward. See the [navigation evidence](navigation-live.md) and the closures above.
- Actual card playback reached the transcription clip's end without a media error; switching to mitosis left only one video element, and moving away removed it. The final production photosynthesis card also played to its 6.958664-second end without an error. All three delivered clips were separately decoded and their first/middle/final frames inspected by the capture reviewer.
- Offscreen hero rendering settled to `idle`. A wheel event over the paused hero scrolled the document from 0 to 350px while the camera remained `[-0.048,0.650,9.813]`. There is one homepage canvas; the nine cards use images. The renderer retains lightweight animation-frame polling while idle.
- Final production assets are served locally at `http://127.0.0.1:4201/#/`. The production hero was confirmed ready, with one canvas and no document overflow. Plant-cell entry and return passed. Photosynthesis → chapter 05, speed 1.5, labels off → home → Continue restored the exact serialized URL and visible settings. No warning/error console entries were observed during this production pass. Temporary viewport, pointer and reduced-motion overrides were cleared; the final homepage tab remains open.

## Automated verification

`npm run check` completed successfully after the final source changes: formatting, the complete existing verification suite plus homepage catalog/navigation/search regressions, Vite production build, and release asset checks. The build completed at 20:21 local time, after the final hero motion change at 20:19. Release output: **84 processes, 9 homepage models, 3 homepage motion previews, 372 built files; subdirectory paths and development-file exclusions PASS**. The command log is `/tmp/bioscape-homepage-check.log`; focused homepage tests and `git diff --check` also passed.

## Evidence and limits

- [Final desktop homepage](home-desktop-final.jpg) · [Full-page view](home-fullpage-final.jpg) · [Production process cards](processes-desktop-final.jpg)
- [390px Chinese homepage](home-390.jpg) · [model grid](models-390.jpg)
- [320px English reduced-motion homepage](home-320-en-reduced.jpg) · [process cards](processes-320-en.jpg)
- [Live process preview](process-preview-live.jpg)
- [Assets](assets.md) · [Catalog](catalog.md) · [Hero](hero.md) · [Routing](navigation.md) · [Accessibility](accessibility.md) · [Visual review](visual-review.md) · [Source/payload review](performance.md)

This pass did not repeat full-duration playback of every process, establish a fixed performance benchmark, test physical mobile hardware or screen-reader speech, or force WebGL loss/slow-network failures. Earlier process and export acceptance remains in the [polish](../polish/README.md) and [round-two](../round2/README.md) records. No commit, push or production deployment was performed in this homepage pass.
