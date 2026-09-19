# Energy process refinement

Inspected the accepted `transcriptionProcess.js`, `scene/membraneDetails.js`, and `scene/bacterialEnvelopeDetails.js` ATPase model before implementation. Existing process IDs, root registrations, stage timing, controls, sources, and mechanistic scope are retained. No SVG, browser, or shared renderer changes.

## Respiration

- Before: three sparse lipid rows, oval complexes and a bead-ring ATP synthase.
- After: densely packed paired leaflets with two acyl tails per lipid, visible hydrophobic cut edge, and membrane holes around proteins. Lipids use six shared instanced meshes rather than thousands of scene nodes.
- Complex I has separate membrane helix bundles, an asymmetric matrix arm and a schematic redox-cofactor route. Ndi1 remains a smaller matrix-side protein in yeast. Complex II has a peripheral domain and membrane anchor; III has paired helix/domain structures; IV has exposed cofactor pockets.
- ATP synthase has paired helix rotor units, a coiled central shaft, stationary a-subunit, paired peripheral stalks, six structured F1 domains, and catalytic nucleotide pockets. Moving ATP uses a nucleoside/triphosphate scaffold.

## Glycolysis

- Before: overlapping carbon beads, phosphate dots, translucent oval enzyme lobes and oval nucleotides.
- After: separated carbon centers expose persistent covalent links during cleavage; phosphates are tetrahedral P–O schematics and show temporary substrate bonds around transfer stages.
- The two enzyme domains are opaque, asymmetric folds with sheet/helix surfaces, an open front-facing cleft, structured hinge, and inward-facing catalytic ridges. Domain closure still follows the absolute reaction progress.
- ATP/ADP have fused base/ribose scaffold outlines and resolved phosphate groups. NAD has a two-ended nucleotide/carrier scaffold. These are reaction-bookkeeping schematics, not atom-fitted molecular structures.

## Bacterial energetics

- Before: a sparse curved bilayer and oval NDH/oxidase proteins.
- After: curved paired leaflets and twin acyl tails with clear protein footprints. NDH-I has an L-shaped peripheral/membrane architecture; NDH-II is a compact peripheral domain.
- bo3 has a large helix bundle plus auxiliary domain. bd-I has two membrane bundles, a periplasmic domain and three exposed heme-like motifs. Switching routes selects the complete protein architecture as well as proton-flow mechanisms.
- ATP synthase now exposes rotor, stator, shaft, F1 domains and nucleotide pockets. The cytoplasmic-facing head and absence of pumping in the NDH-II/bd-I condition are preserved.

## Cyanobacterial photosynthesis

- Before: sparse sac edges, PSII/PSI ovals and single-bead antenna rods.
- After: both surfaces of the thylakoid sac have paired lipid leaflets and acyl tails. Paired curved rim layers connect the surfaces while the front cutaway exposes the lumen.
- PSII membrane bundles have lumen-facing catalytic domains. PSI is a trimer of helix/domain modules; cytochrome b6f has paired membrane and lumenal domains.
- Phycobilisomes have three basal core columns and tiered radial rods. Each disk has a central channel and six resolved radial sectors using shared geometry. Counts and secondary structure are illustrative, not an atomic reconstruction.
- ATP synthase is detailed on the cytoplasmic side; its stationary parts never follow rotor rotation. Light/dark changes preserve the original photochemical boundary.

## Local validation and remaining gate

Run `node src/processes/modules/energy/refinement-smoke.mjs`. It checks all registered roots and conditions, finite geometry attributes and scene bounds, repeated .7 → .2 → .7 seeks, control reset to defaults, object/geometry/material identity stability, stage differences, scientific invariants, and per-module esbuild compilation. The four models pass.

The additions are substantive mechanism-specific geometry changes, but Node checks do not establish the accepted visual baseline. Normal-camera screenshot review is pending root review for all four models, particularly label spacing, the readability of F1 clefts and mobile carriers, and visibility of lipid tails at the final viewport size. No model is claimed visually accepted yet.
