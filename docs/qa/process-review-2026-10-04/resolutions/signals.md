# Signals · Phase B resolution

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Ownership: the four models under `src/processes/modules/signals` only. Original Phase A audit and diagnostic evidence are unchanged.

| Issue | Result | Actual-geometry evidence |
| --- | --- | --- |
| 20261004-signals-01 · ERK crossed a closed nuclear rim | Fixed: every envelope layer opens at the same portal; complete kinase passes through the detailed pore. | All ERK meshes clear every envelope/rim/pore mesh; all three receptor branches pass. |
| 20261004-signals-02 · GATA1 outside/crossing nucleus | Fixed: complete regulator and trajectory moved inside nuclear compartment. | 23,320 actual GATA1 vertex containment checks and no NE triangle intersection; existing complete DNA checks retained. |
| 20261004-signals-03 · peptide/MHC crossed closed ER and carrier walls | Fixed: one connected membrane field buds, separates and fuses; peptide loading is continuous; MHC extracellular domain stays luminal before export. | 259,204 cargo vertices; actual wall-intersection checks; connected ER neck, separated carrier, open surface fusion; fully fused carrier removal has identical geometry hash. |
| 20261004-signals-04 · label leader endpoints/visibility | Additional repair discovery, recorded separately. Named structures now track actual meshes; compartments and constriction point to their actual regions. | 650 active checks across all nine conditions and reverse seeks; actual named-mesh interior tests, ancestry visibility, ER-lumen and membrane-field checks. |

## Full-detail optimization

Equal membrane field inputs now skip remesh/upload. Fixed tetrahedron slots replace per-cell temporary arrays. Resolution remains `[40,32,16]`; complete position **and normal** buffers are byte-identical to the baseline for single, connected-neck and separated fields. Nuclear deformation retains the original vertex transform, using analytic normals and conservative bounds instead of repeated full-mesh rescans. Its 617,589 vertex/normal/bounds checks pass. The new secretory membrane retains its `[164,138]` grid and fixed buffers.

The bounded CPU diagnostic sampled eight updates per case after warmup. Same-state means: apoptosis **0.052 ms**, differentiation **0.019 ms**, immune response **0.039 ms**. Changing-state means: apoptosis **16.33 ms**, differentiation **11.01 ms**, immune transport **2.97 ms**. These are Node update costs with other agents potentially active; they do not establish browser FPS. Apoptosis active morph remains the most expensive case and requires root's rendered measurement.

## Verification and handoff

Passed: `science.test.mjs`, `smoke.mjs`, `labelAnchors.test.mjs`, `deformation.test.mjs`, the baseline-buffer equivalence diagnostic, and scoped `git diff --check`. Existing original DNA containment, membrane closure, molecular contacts, all conditions, arbitrary seek and resource invariants remain intact. Detailed commands, source URLs, limitations and evidence paths are in [signals.json](signals.json).

Evidence: [science](../evidence/signals/phase-b-science.log), [smoke](../evidence/signals/phase-b-smoke.log), [labels](../evidence/signals/phase-b-labels.log), [deformation](../evidence/signals/phase-b-deformation.log), [buffer equivalence](../evidence/signals/phase-b-optimization.json), [CPU timings](../evidence/signals/phase-b-timing.json), [repair discovery](../evidence/signals/repair-discoveries.json).

Integrated native playback and sustained rendered smoothness remain root-owned evidence. This owner reviewed saved normal-camera images and the fresh apoptosis completion records; no browser, full-workspace suite, commit or deployment was run by this owner.

## Final default-scene review and event labels

Reviewed all 28 default Chinese full-b3 frames across the four models and nine original 960 images. The review found and fixed **20261004-signals-05**: apoptosis now distinguishes chromatin, membrane blebbing/body formation and separated bodies, and names Apaf-1 monomers/assembly/assembled complex at their actual stages. Targets and geometry did not move. The new test failed against the prior identities and passes after repair, including actual membrane components, arm configuration, inactive controls and reverse seeks; it is imported by science. Full science, smoke and anchor checks pass after the correction.

[Historical full rendered report](signals-rendered-final.md) retains the original default-frame discovery. Original full-b3 images must not be presented as showing the corrected event names. Fresh final-f English critical images and full-final-apoptosis Chinese images now verify the corrected names; detailed closure is in the [all-case report](signals-rendered-all-cases.md). No claim of 235-context or physical-device acceptance is made by this owner.

## All-control final review and cytosolic Apaf-1 path

[All-case rendered report](signals-rendered-all-cases.md): the initial 9 English sheets / 63 frames / 12 originals exposed compartment error **06**. The full-detail Apaf-1 approach and late inward movement are fixed: 38 visible poses / 893,397 vertices clear actual nuclear, mitochondrial (including correctly transformed instances) and plasma surfaces; original geometry and seven-arm assembly remain. The old path fails, and negative controls restore both defects. `apoptosomeCytosol.test.mjs` is imported by science.

Fresh frozen-model review now passes **4 apoptosis sheets / 36 images / 13 original 960 images**: 22 English critical/control images plus 14 Chinese images from parent-operated native playback. .36/.445/.46 show cytosolic clearance; .94/1 retain the complete complex within the remnant; .36/.89/.94 also close the remaining event-name image checks. Both noStress sets are byte-identical within their respective language batch. Both Chinese native records complete at terminal 1 with monotonic progress and no errors. This owner inspected images and raw records; the parent operated the replay. **All nine signals cases now pass their latest applicable sampled review; repairs 01–06 are closed within the stated geometry/rendered boundaries.** The existing 016 images remain pre-06 discovery evidence. [Compact fresh receipt](../evidence/signals/final-f-rendered-review.json).
