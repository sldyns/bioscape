# Translation group — independent Phase A audit

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and test files unchanged.

Coverage: 4 models, 9 registered model/root pairs, 14 root/condition combinations. All four have confirmed issues: 3 P1 and 1 P2. Existing local regression passes 2,814 frames; independent diagnostics cover 1,092 samples plus targeted boundary measurements. Those passes do not invalidate the issues below.

## translation — confirmed_issue
Roots: cell, plant, yeast, paramecium. Cytosolic eukaryotic last elongation round and termination; registered human 4UG0 reference explicitly disclosed for all roots; separate reaction schematic.

**20261004-translation-01 · P2 — visible discontinuity**
`src/processes/modules/translation/translationReaction.js` — lines 239-240 and 265-266; progress 0.99.

At .989999 the post-translocation tRNA and release factor are fully visible, stationary, and both more than 2.11 scene units tall. At .99 both disappear without departure, shrinking or fading; tRNA CCA remains at world [1.3,1,0]. Declared-camera projection puts each at about 29% viewport height (renderer auto-fit not applied).

The terminal segment abruptly removes two central, fully sized molecular objects. This is a large geometric visibility jump rather than a necessary bond-state change. The intro explicitly says later subunit recycling is not shown.

Fix: Retain the post-release tRNA/factor through the final hold, or provide a continuous, biologically coherent departure whose visibility cutoff is outside the visible action. Keep peptide release and all connection invariants.

Verification: Verify .989999/.99/1 effective visibility and screen-space extents have no large disappearance; test irregular seeks; root reviews continuous playback across .98-1.

