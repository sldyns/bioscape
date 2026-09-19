# yeastLife Phase B correction evidence

All seven Phase A issue IDs are fixed in the assigned group. Phase A reports are unchanged. No shared renderer/catalog, thumbnails, other modules, or browser were touched. Root scientific/visual acceptance remains pending.

## yeastLife-01 - fixed

Replaced center-out disks with fixed-outer-radius annuli. Added an inward-moving terminal annulus to both actual cell-envelope meshes so membrane apertures close before separation. Updated both stage languages.

Verification: Regression reads septum radii and the real inner PM terminal rings through p=0.76-1.0; opening decreases to zero and both daughter apertures close before separation.

Files: `src/processes/modules/yeastLife/yeastBuddingProcess.js`, `src/processes/modules/yeastLife/science.test.mjs`

## yeastLife-02 - fixed

Anchored both flattened SPB plaques at the actual polar vertices of the deforming nuclear envelope and extended the spindle to meet those anchors.

Verification: Regression checks SPB centers against exact NE polar surface vertices and cylinder endpoints at five spindle-visible intermediate frames.

Files: `src/processes/modules/yeastLife/yeastBuddingProcess.js`, `src/processes/modules/yeastLife/science.test.mjs`

## yeastLife-03 - fixed

Changed the initial glucose carbon bookkeeping to an open six-carbon zigzag chain and removed the C6-C1 bond. Both stage languages describe the open-chain abstraction.

Verification: Regression reconstructs carbon adjacency from actual bond-cylinder endpoints for both oxygen conditions; initial chain has exactly five C-C edges and products retain exactly the two ethanol C-C edges.

Files: `src/processes/modules/yeastLife/yeastFermentationProcess.js`, `src/processes/modules/yeastLife/science.test.mjs`

## yeastLife-04 - fixed

Located mating SPBs on each nuclear surface. Pre-fusion microtubules stay within their own cytoplasm; cross-neck microtubules are enabled only after the physical cell opening is complete. Nuclear congression begins after plasmogamy.

Verification: Regression samples actual microtubule centerlines against interpolated real PM mesh sections before and after fusion; checks NE exclusion and SPB surface anchors. Same-type controls show no bridging microtubules.

Files: `src/processes/modules/yeastLife/yeastMatingProcess.js`, `src/processes/modules/yeastLife/topology.js`, `src/processes/modules/yeastLife/science.test.mjs`

## yeastLife-05 - fixed

Replaced appearance of a third nucleus with a continuous envelope joining the two contacting parental lobes. Preserved the same two chromatin populations. Enlarged the actual cell fusion neck and matched its membrane lipids so all nuclear geometry stays inside the cell.

Verification: Regression counts visible real NE meshes through fusion, verifies a positive connecting lumen after contact, and tests all NE mesh vertices against the PM profiles; never three nuclei. Same-type control retains separate parental nuclei.

Files: `src/processes/modules/yeastLife/yeastMatingProcess.js`, `src/processes/modules/yeastLife/topology.js`, `src/processes/modules/yeastLife/anatomy.js`, `src/processes/modules/yeastLife/science.test.mjs`

## yeastLife-06 - fixed

Removed the two separated post-MI envelope meshes. One common nuclear surface remains through MI and MII, broadens around the two spindles and develops late constrictions before four daughter nuclei are partitioned at p=0.80. Updated bilingual description and nucleus metadata.

Verification: Regression verifies the common visible surface and nonzero sectional lumen at every longitudinal section across MI/MII; all four final nuclear meshes remain hidden until late partition. Rich-medium control retains the original state.

Files: `src/processes/modules/yeastLife/yeastSporulationProcess.js`, `src/processes/modules/yeastLife/science.test.mjs`

## yeastLife-07 - fixed

The same inner prospore membrane now persists as mature spore PM. Mannan and glucan shells appear in the intermembrane space; outer membrane disappears before exterior chitosan and dityrosine layers. Separate wall materials and cut edges retain visible layered detail.

Verification: Regression tracks the actual inner-membrane object and its radius across maturation; verifies nuclear containment, early wall radii between the membranes, outer membrane loss, mature wall outside PM, and rich-control suppression.

Files: `src/processes/modules/yeastLife/yeastSporulationProcess.js`, `src/processes/modules/yeastLife/anatomy.js`, `src/processes/modules/yeastLife/science.test.mjs`

## Local verification

- `node src/processes/modules/yeastLife/science.test.mjs`: PASS. Assertions inspect real vertices, cylindrical bond/MT endpoints, visibility and object identity rather than metadata alone.
- `node src/processes/modules/yeastLife/smoke.mjs`: PASS for all four models, including controls, finite attributes, repeat seeks, fixed resources and individual bundles.
- Owned changed files formatted with Prettier.

These checks target the reported geometric defects; they do not certify every scientific fact or replace root rendering. Membrane profiles, chromosome populations and motions remain schematic.

## Added evidence sources

- https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1006195
- https://www.ebi.ac.uk/chebi/CHEBI:4167
- https://pmc.ncbi.nlm.nih.gov/articles/PMC2080914/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC2132592/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3744438/
