# Independent peer review — translation corrections

**Verdict: qualified scientific acceptance of the corrected representations; no new confirmed product defect found.** Browser/visual acceptance is not included. Two regression blind spots were demonstrated below and sent to the author for strengthening. This review edited no product files and no original audit or resolution report.

## Scope and observed evidence

Read Phase A `translation.md/.json`, the completed Phase B `resolutions/translation.md`, all new `ribosomeAssembly.js` and `translationReaction.js`, `translationProcess.js`, `proteinFoldingProcess.js`, `nitrogenFixationProcess.js`, relevant molecular helpers, and `science.test.mjs`. Executed the author's scientific regression: **14 root/condition combinations, 2,814 frames PASS**. Additional independent read-only probes sampled translation at 1,001 progress values and the attached folding segment at 410 values. The author was still adding semantic names/chain spans during review; the assertions below were independently re-read against those additions.

### 4UG0 assembly registration and identity

The implementation concatenates the source datasets before calculating a shared center and extent, preserves residue coordinates, and applies one uniform assembly transform. Large/small subunit child groups have identity transforms; RNA and protein instances inherit the same registration. There are **10,829 large-subunit and 6,327 small-subunit sampled coordinates (17,156 total)**. The RNA records are 28S, 5S, 5.8S and 18S; protein records are Cα and RNA records C4′. Sequential-residue and distance checks prevent invented links across missing stretches. Current `chainSpans` records preserve chain/entity identity for the combined instance batches.

The author's exhaustive source-coordinate/edge test passes. This is a residue-level backbone rendering, not an all-atom reconstruction, and the text correctly names the human source even in other eukaryotic roots. The [primary 4UG0 deposition](https://www.rcsb.org/structure/4UG0), opened during this review, identifies the human 80S cryo-EM structure and its intersubunit architecture. No independently normalized subunits or arbitrary RNA decorations remain in the displayed reference.

### P→A transfer, tRNA ends and residue identity

At p=.28/.41, world P-CCA is `(1.3,1,0)`, A-CCA `(1.75,.98,0)`, incoming residue `(1.75,1.18,0)` and previous C-terminal residue `(1.3,1.32,0)`. At .41 the P ester disappears and the peptide bond to the **same incoming residue object** appears; its A ester remains until .86. No intermediate unattached C terminus or vanished amino-acid object was found. The preserved marker becomes the new C-terminal residue; exact side-chain chemistry/sequence is not claimed. Translocation brings this tRNA to the P site, followed by release-factor-mediated hydrolysis and chain release.

Independent checks inspected the **actual 48-point tRNA backbone**, not only named CCA markers: maximum last-backbone-point to CCA error over 1,001 frames was **1.11×10⁻¹⁵ scene units**; all 47 RNA links meet their neighboring bead centers. The tRNAs are continuous folded teaching traces with distinct anticodon and 3′ ends. Their L-like silhouette and exact elbow/CCA geometry remain schematic, not an experimental tRNA fit. The primary substrate-analogue work supports positioning tRNA acceptor ends in the RNA catalytic center, without validating these invented coordinates: [Nissen et al., primary study record](https://pubmed.ncbi.nlm.nih.gov/10937990/).

### Peptide exit and folding reuse

The actual peptide backbone links **and new terminal peptide bond** were sampled, including portions crossing the y=1.43/2.63 guide boundaries. Across 1,001 frames the maximum radial envelope, including the .065 residue radius, was **.184323 < .25** in the schematic corridor. The chain advances out before its final lateral drift. This goes beyond the current test's bead-center checks.

The corridor is explicitly a separate reaction enlargement, not fitted into 4UG0. Consequently, these results do **not** prove that the peptide occupies the experimental 4UG0 tunnel or that the schematic PTC has a mapped experimental residue anchor. The folding model makes the same distinction. In the folding enlargement, the chain's proximal point stays exactly at the continuation endpoint `(-2.74,-.39,.12)` for all 410 pre-release frames; maximum measured error was **0**. The common 4UG0 helper preserves its registration there too. Complete/hold branch tests pass. Thus the original fabricated-ribosome issue is resolved without claiming an unperformed true-exit mapping.

### Nitrogenase position correction

Both FeMo origins are in the upper alpha region; the **complete rendered cofactor bounds** clear the beta-domain top by **.210013 (left)** and **.198818 (right)** scene units. The changed left relay ends at the same selected FeMo origin `(0.1,.64,.05)` after starting at the P-cluster origin `(0,.04,.49)`. The original lower-beta FeMo placement is gone in both oxygen conditions.

This is appropriate topology-level evidence. An alpha x/y projection test is not proof of enclosure by a closed molecular surface: these domain surfaces intentionally have their front half removed. The [primary 3U7Q deposition](https://www.rcsb.org/structure/3U7Q), opened during review, is the reference for the A. vinelandii MoFe architecture; the current spheres/cluster icons are not fitted 3U7Q coordinates or verified ligand geometry.

## Demonstrated regression blind spots

The reviewed `science.test.mjs` SHA-256 was `1a1c6e4876d9749342e0c762265716e69c361652f9d4b797c1c5436ce08c1c3e`.

An esbuild **in-memory mutation only** made two deliberately wrong changes in `translationReaction.js`: after committing each tRNA backbone, move its final actual bead by +.6 in x; also force `P-tRNA`'s parent group invisible. The original science test still returned **exit 0, all 14 combinations / 2,814 frames PASS**. No disk source was mutated.

1. Bond tests use named CCA marker positions, so they do not establish that the marker is the actual RNA backbone end. Add actual `*-backbone-3prime-end` coincidence and RNA segment endpoint assertions. Current product geometry passes the independent check; this is a future-regression blind spot.
2. Tests largely use local `.visible` and coordinates, so a hidden molecular parent can leave every tested marker coordinate intact. Add effective ancestor visibility at the active molecular states for reference, reaction parent, tRNA body, ester/new bond and incoming residue. Current product parents were independently observed visible when required.

Additional coverage limits: the folding continuation test only checks its visibility, not its connection; the peptide corridor test checks residue centers rather than all links/new terminal bond; nitrogenase tests establish tier/projection but not fitted 3D pocket or metal-ligand placement. Independent measurements above cover the current connection/path cases. These limits must not be silently reported as atomic geometry acceptance.

## Evidence boundary and handoff

No new confirmed molecular-connectivity or subunit-placement failure was found in the final geometry inspected. The two test blind spots have concrete mutation evidence and were reported to `p_regulation`; final acceptance should distinguish their test-strengthening status from the currently passing model. Root still owns visual readability, L-tRNA silhouette and presentation acceptance. The attempted plant Nature page returned an internal error during this review, so no new full-text claim is based on that attempt; Phase A's existing source review was read, and the explicitly opened structural depositions plus primary-study abstract/search record are the fresh source boundary here.
