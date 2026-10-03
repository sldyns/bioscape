# Homepage model assets

Captured 2026-10-03 from the current actual Three.js model roots through `src/CellScene.jsx` and its `captureFrame` bridge. No AI synthesis, reconstructed anatomy, or external reference imagery was used. Production model source was unchanged.

## Delivery

- `public/home/models/cell.webp` and `plant.webp`: 1400 × 1400.
- `public/home/models/bacterium.webp`, `yeast.webp`, `paramecium.webp`, `phage.webp`, `erythrocyte.webp`, `neuron.webp`, `muscleFibre.webp`: 1000 × 1000.
- Total payload: **1,439,106 bytes** (1.44 MB decimal).
- Browser WebP quality 0.95, transparent background, no labels, floor hidden by the existing capture bridge.
- Section mode for cell, plant, bacterium, yeast, paramecium, muscleFibre; whole mode for phage, erythrocyte, neuron.
- Normalized direction from `[0.08, 0.12, 1]`, target `[0, 0, 0]`, fit-relative zoom 1.04.
- Per-file capture metadata and SHA-256 are in `model-capture-manifest.json`.

## Visual checks

Inspected all nine actual exported files together in the Codex browser on the intended `#f5f5f7` background. Cell organelles, plant vacuole/chloroplasts, bacterial flagellum, yeast bud, paramecium cilia, phage tail fibres, erythrocyte concavity, complete neuron projections and muscle fibre exterior all remain visible. No model touches the image edge. All four-square canvases retain alpha rather than baking in the contact sheet background. Soft transparent shell materials deliberately inherit the current renderer's pale scientific palette; these assets were reviewed for light homepage surfaces, not dark backgrounds.

Decoded alpha bounds at alpha > 8 (inclusive pixel coordinates) and top-left alpha:

| Model | Bounds [left, top, right, bottom] | Corner alpha |
| --- | --- | --- |
| cell | 150, 95, 1277, 1278 | 0 |
| plant | 184, 104, 1191, 1335 | 0 |
| bacterium | 231, 59, 822, 875 | 0 |
| yeast | 164, 79, 848, 901 | 0 |
| paramecium | 286, 84, 717, 895 | 0 |
| phage | 296, 80, 706, 948 | 0 |
| erythrocyte | 130, 91, 928, 930 | 0 |
| neuron | 113, 286, 896, 696 | 0 |
| muscleFibre | 130, 307, 933, 749 | 0 |

## Reproduction

1. Use the existing Vite server on `127.0.0.1:5174`.
2. Start `HOMEPAGE_CAPTURE_DIR=/tmp/bioscape-home-capture-new node scripts/homepage-capture-sink.mjs` (port 5179).
3. Open `/scripts/homepage-capture.html` in one isolated browser tab. It captures sequentially with one persistent `CellScene` WebGL canvas, then unmounts the scene.
4. Inspect staged WebP assets before integrating. The sink uses exclusive writes and refuses to overwrite existing files. Staging outside the repository prevents Vite's public-file reload from interrupting a batch.
5. `/scripts/homepage-capture-gallery.html` displays the delivered assets on the homepage surface for review.

No additional WebGL scenes were left running. No optional process preview was produced in this pass; this delivery covers the requested nine model assets only.
