# Plant connection processes: structural refinement

Reviewed `transcriptionProcess.js`, `scene/chloroplastDetails.js`, and `scene/plantDetails.js` before editing. Anatomical structures are schematic, not atomic reconstructions. All edits are contained in this folder; thumbnails, shared code, and browser were untouched.

## plantTransport

- Before: individual lipid balls with single tails, six ellipsoids around a pump, and two three-ellipsoid carrier lobes.
- After: instanced paired membrane headgroups with two tails per lipid and bounded protein footprints; ten pump helices with visible helical traces, extracellular loops, distinct nucleotide-binding / phosphorylation / actuator domains, and a regulatory tail. Carrier now has two six-helix bundles, loops, and a visible central binding region that follows alternating access. Wall fibers now have bundled strands.
- Cargo crosses the protein clefts at the membrane plane. The ATP-absent control keeps uptake stopped, including lateral product release. Architecture references for plant H+-ATPases and SUC-family folding were added; the SUC1 structure is explicitly used as family-level support, not an atomic SUC2 reconstruction.

## plasmodesmata

- Before: one pore sheet, a solid ER rod, smooth wall blocks, and sparse fibers.
- After: two separate pore leaflets plus instanced polar heads and lipid tails, all following neck narrowing; an open section through appressed ER with a narrow lumen seam, connected cortical ER contours, and membrane tethers. The wall section exposes bundled cellulose layers with crosslinks and a distinct middle lamella.
- Callose remains on the wall-facing side of the membrane. Blocked solutes and bulky cargo stop outside the thickened collar rather than intersecting it. Open and restricted routes retain their previous biological outcomes.

## photorespiration

- Before: three back hemispheres with cylinder grana, isolated U-shaped tubes, and small enzyme blobs.
- After: chloroplast and mitochondrial double envelopes with separate cut rims and visible intermembrane spacing; layered thylakoid membranes with exposed lumina, stromal lamellae, connecting margins, stromal starch and a plastid DNA loop. Mitochondrial folds have distinct membrane/lumen contours and neck connections. A single peroxisomal membrane encloses distinct catalase, glycolate-oxidase and reductase bodies. Rubisco, the GDC component assembly, and GLYK have sculpted subunits and schematic secondary structure.
- The same four carbon nodes persist. Normal outcome remains 3C returned plus 1C released; absent GLYK leaves glycerate without final phosphate transfer.

## c4cam

- Before: outlined rectangular cells, simple chloroplast discs, a smooth vacuole, and ellipsoid guard-cell symbols.
- After: cell-wall microfiber bundles and paired lipid cut edges; rimmed symplastic pores in the shared C4 wall; distinct granate mesophyll and reduced-grana bundle-sheath chloroplasts with double envelopes and luminal thylakoid sections. CAM has a paired-leaflet tonoplast section with transporter helices, a detailed mitochondrial NAD-ME compartment, a chloroplast with stromal anatomy, and separate kidney-shaped guard cells with an aperture in the epidermal inset.
- C4 remains the major maize NADP-ME branch. CAM remains mature Kalanchoe fedtschenkoi with mitochondrial NAD-ME; day/night storage and aperture changes remain deterministic.

## Validation and visual boundary

Run: `node src/processes/modules/plantConnections/smoke.mjs`.

All four passed finite vertex/normal/instance buffers and bounds (largest dimension 2–20), both condition controls, meaningful stage differences, repeated seeks, stable geometry/material/node identities, and standalone esbuild bundling. Carbon conservation and terminal control outcomes are asserted. The ATP-absent scene intentionally has fewer geometry changes because its pump and coupled uptake do not proceed.

Current scene inventories: plantTransport 242 nodes / 2346 structural instances; plasmodesmata 460 / 1056; photorespiration 254 / 45; c4cam 498 / 1308. Files are formatted with Prettier. No material objects are swapped during update.

These checks establish mechanical integrity, not visual acceptance. Root screenshot review is still required to judge normal-view legibility and comparison with the accepted transcription/structural baseline; no screenshot-based baseline pass is claimed here.
