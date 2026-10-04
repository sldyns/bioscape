# phageLife Phase B resolution

Three original issues and one repair-discovered label issue are fixed. Phase A is unchanged.

## 20261004-phageLife-01 — fixed

- A single mutable duplex travels from the lambda capsid through an open, curved tail into the host, then closes its ends. The generic packaged genome is disabled.
- Host attachment arms and the same viral loop deform through a common strand-matched recombination junction; integration and excision no longer overlap complete independent genomes. Excision transfers exclusive drawing ownership to a clone sharing the same updated DNA buffers.
- The lambda portal vertex, tail lumen, outlet and ring orientations support the actual transfer path. Existing T4 geometry and both daughter-fate invariants remain intact.

Verification: Actual visible DNA backbone segments do not intersect capsid/tail-wall triangles during transfer; contiguous sampled centerline and schematic contour-length range <0.025 scene units. Both strands match actual host-arm endpoints to <1e-6 during recombination; closed circles and resealed host junctions are verified. At ten conversion boundaries +/-1e-6, corresponding polymer positions move <0.001; integrated/excised complete representations are never simultaneously effective. Existing daughter chromosome/prophage/CI/envelope and T4 entry regressions still pass.

## 20261004-phageLife-02 — fixed

- Removed separate preview duplicates. Six prebuilt physical fibers assemble at independent sites, retain full length during installation and move continuously into their baseplate binding positions.
- Per-fiber transforms compensate rotation/scale about actual binding roots; shortest orientation changes are used during final docking.
- The mature-particle label starts only when all roots have attached at progress .99; inactive gp21 still allows independent tail/fiber assembly while blocking the head.

Verification: All six root-to-tip lengths remain constant through docking in both protease conditions. Actual roots coincide with baseplate attachment coordinates to <1e-6 at maturity. Root world displacement across .93/.94/.95/.99 +/-1e-6 is <0.001; no full-size set appears at the former .93 switch.

## 20261004-phageLife-03 — fixed

- Corrected the exterior dsDNA angular progression and matching rung positions to form a right-handed helix.
- Preserved ATP absence stall, loading, headful cut, motor departure and neck sealing.

Verification: Signed twist from actual world-space cylinder endpoints is positive at multiple visible DNA positions in both ATP conditions. Both backbones remain antipodally paired; ATP-absent branch retains zero loaded fraction with no cut or seal.

## 20261004-phageLife-04 — fixed

- Anchor named structures to actual moving mesh vertices, domain centers, visible duplex buffers and instance centers; keep whole-cell/lumen/cytoplasm labels as explicit region annotations. Hide labels with their target where relevant.
- Added stable in-place label-coordinate updates and visibility checks; preserved source label objects/position arrays.

Verification: labelAnchors.test.mjs: 481 actual-geometry checks, 140 states, all seven root/condition combinations; all four retained pre-label models fail physical-target assertions. All label positions/visibility are deterministic under non-monotonic seeks.

## Verification and acceptance boundary

Local science suite includes both new regression files and preserves the earlier entry/daughter tests. Four process bundles and owned-file formatting/whitespace checks are recorded in `../evidence/phageLife/`. No browser or full-workspace suite was run.

The root still owns continuous rendered playback, native/export label clarity and performance acceptance. T4 lytic mechanism geometry was preserved; its leaders were corrected under issue 04.

## Rendered follow-up: 05 and 06

**20261004-phageLife-05 — fixed:** Preserve each fragment base scale and multiply all axes by a bounded smooth appearance/removal envelope. Fragments shrink to zero at both visibility boundaries.

renderedMechanics.test.mjs rejects retained original model; corrected model passes seven clearance samples, both +/-1e-6 boundary checks, fixed anisotropy, bounded dimensions and gp21-inactive absence.

**20261004-phageLife-06 — fixed:** Smoothly lower the severed downstream product during completed cleavage so it remains outside the entire portal/neck axial envelope, including subsequent seal growth. Preserve the internal genome, ATP stall and motor departure.

Retained original model fails actual-geometry clearance checks. Corrected six completed-cleavage samples have axial clearance .280607 to .515807 and terminal-to-surface distance .348701 to .564300; completed seal clearance .295335. Translation stays continuous at .79/.82/.85/.92 and ATP absence keeps no cut/seal.

The retained full-b3 images precede these two repairs. Post-repair visual confirmation remains pending at assembly .345 and packaging .85 / 1. See `phageLife-rendered-final.md` in resolutions for exact review coverage.
