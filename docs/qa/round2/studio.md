# Studio round 2 — 2026-10-03

Scope: `src/studio/**`, `tests/studio.mjs`. Actual CUA browser checks used a fresh IAB tab on `http://127.0.0.1:5174/` at the existing 1280 × 720 viewport. No global viewport change or build into `dist`.

## Reproduced and fixed

- **Selecting the active option discarded a completed video.** Animal cell → Studio → Video → 6 s → Record video → wait for Download MP4 → click the already-selected Landscape. Before the fix the recorded player and download disappeared. `update` invalidated results before checking whether the selection changed. `changePreference` now returns the same preferences for a no-op, and Studio retains the result. The same rule covers Light already being selected in video mode when the saved image preference is transparent; it also preserves that transparent image preference.
- **Completed-video help described an unrecorded keyframe preview.** The completed player still said “Keyframe preview. Play the full video after recording.” It now states that playback and download use this completed recording and that changed settings require recording again.

## Actual verification

- Recorded a 6-second movie after the fix. Re-clicked Landscape and effective Light: Download MP4 retained the exact same blob URL and the native video player remained available. Returning to Image retained Clear/transparent and its checkerboard explanation.
- Changed Landscape to Portrait: old video download was removed, output dimensions became 1080 × 1920. Started then cancelled recording: “Recording cancelled,” no partial download, Record video became usable again.
- Reopened Studio: persisted Portrait/Clear settings returned in image mode with no stale video. Shift+Tab from Close moved to Download PNG; Tab returned to Close; Escape closed the dialog and restored focus to the underlying Studio button.
- Switched Animal cell to Plant cell and reopened: source name and preview were Plant cell. Toggled labels/title off: rendered portrait showed neither, while the scientific footer remained. The preview image `src` exactly matched Download PNG `href` after processing.
- Recorded a fresh Plant cell 6-second movie and repeated Landscape selection: same result URL retained. Final screenshot: `/tmp/bioscape-studio-round2-recorded.jpg` (one retained image). Final tab warning/error query returned no entries.
- `node --test tests/studio.mjs`: 16 passing. New regression was run red before implementation, then green; covers all unchanged preferences, transparent-to-video fallback, and an actual composition change. Scoped Prettier check passed.

## Boundaries

The previous `docs/qa/polish/studio.md` contains actual file export/codec evidence. This pass tested interaction state and result identity; it did not repeat that full export matrix or native decoding. Mobile viewport and combined release build remain with the integrator. No new GPU-context-loss injection or real-device encoding test. One Escape call overlapped concurrent dev reload and timed out; the full focus-cycle/Escape sequence was rerun cleanly and passed. No comparison/App code was changed in this lane.
