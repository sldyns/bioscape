# Bacterial process refinement

Compared with `src/processes/transcriptionProcess.js`, `src/scene/bacterialEnvelopeDetails.js`, and `src/scene/ribosomeDetails.js`. Existing organism, mechanism, source and condition boundaries remain in place. Protein folds and repeated lipid/glycan features are structural schematics, not atomic reconstructions.

| Model | Before → after |
| --- | --- |
| bacterialExpression | Four overlapping enzyme spheres → open-front β/β′-like cleft, separately moving clamp, schematic helical ridges, catalytic pocket and RNA exit. Simple DNA rails → paired base halves and sugar/phosphate nodes that follow the moving transcription bubble. Two ribosome ovals → 30S head/neck/platform, 50S body/protuberance/stalk, rRNA ridges and peptide-exit opening. RNA nucleotide nodes follow the actual strand. |
| bacterialDivision | Uniformly transparent envelope → opaque, staggered cutaway layers with distinct inner membrane, peptidoglycan, and outer membrane edges. Added paired leaflet heads/tails and crosslinked glycan lattice, all following pole shape and septal invagination. Loose circular DNA → coiled circular nucleoid trajectories. Septal synthesis complexes have periplasmic and membrane-side lobes; FtsZ remains a discontinuous scaffold. |
| conjugation | Ghost rods → layered membrane cutaways exposing the interior and peptidoglycan mesh. Smooth pilus → repeated helical pilin structure. Minimal contact tube → ring-subunit envelope-spanning transfer apparatus and cytoplasmic motor ring; strand route now passes through its lumen. Plasmid complementary chains have connecting base pairs; nucleoids are supercoiled. |
| transformation | Ghost rod → one bilayer plus thick Gram-positive wall cutaway with membrane leaflet/crosslinked glycan detail. Two pore rings → open ComEC lumen with surrounding transmembrane structural segments and cytoplasmic complex. ComEA has DNA-binding lobes; RecA has a continuous helical ridge around incoming ssDNA, with nucleotide/base-pair detail on DNA. No extra outer membrane was introduced. |

Repeated structures use shared geometry and InstancedMesh batches; animated batches update instance matrices and recompute bounds. No geometry, material, or node is allocated in update. No materials are swapped.

Validation: all four bundle with esbuild; sampled 0, .18, .35, .5, .68, .83, .95, 1, and NaN in default and arrest/mismatch controls. Geometry attributes, instance matrices and bounds remained finite; largest bounds remained between 2 and 20. Node/geometry/material identities were unchanged. Full geometry/transformation/instance snapshots matched for .7 → .2 → .7. Stage snapshots were distinct and condition controls changed geometry. Format applied to all owned JS.

Visual acceptance remains pending root screenshots. No browser or shared renderer/thumbnail edits were made. Local numerical checks do not establish that every model has met the accepted visual baseline; root should particularly inspect small RNAP/rRNA detail at normal camera distance and the visible width of envelope layers.
