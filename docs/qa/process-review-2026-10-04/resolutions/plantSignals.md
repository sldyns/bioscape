# plantSignals Phase B resolution · 2026-10-04

All seven findings are fixed in the owned module: the five original Phase B issues and two appended rendered-label findings. Local geometry/tests pass; root must reload this frozen source for final rendered playback acceptance.

| Issue | Change | Measured verification |
|---|---|---|
| 20261004-plantSignals-01 | Corrected shared protein-helix handedness; preserved endpoints and detail. | 137 auxin, 61 plantDefense and 155 photosynthesis helper helices have positive handedness; maximum endpoint change 2.12e-16. Traffic reviewer notified. |
| 20261004-plantSignals-02 | Separated Aux/IAA and ARF PB1 into touching surfaces; preserved the exact TIR1 docking pose. | PB1 vertices inside repressor: 1700/1700 → 0/1700. Initial/control/departure surface checks pass. |
| 20261004-plantSignals-03 | Replaced strand popping with a continuously revealed and consumed, body-anchored 64-segment substrate. | Old visibility thresholds are continuous; terminal visible length/radius tend to zero. Anchor error <1e-6; strand remains fully present in between. |
| 20261004-plantSignals-04 | Separated FLS2/BAK1 ectodomains; retained cytosolic interfaces via the flexible tether. Also fitted flg22 along the FLS2 concave face. | Prior 0.35-unit main-solid overlap becomes a 0.01037-unit surface gap. Both ligand contacts, kinase interfaces and membrane containment/refill pass. |
| 20261004-plantSignals-05 | Hid electron resets only at zero size; smoothed induced onset. | Maximum wrap-neighbor radius 4.65e-13; full-size flow persists midstage and absent condition stays inactive. |

Changed product files: `auxinProcess.js`, `plantDefenseProcess.js`, `structures.js`. Added meaningful regressions in `science.test.mjs`; no prior regression was weakened. No edits to root-owned photosynthesis.

- [Structured resolution](plantSignals.json) accounts for every issue exactly once, with files, sources and limitations.
- [Local science test log](../evidence/plantSignals/science-repair.log): prior and new regressions pass.
- [Mutation results](../evidence/plantSignals/mutation-checks.json): all five independently reintroduced original defects are rejected by their associated assertions; mutations remained in memory.
- [Repair diagnostics](../evidence/plantSignals/repair-diagnostics.json): actual geometry, shared-helper consumers, four condition timelines, finite buffers, stable resources and deterministic irregular seeks.
- Formatting checked on the four owned source/test files only. Original Phase A reports and evidence are retained unchanged.

New primary-source links in the models: [Korasick et al. PB1 interaction](https://pmc.ncbi.nlm.nih.gov/articles/PMC3986151/), [de la Peña et al. substrate-engaged proteasome](https://www.lander-lab.com/pdfs/30309908.pdf), [4MN8 FLS2/flg22/BAK1 structure](https://www.rcsb.org/structure/4MN8). The original experimental TIR1 coordinates and provenance remain intact.

Normal-camera appearance, labels in both languages and continuous rendered playback remain root gates. No browser, full-workspace test, release, device or performance claim is made here.

## Integrated rendered follow-up

- **20261004-plantSignals-06 / auxin:** named leaders now follow actual mesh/instance surfaces, including bound auxin and growing RNA; transient labels respect their objects. The nucleus remains an interior-region caption.
- **20261004-plantSignals-07 / plantDefense:** receptor, kinase, ligand, ROS/donor and membrane anchors now follow the complete geometry transforms. Apoplast/Cytosol remain region captions.

[Stage-by-stage review](plantSignals-rendered.md), [additional discovery record](../evidence/plantSignals/repair-discoveries.json), [current regression log](../evidence/plantSignals/science-rendered-repair.log) and [new offset mutation checks](../evidence/plantSignals/rendered-mutation-checks.json). All 203 active anchors land on actual triangle surfaces; both legacy-offset mutations are rejected. No Phase A artifact was changed. Updated anchors have not been re-rendered here; root owns the reload/review.
