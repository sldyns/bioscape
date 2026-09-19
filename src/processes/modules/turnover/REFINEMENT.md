# Turnover process refinement

Baseline inspected: `src/processes/transcriptionProcess.js` and `src/scene/bacterialDnaDetails.js`. These are teaching models with schematic protein folds, not fitted atomic structures. Existing species, process scope, references, stages, and condition controls are preserved. No thumbnails or shared rendering/catalog code changed.

## rnaSilencing

Before: four smooth AGO lobes, simple RNA rods, an effector cable.

After: distinguishable N, PAZ, MID, and PIWI domains with shared helix and beta-sheet geometries; an open nucleic-acid cleft, guide anchor pocket, and PAZ-side guide connection. Guide and mRNA now have separate phosphate, ribose, and base instances. TNRC6 binding regions and the deadenylase catalytic domain have folded surfaces. The central guide bulge now uses continuous backbone segments instead of independently shifted horizontal segments. Seed repression, catalytic AGO2 slicing, and mismatch controls retain their original boundaries.

At p=.55: 207 nodes, 12 unique geometries, 6 instanced meshes / 150 instances; bounds 8.85 × 2.38 × 1.62.

## proteasome

Before: annular wedges, cylinder ATPases, polyubiquitin polyhedra, and a regular coiled substrate.

After: 28 individually named folded core subunits form alpha7–beta7–beta7–alpha7, with a bounded front cutaway and visible cut edges. Six bilobed ATPase subunits have nucleotide pockets, small helical domains, and independently moving inward pore loops. Added folded lid, receptor and Rpn11 domains, and folded ubiquitin units. The substrate starts as two folded helices plus an initiation region, then unravels into the central channel. Its ubiquitin attachment now follows an actual residue until detachment.

Corrected a preexisting scale bug: catalytic sites were enlarged from ~0.1 to 1 by update, obstructing the chamber. They now remain small, with a specific regression assertion.

At p=.55: 504 nodes, 26 unique geometries shared by repeated folds; bounds 3.94 × 5.79 × 2.24.

## crispr

Before: two Cas9 lobes, separate catalytic ellipsoids, plain double-helical rods and RNA paths.

After: separate REC1, REC2, REC3, NUC, PAM-interacting, HNH and RuvC domains; bridge helix and an exposed PAM pocket. Dynamic DNA has instanced phosphates, sugars and attached bases, including exposed bases within the R-loop. crRNA guide and both natural RNA scaffold backbones have nucleotide detail. HNH/RuvC domain movement still follows R-loop activation; all target conditions retain their distinct geometries and cleavage outcomes. Full material inventory includes alternative PAM materials.

At p=.55: 305 nodes, 13 unique geometries, 11 instanced meshes / 518 instances; bounds 8.12 × 3.87 × 1.44.

## bacterialRepair

Before: repeated torus slices for RecA, four LexA ellipsoids, minimal duplex and RNAP surfaces.

After: RecA subunits wind helically along the ssDNA, each with an ATPase core, a smaller C-terminal domain, an inward DNA-contact loop and a nucleotide pocket. LexA monomers have helical N-terminal DNA-binding domains, a visible cleavage hinge and beta-sheet catalytic domains. ssDNA, the SOS locus, and growing RNA have phosphate/sugar/base geometry. RNAP now has separated clamp domains surrounding its open cleft. Self-cleavable and noncleavable LexA retain different transcription outcomes; completed repair remains explicitly outside scope.

At p=.55: 388 nodes, 30 unique geometries, 12 instanced meshes / 633 instances; bounds 7.62 × 4.13 × 1.20.

## Local validation and limits

`node src/processes/modules/turnover/smoke.mjs` passes for all four modules, all controls, and all registered proteasome roots. It checks esbuild bundling, bilingual stages, finite geometry attributes and instance matrices, finite 2–20 bounds, distinct stages, stable node/geometry/material identities, deterministic repeated seeking including instance matrices, Cas9/LexA branch states, and catalytic-pocket dimensions. Dynamic instance bounds are recomputed. Geometry/material/node allocation remains outside update.

All owned JavaScript is formatted. Browser screenshots were deliberately not run under the delegation contract. **Visual acceptance remains pending for all four models**; numerical validation alone does not establish that they meet the accepted visual baseline. Root should inspect open clefts, pocket visibility, and label density at normal viewing scale.
