# Operons process refinement

Reviewed `src/processes/transcriptionProcess.js`, `src/scene/nucleusAssembly.js`, and `src/scene/ribosomeDetails.js` before editing. Scope: the existing four processes only; mechanism controls and sources retained. Protein surface helices, nucleotide repeats and envelope details are explanatory structural schematics, not fitted atomic reconstructions.

## lacOperon

Before: parallel DNA rails and opaque gene boxes; smooth LacI/CAP lobes and filled polymerase blobs; detached plain RNA curves.

After: instanced antiparallel sugar–phosphate backbones and paired base plates; annotation bands moved behind DNA; deterministic local transcription bubble follows RNAP. LacI now has four domain-associated helices, DNA-binding heads, ligand pockets and a tetramer connection. CAP has distinct binding heads and cAMP pockets. RNAP has separated beta/beta-prime cleft walls, clamp/jaw lobes, alpha domains and exposed catalytic channel. RNA nucleotide detail and a moving exit bridge maintain continuity between growing transcript and active polymerase. Existing three qualitative outputs remain unchanged.

## trpOperon

Before: DNA ladder, two-lobe TrpR/RNAP/ribosome, smooth alternative hairpin curves and plain L-shaped tRNA.

After: detailed duplex and RNAP opening; TrpR DNA-recognition heads, pocket outlines and helical domains; open-cleft bacterial RNAP. The 70S representation has distinguishable large/small surfaces, small-subunit head, mRNA cleft, rRNA arcs, stalk and exit opening. tRNA includes a folded loop/acceptor-stem schematic. Both alternative RNA folds have phosphate repeats and exposed bases; these follow each actual curve and its revealed length. Enlarged leader RNA remains explicitly a separate detail view. Free-tryptophan repression and charged-tRNA-dependent attenuation remain independently controlled.

## yeastGal

Before: two outline rings around smooth protein lobes and a flat DNA ladder.

After: cut nuclear-envelope annulus with paired membrane edges, lumen and eightfold pore collars; nuclear interior remains unobstructed. Gal4 has coiled-coil/domain structure and zinc-cluster cues; Gal80/Gal3 surfaces carry distinct folded segments and Gal3 lobes still close around ligands. Cyc8/Tup1 has repeated structural surfaces. Detailed promoter DNA opens under sculpted Pol II, including a stalk and accessible cleft; nascent RNA has nucleotide detail and continuous polymerase exit. Nuclear transcription and glucose repression boundaries are retained.

## yeastOsmoregulation

Before: membrane rings with one bead row, smooth kinase blobs and a nucleus outline.

After: two instanced phosphate leaflets and paired acyl tails with a physical gap around Fps1. Sln1 has transmembrane helices and a cytoplasmic receiver/kinase detail; Ypd1/Ssk1 gain folded-domain cues. Ssk2/22, Pbs2 and Hog1 use separated N/C lobes and accessible nucleotide clefts. Fps1 jaw motion carries its transmembrane fold details. Nuclear rim gains double membranes and pore collars; GPD1-region DNA and RNA have nucleotide structure. Glycerol now includes hydroxyl branches on its three-carbon skeleton. Membrane details remain attached during shrinkage/recovery; HOG-independent early Fps1 closure remains modeled.

## Validation and review boundary

- `node src/processes/modules/operons/smoke.mjs`: all 8 bacterial combinations pass.
- `node src/processes/modules/operons/yeastSmoke.mjs`: all 8 yeast combinations pass.
- `node src/processes/modules/operons/refinementSmoke.mjs`: all 16 combinations pass finite geometry/instance buffers and bounds, exact repeated instance-matrix seeking, stable object/geometry IDs, and complete material inventory.
- Instanced meshes: lac 20; trp 26; GAL 12; HOG 12. Dynamic instances refresh bounds and dirty flags.
- All four entry modules bundle with esbuild. Owned JS formatted with Prettier.
- No SVG, shared renderer, browser, or full-workspace test changes.

No known local deterministic/mechanistic regression. Browser screenshots were deliberately not run under ownership instructions; normal-distance legibility, label overlap and whether these meet the accepted visual baseline still require root visual review. Unit tests alone are not visual acceptance.
