# Plant water — Phase A fresh audit

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product/test files unchanged. All four actual root registrations are `plant`.

| Model | Verdict | Issues |
|---|---|---|
| plasmolysis | confirmed_issue | 20261004-plantWater-01 P2 |
| stomata | confirmed_issue | 20261004-plantWater-02 P2 |
| plantLongDistanceTransport | confirmed_issue | 20261004-plantWater-03 P1, 20261004-plantWater-04 P2 |
| chloroplastMovement | qualified_pass | None confirmed |

## Confirmed findings

### 20261004-plantWater-01 · P2
`src/processes/modules/plantWater/plasmolysisProcess.js` (215-219, 239-251)

The 12 bath-gap solute markers remain fixed at abs(x)=2.05, radius=0.055; they become fully visible when shrink > 0.45. At p=0.325, the straight-side membrane outer-head silhouette reaches x=2.07986 while each solute begins at x=1.995. Thus the supposedly extracellular impermeant-solute disks overlap the rendered membrane cross-sectional boundary by about 0.08486 units. This is a cross-sectional XY/silhouette error: markers are raised in z, so this is not claimed as a literal 3D membrane collision.

The markers explicitly denote solute excluded by the plasma membrane; placing their visible disks across the boundary briefly contradicts the very distinction the model teaches.

Fix: Place gap markers from the current membrane outer silhouette and fixed wall inner boundary; preserve positive clearance for their full radius whenever visible.
Verification: At all visible samples in both baths, verify marker projected XY extent lies beyond the actual outer leaflet and inside the fixed wall, including the onset around p=0.325; test the original fixed-x placement as a negative control.

### 20261004-plantWater-02 · P2
`src/processes/modules/plantWater/stomataProcess.js` (233-235, 324-333; K+/counter-anions label)

The same i % 2 controls ion color and guard-cell side. Consequently all eight left-hand ion nodes are #baa574 and all eight right-hand nodes are #a698b2 during influx and ABA efflux. There is one shared K+/counter-anions label and no identity/color legend.

The paired colors read as the two named ion classes, but segregate them by guard cell. This is an important visual ambiguity rather than a claim that the underlying model quantitatively violates electroneutrality. Both members of the guard-cell pair should communicate the same ion-accumulation/efflux mechanism.

Fix: Decouple species/color from side, send both classes across each guard-cell boundary, and identify the colors bilingually. Preserve simplified non-stoichiometric marker counts.
Verification: Read actual visible mesh color and position in both conditions over influx and efflux; require both explicit ion identities on both sides and their correct directions. Negative control restores parity-coupled color/side and must fail.

### 20261004-plantWater-03 · P1
`src/processes/modules/plantWater/plantLongDistanceTransportProcess.js` (200-225, 288-297)

Vapor tracks begin at x=1.25, y=2.36+/-0.1, z=0.15+/-0.09. Exact point-to-triangle distances from the 15 track starts to the actual wet-wall tube are at least 0.25788, and to the four mesophyll surfaces at least 0.49122, versus vapor radius 0.052. All vapor is born in the middle of the air space, detached from both wet surfaces and the liquid branch ending near y=2.77.

The central teaching event is evaporation from a wet wall into air. The visible event originates from empty air instead, leaving liquid delivery and vapor release disconnected despite correct stage text.

Fix: Connect liquid delivery to a wet mesophyll surface and begin every vapor path there before traversing the intercellular space and the stomatal aperture. Reuse prebuilt geometry and maintain the continuous xylem column.
Verification: Measure actual wet-wall/mesophyll-surface intersection and complete vapor-start attachment (radius-aware) for all lanes; sample all closure/open conditions and prove that trajectories traverse the pore without guard-cell intersection. Original start positions must fail.

### 20261004-plantWater-04 · P2
`src/processes/modules/plantWater/plantLongDistanceTransportProcess.js` (288-290)

At p=0.777 -> 0.778 in the closure condition, visible vapor nodes drop from 15 to 3 (80% vanish together), while relativeFlow varies smoothly from 0.42101 to 0.41526. The arbitrary closure<0.7 threshold removes full-size, opaque particles at unrelated positions in the air space.

