# Model loading performance — 2026-10-03

Scope: local production preview at `http://127.0.0.1:4201`, same browser session and default 1280 × 720 viewport. Changes preserve geometry, material parameters, texture resolution, antialiasing, pixel ratio and shadow settings. No deployment was performed.

## Changes

- Four geometry-merging paths copy into `BufferGeometry` directly. The previous `.clone()` constructed a default sphere/torus/etc. before overwriting it with the original buffers. Both paths use the same Three.js `copy` and matrix transform operations.
- A completed-payload LRU cache retains at most eight entries and 224 MiB of typed-buffer storage. It shares immutable CPU arrays, without retaining renderers, GPU objects or workers. Scene wrappers, groups, user data, material state and textures are created independently per consumer. Eviction drops the cache reference; active scenes remain valid. Oversized results are not cached. The limit covers retained typed buffers, not all browser memory; metadata and active scene/GPU allocations are additional.
- Detail workers start only on a cache miss. The `cell` and `cytoplasm` routes proceed directly to the base cell builder. Canceled or failed detail requests are not cached. Completed data survives component unmounts within one page session; a full reload still performs a cold build.

## Fidelity and regression evidence

`model-equivalence.json` compares the pre-change bundled cell builder with the optimized builder: 190 meshes, identical SHA-256 fingerprints covering raw position/normal/UV/index/instance bytes, world transforms, material properties, texture pixels and render flags. The single Node timing in that artifact is diagnostic, not the browser benchmark.

`tests/prepared-model-cache.mjs` covers byte accounting (including shared backing buffers), least-recently-used eviction, oversized results, bounded entry count, cache reuse without a new worker, mutable-state isolation, disposal, and canceled/failed replies. Existing model tests also confirm that the two base routes have no standalone detail model.

## Measurement method and artifacts

- `before-cell.json`: three full document reloads with HTTP cache disabled. CPU model cache starts empty each time. Readiness is the first rendered model signal, captured with a mutation observer; the probe was installed before any ready signal in every sample.
- `before-enter-cell.json`: transition from a fully rendered homepage hero into the cell explorer. Time is measured from just before clicking the entry link to the first ready model signal.
- `before-home.json` is a hash-navigation diagnostic, **not** a cold homepage benchmark. Its absolute document timestamp must not be reported as a load duration.
- `cell-before.png`: settled cell view at the baseline camera and viewport.
- Full check log: `/tmp/bioscape-loading-speed-check.log`.

These local measurements do not establish production network speed, mobile-device frame rates or performance for every model. Warm cache results require the retained payload to remain within the bounded working set.

## Results

| Scenario | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Cell first rendered frame, median of 3 reloads | 2,856.0 ms | 2,453.9 ms | 14.1% |
| Homepage → cell explorer | 2,653.8 ms (one baseline) | 353.8 ms (median of 3) | 86.7% |
| Cell model preparation after homepage | 2,283.6 ms | 4.1 ms (median of 3) | 99.8% |

The after-transition samples were 353.8, 346.8 and 484.2 ms. The limited baseline count means the 86.7% figure is an observed local comparison, not a general performance guarantee. These are the same browser/session and rendering settings, with HTTP cache disabled in the measuring tab. The HTTP-cache override was restored after testing.

- `after-cell.json`, `after-enter-cell.json`, `summary.json`: raw timing records and summary.
- `detail-reentry.json`: mitochondrion prepared in 155.0 ms on first visit and 0.8 ms after leaving for the homepage and resuming. The expected explode mode resumed; switching back to section view worked. Draw calls stayed at 18.
- `pixel-comparison.json`: the baseline cell, optimized cold cell, and cache-rebuilt cell at the same camera have **exactly identical pixels** in the 762 × 402 model viewport. `cell-warm-matched-full.png` and its metadata contain the controlled cache view. Two intermediate screenshots with uncontrolled hover/camera or an invalid clip are explicitly excluded in the record.
- The cell retained 152 draw calls. No geometry, texture, material or rendering-quality settings were reduced.
- `npm run check` passed: format, model and scientific regressions, cache tests, production build, and release asset/path checks. The final browser console check returned no warning/error entries.

The cache's 224 MiB / eight-entry bounds apply per document. It avoids repeated model generation, not every remaining cost: a fresh WebGL context still compiles/uploads and renders its first frame. Full reloads, cache eviction and models larger than the cap still need construction.
