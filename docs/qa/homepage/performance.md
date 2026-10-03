# Homepage source, payload and release review

Reviewed 2026-10-03 during integration. This is a source/dependency review with local asset integrity checks, not a browser performance benchmark, device acceptance, or production deployment check. No Vite production build was run by this reviewer. Homepage CSS and motion previews were still being integrated.

## Actionable findings

### P2 — Add the homepage's new assets to the release gate

At review time `scripts/check-release.mjs` verifies films and process thumbnails but does not enumerate the nine homepage model WebPs or compare them with `docs/qa/homepage/model-capture-manifest.json`. A missing or stale homepage asset can therefore pass the existing release checks, despite leaving a broken model card or initial hero poster.

Minimal useful addition: require unique capture IDs matching the nine homepage model IDs; require every `dist/home/models/<id>.webp`; compare its size and SHA-256 to the capture manifest. Include homepage motion clips and their manifest once that delivery exists. Check the actual referenced files rather than all miscellaneous QA artifacts. Keep the check after the integrating production build.

### P3 — Reduce upfront structure metadata only if measured startup warrants it

A bounded esbuild analysis (`write:false`, minified ESM splitting, CSS external) found 519,423 bytes of synchronous JavaScript before gzip, across 91 input modules. It is not a Vite production payload measurement. Of that analysis, `hierarchy.js` contributed 72,277 bytes, `catalog/cellTypes.js` 52,401, `catalog/microbes.js` 30,131, `data.js` 15,612 and `data-en.js` 8,180. These contain much richer structure data than the homepage labels/counts need.

If actual startup is slow, a generated lightweight homepage projection could retain catalog-derived counts, names and routes without shipping the complete structure-description graph in the initial UI. Treat this as a follow-up opportunity, not a reason to duplicate scientific data manually or expand this visual polish pass.

## Confirmed source boundaries

- The synchronous main/HomeRouter graph contains no `node_modules/three/` code and no process scene/geometry builders. App, CellScene, ProcessExperience, comparison and Studio use dynamic imports. The hero mounts CellScene immediately, so its Three.js download still begins on initial homepage render; lazy splitting does not mean the hero waits for interaction.
- Model cards use images, not nine independent canvases. The hero uses one persistent CellScene. Model switches update its selected ID/view key; they do not mount a new renderer per card or selection. CellScene limits cached detail views to eight and disposes workers, animation callbacks, model resources and its renderer on unmount. Repeated navigation/context-lifecycle behavior still needs browser verification.
- Hero intersection state disables auto-rotation offscreen. CellScene skips GPU rendering once camera damping/transitions settle and the scene becomes idle. Its lightweight RAF polling remains active while mounted. Hidden documents short-circuit the animation body. This is not equivalent to stopping all offscreen work instantly, but there is no source evidence of continuous offscreen GPU drawing after settling.
- Model and process card images are lazy-loaded and asynchronously decoded. Only the active hero poster has high fetch priority. The initial animal-cell poster is 593,812 bytes; later reuse in the model grid uses the same URL.
- Asset paths pass through `assetUrl`, which combines Vite's configured relative base (`./`) with slash-stripped public paths. Catalog process thumbnails explicitly strip their initial slash. Hash navigation preserves the project subdirectory. No newly introduced root-only homepage asset URL was found in the reviewed source.

## Asset integrity evidence

The nine public WebP files all have RIFF/WEBP signatures and SHA-256 values matching `model-capture-manifest.json`. Their sizes total **1,439,106 bytes**:

| Model | Bytes |
| --- | ---: |
| cell | 593,812 |
| plant | 251,054 |
| bacterium | 126,872 |
| yeast | 122,990 |
| paramecium | 139,556 |
| phage | 43,904 |
| erythrocyte | 29,838 |
| neuron | 32,214 |
| muscleFibre | 98,866 |

Capture provenance, source camera framing, image dimensions and alpha review are documented separately in `assets.md` and `model-capture-manifest.json`. This review independently checked file signatures, sizes and hashes; it did not repeat the capture agent's visual/alpha inspection.

## Remaining integration evidence

Run the root-owned production build/release check after files settle. In the rendered homepage, verify hero idle state after scrolling away, only one active homepage canvas, navigation cleanup, reduced-motion behavior, load/error behavior on a slow connection, and the final video preview visibility/preload lifecycle. Confirm asset requests under a project-subdirectory preview. No browser FPS, heap, network-waterfall, mobile-device or production acceptance is claimed here.
