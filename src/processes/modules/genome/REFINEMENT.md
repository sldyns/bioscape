# Genome process refinement

Baseline read: `src/processes/transcriptionProcess.js` in full and `src/scene/bacterialDnaDetails.js`. The structural features below are educational geometry, not atomically fitted protein or capsid structures. No SVG was changed in this refinement.

## Replication

Before: nearly planar parent/daughter rods, one-piece polymerase ellipsoids, disconnected visual fragment markers.

After: parental and daughter strands follow continuous 3D helical paths. The unreplicated duplex opens locally into two daughter duplexes. Each strand uses 240 instanced backbone segments plus explicit phosphate groups and paired, flattened nucleotide bases. Exposed bases remain attached to their own strands. Gold RNA replaces, rather than overlays, the daughter DNA in primer regions. Lagging-strand synthesis grows leftward; actual backbone gaps remain in the ligase-off branch. The central-channel helicase contains six schematic motor domains with accessory lobes. Polymerases now have open multi-domain clefts and split clamp rings.

## Nucleotide excision repair

Before: a flat ladder and generic ring/diamond enzyme symbols.

After: two helical DNA backbones remain paired outside the local repair bubble. Local opening reveals individually attached bases; the complementary template is continuous through the gap. Two visible backbone interruptions and highlighted ends flank the lesion. The released oligonucleotide retains its own backbone, phosphates and exposed bases. New DNA reconstructs the missing helical strand as synthesis proceeds. Recognition, TFIIH, nucleases, polymerase and ligase have distinct functional multi-domain placement with open clefts. The incision-blocked branch retains the damaged strand.

## Transduction

Before: transparent rod outlines, single-line chromosome loops and a smooth translucent phage head.

After: both bacterial envelopes use opaque posterior cutaways with paired membrane-edge leaflets and visible thickness; the front opening exposes the genome. Chromosomes are instanced closed double helices with phosphate and base-pair detail, retaining branch-specific gene coloring and excision gaps. The phage has an open-front faceted capsid, a capsomere lattice, portal collar and repeating contractile sheath rings. The P1 sheath contracts during injection and is absent from the lambda branch. Packaged nucleic acid remains visible in the capsid window. DNA-delivery and stable-inheritance boundaries remain unchanged.

## B. subtilis sporulation

Before: transparent rod and concentric smooth rings.

After: the mother-cell envelope has an opaque cutaway with paired leaflet edges. Engulfment grows a three-dimensional curved membrane surface around the forespore rather than only revealing a 2D circle. The inner membrane shows paired headgroup rows and a hydrophobic core at the cut edge. Intermembrane cortex exposes a crosslinked mesh. The protein coat has continuous exterior fold ridges on its rear shell, leaving the front section open to the protected chromosome. Both mother and forespore DNA are double-helical nucleoid schematics. The spore is mildly elongated along the cell axis. Normal and engulfment-blocked outcomes remain distinct; one mature spore is released and reproduction remains false.

## Local verification

Run `node src/processes/modules/genome/smoke.mjs`.

Eight condition branches passed Node imports and esbuild browser bundles, bilingual-stage checks, finite vertex/instance buffers, bounds between 2 and 20, stable node/geometry/material inventories, at least four distinguishable stage states, and deterministic `.7 → .2 → .7` seeks including instance matrices/colors. NaN maps to progress 0. Geometry/material/node allocations remain outside update. New molecular structures use shared geometry and instancing.

Local counts: replication 93 nodes / 15 instanced meshes; repair 117 / 10; transduction 222 / 15; sporulation 189 / 15.

## Acceptance boundary

Browser screenshots and real-device inspection have not been performed by this agent. Passing programmatic checks does not establish visual acceptance. Root must still judge normal-distance cleft readability, capsid-window visibility, layer separation, label collisions and progression framing. Protein surface ridges, capsomere spacing, membrane proportions and cortical mesh are schematic; no measured atomic structure or exact capsid stoichiometry is claimed.
