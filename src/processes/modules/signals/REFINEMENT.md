# Signals refinement

Baseline inspected: `src/processes/transcriptionProcess.js` and `src/scene/membraneDetails.js`. Existing scope, stages, controls, and source boundaries are retained. Secondary structures are teaching schematics rather than atomic reconstructions.

| Model | Before → after |
| --- | --- |
| signalTransduction | Single receptor stalks and plain lobes → five extracellular domain silhouettes per PDGFR, explicit transmembrane helices, paired membrane cut faces, kinase beta sheets / alpha helices around catalytic clefts, structured Grb2/SOS, double nuclear envelope edges, an eightfold nuclear pore, and paired DNA with nucleosome cores. Nascent RNA now grows from its nuclear origin rather than scaling from world zero. |
| apoptosis | Elliptical mitochondrial outlines and narrow spoke wheel → membrane walls with front cut edges, distinct inner/outer boundaries, paired crista lamellae and exposed intracristal spaces, seven Apaf-1 arms with separate NOD/helix/paired propeller shapes, and structured caspase subunits. The main cell, nucleus, and membrane-enclosed bodies now have bounded rear cutaway shells and chromatin. The BAX/BAK opening retains a separately switched membrane closure. |
| differentiation | Uniformly transparent cell, parallel nuclear strands, and single bead ribosomes → bounded cell/nuclear cutaways, paired cell and nuclear membrane edges, nucleosome-bearing chromatin loops and a pore, schematic GATA1 zinc-finger features, two-part ribosomes with rRNA ridge, and four hemoglobin subunits with visible heme planes. Membrane-enclosed pyrenocyte acquires a rear shell and inner membrane edge. RNA growth remains anchored to its nuclear origin. |
| immuneResponse | Flat compartment outlines, rings, and simple receptor branches → paired target/T-cell membrane walls, ER lumen backplane and membrane cut edges, TAP helix bundles, four seven-subunit proteasome rings and regulatory cap silhouettes, paired Golgi cisternae, membrane carrier detail, MHC-I beta-sheet floor between two helical groove walls, beta-2-microglobulin/alpha-3 domains, TCR constant/variable domain features with contact loops, and paired CD8 domains. Protein degradation now contracts toward the proteasome entrance rather than world zero. |

## Local validation

`node src/processes/modules/signals/smoke.mjs` passes for all four models: bilingual/distinct stages, finite geometry and instance buffers, finite bounds (largest dimension within 2–20), stable node/geometry/material resource identities, repeated seeks, all condition branches, thumbnail existence, and esbuild compilation. Every model exposes its complete material inventory, including preallocated alternate caspase materials. Repeated elements use shared sphere/cylinder primitives and instanced membrane headgroups. In the current chromatinFiber implementation, each histone core has its own cylinder geometry and the DNA duplex uses two continuous tube meshes; differentiation deforms the independent chromatin vertex buffers. Geometry/material/node construction remains outside update.

## Review boundary

No browser, screenshot, thumbnail, or shared-renderer changes were made. These are concrete structural revisions, but visual parity with the accepted baseline is not yet established: root must judge normal-distance readability and occlusion in screenshots. No model is declared visually accepted from smoke results. Retained simplifications include compressed Golgi transport, schematic enucleation mechanics, and omitted signaling branches/feedback.

## 2026-10-15 incremental pass

PDGFR Ig-domain centers now have a continuous backbone. Apoptosis and erythroblast membrane rear faces reuse the exact authoritative implicit geometry; paired section contours follow its actual triangles through neck formation/fission. Erythroblast Hb tetramers grow smoothly and separate tangentially from ribosomes. Cytotoxic granules now expose a membrane hemisphere, cut rim and enclosed core at the original whole-granule radius. Scientific branches remain unchanged. Focused smoke and new refinement tests pass; root rendered/performance acceptance remains required. Detailed evidence: `docs/qa/process-refinement-2026-10-15/agents/refine_signals.md`.
