# Skeletal muscle refinement — 2026-10-03

## Scope and design

One cropped multinucleate skeletal muscle **cell**, never a fascicle. The previous transparent tube and striped cylinders remain an appropriate overview abstraction, but every isolated part now has its own magnified structural model. The continuous fibre membrane has an opaque removable front half; annular end sections explicitly imply continuation beyond the crop. Counts are sampled and the overview and isolated views use independent scales.

- Sarcomere: seven bipolar thick filaments, eighteen sampled thin-filament positions, bead-like double actin strands, representative tropomyosin/troponin, myosin heads excluded from the central bare zone, Z-disc lattice/anchors, M-line radial links and elastic titin connections. I/A/H/M/Z relationships are encoded by filament extent rather than painted stripes alone. Lattice positions and molecular geometry remain simplified, not an atomic reconstruction.
- Myofibrils: aligned serial repeats on neighbouring myofibrils; one exposed terminal repeat reveals the filament architecture. Open overview rod surfaces avoid thousands of hidden internal caps.
- Sarcolemma: curved two-leaflet patch, polar heads, paired hydrophobic tails and sampled transmembrane proteins, with enlarged thickness.
- Myonucleus: one elongated nucleus in isolation; double envelope, surface pores, irregular chromatin domains and nucleolus. Front-envelope pores share the cap gate, avoiding floating pore rings after sectioning.
- SR: sparse connected longitudinal tubules/crosslinks with fenestrations and paired terminal cisternae around a representative myofibril-sized space.
- Triad: one central T tubule and separate flanking cisternal lumina, double-sided membrane thickness, open cropped rims, junctional feet and a section-only calsequestrin schematic. No false luminal connections.
- Mitochondrion: reuses the accepted detailed mitochondrial model (outer/inner membranes, cristae, matrix). Overview samples intermyofibrillar mitochondria; no fibre-type-specific quantitative claim.

## Evidence and sources

Read accepted muscle process (`src/processes/modules/neurons/muscleProcess.js`), structural mitochondrial detail, detail flattening and presentation contracts, process refinement standard, and archived specimen audit before implementation. Baseline browser view showed only uniformly translucent shell and striped rods.

Scientific scope checked against:

- [Dulhunty 1989, mammalian triad ultrastructure](https://pubmed.ncbi.nlm.nih.gov/2769737/): independent terminal cisternae, junctional feet and cisternal calsequestrin. The rendered protein forms/counts are explicitly schematic.
- [1998 primary study, sarcomere length and triad location](https://pubmed.ncbi.nlm.nih.gov/9682134/): supports cautious “near A/I junctions” phrasing rather than invariant exact placement under all sarcomere lengths.
- [Traeger et al. 1983, thin-filament arrangement](https://pubmed.ncbi.nlm.nih.gov/6683726/): the real lattice changes across I and A regions; this model is explicitly a sampled simplified filament arrangement.
- [NCBI Molecular Motors](https://www.ncbi.nlm.nih.gov/books/NBK26888/): Z anchorage, bipolar thick-filament arrangement, titin and sliding-filament interpretation; this structural model is static.

## Local checks

`node tests/muscle-refinement.mjs` checks all eight factories, finite attributes/bounds, legal hit IDs, no instances, ownership flags, section caps, anchors, bounded draw calls/triangles and immutable geometry under matrix updates. Anatomical extent assertions require Z outside thick-filament ends and a central no-actin H region distinct from the myosin bare zone. No per-frame allocations or animation code exist.

Final optimized resources: fibre 325,296 triangles / 22 raw meshes; sarcomere 187,408 / 7; myofibrils 192,176 / 11; membrane 116,496 / 3; myonucleus 33,256 / 8; SR 13,568 / 2; triad 6,696 / 20; mitochondrion 343,632 / 20. Indexed merges retain transforms; clone temporaries are disposed. The test asserts stricter 350k/250k budgets for fibre/sarcomere, actual filament vertex extents and exclusion of heads from the central bare zone. Repeated factory builds produce identical position-buffer signatures.

## Rendered inspection

Dedicated background browser tab at `127.0.0.1:5174`. No viewport setting changes. Root whole, section and explode inspected; whole cropped-end angle adjusted after first inspection. Sarcomere and sarcolemma inspected; filament organization legible, bilayer spacing tightened after initial screenshot. Nucleus first inspection caught rib-like chromatin and floating front pores; both revised. All eight views have now been rendered and inspected. Stable preview `127.0.0.1:4199` was used for final triad and mitochondrial modes and the sarcomere label overlay; its browser warning/error log was empty. Latest root-angle, SR-ring, myofibril-section-face and membrane-tail revisions were then rechecked directly against frozen source on `127.0.0.1:5174`, with all affected screenshots replaced. Its warning/error log was also empty. The opaque whole-fibre view now visibly exposes the artificial cropped cross-section. Bilayer continuity was additionally inspected by rotating to the patch edge.

Screenshots in this folder use prefix `muscle-`. These are rendered desktop checks, not mobile/device acceptance or a fixed-performance benchmark.


| View | Supported modes inspected | Evidence |
|---|---|---|
| Fibre | Whole / section / explode | `muscle-root-{whole,section,explode}.jpg` |
| Sarcolemma | Structural patch (no synthetic section/explode toggle) | `muscle-membrane.jpg`, `muscle-membrane-edge.jpg` |
| Myonucleus | Whole / section | `muscle-nucleus-{whole,section}.jpg` |
| Myofibrils | Structural detail | `muscle-myofibrils.jpg` |
| Sarcomere | Structural detail; label overlay | `muscle-sarcomere.jpg`, `muscle-sarcomere-labels.jpg` |
| SR | Structural network | `muscle-sr.jpg` |
| Triad | Whole / section | `muscle-triad-{whole,section}.jpg` |
| Mitochondrion | Whole / section | `muscle-mito-{whole,section}.jpg` |


## Completion boundary

All assigned source, metadata and targeted tests are ready for integration. Fifteen retained screenshots cover every supported view/mode plus the sarcomere landmark overlay and rotated membrane edge. No unresolved local rendering error was observed. Quantitative ultrastructure, live contraction, specific fibre-type mitochondrial abundance, real-device performance and full-workspace integration remain outside this static-specimen pass; representative counts and educational scales are disclosed in the UI metadata. No commits, deployment or shared full-suite invocation were performed by this specialist.
