# Operons fresh review · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Phase A only; product and tests unchanged.

Coverage: **4 models, 4 registered process/root pairs, 16 condition combinations; 6 confirmed issues (2 P1, 4 P2)**. Actual registry routes: lac/trp → bacterium; GAL/HOG → yeast. No specialized-root overrides apply.

## Findings

### lacOperon — confirmed_issue

E. coli cytoplasmic LacI plus CAP-cAMP regulation; lactose present/absent crossed with glucose low/high.

- **20261004-operons-01 (P1)**: The lactose-dependent release starts at p=.17, while both bound ligand meshes remain invisible until p=.25. At p=.24 LacI has moved 0.5363 world units from its original operator pose; at p=.249 it has moved 0.6594, still with no drawn inducer occupancy. The specific induction animation reverses its own stated allolactose-binding -> lower operator affinity -> induced dissociation order. This is a deterministic ligand-conditioned release, not a depiction of stochastic basal dissociation.
  Fix: Complete the ligand-binding event before starting the modeled LacI induction displacement, retaining no-lactose repression and both glucose branches.

- **20261004-operons-02 (P2)**: Across p±1e-6 at six RNAP entry/release boundaries, individual DNA phosphate jumps reach 0.2037–0.6738 world units. At .87/.91/.95 a visible RNA bridge of length 1.0698/1.4045/1.7487 disappears outright; the 3-prime end location changes by 0.9884/1.3421/1.6984. A binary polymerase visibility flag is reused as duplex opening and RNA bridge existence. Integration of twist carries the step down the DNA, while release removes a visibly long part of the same RNA chain instead of moving it continuously into the released conformation.
  Fix: Use continuous opening/closing ramps and a continuous released-RNA transition that preserves the visible connected chain. Keep independent bubbles for all three RNAPs and exact arbitrary seeking.

