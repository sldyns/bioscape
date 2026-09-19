# Regulation structural refinement

2026-09-19. Scope: `promoterRegulation` and `enhancerRegulation` only. Read the accepted `src/processes/transcriptionProcess.js` and `src/scene/chromatinDetails.js` before rebuilding. Existing process IDs, roots, stages, conditions and source boundaries are retained. SVGs, browser state and shared renderer/kit were not changed.

## Promoter regulation

Before: narrow smooth DNA rails with single base-pair sticks; six ellipsoids for TFIID, a torus half-ring for TBP, simple Pol II lobes, ring-like XPB, and smooth RNA. The TATA marker was a separate broad slab.

After:

- DNA has 96 displayed complementary base pairs, two different backbones with major/minor-groove spacing, instanced nucleotide repeats and planar base halves. The actual TATA-region bases carry the recognition highlight; altered-site color changes no longer recolor all gold protein factors.
- Locally melted bases stay attached to their respective backbones. Central pairing marks disappear only at the opened bubble, leaving both exposed strands legible.
- TFIID uses individually shaped TAF lobes, a connecting scaffold and an eight-rib curved TBP beta-sheet saddle. The saddle is open underneath for the bent DNA.
- Pol II exposes a foreground cleft bounded by named RPB1 clamp/wall/foot and RPB2 protrusion/jaw; the RPB4/7 stalk, bridge helix, clamp rim, RNA exit lip and a short CTD schematic distinguish its architecture.
- TFIIA/B, TFIIF and TFIIE have recognition/interaction arms and helical regions. TFIIH now presents a bilobal XPB motor and scaffold, rather than implying a hexameric helicase ring.
- Nascent RNA includes an instanced backbone repeat and exposed bases. Its growing 3′ end remains at the active region and its older 5′ end emerges from the open front.

## Enhancer regulation

Before: seven featureless cylinder cores on one smooth tube, three-lobe activators, six-lobe coactivator and a smooth RNA strand.

After:

- Each nucleosome has eight shaped histone subunits in four muted colors, exposed histone-fold helices and flexible tails. Seven cores share the immutable structural template, preserving geometry/material reuse.
- Each core is wrapped by explicit two-stranded DNA: a left-handed 1.65-turn superhelix contains a locally right-handed duplex with 147 displayed pairs. There are eight dynamic duplex linker segments. All display counts are schematic structure, not a represented genomic locus or measured length.
- Moving linker endpoints remain attached to the exact two strand ends of the neighboring moving/rotating cores. Cubic handles follow the strand tangents; the linker twist preserves endpoint positions and endpoint tangent directions.
- Core spacing was rebuilt to prevent the center of the folded chain collapsing into overlapping disks. The smallest adjacent-center distance in the sampled trajectory is approximately 0.959 model units; wrapped core diameter is approximately 0.9.
- Activators now have DNA-facing recognition helices and an exposed activation-region schematic. Flat locus boxes were replaced with unobtrusive curved locus markers.
- Mediator is organized into tail, middle scaffold and PIC-facing head/jaw modules, with connecting structure. Pol II uses the refined open-cleft architecture, and RNA carries nucleotide detail.
- Both coactivator scenarios retain the same chromatin trajectory. Coactivator docking and illustrative burst output remain distinct from enhancer–promoter distance; no permanent enhancer–promoter tether or deterministic distance-to-expression rule was added.

Protein-fold motifs are structural illustrations, not atomic coordinate reconstructions. No scientific pathway or organism scope was expanded, and the sources already embedded in each module remain applicable.

## Local validation

Commands:

```sh
node src/processes/modules/regulation/smoke.mjs
node_modules/.bin/prettier --check src/processes/modules/regulation/*.js src/processes/modules/regulation/smoke.mjs
```

Both pass. The focused smoke test now includes instance matrices and instance colors in seek snapshots, in addition to ordinary transforms and geometry buffers. It checks bilingual metadata, stage differences, both control branches, default values, clamping, finite buffers/bounds, exact repeated seeks and stable node/geometry/material identities. It bundles each model with esbuild. Additional checks cover exact duplex-linker endpoint attachment and nucleosome separation. No full-workspace tests were run.

| Model | Nodes | Meshes | Instanced elements | Unique geometries | Largest sampled dimension | Local mean update, 50 seeks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| promoterRegulation | 80 | 71 | 584 | 66 | 8.478 | 2.22 ms |
| enhancerRegulation | 318 | 296 | 6909 | 97 | 10.429 | 4.44 ms |

The timing is CPU-only Node sampling on this machine, not a browser frame-rate or device claim. Geometry/material/node construction remains outside `update`; moving instance bounds and deformed tube normals/bounds are refreshed. Materials are not swapped, so no detached material inventory is needed.

## Acceptance boundary

Both models have received substantial mechanism-specific structural changes. Neither has screenshot acceptance in this subtask: no browser was used. Root must inspect normal camera scale, foreground cleft visibility, labels and late-stage RNA against the accepted transcription baseline. The successful tests establish stable implementation and retained scenarios, not visual acceptance.
