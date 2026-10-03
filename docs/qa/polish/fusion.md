# Fusion membrane polish — 2026-10-03

Scope: `traffic/autophagyProcess.js`, `traffic/endocytosisProcess.js`, new `fusionProfiles.js` and focused test; narrowly updated traffic science regression membrane measurements. Shared `membranes.js`, stages, durations, scientific text and sources are unchanged.

## Cause and repair

The mature fusion surfaces previously sampled 11/12 control points with **linear interpolation**. More mesh rings alone could not remove the long straight meridional facets visible in `process-evidence/autophagy-05.jpg`, `autophagy-06.jpg`, and `endocytosis-05.jpg`.

- Replaced the polygonal meridian with monotone cubic Hermite spans, common tangents at joins, and axial pole tangents that produce rounded tips. The same profile drives both leaflets and their existing closed cut walls; the lumen remains empty.
- Fusion now starts with the two original spherical envelopes joined by a narrow common neck. The neck expands over 0.65–0.73 (autophagy) or 0.67–0.76 (endocytosis). A monotone axial correspondence keeps the same neck throughout the blend, preventing a spurious second waist. This is a schematic envelope transition, not a molecular fusion-pore simulation.
- Endocytic receptors follow the actual sampled membrane wall and its tangent; the pump follows its radius. An independent geometry test caught up to 0.02 units of transient analytic-curve versus triangle-wall discrepancy at the narrow neck; using the rendered ring interpolation fixed it without weakening tolerance.
- Autophagosome inner membrane remains separate and intact until 0.71, clears by 0.8, and cargo cleavage still starts at 0.9. Hydrolases remain inside the outer envelope.

## Validation

Passed after final neck correspondence change:

- `node src/processes/modules/traffic/science.test.mjs`: finite buffers and bounds, deterministic seeks, stable resources, bundled-module syntax; separate receptor anchors on actual membrane wall (1e-5 tolerance); full hydrolase-vertex containment; opening/removal before protease access and cleavage. Existing secretion checks also passed in this focused traffic suite.
- `node src/processes/modules/traffic/fusionProfiles.test.mjs`: continuous tangent joins, positive nascent common lumen, profile inversion, all stage times plus 61 close transition samples and backward seeks, finite geometry, stable identities, degradation order.
- CUA browser rendered all 7 autophagy stages and all 6 endocytosis stages at native 1280×720, plus intermediate 0.691 autophagy and 0.715 endocytosis, half-speed play/pause through endocytosis fusion, timeline seek and Chinese/English switch. No condition selectors exist in these two models. No global viewport mutation.
- Latest source inspected on private Vite 4213; stable 4200 snapshot predates final neck-correspondence refinement. Root should include final helper/caller change in next integrated snapshot.

Visual evidence in `fusion-evidence/`: autophagy stages 05/06/07 and 0691; endocytosis stages 05/06 and 0715. Stages 05 and intermediate images were recaptured after the final refinement; mature stages are identical after opening reaches 1. The long polygon facets are gone, leaflets and cut edges remain visible, and cargo remains readable.

## Resource cost and limits

No new scene nodes, geometry objects, materials, draw-call types, or instanced lipid counts. The fusion meridian was increased from 81→129 rings for the autolysosome and 65→129 for the endosome to resolve the transient narrow neck. Total added buffers across both scenes: 15,008 vertices and 29,120 triangles, allocated during creation. Per-scene identities remain autophagy 212 nodes / 51 geometries / 21 materials; endocytosis 200 / 32 / 19. No geometry/material/node allocation occurs in update. This is scoped visual and geometry verification, not a frozen-FPS or mobile performance gate.
