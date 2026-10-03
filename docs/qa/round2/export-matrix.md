# Export matrix — second-round live verification

Date: 2026-10-03. Independent IAB tab, dev server `http://127.0.0.1:5174/`. Actual captured viewport 1280×720; no viewport override made by this verifier. Source and build output were not edited. These are new checks; previous studio evidence is not counted as newly tested.

| Context | Actual export | Playback | State after closing Studio |
|---|---|---|---|
| Animal section / plant whole, separately rotated and zoomed | PNG 1920×1080; rotation MP4 1920×1080, browser duration 6.0986 s, 3,999,706 bytes | Native video controls advanced to 5.602485 s with readyState 4 and no media error | Both rendered views visually match pre-Studio screenshot; URL retains distinct camera directions/zooms |
| RTK–Ras–MAPK, receptor kinase inactive, progress 0.51 | PNG 1920×1080; complete-process MP4 1920×1080, browser duration 6.0418 s, 756,913 bytes | Played to currentTime 6.0418, ended=true, no media error | Progress 0.51 / 0:16, inactive condition, annotations=true and custom camera all preserved |

## Compare setup and result

A camera direction `[-0.52004,-0.84897,-0.09384]`, target `[0,0,0]`, zoom `0.69363`; B direction `[0.63932,0.7077,0.30073]`, target `[0,0,0]`, zoom `1.0035`. Two drags and left-side wheel zoom prepared visibly different viewpoints. Export used landscape, 1920 px long edge, labels/title/credits on. PNG used transparency; movie used light background and 6-second orbit rotation. Studio close kept both models in their original orientations, sizes, display modes, and labels-off exploration state.

- [Downloaded PNG](export-compare.png)
- [Downloaded MP4](export-compare.mp4)

## Altered process condition

The endocytosis UI did not expose an ATP condition, so the authorized alternate RTK condition was used. Selected **受体激酶失活**, chapter 04, then zoomed and rotated. Starting state: progress `0.51`, speed `1`, parameters `{condition: "kinaseInactive"}`, annotations `true`, camera direction `[-0.47893,0.48515,0.73161]`, target `[0,0,0]`, zoom `0.84`.

Preview and final PNG visibly use the actual-response caption **配体结合，受体激酶失活** instead of implying the chapter's Raf→MEK→ERK activation occurred. For video, explicitly selected **完整过程** and **6 秒**. Native playback reached ended=true; close retained starting progress, parameters and camera.

- [Downloaded PNG](export-process.png)
- [Downloaded MP4](export-process.mp4)
- [Video playback screenshot](export-process-video.jpg)
- [Restored exploration screenshot](export-process-restored.jpg)

## File verification and limits

PNG dimensions verified using macOS `sips`. Downloaded MP4 files were read directly: both contain ftyp/moov/mdat boxes and tkhd dimensions 1920×1080. Playability was verified through the app's actual recorded-video element and native playback controls for the same downloadable blobs; no native codec matrix was repeated. No claim of all OS/device players is made.

Automation downloadMedia and download-event waits timed out despite native link clicks saving files successfully to ~/Downloads; these were tool observation failures, not failed product downloads. Subsequent downloads used one native click and filesystem confirmation. Saved files were copied to this evidence folder. No export product bug found within this matrix. Responsive mobile widths were not exercised by this tab.
