# Homepage process motion capture

Captured 2026-10-03 from current production process definitions through the actual `ProcessScene` renderer. These are silent model recordings, not microscopy footage or a claim of real-time biological duration.

| Process | Source context | Progress | Duration | Dimensions | Bytes |
| --- | --- | --- | --- | --- | --- |
| transcription | cell, default parameters | 0–1 | 6.919869 s | 640×400 | 331486 |
| mitosis | cell, attachment=normal | 0–1 | 6.959976 s | 640×400 | 379237 |
| photosynthesis | plant, default parameters | 0–1 | 6.958664 s | 640×400 | 299124 |

Exact bytes/hashes are authoritative in `process-motion-manifest.json`. All clips are VP9 WebM, generated with `MediaRecorder` at requested 24 fps, 168 submitted process frames, 680 kbps target, and `#f5f5f7` background. No soundtrack, post-render motion, or fabricated extra structure was added. Model camera framing, lighting, meshes, and default controls are the existing implementation. Annotations are disabled for small homepage previews; the linked process experience retains its original stage descriptions and scientific limits.

## Files and integration

- `/home/processes/transcription.webm`
- `/home/processes/mitosis.webm`
- `/home/processes/photosynthesis.webm`

Use the existing genuine process thumbnail as each video's poster. Load only on intentional hover/focus; play one muted inline clip at a time. On leave pause and restore poster. Full progression ends in its terminal state, so replaying from zero has a natural jump: do not describe the clip as a seamless biological cycle. Other homepage cards remain still previews.

## Verification

The actual encoded videos were loaded back into browser HTML video elements. Metadata confirms 640×400 for all three; media error is null. Each video was sought to start, midpoint, and 98.5% duration, decoded onto canvas, and those frames saved in `process-motion-frames/` and visually inspected:

- Transcription: polymerase moves along DNA while the RNA product lengthens and releases.
- Mitosis: chromosomes start inside the nucleus, align with spindle attachments, then appear in separated daughter cells.
- Photosynthesis: initial chloroplast machinery transitions to visible photon/transport paths and downstream reaction motion.

Final deployed-path local verification used `scripts/homepage-process-review.html`, including seeking the transcription clip to its middle. No media decode errors occurred. This verifies local recorded assets and frame progression; homepage interaction/accessibility and physical-device codec verification remain the integrating agent's responsibility.

A fourth action-potential recording was interrupted by a concurrent Vite reload and is not delivered. The reload restarted the capture entry and the write-once sink correctly rejected duplicate transcription output; the already completed three clips were preserved. Capture is now explicitly button-triggered so reloading no longer begins another recording automatically.

## Reproduction

1. Run the Vite dev server on 127.0.0.1:5174.
2. Use a fresh output directory: `HOMEPAGE_PROCESS_CAPTURE_DIR=/tmp/bioscape-process-motion-new node scripts/homepage-process-capture-sink.mjs`.
3. Open `http://127.0.0.1:5174/scripts/homepage-process-capture.html` in a background browser tab and press **Record three real process clips**. Keep the dev source stable during capture.
4. The local-only port 5183 sink accepts an explicit file allowlist and refuses overwrites. Review videos and start/middle/end decoded WebP samples before copying assets to `public/home/processes/`.
5. `scripts/homepage-process-review.html` verifies the final public asset paths. No build to dist or software installation is needed.
