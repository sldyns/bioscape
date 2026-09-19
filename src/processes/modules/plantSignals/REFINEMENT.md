# Process geometry refinement

Baseline inspected: `src/processes/transcriptionProcess.js`, `src/scene/membraneDetails.js`, and `src/scene/plantStromaDetails.js`. These changes are structural cartoons, not atom-coordinate reconstructions. IDs, existing stages, controls, and literature scope remain intact.

## auxin

- Beaded C-ring → continuous deep TIR1 LRR concave sheet, individual repeat faces and outer helices; recognizable F-box/ASK1–cullin–RING/E2 scaffold domains.
- Two smooth ARF blobs / simple DNA cord → domain-separated ARF, accessible Aux/IAA degron, explicit antiparallel phosphate backbones and half-base pairs. A moving, smoothly opening transcription bubble exposes DNA through an open polymerase cleft; new RNA has backbone and nucleotide instances.
- Four torus rings → alpha7–beta7–beta7–alpha7 proteasome barrel, bounded front beta-ring cutaway exposing its lumen, sixfold ATPase bases and regulatory lids. Unfolded substrate and separately recycled ubiquitin distinguish substrate destruction from ubiquitin reuse.
- Existing low-auxin condition still prevents recruitment, degradation, transcription, and induced growth. The shoot inset remains a labeled qualitative later response.

## plantDefense

- Sparse lipid balls → dense, paired instanced phosphate leaflets with separate paired kinked tails and exposed bilayer cut edge.
- Beaded receptors → continuous FLS2 and shorter BAK1 LRR sheet surfaces, repeating outer helices, single membrane-spanning helices, and bilobed cytosolic kinases with open ATP clefts. Ligand now docks on the concave FLS2 face at the coreceptor interface.
- Six straight cylinders / enzyme spheres → six individually wound RBOHD membrane helices, alternating loops, two membrane cofactor discs, cytosolic enzyme domains and N-terminal regulatory motifs. Electrons remain cytosol-to-apoplast; flg22 remains extracellular. BIK1 phosphorylation remains one depicted regulatory input, not the only activator.

## photosynthesis (additional explicit ownership from root)

- Retained the open double-envelope chloroplast and ten thylakoid sacs. Added paired membrane head/tail detail at sac cuts and hollow intergranal lamellae with visible inner surfaces.
- Tiny protein clusters → PSII dimer with antenna complexes and lumen-facing water-oxidation caps; separate PSI core/antenna crescent and stromal acceptor face. Added component labels without changing stage metadata.
- Simple ATP synthase stalk → membrane rotor ring, offset membrane subunit, rotating central stalk, six-subunit stromal head and separate peripheral stator.
- Identical cycle-site beads → recognizable Rubisco L8S8 assembly and distinct multi-domain stromal enzyme assemblies. The reaction-cycle arrows remain explicitly nonphysical explanatory guides. Original flow timings, concurrent reactions, ID, stages and sources retained.

## Local verification and visual boundary

Run `node src/processes/modules/plantSignals/refinementSmoke.mjs` from the repository. Checks all three bundles, bilingual stages, both signal conditions where supported, finite geometry/instance buffers and transforms, dimension bounds, repeated-seek snapshots including instances/materials/labels, and 60 updates without resource/node identity changes. Repeated helices and domain ribbons share geometry; lipid and nucleic-acid detail is instanced. No geometry, material or scene-node allocation occurs in update.

Current maximum extents: auxin 8.63, plantDefense 8.71, photosynthesis 7.24 units; all within 2–20. No shared files or SVGs changed in this refinement; photosynthesis is the one separately authorized existing-process file.

**Visual acceptance is pending root screenshots.** The smoke checks do not prove equivalence to the accepted transcription model at normal viewing distance. No model is claimed to pass that visual gate without root review. No browser or full-workspace tests were run.
