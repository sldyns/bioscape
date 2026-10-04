# Division geometry optimization · 2026-10-04

**Implemented and frozen: the two root-authorized algorithm changes only. Complete sampled geometry remains bit-identical to the root-frozen baseline. All directed regressions pass. No new timing benchmark or browser run was performed by this reviewer; speedup and release/deployment acceptance remain with the root integrator.**

## Changes

1. `divisionShapes.js:chromatid.restAxisPoint` exposes the undeformed exchange coordinate using the same ordered local-to-world and world-to-model operations as the former `setDeflection(0); axisPoint(...)` path. `meiosisProcess.js:update` derives the final absolute deflection from that query, then calls `setDeflection` once. The intermediate zero geometry is never needed for rendering. Its removal avoids rebuilding three arm surfaces, their normals/bounds and decorative instances twice for each recombinant; an unchanged deformation now hits the existing cache. Zero targets are normalized to positive zero because the previous reset path retained +0 even when its subsequent computed target was -0.
2. `germCellMembrane.js:update` evaluates x columns 0–32 and copies each rounded Float32 result to column 64-i. The original x coordinates `-4+i/8` are exact binary fractions and all x field terms depend only on `abs(x)`. This retains every original field value while reducing scalar evaluations from **70,395 to 35,739**, and square-root calls from **211,185 to 107,217** per changing field. The complete grid, gradient calculation, tetrahedral traversal, output ordering, normals, labels, ring contours and biological state remain in place.

The current product diff against the root-frozen snapshot is preserved in [authorized-product-diff.patch](evidence/division/authorized-product-diff.patch). Other source-level candidates in [geometry-candidates.md](geometry-candidates.md) remain proposals and were not implemented. No files outside division ownership, no shared runner and no original infection product files were changed in this performance increment.

## Equivalence evidence

Frozen source: `/tmp/bioscape-performance-20261004-baseline/src`. The comparison reads that independent source tree; it does not construct a reference from the optimized function. Detailed state hashes and source hashes are in [frozen-model-equivalence.json](evidence/division/frozen-model-equivalence.json).

- **6 configurations / 112 sampled states:** meiosis default, mitosis normal and mitosis unattached, each with an identity root and an externally translated/rotated/nonuniformly scaled parent plus local root transforms. Meiosis covers 34 poses around crossover, I separation, both membrane constrictions, II separation, envelope assembly and terminal state; each mitosis branch covers 11 poses including the previously problematic irregular capture value `.1603687500000001`.
- **112 additional arbitrary-seek comparisons:** each state is revisited after `.97831` and `.03197`. Both frozen and optimized models reproduce the same digest; node, geometry, BufferAttribute and backing-array identities remain stable.
- The digest includes full Float32/other typed geometry attribute and index buffers, including unused membrane tails; instance matrices; Float64 object transforms and world matrices; geometry and instance bounds; draw ranges; material identity relationships and render properties; visible state; labels and model state. Numeric arrays are hashed as bytes, preserving signed zero. Internal GPU dirty/version counters are intentionally excluded because suppressing unchanged writes is the optimization.
- **15 independent scalar-field states × 2 leaflets** have stored frozen-reference hashes for full positions/normals, draw ranges and bounds. The permanent `geometry-equivalence.test.mjs` checks them, then checks reverse/irregular seeks and buffer identities. The fixture is generated once from the explicit frozen source using `make-membrane-reference.mjs`; ordinary tests never regenerate it from current output.
- **36 rest-axis queries** cover both chromatid sides, telocentric and non-telocentric shapes, three deflections and three coordinates under transformed parents. Returned coordinates exactly match the previous zero-reset query; geometry contents and dirty counters remain unchanged by the query.
- The new plateau regression rejects the original redundant rewrite: at `.3 → .3119`, the frozen version changes **24 arm position/normal attribute versions**, while the optimized version changes **0**. The regression also requires an actual chromosome-buffer change when homolog relaxation progresses to `.4731`; it cannot pass by disabling deformation.

## Checks completed

| Check | Result | Evidence |
| --- | --- | --- |
| Frozen-source model equivalence (no timers) | PASS: 112 states + 112 repeat comparisons | [Log](evidence/division/frozen-model-equivalence.log) |
| `node src/processes/modules/division/geometry-equivalence.test.mjs` | PASS | [Log](evidence/division/geometry-equivalence.log) |
| `node src/processes/modules/division/science.test.mjs` | PASS; all original regressions retained, with the new equivalence test imported last | [Log](evidence/division/science.log) |
| `node src/processes/modules/division/division.smoke.mjs` | PASS; mitosis 254 nodes and meiosis 325 nodes | [Log](evidence/division/smoke.log) |
| Exact owned-file Prettier formatting and `git diff --check` | PASS | [Format log](evidence/division/format.log) |

Old scientific checks still cover actual kinetochore contacts, arrest, chromosome allocation, open bridge/manifold topology and irregular replay. Existing cortical-ring tests retain the measured maximum sampled gap **.037536**; all **226** division world-space label checks pass. Neither old assertions nor tolerance bounds were weakened.

## Frozen file hashes

The machine-readable [code-freeze-sha256.json](evidence/division/code-freeze-sha256.json) includes baseline hashes where available. The product hashes below still match the source used by the successful independent model comparison after formatting.

| File | Final SHA-256 |
| --- | --- |
| `divisionShapes.js` | `642a24b88e4f7ba69e210147f698a3073d41c27a97feeb9437daf2262a180556` |
| `germCellMembrane.js` | `ab3c520603a6ed05ce1371c450156d582b9b657b0c1ffb2931dbf34a8fa30f41` |
| `meiosisProcess.js` | `ddca511ed617e3b767a3cce604c4db1cd398d3bdc46a070e8b8192f423984f98` |
| `science.test.mjs` | `b2d43914619c736f753314b7a20fb789fd914735106e5712faeb5d7af6f55862` |
| `geometry-equivalence.test.mjs` | `78123ef1346e1bece0a7a5d17cde97141093bb26e15243b6955ec24feb0967bf` |
| `geometry-equivalence-baseline.json` | `29c2114fcc7e911cb4f507d1afc68fda25f4d3def79e02458fae817b257167e7` |

## Remaining gates and limits

The analytical operation counts establish less redundant work, not a measured end-to-end speedup. Root owns the controlled final CPU A/B and native browser performance runs after all agents are idle. Existing prior-run p95 values in `geometry-candidates.md` are historical context, not results for this increment. No full-workspace suite, new rendered acceptance, commit, publication or deployment was performed by this reviewer.

Bit-identical sampled output plus the x-symmetry and pure-final-deformation arguments provide a strong equivalence case; the report does not claim testing every real-valued progress input or every future rendering engine. The new permanent fixture depends on the declared current geometry/normal contract and should only change after a separately justified geometry change, never simply to make a failed optimization pass.
