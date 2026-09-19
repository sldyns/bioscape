# Paramecium process refinement

Reference inspected: `src/processes/transcriptionProcess.js`; `src/scene/parameciumDetails.js` (surface/cilia, nuclear-envelope and chromatin, contractile-vacuole models).

## Model changes

- **parameciumFeeding:** flat silhouette and isolated nuclei → posterior cortical rows with instanced tubular basal bodies and bent cilia; four small nuclei plus large nuclear cutaway with paired envelope, pores, chromatin fibers and schematic nucleosomes/nucleoli. Solid oral-groove tube → concave trough with three oral membranelle rows (54 basal bodies and cilia). Translucent food sphere → paired membrane cutaway with visible lumen, membrane-associated pump silhouettes and pocketed enzyme units becoming visible during digestion. Intake, acidosome fusion, lysosome fusion and cytoproct sites/timing retained.
- **contractileVacuole:** solid-core canal strokes → open half-tube collecting canals with inner/outer walls and end rims. Sparse straight twigs → 108 connected fine spongiome loops plus 216 instanced membrane-associated protein silhouettes. Ampullae and central bladder now have paired walls and open cut edges; cortical pore has inner lip and supporting filaments. Condition-dependent cycle, transient arm disconnection and outward water flow retained.
- **parameciumDivision:** ghostlike full body and featureless nuclei → posterior cortical cutaway, coordinated deforming cortical rows and instanced basal bodies/cilia. Dividing micronucleus and its daughters contain envelope/pores/chromatin; maternal and daughter macronuclei expose chromatin and fibrous nucleoli. New structures inherit the original nucleus transforms; cortical details use the exact deformation map of the envelope. Closed mitosis, macronuclear partition and transverse cleavage remain distinct.
- **parameciumConjugation:** outline pair and colored nuclear spheres → cortical rows/basal bodies/cilia on both partners, structured parental macronuclei, meiotic nuclei, stationary/migratory pronuclei, synkaryon descendants and new macronuclear anlagen. Parent-origin envelope colors remain visible. Old nuclear fragments remain; counts and omitted postconjugational fissions unchanged.

Fine structure is schematic, not atomic geometry or measured organelle counts. Whole-cell cutaways expose the active compartments. No controls, process IDs, stages, thumbnails or shared renderer files changed. Sources embedded in each model continue to define species and mechanism scope.

## Local validation

Run `node src/processes/modules/parameciumLife/refinementSmoke.mjs`.

All four passed: esbuild bundling; bilingual stage fields; finite geometry/normal/instance buffers; finite 2–20-unit bounds at NaN, 0, .2, .4, .6, .7, .85, .94, 1; exact .7 → .2 → .7 buffer/material/transform/state hashes; unchanged node/geometry/material identities across updates; changing stage states; both osmotic control branches. Instance bounds update with cortex deformation. No geometry/material/node construction occurs inside update functions. Construction-time material replacements remain attached to the traversable scene; no material swaps during playback.

## Acceptance boundary

The models have substantial structure changes, but normal-distance readability and comparison with the accepted transcription baseline still require the root agent's screenshots. No browser or full-workspace tests were run here, and no model is claimed visually accepted from smoke tests alone. The smallest conjugation-stage nuclei deliberately use schematic chromatin to preserve readable nuclear counts; inspect these during screenshot review.
