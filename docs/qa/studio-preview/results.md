# Studio preview repair — 2026-10-03

Later update on 2026-10-03: the user explicitly requested removing their name from image/video exports. Author-name watermarks were removed; the project mark and scientific context remain. The earlier credit behavior and screenshots below document the previous revision. See [project information and export credit QA](../project-information/README.md) for the current behavior.

## Delivered behavior

- Replaced full-resolution PNG slideshow generation with a persistent, bounded-resolution canvas and an elapsed-time animation clock capped at 30 fps. No PNG encoding or object URL churn during preview playback.
- Rendering keeps the exact logical export layout; preview uses the visible stage, while PNG and recording retain the chosen 1920/2560 resolution, MSAA and recording bitrate.
- Reused capture buffers, cameras, intermediate canvases and valid shadow maps; default capture calls still return independent snapshots. Comparison composition resources release with the pane capture APIs.
- Pausing/seeking coalesces to one pending frame, pauses time progression and cancels idle work. A regression caught in review preserves a pending first paint/seek across a pause.
- Removed the three explanatory UI notes identified by the user. Refresh is a compact heading control. Video motion/duration appear before general output settings.
- Following the user's “必须有” annotation, project/author credit is always included, including when old saved preferences disabled it; removed the off switch. Export scale/science context stays in the artwork.

## Actual browser checks

Production build, Codex in-app desktop browser; these are this machine's measurements, not a device-wide performance guarantee.

| Check | Result | Evidence |
| --- | --- | --- |
| Animal cell 9:16, 926 × 865 viewport, 10-second preview | 293 observed frame updates; median draw 12.4 ms, p95 15 ms; 0 PNG calls; final fraction 1 and stopped | `actual-preview-run.json` |
| Preview backing canvas | 267 × 474 for the displayed composition; export target 1080 × 1920 | same |
| 6-second full-resolution video | 1080 × 1920 MP4; actual duration 6.0767 s; played to ended; 167 decoded frames, 0 dropped | `recorded-video.json`, `recorded-video.png` |
| PNG button | Actual encoded image/png 1440 × 2560, 2,453,229 bytes; image visually inspected | `export-png.json`, `export-1440x2560.png` |
| Scrubbing | Click at middle seeks to 0.501 and remains paused; no busy status | `studio-final-926.png` |
| Cancel / close | Cancelling returns to ready preview; closing restores usable source controls and body scroll | browser action verification |
| Full biological process preview | Secretion reaches final stage continuously; source process timeline remains at 0 after close | `process-preview.png` |
| Comparison preview | Both models, identities, labels and footer visible in portrait composition; close/reopen works | `comparison-preview.png` |
| Mobile layout | 390 × 844 emulated viewport; 370px dialog inside viewport, no page overflow; preview and playback controls visible, settings scroll | `studio-mobile-390.png` |

`process-preview.png` was captured before the pending-first-paint pause fix and shows an old loading badge. The scenario did not recur on the immediate repeat, and focused tests reproduce/cover the verified pause race. `studio-final-926.png` is the final animal-cell UI review, including the final spacing after the video format note.

## Automated checks

- `npm run check` passed (format, full verify including all scientific regressions, build, release assets): `/tmp/bioscape-studio-full-check.log`
- After the final pause/credit changes: Studio and preview tests 26/26, targeted formatting, fresh production build, release asset check passed: `/tmp/bioscape-studio-integration-tests.log`, `/tmp/bioscape-final-format-check.log`, `/tmp/bioscape-home-studio-build.log`, `/tmp/bioscape-studio-release-check.log`
- Capture and comparison focused checks are registered in the project verifier; actual GPU fixture confirms independent default snapshots and renderer/camera/shadow restoration.
- Fixed capture fixture before/after: `capture-before.json`, `capture-after.json`. Its 38.5 → 1.8 ms preview median is a capture-path measurement, distinct from the actual Studio measurements above.

No commit, push or deployment was made.
