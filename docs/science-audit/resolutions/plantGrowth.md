# plantGrowth Phase B resolutions

All 6 original issues have implemented fixes; 0 unresolved. Phase A evidence is unchanged. cellWallGrowth is unchanged. No browser operated; root retains final visual acceptance.

## plantGrowth-01 - fixed

Replaced independent slabs and solid rods with a shared membrane isosurface enclosing the cell-plate lumen. Real fenestrations close into a sheet; incoming vesicles merge through continuous necks with their internal membrane caps removed. Delivery follows the actual rounded plate margin, and the plate joins the parental plasma membrane in the same surface. Bilingual text identifies the enlarged topology schematic and front/back inspection cuts.

Verification: Welded rendered triangles at p=.44/.53/.65: both plate faces share one component and the nascent plate has zero boundary edges. Euler characteristic is below 2 for the early perforated network at p=.44 and equals 2 for the closed sheet at p=.65. At p=.484 a ray through the shared vesicle/plate lumen reaches the outer fusion membrane without encountering an obsolete internal cap. Actual margin-to-triangle distance is below .12 units, accounting for a .095 fusion bulge. At p=1 the membrane connects both parental sides; boundary edges occur only at declared display cuts or continuations.

Limitations: Mesoscale topology schematic, not an experimentally fitted membrane shape or molecular dynamics. Thirty advancing Node samples averaged about 19.5 ms/update on this host. Static initial/terminal states and repeated paused values are cached. Browser performance and visual acceptance remain for root.

## plantGrowth-02 - fixed

Microtubule endpoints, lengths and orientations now follow the actual kinetochore domains of the corresponding moving chromatids until anaphase disassembly.

Verification: At p=.13/.2/.27/.32/.35 all eight rendered cylinder endpoints remain within 1e-6 of their moving kinetochore mesh centers.

Limitations: Chromosome number, microtubule counts and motion rates remain illustrative.

## plantGrowth-03 - fixed

Preserved the two-cell embryo endpoint, with a larger basal daughter toward the micropyle and smaller apical daughter, distinct boundaries, one nucleus each and a division wall. Updated the bilingual final stage and added the Kimata primary paper to model sources.

Verification: Both assignment controls at p=.91: basal volume exceeds twice apical volume, basal position faces the micropyle, daughter ellipsoids do not overlap, and each has one visible 2n nucleus.

Limitations: Cell dimensions and timing are illustrative rather than fitted measurements; no full embryogenesis process was added.

## plantGrowth-04 - fixed

The sperm and its paternal nucleus now hand off exclusively at p=.72 to the paternal contribution inside the fusion product, eliminating the .72-.73 duplicate interval.

Verification: Both assignments at .70/.7199/.72/.725/.7299/.73/.75/.85: actual inherited mesh visibility gives exactly two paternal nuclear identities.

Limitations: The handoff illustrates identity transfer rather than nuclear-envelope fusion dynamics. Existing correct 2n/3n outcomes remain.

## plantGrowth-05 - fixed

Restricted transport cables to their own cytoplasmic compartments. Vesicles cross the central septal pores; the narrowed crossing region now accounts for the whole vesicle radius rather than its center alone.

Verification: Forty-one progress samples for each delivery control: all six cable bounds stay outside each solid septal slab. Transformed actual vesicle vertices entering septal thickness remain within the .149 clear pore radius.

Limitations: Motor transfer between compartment-local tracks is not expanded; no continuous cable is implied through solid wall.

## plantGrowth-06 - fixed

Converted wall bundles to preallocated shoulder-deposition cohorts with different birth times. Deposited material retains its wall position as the apex advances and becomes lateral wall. Updated the bilingual explanation.

Verification: For both delivery controls, bundles visible at p=.55 retain identical world positions at p=.95 while the apex advances; their radial positions remain outside the wall cylinder.

Limitations: Fixed markers represent retained material over this illustrative interval, not a claim that real walls never deform.

## Commands

- node src/processes/modules/plantGrowth/science.test.mjs: PASS; all six geometry/state invariants, both controls, deterministic seeking and stable resource identities.
- node src/processes/modules/plantGrowth/smoke.mjs: PASS; all four models, finite attributes/bounds, distinct states, deterministic seeking and resource identity.
- npx prettier --write on the six owned JS/MJS files: completed. No full-workspace verification run.

Modified models/helpers: plantDivisionProcess.js, structuralDetail.js, doubleFertilizationProcess.js, fungalHyphaeProcess.js. Added cellPlateMembrane.js and science.test.mjs. No shared renderer, catalog, thumbnail, other group or Phase A report was changed.

The scientific regression verifies these geometric/state invariants; it is not a guarantee of every biological detail.

## Exact-seek follow-up

Reproduced the global plantDivision seek-0 hash mismatch exactly (f9d6ec7e versus 1549e0b7). The active 55296 scalar entries were identical; only unused fixed-capacity buffer tails retained later frames (112500 position and 79074 normal scalar differences). Both tails are now zeroed on every membrane rebuild. No global test or assertion was changed.

Added seek.test.mjs with the same complete snapshot fields and forward/reverse/stage/clamp/control sequence as tests/processes.mjs. All four owned models pass; the existing scientific regression also passes.
