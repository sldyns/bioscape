# Traffic model refinement

Reference review: `src/processes/transcriptionProcess.js` and `src/scene/lysosomeDetails.js`. This pass changes structural modeling, not thumbnails or catalog scope. Both processes remain mammalian / `cell` only.

## Endocytosis

Before: isolated short bars suggested a coat; Y-shaped receptors and homogeneous spheres represented LDL; thin surfaces did not distinguish a bilayer from a double membrane.

After:

- Each membrane has two leaflet surfaces, a closed hydrophobic cut edge, and shared-geometry instances for paired phospholipid heads/tails. The open front remains an observation cutaway, never a filled lumen. A single carrier is one bilayer, not two independent membranes.
- The clathrin coat is a truncated-icosahedral lattice: 60 three-valent hubs and 90 edges, with pentagonal/hexagonal faces. It bends with the pit and its struts separate during uncoating; the front is cut away with the membrane. An oligomeric dynamin helix surrounds the neck.
- LDLR contains a transmembrane segment, cytosolic tail/adaptor, six-bladed beta-propeller and seven LA-repeat modules. The repeat region bends toward the propeller after acidic sorting. Geometry is a domain schematic, not fitted atomic coordinates.
- Each LDL particle has a lipid core, a phospholipid **monolayer**, and one connected schematic ApoB path. Three spatially separated particles replace the crowded five-sphere row.
- A V-ATPase has a membrane rotor, stalks and a six-subunit cytosolic head. The narrowed continuous endosome domain retains membrane-bound receptors while LDL remains luminal.
- Reduced irrelevant planar membrane extent and enlarged the pit/carrier to keep the active event legible. Carrier docking now meets the endosome before the fused envelope appears.

Sources checked: NCBI Bookshelf NBK26859; LDLR mutagenesis/structure PMC2803231; native LDL cryoEM PMC3090388; original endocytosis references retained.

## Macroautophagy

Before: two featureless cups and a group of overlapping balls represented cargo; lysosomal enzymes were dots.

After:

- Outer and inner autophagosomal membranes are individually resolved bilayers (four leaflet surfaces total) separated by a real intermembrane space. Their growing rims remain joined until closure; outer fusion leaves the inner membrane intact before degradation.
- Cargo consists of three visibly structured, partly disrupted cytosolic enzyme chains. PDB 1HTI human triosephosphate-isomerase C-alpha coordinates provide the fold reference. The aggregate arrangement and damage are explicitly illustrative, not an experimentally determined TPI aggregate or a claim of substrate-specific targeting.
- Seven lysosomal cathepsin-D models use the separate light/heavy-chain C-alpha traces from PDB 1LYA. Cloned meshes share their geometry/materials. The enzyme folds and central cleft replace generic spheres.
- Added a membrane V-ATPase and branched glycans on the luminal face. Short connected peptide fragments replace unstructured product dots.
- Protein-coordinate provenance and original CIF hashes are preserved in `proteinCoordinates.js`; only the native trace is reference-derived. Added the two checked RCSB structure pages to the model bibliography.

## Validation and boundary

`node src/processes/modules/traffic/smoke.mjs` passes bilingual metadata, all attributes/instance matrices finite, bounds between 2 and 20, deterministic repeated seeks, resource/node stability, coat lattice counts, membrane topology and native-reference signals. Both models bundle with esbuild. No allocations of geometries, materials or nodes occur in update. No controls were removed; these two models do not define condition controls.

Rendered screenshot acceptance against the transcription baseline remains **pending root review**. Node/bundle checks establish the contract and scientific state transitions, not normal-distance visual acceptance. No browser, SVG, global renderer, kit, catalog or shared tests were edited in this refinement pass.
