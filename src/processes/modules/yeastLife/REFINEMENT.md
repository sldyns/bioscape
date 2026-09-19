# Yeast process refinement

Compared with `src/processes/transcriptionProcess.js`, `src/scene/yeastDetails.js`, and `src/scene/nucleusAssembly.js`. Only the yeastLife folder changed in this pass; no process IDs, thumbnails or shared renderer edits.

## yeastBudding

Before: transparent single cell surfaces, smooth nuclear envelope and simple chromosome markers.

After: the existing round mother/bud geometry retains its common open neck, but now has a bounded front viewing cut, wall thickness, plasma membrane paired layers, cut-edge lipid heads and continuous layers following growth/separation. The closed-mitosis nuclear surface has paired envelope layers and instanced pore rings/subunits. Separate nuclei contain coiled chromatin/nucleosome beads, a nucleolar body and pore collars. Mother/bud cytoplasmic context includes a vacuolar lumen, a cut mitochondrion with cristae, ER tubules and instanced ribosomes. Nuclear transport pores are a schematic surface representation, not an atomic reconstruction.

## yeastMating

Before: two smooth shmoo surfaces, nuclear spheres and a generic connecting opening.

After: both mating partners use layered wall/membrane cutaways with visible cytoplasmic structures. The contact-site wall fragments shrink away as the local opening forms, and paired lipid rows frame the membrane fusion opening. Nuclei now expose envelope layers, pore subunits, chromatin and nucleolar structure. Same-type controls retain two independent cells and do not produce wall removal or the fusion opening. Plasmogamy and karyogamy remain separate events.

## yeastSporulation

Before: transparent ascus, simple elongating nuclear envelopes, single membrane cups and smooth spore walls.

After: the ascus wall has visible wall/membrane layers. Meiotic nuclear surfaces have cut envelope layers and moving instanced pore complexes. Each representative chromatid includes axial coiling; parental segment markers remain responsible for the recombination schematic. Prospore membranes have separate inner/outer surfaces and a shrinking closure rim. Mature spores show nested wall layers, membrane edges and nuclear anatomy, while the ascus remains a separate surrounding compartment. No second DNA replication or bacterial endospore mechanism is introduced.

## yeastFermentation

Before: four generic enzyme lobes, mostly plain carbon beads and an abstract reduction badge.

After: enzymes have multiple opaque domains around an exposed cleft, helical backbone motifs and schematic beta-sheet arrows. Substrates remain visible in front of the pockets. Pyruvate carboxyl oxygen groups follow the departing carbon into CO2, and carbon identity stays green throughout carbon accounting. The acetaldehyde carbonyl has a double bond that becomes a single C–O bond plus an O–H group during reduction. NAD cofactors use two linked ring motifs. A layered cutaway wall supplies cytosolic context. Molecules and protein folds remain explicitly schematic; only carbon bookkeeping is complete.

## Local verification and remaining gate

`node src/processes/modules/yeastLife/smoke.mjs` passes for all four processes: bilingual stages, NaN/out-of-range progress, finite positions/normals and bounds, repeated-seek determinism, fixed node/geometry identities, updated instance bounds, distinct stages and control branches, full material inventory and standalone esbuild bundles.

- Budding: 153 nodes / 59 geometries / 32 materials.
- Mating: 214 nodes / 57 geometries / 27 materials.
- Sporulation: 300 nodes / 107 geometries / 41 materials.
- Fermentation: 162 nodes / 33 geometries / 24 materials.

The owned files are formatted. Mechanistic scope and embedded sources are retained. This pass has **not** been accepted visually: root screenshot review remains required for normal-camera readability, occlusion and comparison with the accepted detail baseline. No browser or device validation was run by this agent.
