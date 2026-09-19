# Division refinement

2026-09-19. Scope: existing `mitosis` and `meiosis`; no new IDs, shared renderer edits, thumbnail edits, or browser operations.

Reviewed baseline: `src/processes/transcriptionProcess.js` (instanced backbone/subunit detail and open active cleft), `src/scene/chromatinDetails.js` (folded chromatin/histone hierarchy), and `src/scene/nucleusAssembly.js` (paired envelope, cut rim and real pore apertures). Existing NCBI Mitosis/Cytokinesis/Meiosis and mouse germ-cell bridge sources remain the mechanism boundaries.

## Shared structural changes

- Smooth rod chromatids → tapered chromosome arms with a centromeric waist, closed distal ends, repeated folded surface chromatin paths and packing domains. These are explicitly schematic organization, not atomic coordinates or an asserted universal 30-nm fibre.
- Single kinetochore bead → inner centromeric pad, outer plate and multiple attachment fibrils; plate orientation follows mitotic sister biorientation or meiotic homolog co-orientation.
- One line per chromosome attachment → five curved microtubules per visible kinetochore bundle. Interpolar fibres have three strands. Counts describe this schematic, not biological stoichiometry.
- Pole spheres → orthogonal centriole barrels, each with nine triplet sets, supporting rings and a bounded pericentriolar matrix. Repeated barrels/strands/packing domains use shared or instanced geometry.
- Uniform transparent cell spheres → rear cutaway bowls with paired membrane surfaces and explicit cut edges. Daughter membranes blend in as the pinched parent resolves, without daughter cells passing through one another.
- Nuclear haze spheres → paired envelope surfaces with actual removed pore apertures, pore collars and cut rims; envelope assembly/disassembly changes continuously.
- Single torus cleavage marker → multiple actin-like tracks with repeated myosin-like assemblies. Geometry remains schematic and no quantitative force claim is made.

## Mitosis

The replicated chromosome subset is preserved, but the metaphase plate now exposes chromatin/centromere/outer-kinetochore hierarchy against the cutaway cell. The unattached option still stops at progress 0.43 with one missing attachment, no sister separation and no completed cytokinesis. Spindle bundles taper during exit; centrosome structures remain in daughters. Parent/daughter membrane transition and nuclear envelope assembly are continuous functions of progress.

## Meiosis

Mouse spermatocyte identity, two-autosome-pair subset, reciprocal nonsister distal exchange, I-versus-II segregation and four bridged spermatid products remain unchanged. Surface organization continues onto exchanged distal regions. Pairing now has 15 transverse synapsis connectors per shown homolog pair; crossover connectors meet the relevant distal arm region. First-division co-orientation and second-division sister biorientation drive distinct kinetochore placement. Both division membrane transitions blend continuously. Retained germ-cell cytoplasmic bridges remain distinct from completed somatic abscission.

## Local validation

`node src/processes/modules/division/division.smoke.mjs` passes for both definitions: 246 mitosis nodes / 355 meiosis nodes. It checks bilingual stages, finite positions/normals/instance matrices and bounds, complete material inventories, stable resource/node identities, required structural features, repeated seeks across 13 transition samples, checkpoint/control restoration, biological state and esbuild bundling. Owned JavaScript and smoke files formatted with Prettier.

Visual acceptance remains open for root screenshot review. No claim is made that code tests alone meet the accepted visual baseline. Chromatin packing and membrane crossfades are educational approximations; molecular recombination chemistry, decondensation into a full interphase chromatin network, and the detailed membrane-abscission machinery are not expanded. No known local runtime failures remain.
