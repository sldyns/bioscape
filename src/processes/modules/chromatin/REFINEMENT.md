# Chromatin process refinement

Reviewed `transcriptionProcess.js`, `chloroplastDetails.js`, and `nucleusAssembly.js` before changes. All added molecular motifs are schematic, not fitted atomic coordinates. Ownership stayed within this folder; no SVG, renderer, catalog, or browser changes.

## chromatinAccess

Before: eight plain histone lobes, smooth two-strand curves and simple enzyme/factor blobs.

After: eight histone folds carry three helical motifs apiece plus projecting tails; the retained octamer still slides relative to the same DNA sequence. Added 164 paired sugar/phosphate/base motifs in four instance batches, an ISWI interlobe ATPase pocket and helical linker-binding extension, and recognition helices on the binding factor. Shortened empty linker spans to enlarge the active event in the frame. The 1.65-turn wrap, ATP-disabled control, and fixed sequence tracking remain.

## tad

Before: one smooth fiber, a torus for cohesin, two ball-and-arrow CTCF markers.

After: two detailed DNA backbones with paired nucleotide motifs; cohesin has paired coiled-coil SMC arms, a hinge, ATPase head pockets, a kleisin link and a schematic helical loader-associated surface. Oriented CTCF markers include an eleven-motif zinc-finger chain. Labels were moved clear of the larger complex. Genomic anchor tracking and all three scenarios still operate; no membrane enclosure, reconstructed Hi-C claim, or expression prediction was added.

## plantGenome

Before: uniformly faint half-envelopes, flattened solid discs for grana, tubes for cristae, two-lobe ribosomes and single DNA strands.

After: stronger double-envelope back surfaces, front cut rims with lipid-head motifs, paired DNA nucleotides in nuclear/organelle nucleoids, stacked hollow thylakoid sacs with visible lumen cuts and bridging lamellae, paired-face crista sacs with posterior junction necks and matrix-facing ATP-synthase motifs. Cytosolic and local ribosomes now expose rRNA ridges and an mRNA channel; import channels have membrane-spanning subunit collars, nuclear pores have repeated subunits, and exported RNA carries nucleotide motifs. Precursor chains remain visible through the open fronts. Signal deletion still leaves illustrated precursors outside while local translation continues.

## plantRdDM

Before: largely straight RNA rails and two-lobe enzymes.

After: paired DNA sugar/phosphate/base motifs; individual nucleotide motifs on the duplex precursor, processed guide, passenger and Pol V scaffold; polymerase/RDR2 open clefts; DCL3 double jaws with helical surfaces and catalytic tips; AGO4 guide groove and end pocket; DRM2 substrate-recognition pocket and an enlarged reversible cytosine base-flip. The guide continues rotating into antiparallel scaffold alignment. Catalytic inactivation preserves upstream processing, pairing, recruitment and base engagement but removes new methyl marks. Added primary structural source: Fang et al. 2021, PMID 34078593.

## Local validation and remaining gate

- `smoke.test.mjs` and `plantSmoke.test.mjs`: original bilingual/stage, finite-geometry, deterministic-seek, resource-identity and condition assertions.
- `refinementSmoke.test.mjs`: all nine process/control cases; vertex/normal/instance matrices, recomputed bounds, repeated seeks, resource identities, instance presence and reversible DRM2 base-flipping.
- Per-model esbuild bundles succeed.
- Instance batches: chromatinAccess 4; tad 4; plantGenome 21; plantRdDM 23.

These are geometry/behavior checks, not visual acceptance. No browser/screenshot review was performed here. The four models have no known local finite-state or resource failures, but the accepted-baseline visual verdict remains open for root review, particularly label density around AGO4/DRM2 and readability of membrane lumina at normal camera distance. Thylakoid lamellae and crista junctions are simplified communicating structures, not a meshed ultrastructural reconstruction.
