# plantGrowth · Phase A · 2026-10-04

Baseline `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Four models and seven complete condition scenarios reviewed: three `confirmed_issue`, one `qualified_pass`, no `unresolved` model. Five findings: two P1, three P2. Product/test files remain unchanged. No browser or full suite was run.

| Model | Actual roots | Verdict | Findings |
| --- | --- | --- | --- |
| plantDivision | plant | confirmed_issue | 01 P2: fused cell-plate rim snaps inward on loop reset |
| cellWallGrowth | plant | qualified_pass | No confirmed defect in checked compartment/control/motion scope |
| doubleFertilization | plant | confirmed_issue | 02 P1: gamete/nuclear topology; 03 P2: paternal identity jumps |
| fungalHyphae | yeast | confirmed_issue | 04 P1: intact carrier recycle skips represented fusion; 05 P2: path junction jump |

All six stages per model, both languages, entries, labels, condition options and shared root/condition annotations were read. `processesByRoot` was evaluated directly; none of these models is registered under neuron, muscleFibre or erythrocyte. The `yeast` navigation ID is presented as a fungal entry, and the hyphal model explicitly identifies **Neurospora crassa** and avoids the yeast-bud link. This scope is appropriate.

## 20261004-plantGrowth-01 · P2 · cell-plate surface discontinuity

`plantDivisionProcess.js:178–185,210–211` removes a fused vesicle bulge when its modulo phase wraps. Actual triangle ray intersections along +x retreat by **0.094999** at p=.5 and **0.094999** at p=.7 across only 2e-7 progress. This is almost a full vesicle radius (.095), while the central plate radius changes negligibly. The membrane itself snaps inward; it is not only an invisible flow-particle reset.

Complete absorption continuously before carrier reuse. Regression should compare actual membrane surfaces across every cycle boundary and preserve existing closed-lumen, growing-margin, parental-connection and exact-seek checks. The [opened primary publisher abstract](https://academic.oup.com/plcell/article/16/4/836/6010368) supports the outward-growing fusion sequence; the discontinuity measurement is from this implementation.

The bounded 18-update Node sample measured median **17.05 ms**, maximum **27.86 ms**. Concurrent review load and lack of WebGL make this a **browser measurement lead**, not proof of a sustained FPS failure.

## cellWallGrowth · qualified pass

Actual geometry keeps cortical microtubules and catalytic lobes on the cytosolic side, output/fibers outside the membrane, and alternating CESA trajectories attached to their growing trails. Yielding reaches patch y-scale 1.32 while restrained remains 1; both continue deposition. No modulo reset exists and boundary position/scale functions are continuous. The [opened author-university primary abstract](https://researchprofiles.ku.dk/en/publications/cellulose-synthesis-and-cell-expansion-are-regulated-by-different/) supports distinguishing short-time cellulose synthesis from expansion governed by wall extensibility.

This pass does not certify atomic CESA folds/subunit counts, glucan chemistry, membrane packing, rates or rendered smoothness. Paredez's primary abstract was available through search, but direct article opening was blocked; that limit is recorded explicitly.

## 20261004-plantGrowth-02 · P1 · double-fertilization topology

`doubleFertilizationProcess.js:66–68,91–104,138–150,230–249` carries an independently bounded, complete sperm membrane into the egg until p=.72. At p=.7 the entire sampled egg-target sperm shell is inside the egg (ellipsoid Q .102–.494). Conversely, the central-target paternal nucleus is **outside** the female central-cell envelope: Q=1.547 at .7 and Q=1.484 just before .72. Its z=.2689 exceeds the gamete's maximum front z=.21. Both assignments reproduce this.

The [opened eLife primary research](https://elifesciences.org/articles/04501) distinguishes membrane fusion from subsequent male nuclear migration inside the female gamete. Fix actual membrane contact/merger and contained nuclear routes, while preserving the two sperm identities and the correct ploidy outcomes. A metadata label or count-only check cannot fix this compartment error.

## 20261004-plantGrowth-03 · P2 · paternal nuclear handoff

At p=.72 the outgoing carried nucleus and incoming contribution marker differ by **.238716 units** for the egg and **.200881** for the central cell, several times the prior nucleus radius (~.027). This occurs in both assignments. Current tests prove two identities remain visible, but do not test spatial continuity.

Match the world positions and visual extents at handoff and then allow continuous nuclear mixing. Keep exactly two contributions throughout. The larger basal/smaller apical embryo geometry and stated n+n / 2n+n outcomes were retained as correct scoped aspects; later development is explicitly compressed.

## 20261004-plantGrowth-04 · P1 · hyphal fusion event skipped

`fungalHyphaeProcess.js:153–156,245–287` and `structuralDetail.js:20–46` show a detailed vesicle shell, two rims and cargo bodies. Each carrier remains fully visible at scale .073 through apical approach; the membrane has no merger/neck/cargo-transfer state. It then reappears at the base unchanged. Normal carrier 0 jumps **5.216738 units** at p=2/3. A visible reduced-supply carrier also does this. Independent wall-cohort births do not establish carrier-to-membrane transfer.

The [opened institutional primary paper](https://escholarship.org/content/qt9f07s7gz/qt9f07s7gz_noSplash_ea3a4598693ca4e27485abac86cb6793.pdf) supports apical tethering/exocytosis and membrane/cargo transfer. Represent a traceable fusion event and finish delivery before invisible reuse. Preserve the stratified Spitzenkörper, carrier detail, pore clearance and retained wall cohorts.

## 20261004-plantGrowth-05 · P2 · hyphal path junction

`fungalHyphaeProcess.js:249–263` switches at t=.68 from a route ending at nonzero y and carrier-dependent z to y=0,z=.12. Actual visible carriers jump **.080–.247406 units** in normal delivery and **.124660–.227606** for the reduced branch's sampled crossings. The largest exceeds the .146 carrier diameter. Join the two routes in the same world position, smooth the velocity change, and retest all crossings plus septal clearance.

## Evidence and remaining gates

- `node src/processes/modules/plantGrowth/science.test.mjs`: PASS. This includes exact full-buffer seeks for all four models (26 reference states each), both branch checks and prior attachment/topology/pore/identity invariants.
- `node docs/qa/process-review-2026-10-04/evidence/plantGrowth/audit-probe.mjs`: PASS as a diagnostic run; writes measured findings, actual registrations and resource inventories. All node/geometry/material UUID inventories remained stable.
- [Full measurements](../evidence/plantGrowth/audit-probe.json), [diagnostic source](../evidence/plantGrowth/audit-probe.mjs), [test log](../evidence/plantGrowth/science-test.log), and [opened primary-source access notes](../evidence/plantGrowth/source-notes.md).

These are source/numeric audit results. Browser rendering, continuous playback, full integration and device/performance acceptance remain with the integrator. Phase B has not begun.
