# Membrane process refinement

Inspected the accepted `src/processes/transcriptionProcess.js` and anatomical `src/scene/membraneDetails.js` before editing. These changes preserve the four process IDs and existing control semantics. All secondary structures, pockets, membrane thicknesses, and cortex meshes are explanatory schematics, not atomic fits or measured mechanics.

## Common membrane

Before: widely spaced ball heads and straight cylinder tails, each a separate node.
After: denser instanced paired leaflets with distinct headgroups, glycerol necks, and two separate fatty-acid paths including an unsaturation-style kink. Shared tail buffers preserve a readable cut edge without a uniform transparent slab. Protein gaps are preserved. Alpha helices reuse a shared secondary-structure buffer within each scene.

## diffusion

Before: one six-ellipsoid channel and spherical tracers.
After: a four-monomer aquaporin assembly, six helical ribbons and connecting surface loops per monomer, paired half-helical pore features, and four distinct water paths. Water is routed through monomer pores, never the central tetramer interface. Oxygen retains its bilayer path; tracers distinguish bent water and diatomic oxygen. Both gradient controls and bidirectional particle accounting survive. The two route materials are included in the full returned material inventory.

## activeTransport

Before: ten ellipsoid rods and three solid cytoplasmic spheres.
After: ten secondary-structure helices around the binding cavity, visible coordinating-site features, ribbed alternating gate caps, folded N/P/A domains with open clefts, a phosphorylation pocket, and the beta-subunit membrane anchor/extracellular domain. Existing conformation-dependent domain motions now move their complete structural details. The cytoplasmic/external gates remain mutually exclusive, with 3 Na exported and 2 K imported per ATP; no-ATP still stalls. Backbone/catalytic topology is schematic, not a PDB reconstruction.

## osmoticBalance

Before: a single deforming opaque red-cell surface.
After: a bounded membrane window reveals the inner leaflet, an attached cortical lattice and membrane attachment rods. The cortex is inside the cytoplasmic leaflet, not between leaflets. Outer surface, inner layer, lattice vertices and attachments deform from the same coordinates continuously through all three tonicity conditions. The bulk cell stays opaque. The model still excludes rupture, volume regulation and quantitative biomechanics. Added an authoritative membrane-skeleton structure reference (Li et al., 2023; PubMed 37044097).

## bacterialCellWall

Before: sugar beads, a five-rod RodA placeholder, and a smooth PBP head.
After: puckered NAG/NAM sugar-ring schematics, residue-specific stem features (including mDAP side groups), a ten-helix RodA body with periplasmic substrate groove, and an anchored PBP2 folded catalytic cleft. The beta-lactam has a strained-ring/substituent schematic; the ring-opening/covalent-occupancy transition remains linked to blocked transpeptidation. Existing and new strands remain distinguishable. D-Ala4 to mDAP3 crosslink endpoints and terminal D-Ala release are unchanged. Alternate site materials are included in a full returned inventory.

## Local verification

Run `node src/processes/modules/membrane/refinement.test.mjs`.

PASS on all four models: all condition combinations; finite vertex/normal/instance buffers and bounds; repeated-seek equality including deforming mesh buffers; stable node and geometry inventories; material inventory coverage; at least four distinct states; browser-target esbuild bundles. Additional assertions cover four aquaporin pore paths, diffusion net flux/equilibrium, mutually exclusive pump gates and stoichiometry, tonicity-dependent volume direction, and blocked versus normal wall crosslink formation.

Resource counts after construction: diffusion 203 nodes / 32 geometries; activeTransport 109 / 55; osmoticBalance 62 / 6; bacterialCellWall 655 / 22. Repeated membrane components use instancing; sugars/stems share sphere and cylinder buffers.

Visual acceptance remains with root screenshot review. No browser or thumbnail work was performed in this refinement. No known local invariant failures; these tests do not establish that every model meets the accepted visual baseline.