Source support: [Interaction of effecting ligands with lac repressor and repressor-operator complex.](https://pubmed.ncbi.nlm.nih.gov/235964/) — Primary ligand-binding measurements show inducers weaken operator affinity; the modeled ligand-dependent release should follow inducer occupancy.; [Structural basis of transcription: an RNA polymerase II elongation complex at 3.3 A resolution](https://www2.rcsb.org/structure/1I6H) — Primary structural reference for continuity between synthesized RNA and its polymerase-bound growing end; polymerase-family-specific protein architecture is not transferred to the bacterial schematic.

### trpOperon — confirmed_issue

E. coli trp initiation repression and attenuation; free Trp severe depletion/high crossed with charging normal/limited.

- **20261004-operons-03 (P2)**: Each following region starts .095 progress after the previous region begins, but the previous needs .12 progress to complete. At p=.513 in the antiterminator branch, region 4 is already visible (24 indices) while region 3 has only 1992/2112 indices. The upper-bound last visible tube-ring center remains .14837 units from the next region start, exceeding the sum of radii .104 by .04437. Thus the displayed single RNA is broken between regions. These colored regions are covalently contiguous portions of one transcript; simultaneous emergence of a downstream fragment before the preceding region reaches it misrepresents polymer-chain continuity. The final fully drawn paths do join, so endpoint-only tests miss the failure.
  Fix: Reveal regions with a single ordered front or gate each downstream region until its predecessor reaches the junction. Preserve the two complete mutually exclusive RNA folds and draw nucleotide detail only over the connected visible prefix.

- **20261004-operons-04 (P2)**: Across p=.2±1e-6 the DNA phosphate maximum displacement is .42720 world units. In high-Trp/normal-charging termination, p=.96±1e-6 yields .47891 displacement when the opening abruptly vanishes. The moving schematic transcription bubble changes from fully closed to fully open or back in one state switch; downstream integrated twist also changes instantly. This is a measurable internal-stage jump rather than the intentional player restart.
  Fix: Drive bubble opening/closure with continuous event ramps tied to loading and release, preserving the initiated-transcript framing and readthrough outcome.

Source support: [Repression is relieved before attenuation in the trp operon of Escherichia coli as tryptophan starvation becomes increasingly severe.](https://pubmed.ncbi.nlm.nih.gov/6233264/) — Primary physiological data separate free-tryptophan-dependent repression from charged-tRNA-dependent attenuation and support the severe-starvation qualification.; [Attenuation in the Escherichia coli tryptophan operon: role of RNA secondary structure involving the tryptophan codon region.](https://pubmed.ncbi.nlm.nih.gov/118451/) — Primary leader-transcript work supports alternative secondary structures within one connected trp leader RNA, coupled to ribosome behavior.

### yeastGal — confirmed_issue

Saccharomyces cerevisiae nuclear GAL1 promoter; galactose present/absent crossed with glucose low/high.

- **20261004-operons-05 (P2)**: At p=.71±1e-6 active-branch DNA phosphate displacement reaches .44414; at p=.97±1e-6 it reaches .43114. The p=.97 release also removes a 1.05535-unit visible RNA exit bridge, moving the visible growing/released end by .97020 units. Other three control branches do not transcribe. The same binary visibility coupling as lac creates large DNA torsional steps and removes visible RNA material at release. The final transcript alone is valid, but the continuous playback transition is not.
  Fix: Open/close the duplex continuously and release/reposition the connected RNA through a continuous contour transition; preserve induced-only geometry and nuclear localization.

Source support: [The Gal3p transducer of the GAL regulon interacts with the Gal80p repressor in its ligand-induced closed conformation.](https://pubmed.ncbi.nlm.nih.gov/22302941/) — Galactose plus ATP stabilize Gal3 closed state; primary complex structure supports Gal3-Gal80 interaction and release of Gal4 inhibition.; [Control of yeast GAL genes by MIG1 repressor: a transcriptional cascade in the glucose response.](https://pubmed.ncbi.nlm.nih.gov/1915298/) — MIG1 regulates GAL4 and directly GAL1; supports the explicitly scoped local GAL1 glucose-repression layer.; [Structural basis of transcription: an RNA polymerase II elongation complex at 3.3 A resolution](https://www2.rcsb.org/structure/1I6H) — Primary structural reference for continuity between synthesized RNA and its polymerase-bound growing end; polymerase-family-specific protein architecture is not transferred to the bacterial schematic.

### yeastOsmoregulation — confirmed_issue

Saccharomyces cerevisiae Sln1 branch response to moderate high osmolarity versus unchanged conditions, crossed with normal/nonphosphorylatable Hog1.

- **20261004-operons-06 (P1)**: Glycerol groups remain in fixed world positions while only the plasma membrane shrinks/re-expands. In high-osmolarity/normal-Hog1 at p=.835, glycerol index 10 appears at [-2.3,-1.85,.08] while membrane scale is .876545. One actual atom center has outer-leaflet elliptical radius squared 1.06370; its rendered molecular surface reaches 1.10326. Values >1 put it outside the outer membrane ellipse, not in the cytoplasm. It remains partly outside until about p=.88. The scene labels these accumulating molecules as cytoplasmic glycerol retained by closed Fps1, but a newly produced molecule appears on/across the closed plasma membrane elsewhere. The fixed cell-wall outline does not make this location cytoplasmic.
  Fix: Keep every visible glycerol molecule and its full geometry inside the current inner leaflet during shrinkage/recovery, by using cell-relative positions or a validated interior arrangement; preserve molecular scale/details and controls.

Source support: [Yeast HOG1 MAP kinase cascade is regulated by a multistep phosphorelay mechanism in the SLN1-YPD1-SSK1 "two-component" osmosensor.](https://pubmed.ncbi.nlm.nih.gov/8808622/) — Primary Sln1-Ypd1-Ssk1 phosphorelay work supports ordered sensors/kinases and cellular compartments.; [Regulated nucleo/cytoplasmic exchange of HOG1 MAPK requires the importin beta homologs NMD5 and XPO1.](https://pubmed.ncbi.nlm.nih.gov/9755161/) — Primary localization experiments distinguish phosphorylation-dependent Hog1 import from catalytic activity and show transient nuclear accumulation with export.; [Fps1, a yeast member of the MIP family of channel proteins, is a facilitator for glycerol uptake and efflux and is inactive under osmotic stress.](https://pubmed.ncbi.nlm.nih.gov/7729414/) — Primary Fps1 experiments show stress-associated closure can occur without HOG and adaptation depends on intracellular glycerol accumulation.

## Verification and limits

- `node src/processes/modules/operons/refinementSmoke.mjs`: PASS all 16 combinations; finite geometry/instance buffers, deterministic seeks and stable resource inventories.
- `node docs/qa/process-review-2026-10-04/evidence/operons/diagnostic.mjs`: PASS general resource checks over 1,616 samples; defect measurements retained in `diagnostic.json`.
- `glycerol-boundary.json` records actual atom-center and surface bounds beyond the shrinking outer leaflet.
- Both-language metadata, stages, controls, labels and shared condition notes were read. GAL causal movement was evaluated conservatively; no unsupported claim that Gal3 must contact DNA-bound Gal80 before any dissociation was made.
- Sources were opened, and primary abstracts were read through Europe PMC where PubMed delivery was truncated. Full API records remain local artifacts.
- No browser, full-workspace tests, performance benchmark, publication or physical-device claim. Root owns rendered continuous-playback acceptance.
- Product/test files remain unchanged pending root Phase B release.
