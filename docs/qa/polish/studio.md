# Studio polish — 2026-10-03

## Problems found through actual output review

- A tall decorative dialog header competed with the artboard; model name repeated as its own subtitle.
- There was no composition spacing control and no play/pause control for motion preview.
- Disabling author credit also removed the scientific disclaimer.
- Process exports inherited the structure breadcrumb instead of describing the exported step.
- Generic `video/mp4` produced VP9-in-MP4 on the tested browser. It played inside Chromium but AVFoundation rejected it with -11869. A playable browser preview alone was insufficient evidence of a useful export.
- Actual transparent PNG had a blocky colored floor-shadow semicircle, invisible against the initial light preview. Actual dark PNG had low-contrast leader lines.
- Comparison specimen names and scale notes were too small at 1920 px output.

## Delivered in this lane

Studio keeps the existing public props and renderer capture contract. It now has a stable, larger artboard, compact header, deliberate fitted/spacious framing without cropping or modifying live geometry, readable disabled states, keyboard-accessible keyframe playback, and an explicit distinction between keyframe preview and recorded playback. Independent settings invalidate stale recordings; recording pauses preview capture. The semantic name is “影像工作台 / Image & motion studio”.

Export composition suppresses duplicate subtitles, keeps scientific scale context independent of credit, uses the actual process step for current stills and process frames, preserves the current step for orbit movies, and includes process summary text in portrait compositions. Optional source scientific-scope notes receive their own reserved footer line. Transparent exports explain that dark typography is intended for light backgrounds.

The encoder prefers explicit AVC/H.264 MP4, then supported WebM variants, before ambiguous generic MP4. This fixes native compatibility on the tested browser without claiming all browsers support AVC.

Coordinated fixes by other owners: App/ProcessExperience provide actual step/scope metadata; renderer hides the floor for transparent capture and uses background-aware leaders; comparison reserves larger specimen caption typography. These files were not edited by this lane.

## Evidence and verification

Stable production snapshot was served from `/tmp/bioscape-studio-polish-build` at `http://127.0.0.1:4198/` because concurrent Vite HMR repeatedly disposed the active review scene. Latest snapshot includes the coordinated renderer and comparison fixes. Build output: `/tmp/bioscape-studio-polish-build.log`.

Actual downloads and copied evidence: `/tmp/bioscape-studio-polish-evidence/manifest.json`. Browser controls used ordinary download links; the automation download-event helper timed out even though normal clicks produced actual files. No success claim rests on that event helper.

| Output | Actual inspection |
| --- | --- |
| Structure landscape 1920×1080 | Full PNG pixels: title, model, all labels and footer separated |
| Structure portrait 1080×1920 | Full PNG pixels: model fits; no cropped footer or label boxes |
| Structure dark square | Full PNG pixels; initial weak leaders identified and corrected by renderer |
| Transparent square 2560×2560 | Real alpha PNG; final floor artifact removed and leaders readable on black |
| Transparent model without labels/title/credit | Downloaded clean composition; scale note remains |
| Process still | Exported at step 4/7; title matches actual current step |
| Process portrait 1440×2560, English | Actual PNG with step caption and summary; no text collision |
| Comparison landscape, portrait, square | All three actual PNGs inspected after caption fix; A/B identity and independent-scale note readable |
| Structure orbit and disassembly | Actual 6-second MP4s played in browser; AVC disassembly decoded with AVFoundation |
| Process full movie | AVC portrait1080×1920, duration6.059s, decoded frames at0/3/5.9s; last frame is step7/7 with extracellular cargo |
| Comparison movie | AVC1920×1080, duration6.097s; final typography square1920×1920, duration6.197s. Native decoded frames at0/3/5.9s; separate models retained |

Record/cancel/re-record was exercised. Cancellation removes the downloadable old recording and returns a usable preview; no partial-success message. Close/reopen was exercised. After process capture, closing Studio restored live stage4/7 at0:10, confirming the export did not leave the process at its final frame. Transparent-to-video changes to an opaque light background and disables transparency. Both English and Chinese UI/output were inspected. Latest browser console inspection returned no warning/error entries.

Focused tests: `node --test tests/studio.mjs` (15 passing); scoped Prettier check passed. Tests cover malformed settings, region allocation, source stage captions, scientific disclaimer independent of credit, framing boundaries, AVC preference, encoder failure/interrupt/cancel cleanup, and final-frame behavior. These checks supplement output inspection and do not establish visual acceptance alone.

## Remaining acceptance boundaries

The root integrator owns the coordinated mobile viewport review and final combined build. This lane used1280×720 desktop and did not change the browser-global viewport. Actual hardware/mobile encoding performance is unmeasured. Long horizontal process diagrams naturally leave more whitespace in portrait; landscape remains the most readable choice for them. Generic MP4 fallback, unsupported-browser errors, and a real GPU context loss were not re-injected during this polish pass; focused failure tests cover cleanup, and prior functional verification remains separate.