Unlike ordinary repeated flow at inlet/outlet boundaries, this deletes most visible in-flight tracers simultaneously in the interior during a smooth narrowing event; the flow cue visibly jumps.

Fix: Keep a smoothly weighted vapor population or continuously reduce each tracer appearance using closure and endpoint envelopes; avoid threshold-based mass removal of in-flight tracers.
Verification: Sample immediately either side of the analytically determined closure=0.7 threshold; visible screen-contributing tracer weights must change continuously while flow slows, and arbitrary seeks remain deterministic.

## Checks and evidence

- `node src/processes/modules/plantWater/smoke.mjs`: PASS for all four models and both options.
- `node src/processes/modules/plantWater/science.test.mjs`: PASS; 404 inputs × 2 genotypes × 16 full plastids; minimum wall clearance 0.0678; conservative vacuole exclusion distance 1.0455.
- `node docs/qa/process-review-2026-10-04/evidence/plantWater/diagnose.mjs`: direct root registration, solute extents, visible ion color/side, exact triangle-distance vapor-start attachment, vapor cutoff and full-range chloroplast center-motion samples.
- Evidence: `evidence/plantWater/diagnostics-phase-a.json`, `smoke-phase-a.log`, `science-phase-a.log` and the retained diagnostic script.

## Primary evidence actually opened

- [Lang-Pauluzzi and Gunning — The behaviour of the plasma membrane during plasmolysis: a study by UV microscopy](https://pubmed.ncbi.nlm.nih.gov/10849197/): Opened primary-study abstract: onion protoplast withdrawal retains membrane–wall attachments, and membrane re-expands and realigns during deplasmolysis. Supports reversible geometry; the chosen impermeant-solute condition is explicitly defined by the model, not established for every osmolyte.
- [Kinoshita et al. — Phot1 and phot2 mediate blue light regulation of stomatal opening](https://pubmed.ncbi.nlm.nih.gov/11740564/): Opened abstract: blue light activates plasma-membrane H+-ATPase and inside-negative potential drives guard-cell K+ accumulation; Arabidopsis phot1/phot2 act redundantly.
- [Vahisalu et al. — SLAC1 is required for plant guard cell S-type anion channel function in stomatal signalling](https://www.nature.com/articles/nature06608): Opened publisher abstract/editorial summary: guard-cell membrane anion-channel function supports stimulus-induced stomatal closure. Each guard cell is an ion-regulating cell; opposite cells are not separate cation-only and anion-only pathways.
- [Wheeler and Stroock — The transpiration of water at negative pressures in a synthetic tree](https://www.nature.com/articles/nature07226): Opened primary experiment abstract: evaporation lowers liquid pressure, drawing liquid through the continuous pathway; liquid-to-vapor phase change at the leaf interface drives the passive system. This synthetic-tree experiment supports the physical mechanism, not detailed leaf anatomy.
- [Kasahara et al. — Chloroplast avoidance movement reduces photodamage in plants (publisher article mirrored by Universidade de São Paulo)](https://www.esalq.usp.br/lepse/imgs/conteudo_thumb/Chloroplast-avoidance-movement-reduces-photodamage-in-plants.pdf): Opened full primary article; page 2 reports anticlinal distribution in wild type under high light, while phot2-1 retains cell-surface accumulation and lacks avoidance. Mutants suffered more high-light damage. The model does not claim experimental intensity/time calibration.

## Limits

No browser, full suite or subagents used. Numeric/source review is not rendered acceptance. Finite-path repeated tracer flow alone was not classified as a defect. Chloroplast-motion verdict remains qualified: compartment clearance was checked thoroughly, while arrow resets and curvature-transition aesthetics await root playback review. Kadota full text and the current Jarillo publisher page could not be retrieved; this access limitation is retained in JSON. Hechtian connections, stomatal channel machinery and radial root anatomy are explicit/appropriate schematic omissions rather than fabricated defects.

Awaiting root Phase B release before any repair.
