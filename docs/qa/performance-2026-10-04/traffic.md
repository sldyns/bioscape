# Traffic membrane optimization — 2026-10-04

The candidate preserves the frozen model output while avoiding repeated work for unchanged membrane profiles. This task changes only the production file `src/processes/modules/traffic/membranes.js`; the caller models, mesh resolution, normal algorithm, materials, cameras and biological mechanisms are unchanged.

## Implementation

- `set(profile)` still evaluates the full profile on every call. It compares every sampled axial coordinate and clamped radius with the last completed update using `Object.is`; this preserves signed-zero distinctions. Only a fully unchanged effective profile skips geometry writes, normal/bounds recomputation, lipid instance matrices and upload flags.
- The first call always builds the surfaces, even when its complete profile consists of zeros. A change at the last ring also invalidates the profile.
- Fixed angular sines/cosines and lipid-row indices are computed once per surface. The original arithmetic expressions and double precision are retained, including independent cut-edge angle expressions.
- There is no skip based on visibility, sampled progress alone, callback identity or approximate coordinate equality. Changes to position/opacity remain controlled by the original callers.

## Frozen output comparison

Baseline: `/tmp/bioscape-performance-20261004-baseline/src`, captured by the root before optimization and containing the completed scientific repairs. Baseline membrane SHA-256: `cbd58fc7e6b75615c45e0c6d00486119db5d0ae388ce3d3ef845f0d5b3db8728`.

[equivalence.json](evidence/traffic/equivalence.json) records exact source hashes and results. The reproducible [comparison script](evidence/traffic/compare-frozen.mjs) bundles the frozen model sources into temporary modules against the same Three.js runtime, removes those temporary bundles afterwards, and compares them with the candidate. The baseline root can be supplied using `BIOSCAPE_PERF_BASELINE`.

For each model, 210 updates cover 121 evenly spaced states, 75 samples at/around 25 transition boundaries, backward/repeated seeks, out-of-range progress and nonfinite inputs. Comparisons include all objects, even when hidden: every geometry attribute and index byte, local/world transform, instance-matrix byte, geometry/instance bounding box and sphere, visibility, draw ranges, materials, user data, labels and camera. UUIDs/resource IDs and buffer upload versions are excluded because their identity or changed upload frequency is not rendered model output.

| Model       | Equivalent states | Baseline profile rebuilds | Candidate profile rebuilds | Rebuilds omitted |
| ----------- | ----------------: | ------------------------: | -------------------------: | ---------------: |
| Endocytosis |         210 / 210 |                       630 |                        114 |              516 |
| Autophagy   |         210 / 210 |                      1050 |                        324 |              726 |

These counts come from position-buffer update versions during the correctness sequence, not from a timed benchmark. They show removed work and must not be interpreted as FPS or elapsed-time improvements. Each skipped profile avoids the existing three normal/geometry-bounds passes and two lipid-instance/bounds updates.

## Regression coverage

The new `membranes.perf.test.mjs` is imported by the existing owned `science.test.mjs`; the shared runner is unchanged. Its frozen reference fixture retains the pre-optimization membrane builder, with only its relative import adjusted for the fixture directory.

- 88 byte-identical direct-surface states span both axes and 9/65/82/129 rings with the original 64 angular divisions.
- Instrumented checks establish that an unchanged complete profile avoids geometry upload versions, normal/bounds methods and instance writes.
- Edge cases cover first zero initialization, a last-ring-only change, different callbacks returning identical values, different negative radii with the same clamped output, signed zero, curved profiles, backward return, external transforms and material opacity.
- Full-model comparison passed for both models, including labels and deterministic seek results.

Evidence: [surface-equivalence log](evidence/traffic/membranes-equivalence.log), [frozen-model log](evidence/traffic/frozen-model-equivalence.log), [science log](evidence/traffic/science.log), [baseline hash](evidence/traffic/baseline-membranes.sha256).

Status: direct-surface equivalence, full-model equivalence and the complete owned traffic science suite all passed. The latter retains the earlier membrane/protein/label scientific regressions and also passed finite geometry, stable resource inventory, deterministic seeks and browser esbuild checks for endocytosis, autophagy and secretion. Owned `git diff --check` passed. Product code and test sources are frozen for the root's controlled measurements.

## Acceptance boundary

No timing benchmark or browser operation was run by this agent. The root owns final A/B CPU measurements, rendered/pixel comparison, browser performance, integration, release checks and deployment. Retain the candidate only if those measurements confirm a useful benefit without a rendered regression. The byte-equivalence results here establish correctness for the checked states, not a deployment outcome.