Scientific sources:
- [RCSB 4UG0 — Structure of the human 80S ribosome](https://www.rcsb.org/structure/4UG0) — Human cryo-EM 80S assembly at 3.6 A; authentic rRNA/protein and common subunit placement. Does not validate the independent animated reaction diagram.
- [NCBI genetic codes — table 6](https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi) — Ciliate nuclear code includes Paramecium and assigns UAA/UAG to glutamine; the animation wisely leaves its stop triplet unspecified.

## proteinFolding — confirmed_issue
Roots: cell, plant, yeast. Illustrative eukaryotic cytosolic soluble client and Hsp70 ATP/ADP complete-versus-hold cycle; human 4UG0 reference separate from enlarged chain.

**20261004-translation-02 · P1 — misleading protein secondary-structure geometry**
`src/processes/modules/translation/proteinFoldingProcess.js` — lines 82-86 and 184-201.

Final helix uses x increasing with y=+sin(theta), z=+cos(theta), giving left-handed chirality. Actual beads 0-22 at p=1/complete produce 20/20 negative consecutive-edge scalar triples, approximately -0.0031778853. All three manual Hsp70 lid helices likewise give 34/34 negative triples each, approximately -0.0001016377. The shared helix helper uses the opposite, right-handed convention.

The model teaches a normal alpha/beta protein fold and an Hsp70 alpha-helical lid but constructs these representative alpha helices with reversed handedness. Rare left-handed protein conformations do not justify making the generic client and all lid helices left-handed without any such biological scope.

Fix: Reverse the manual angular orientation or use the right-handed helper while preserving coil endpoints, chain continuity, client-release choreography, shape detail and both branches.

Verification: Add actual-path chirality regressions for the final client helix and all three Hsp70 lid helices with a known right-handed positive control; ensure endpoints remain connected and all root/control cases pass.

Scientific sources:
- [RCSB 4UG0 — Structure of the human 80S ribosome](https://www.rcsb.org/structure/4UG0) — Human cryo-EM 80S assembly at 3.6 A; authentic rRNA/protein and common subunit placement. Does not validate the independent animated reaction diagram.
- [Zhang et al. 2014 — Crystal structure of human HSP70 substrate-binding domain with peptide substrate](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0103518) — Primary human HSP70 structure: two-layer beta-sandwich substrate pocket and alpha-helical lid; substrate binding is stronger in ADP state and weaker following ATP exchange. Schematic domain shapes are not fitted atomic coordinates.
- [Allostery in the Hsp70 chaperones is transduced by subdomain rotations](https://pmc.ncbi.nlm.nih.gov/articles/PMC2693909/) — Primary NMR evidence for nucleotide-dependent changes in NBD subdomains; ATP versus ADP affects domain coupling and client release. Supports the generic cycle, not exact model kinetics.
- [EMBL-EBI — Alpha helix](https://www.ebi.ac.uk/training/online/courses/foundations-protein-structure/principles-of-protein-folding-and-architecture/secondary-structure-%CE%B1-helices-and-%CE%B2-sheets/%CE%B1-helix/) — Official structural teaching reference explicitly distinguishes helical handedness and gives right-handed alpha helix as the standard L-amino-acid protein conformation. It does not assert that rare left-handed conformations never exist.

## alternativeSplicing — confirmed_issue
Roots: cell. Human nuclear SMN2 exons 6-8; include or skip exon 7; schematic lariats and spliceosomes with two-event inclusion timing compressed.

**20261004-translation-03 · P1 — misleading reaction geometry and visible bond pop**
`src/processes/modules/translation/alternativeSplicingProcess.js` — lines 170-199, 204-208, 217-228 and 238-249.

New exon-ligation bonds become fully visible at p=.59 while exon approach is still in progress (.55-.73). Actual skip endpoints are 4.4068587 units apart and inclusion endpoints are 1.4980796 apart; ordinary RNA backbone spacing is .1. These giant bonds immediately appear then contract to .3/.1. First transesterification has the same order problem: at p=.349 its new branch bond spans 2.23371 units (skip) or .71457 (include).

Transesterification is drawn as creating a long covalent tether across remote RNA segments instead of first bringing reactive endpoints together at the spliceosomal active site. The model itself presents these cylinders as RNA bonds; their conspicuous appearance across a substantial part of the scene cannot be treated as a harmless length-scale label.

Fix: Choreograph RNA approach and bending before either bond exchange; switch donor/branch and acceptor/new-exon connectivity only when respective endpoints are adjacent. After ligation move the connected product without stretching its new junction, retaining original nucleotide identities and both lariat outcomes.

Verification: Regression must inspect actual branch/exon bond endpoints and lengths at both reaction instants, throughout intermediate progress and in both isoforms; reject the baseline long-link spans; preserve branched RNA and retained/excised exon identity.

Scientific sources:
- [Lorson et al. 1999 — A single nucleotide in the SMN gene regulates splicing](https://pubmed.ncbi.nlm.nih.gov/10339583/) — Primary SMN minigene/transcript evidence for exon 7 skipping and impaired SMNDelta7 self-association; supports inclusion versus skipping scope and avoids equating RNA variety with normal protein function.
- [Galej et al. 2016 — Cryo-EM structure of the spliceosome immediately after branching](https://pubmed.ncbi.nlm.nih.gov/27459055/) — Primary 3.8 A spliceosome structure: first transesterification joins intron 5-prime phosphate to branch adenosine 2-prime OH; cleaved 5-prime exon is retained near the catalytic site. Splicing proceeds through branching followed by exon ligation.

## nitrogenFixation — confirmed_issue
Roots: bacterium. A. vinelandii cytosolic Mo nitrogenase; one enlarged catalytic half; protected versus unprotected oxygen exposure.

**20261004-translation-04 · P1 — substrate/product atom duplication**
`src/processes/modules/translation/nitrogenFixationProcess.js` — lines 309-318; protected branch progress [.8,.81).

N2 is visible while p<.81, whereas both separate NH3 groups become visible at p>=.8. Actual nitrogen-sphere count is 2 at .799999, 4 at .8/.805/.809999, and 2 at .81. The overlap lasts .36 s at the declared 36 s duration, with opaque materials and fully present product nitrogen spheres.

One represented N2 substrate is converted to two NH3 products, so it cannot coexist with an extra pair of product nitrogen atoms during that same conversion. This is duplicated molecular matter, not merely teaching-marker stoichiometry.

Fix: Transfer the two existing nitrogen identities into the product representation at a single coherent conversion boundary, or make substrate/product visibility mutually exclusive and align product starting positions to the same atoms; preserve two NH3 and H2, all eight rounds and the blocked branch.

Verification: Assert exactly two effective visible nitrogen atom representations in the active substrate-to-product trajectory at dense boundary samples; assert no product in exposed branch. Root should inspect continuity at .78-.83.

Scientific sources:
- [Duval et al. 2013 — Electron transfer precedes ATP hydrolysis during nitrogenase catalysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC3799366/) — Primary measurements establish ET then ATP hydrolysis, phosphate release and Fe-protein dissociation; minimum eight electrons and sixteen ATP per N2; two NH3 plus H2; alpha2beta2 MoFe with P and FeMo clusters.
- [RCSB 3U7Q — A. vinelandii nitrogenase MoFe protein at atomic resolution](https://www.rcsb.org/structure/3U7Q) — Primary 1.00 A MoFe structure from A. vinelandii; central light atom in FeMo cofactor identified as carbon. Model cluster schematic retains distinct composition and alpha-domain placement.

## Evidence and limits

- [Structured audit](translation.json)
- [Independent diagnostics](../evidence/translation/diagnostic.json)
- [Diagnostic script](../evidence/translation/diagnostic.mjs)
- [Targeted helix and splice measurements](../evidence/translation/targeted.json)
- [Translation terminal projection](../evidence/translation/translation-terminal-projection.json)
- [Existing regression log](../evidence/translation/existing-science-test.log)

No browser/rendered playback, physical-device or performance acceptance was performed. Root retains visual acceptance ownership. Model texts, stage/control conditions, formula transitions and actual geometry were read independently; earlier audit verdicts were not reused as current proof. Some extra source endpoints were blocked; no finding depends on a blocked page. No repairs begin before root releases Phase B.
