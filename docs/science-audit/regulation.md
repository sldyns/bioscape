# Regulation / original transcription — Phase A scientific audit

Reviewer: `p_genome`, independent of these models’ authors. Product and test files remained read-only. Coverage: **3/3 models; 3 confirmed_issue; 0 qualified_pass; 0 unresolved. Three P1 findings.** Full checks, source observations, limits and correction invariants are in [regulation.json](regulation.json).

Read both languages, all six stages of each process, intros, controls, legends, labels, registered roots, geometry helpers and complete update functions. Inspected existing representative screenshots and measured actual mesh geometry with read-only Node imports. No browser operation; no existing smoke-test or `userData` assertion was treated as scientific proof.

## promoterRegulation — confirmed_issue, high confidence

Scope: mammalian nuclear TATA promoter; root `cell`; both intact and altered-site conditions reviewed.

**regulation-01 / P1 — RNA grows outside the displayed catalytic center.** `promoterRegulationProcess.js:263,278–290` positions the RNA 3′ end at `[.2+travel,-.14,.32]`; `geometry.js:155–161` places the catalytic sphere at Pol II local `[.03,-.18,.015]`. World-coordinate mesh sampling at p=.90 measures **0.4262 units** separation (catalytic radius .055, RNA radius .035). The RNA has no continuation into the marked catalytic region or short template-associated segment. This conflicts with the final stage’s literal molecular synthesis description. Transcribing Pol II contains a coordinated DNA/RNA scaffold in its bubble and cleft ([PDB 5C44](https://www.rcsb.org/structure/5C44)).

Fix: derive RNA 3′ and the local template trajectory from the same catalytic anchor, then route the older RNA through the exit. Verify continuity and catalytic contact during initiation/escape and reverse seeks; altered-site RNA stays absent.

Checked without another confirmed error: upstream TATA/downstream start ordering, antiparallel DNA, local bubble, TBP/TAF recognition, bilobal XPB, failed altered-site example, and single-stranded RNA. Mammalian PIC opening and TFIID loading are supported by [Aibara 2021](https://www.nature.com/articles/s41586-021-03554-8) and [Patel 2018](https://pubmed.ncbi.nlm.nih.gov/30442764/). Protein shapes remain schematic rather than atomic fits.

## enhancerRegulation — confirmed_issue, high confidence

Scope: mammalian nuclear enhancer/promoter overview; root `cell`; both coactivator settings and both RNA burst windows reviewed.

**regulation-02 / P1 — literal RNA elongation is disconnected from an unopened template.** `enhancerRegulationProcess.js:178–228` lengthens RNA while Pol II stays at a constant promoter-relative offset. `chromatinGeometry.js:175` updates every linker with default fully paired DNA; no promoter bubble appears. Actual mesh sampling at p=.68 places RNA 3′ **0.4186 units** from the catalytic center (radius .03465). This is an incorrect local transcription topology, independently of the legitimate regulatory abstraction ([PDB 5C44](https://www.rcsb.org/structure/5C44)).

Fix: show a local bubble, engaged template, active-site RNA anchor and relative progression during growth; alternatively use an explicitly abstract output indicator rather than a literal elongating molecular strand. Verify those relations during both bursts and keep identical chromatin trajectories across the control conditions.

Checked without another confirmed error: one connected nucleosomal fiber, eight-subunit cores and duplex wraps, accessible enhancer binding, differing recruitment, and no universal distance-to-expression claim. **Lack of obligatory enhancer contact was not called an error**: the Sox2 study supports separating enhancer dependence from contemporaneous proximity ([Alexander 2019](https://elifesciences.org/articles/41769)). Coarse nucleosome topology agrees with [PDB 1AOI](https://www.rcsb.org/structure/1AOI). Burst timing and whole-fiber motion are illustrative, not measured data. RNA fate between bursts remains an explicit representation limit rather than a separately proven degradation claim.

## transcription — confirmed_issue, high confidence

Scope: generic nuclear protein-coding Pol II transcription; roots `cell`, `plant`; no controls.

**regulation-03 / P1 — cleavage duplicates the near-active-site RNA segment.** `transcriptionProcess.js:249–275` retains the full main RNA at length 3.57 while enabling a second .4-long downstream RNA at p=.86. At that boundary both use exactly the same start/path, measured endpoint difference **7.7×10⁻⁸ units**. The second chain overlaps the original, then the entire original moves away without a cut or removal of its duplicated segment. The correct cleavage topology partitions one RNA into upstream and downstream products; it does not copy its terminal portion ([Eaton 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5830926/), [Larochelle 2018](https://www.nature.com/articles/s41467-018-06546-x)).

Fix: split the existing path at a defined cleavage coordinate, retain each pre-existing segment in exactly one product and extend the downstream product only with subsequent synthesis. Verify coincident cut ends at separation, no instantaneous RNA amount jump, and continued downstream 3′ anchoring, including reverse seeks around .86 and .91.

Checked without another confirmed error: antiparallel strand labels, local opening/reannealing, exposed bases attached to their own backbones, RNA 3′ anchored before cleavage, single RNA strand, downstream Pol II continuation and eventual DNA reclosure. The intro correctly restricts the mechanism to a protein-coding gene and does not equate release with mature RNA. Plant-specific termination machinery is not independently validated here and is not named in the scene.

## Evidence boundary

These are code-and-geometry-supported scientific findings, not a declaration that every camera angle or atomic fold has been validated. Some publisher/PMC links became intermittently inaccessible after successful retrieval; source observations and substitute primary evidence are recorded in the JSON. No model corrections were made; await root’s global Phase A reconciliation and Phase B authorization.
