# Secretion performance audit — 2026-10-04

## Scope and ownership

- Product change: `src/processes/secretionProcess.js` only.
- Portable regression: `tests/secretion-performance-equivalence.mjs` and
  `tests/fixtures/secretion-performance-ae697be/`.
- Evidence: `docs/qa/performance-systemwide-2026-10-04/evidence/secretion/`.
- No changes to `secretoryDetails.js`, runner, shared geometry, ProcessScene,
  biological content, sample counts, or model topology. No commit or deployment.

The delegated starting measurement was 5.92 ms mean update and 5.85 ms repeated
update in the complete 235-case baseline scan. This agent did not run timing;
the integrator owns paired performance measurement and browser acceptance.

## Complete shape dependencies

| Work | Shape dependency | Optimization |
| --- | --- | --- |
| ER connection | Constant donor ellipse and carrier mouth | Build the unchanged 13 × 289 vertex surface once |
| Golgi connection | `activeX`, `bridgeScale`; other radii and mouth coordinates are constants | Recompute for any change in either input, including hidden maturation and reverse docking seeks |
| Receiving membrane patch | Actual `poreRadius` | Reuse unchanged positions, normals and bounds |
| Fusion shell | `poreOpening`, `flatten` | Reuse unchanged complete surface; calculate row-dependent quantities once per row |
| Fusion/patch angular coordinates | 97 fixed angles | Retain the exact `Math.sin` / `Math.cos` results in Float64 arrays |
| Travelling carrier lipids | Fixed `outgoing.sites` | Reuse local instance matrices; update parent position and rotation every frame |
| Fused carrier lipids | Mode plus `poreOpening`, `flatten` | Rebuild the same triangle-attached lipid matrices when any input changes |

Caches are bounded per model: scalar last-state values and two 97-entry Float64
arrays. They do not quantize progress, skip invisible motion, change any vertex
count, or decrease update/render cadence. Every actual change still recomputes
normals, instance matrices and bounds using the original implementation.

## Correctness evidence

`node tests/secretion-performance-equivalence.mjs --report docs/qa/performance-systemwide-2026-10-04/evidence/secretion/full-equivalence.json`

Passed 362 paired states against the exact frozen `ae697be` source and helper:
201 evenly spaced playback states; epsilon neighborhoods around all 16 motion
and topology boundaries; reverse and shuffled seeks; dense final flattening;
repeated states; out-of-range and non-finite progress.

At every state the test checks all 350 nodes, all 159 unique geometries, all
materials, and the complete position/normal/UV/index/instance buffers. It checks
hidden nodes, exact bounds, transforms, hierarchy, visibility, retained object
and resource identities, labels, camera and user data. No sampled vertices or
numeric tolerances are used. Buffer upload versions are checked separately,
because suppressing unnecessary uploads intentionally changes those counters.

The invalidation checks confirm that the invisible Golgi bridge still moves
during maturation; pore opening changes update the patch, fusion surface and
lipids; identical dynamic states and plateau frames do not re-upload; seeking
between carrier and fused modes rebuilds the appropriate lipid matrices; the
ER bridge is built once.

Existing independent regressions also passed:

- `node tests/secretion-refinement.mjs`: cargo containment, cisternal fade,
  recycling and arbitrary seeks.
- `node tests/original-secretion-review.mjs`: lipid/surface continuity, welded
  neck and pore boundaries, triangle attachment, cargo passage and stable
  deterministic resources.
- `node tests/original-secretion-label-review.mjs`: 444 actual membrane surface
  checks, maximum label-to-surface distance 0.
- Scoped Prettier check and `git diff --check` passed.

Logs are retained beside `full-equivalence.json`; `source-freeze.json` records
the exact source/test/fixture hashes at handoff.

## Remaining acceptance boundaries

This is exact model-output and scientific-regression evidence. It does not
claim measured speedup, browser pixel/FPS acceptance, export acceptance,
cross-process integration acceptance, or publication. The integrator must run
the shared frozen-baseline performance and rendered review gates. The complete
portable baseline fixture covers this model only and remains an independent
reference if shared production helpers change in future work.
