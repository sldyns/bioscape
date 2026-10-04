# Signals continuous membrane optimization · 2026-10-04

Status: implementation frozen; exact geometry/model comparison and scoped science checks pass. This owner ran no timing benchmark or browser. Root owns the unified serial A/B–B/A measurements, browser playback, integrated checks and deployment.

## Change and retained behavior

Only `src/processes/modules/signals/continuousMembrane.js` changes production behavior internally. The two process files, their scientific paths, labels, materials and control logic remain byte-identical to the frozen source directory `/tmp/bioscape-performance-20261004-baseline/src`. All six prior signals scientific repairs are retained.

The same grid coordinates now live in a `Float64Array`, and fixed cube connectivity plus the original six-tetrahedron pattern replace nested point/tetrahedron arrays. A cube whose eight sampled values have the same `< 0` classification skips all six tetrahedra: the old algorithm emitted no triangles there. Cube traversal, tetrahedron order, corner order and zero classification stay unchanged.

A directed grid-edge key reuses each interpolated point and its exact normalized field result within one changed update. **The two endpoint directions have separate cache entries.** Their mathematical location agrees, but normalizing endpoint order could alter floating-point rounding. The implementation retains the original ordered `values[a] / (values[a] - values[b])` and `a + (b - a) * u` operations, original lobe/field evaluation order and Float64 intermediate precision. No reversed-edge equivalence is assumed.

Fixed position/normal scratch pools, reusable normal scratch and per-update stamps replace per-edge map arrays, per-emitted-triangle normal arrays and per-update helper closures. The winding test uses the same full-precision coordinates and normals; scalar writes retain the original emitted vertex and triangle order and final Float32 conversion. Complete inactive buffer tails are still cleared. The previous unchanged-field cache still skips remeshing/uploads.

Resolution remains **40×32×16** for apoptosis and **44×32×16** for differentiation. The output capacity remains **60,000 vertices**. No triangle simplification, molecular geometry change, opacity/material change, label change or render setting was introduced. The API and exported field function remain unchanged.

The new fixed typed-array storage, including output buffers, grid samples/topology and directed cache, is **8,287,584 bytes** for apoptosis and **8,676,256 bytes** for differentiation. This is an explicit bounded-memory tradeoff for eliminating repeated transient allocations and field evaluations. It is not a measured heap reduction; the old nested-array heap size was not measured.

## Exact verification

`continuousMembrane.reference.mjs` is a test-only frozen copy of the previous implementation. Its original source SHA-256 is `ca3bf70e4f8e82eba4c83be803e77952c1e6bf0b16a43f6bf9c34dbc5efaab6c`. The new `continuousMembrane.test.mjs` is imported by the existing signals science runner. No shared runner was changed.

The permanent regression compares the complete position and normal arrays **byte for byte**, including unused tails, across the two production resolutions, an asymmetric grid and a single-cube boundary grid. Cases include empty/all-positive/all-negative fields, one cell, connected neck, separation, six lobes, grid-zero samples, weak blend, deterministic unequal lobes, reverse seeks, repeated equal inputs and in-place input mutation. It also compares draw ranges, upload versions, fixed object/buffer identities, bounds, material identity/state and exact field/normal queries. Result: **364 states, 524,160,000 complete buffer bytes and 1,092 exact field/normal checks pass**. [Log](evidence/signals/equivalence.log).

A separate diagnostic imports both complete models directly from the frozen directory and current source. All four conditions (`stress`, `noStress`, `competent`, `impaired`) run 28 ordinary/critical/reverse states each, including .36/.445/.46, .825/.89/.94 and terminal 1. Result: **112 states / 38,080 scene nodes / 23,688 unique geometry states**, covering **821,177,952 geometry/index bytes**, **415,744 instance bytes**, and **728 bilingual label states**, all exact. The comparison also checks complete triangle indices, material groups, transforms, visibility, draw ranges, material JSON excluding per-instance UUID/metadata, biological state and camera. It independently confirms that both process source files remain unchanged. [Diagnostic](evidence/signals/compare-model-output.mjs), [result and per-state membrane hashes](evidence/signals/model-output-equivalence.json), [compact log](evidence/signals/model-output-equivalence.log).

Scoped checks completed successfully:

- `node src/processes/modules/signals/continuousMembrane.test.mjs` — exact standalone equivalence above.
- `node docs/qa/performance-2026-10-04/evidence/signals/compare-model-output.mjs` — independent complete-model frozen-directory comparison.
- `node src/processes/modules/signals/science.test.mjs` — original ERK/GATA/ER-cargo checks plus 05 event identities, 06 Apaf cytosol regression and new membrane equivalence. [Log](evidence/signals/science.log).
- `node src/processes/modules/signals/smoke.mjs` — all four signals processes, bilingual stages, geometry, deterministic seeks, controls and bundle. [Log](evidence/signals/smoke.log).
- Scoped Prettier and `git diff --check` completed. Final formatting left production code unchanged.

[Frozen source hashes and compact receipt](evidence/signals/frozen-receipt.json).

## Measurement and release boundary

The exact comparisons establish retained output for the tested states; they do not establish FPS or a speedup. Root was notified as soon as all model/test activity ended and may run uncontended serial timing and real browser playback against this frozen implementation. This owner will not start more model tests or timing while root measures. No browser actions, commit, push or deployment were performed by this owner.
