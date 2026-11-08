# Plant cell-plate junction sampling

## Problem and change

The original scalar field retained a positive separating region between the growing cell plate and parental plasma membrane at normalized progress 0.8325, 0.84, 0.85 and 0.86. A focused-grid interval could have negative values at all eight corners while containing that positive region. The extractor then omitted both separating surfaces and showed premature continuity.

The repair keeps every original Float32 sample and merges additional axis planes through the positive field maximum. Near-parent vesicle/sheet gaps receive conforming y planes too. Planes enter from existing grid coordinates; scalar-field mathematics, vesicle paths, stage timing, tetrahedron extraction, interpolation, winding, normals, material and capture settings are unchanged. CPU lattice arrays are allocated once; GPU vertex/normal capacity and object identities remain fixed.

## Evidence

- A permanent rendered-mesh regression fails on the original source and passes on the repair. It independently bounds hidden vesicle support, then requires two actual ray crossings around the gap; the true final junction remains open.
- Dense motion: 571 poses in each direction, 47,393 retained original axis samples, 185,800 sampled values equal to the original field, 12,564 positive-gap checks and 27,408 total rays.
- Exact Float32 edge welding across twelve topology states finds no nonmanifold seams or internal boundaries beyond the disclosed finite-window cuts. Fully joined states retain two daughter membrane components spanning both parents. Deliberate obsolete caps and a missing face patch are rejected by negative controls.
- Cross-consumer/state validation: 1,290 model states and 7,329 single-cube sign/zero patterns. Both fungal delivery conditions remain byte exact. Unaffected plant geometry, metadata, materials, cameras, labels and bounds are exact; the intentionally repaired membrane is tested separately, including complete allocated-buffer history and zeroed tails.
- Original-quality browser captures: 100 unchanged bilingual 1920×1080 pairs are pixel exact. Sixty-four added intermediate pairs cover both full and close views; forty contain intended membrane changes. Progress 0.9 is exact in all added contexts. One shared renderer is released exactly once; no console errors or warnings.
- A frozen, plain-source Node ABBA screen retains all sixty windows across full/late plant, both fungal conditions and an unchanged secretion control. It passes the predeclared mean/p95 budget of baseline + max(0.1 ms, 10%). The correction adds some plant CPU work; this is not a speed improvement or browser-frame-time measurement.

## Biological scope

The zero surface models continuity of vesicle and cell-plate lumens with the parental membrane in a disclosed central cutaway. It is not a globally sealed whole-cell mesh. The current field is a teaching model, not a fitted molecular-fusion simulation. Normalized progress and coordinates are engineering validation inputs, not measured biological time or dimensions.

Primary background: [Arabidopsis electron tomography, 2004](https://doi.org/10.1105/tpc.017749), and [tobacco BY-2 live imaging, 2017](https://doi.org/10.1104/pp.17.00343). These are distinct organisms and methods; neither is used to assign experimental units to the model.

This scoped correction does not qualify all 84 processes scientifically, validate every spatial point, resolve the separate fungal analytic-field audit, or establish sustained physical 60 FPS. Original failures and frozen baselines are retained.
