# Translation group refinement

Reviewed `src/processes/transcriptionProcess.js`, `src/scene/ribosomeReference.js`, `src/scene/ribosomeDetails.js`, and the chain/residue organization of the 4UG0 large/small-subunit JSON datasets. The reference renderer deliberately breaks missing-residue spans. No experimental-coordinate files are imported: these moving, multispecies scenes use explicitly schematic anatomy rather than misrepresenting a human atomic reconstruction as every organism's ribosome.

## Concrete changes

- **translation** — Replaced uniformly transparent ellipsoids and seven flat rRNA ridges with opaque, sculpted open-front 60S and 40S surfaces. Paired rRNA stems have phosphate rails, base-pair crosspieces and terminal loops. Separate 40S rails form an unobstructed mRNA groove; rear rRNA boundaries frame the E/P/A decoding spaces. A half-cylinder lumen and cut edges expose the peptide exit tunnel. tRNAs now carry 3D paired stems and phosphate markers; eRF1 has beta-sheet and helical secondary structure. The peptide has attached side-group markers. P→A transfer, A→P/P→E movement, 5′→3′ reading and code-dependent termination are preserved.
- **proteinFolding** — Replaced the small ribosome's featureless blobs with a scaled cutaway ribosome. Replaced Hsp70's main blobs with a two-sheet substrate-binding sandwich and four ATPase subdomains surrounding the nucleotide cleft; retained the independently moving helical lid and exposed client groove. Added J-domain and exchange-factor helix bundles and peptide side-group markers. The ADP-hold branch still retains the client and never displays a completed fold.
- **alternativeSplicing** — Replaced three translucent spliceosome blobs with an open Prp8/U5 scaffold, beta-sheet/helical protein surfaces, U2/U6-like paired RNA stems, an exposed exon-positioning RNA loop, two catalytic-metal markers and a seven-subunit Sm-ring schematic. The transcript now has instanced sugar/base details that follow the same RNA backbone through ligation and lariat motion. Both actual exon-junction branches and 2′–5′ branch links remain distinct.
- **nitrogenFixation** — Replaced ghostlike MoFe/Fe blobs with sculpted alpha/beta subunits, sheet/helix motifs, nucleotide clefts and exposed cofactor pockets. Replaced generic polygonal cluster rings with distinct [4Fe–4S] cubanes, an [8Fe–7S] fused P-cluster topology, and a [7Fe–9S–Mo–C] FeMo schematic with a homocitrate arm. Ferredoxin now has a folded sheet/helix surface. These are simplified connectivity models, not fitted atomic coordinates. Eight delivery rounds, transfer-before-hydrolysis ordering and oxygen-inhibited product suppression are unchanged.

Secondary structures are intentionally illustrative. Added source links for Hsp70 subdomain architecture and the structurally determined FeMo cofactor. No new process IDs, organism registrations, renderer changes or thumbnail edits.

## Local verification

Reproduce with `node src/processes/modules/translation/refinementSmoke.mjs`.

All nine model/root combinations pass bilingual-stage checks, finite geometry and instance buffers, finite bounds in the required 2–20 interval, deterministic .7 → .2 → .7 seeking, NaN clamping, resource/node identity stability, and different final geometry/state for every control branch. Each process also bundles with esbuild.

| Model | Nodes | Instanced meshes | Largest dimension | Browser bundle excluding Three |
|---|---:|---:|---:|---:|
| translation | 201 | 19 | 9.03 | about 25 KB |
| proteinFolding | 281 | 17 | 7.23 | about 28 KB |
| alternativeSplicing | 234 | 8 | 8.19 | about 25 KB |
| nitrogenFixation | 312 | 0 | 8.19 | about 25 KB |

Metal-cluster markers reuse the common sphere/cylinder geometry; RNA stems and moving peptide/RNA details use instancing. Dynamic instance bounds are recomputed. Geometry/material/node construction occurs before updates; no material swapping occurs during updates. A single-model create + local-check run measured approximately 40–100 ms in Node; this is not a browser frame-rate measurement.

## Visual acceptance boundary

No browser or screenshots were used, per assignment. All four now have concrete mechanism-specific structural improvements, but none is claimed to have passed the user's visual baseline from tests alone. Root screenshot review must confirm normal-distance readability, peptide visibility within the cutaway, Hsp70 groove occupancy and label placement. No remaining finite-state or resource-stability failures are known.
