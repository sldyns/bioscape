# phageLife Phase A audit · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product/test files unchanged. Four models; roots evaluated from live `processesByRoot`: `phage` only. Three confirmed issues (2 P1, 1 P2); one qualified pass.

All Chinese/English intros, stages, labels, controls, source lists and geometry/update intervals were read. Conditions: lytic none; lambda induce/maintain; assembly active/inactive gp21; packaging ATP present/absent.

## phageLytic — qualified_pass

Obligately lytic T4 in susceptible Escherichia coli, phage root, no condition controls.

Existing actual-triangle entry tests pass: one continuous duplex through open capsid/neck/tube/baseplate, no duplicated visitor genome. Event ordering and three-layer envelope remain internally consistent. This is a qualified overview pass, not rendered acceptance.

Continuity limits: Entry draw-range windows advance continuously to tessellation tolerance. No new proven macroscopic continuity failure was promoted for this overview. Host-DNA/visitor removal and expression/assembly population changes are stage abstractions requiring root rendered review.

## phageLysogenic — confirmed_issue

Temperate lambda in E. coli; fate=induce or maintain. Entry/circularization, integration, inheritance and one-daughter induction.

**20261004-phageLife-01 · P1 · molecular-continuity-and-conversion**

Location: `src/processes/modules/phageLife/phageLysogenicProcess.js`, lines 313–328 and 342–348; lambda genome, linearDNA, freeDNA, inserted and excised objects.

At p=.05 the residual capsid genome has minimum world y=2.43530 while the independent incoming DNA has maximum y=1.61885, leaving >=0.81645 scene units without DNA through the tail. The capsid molecule is scaled toward its origin, while the full separate linear molecule is simply enabled at p>.025. Linear and complete circular genome coexist for .1<p<.135 (1.33 s at duration 38). Complete free circle and integrated prophage coexist at .29<=p<.3; excised circle appears at .795 before the integrated segment is removed at .805.

The declared entry, circularization and site-specific recombination steps convert or transfer one genome. Independent complete-molecule swaps create unearned extra genomes and a missing tail-spanning interval; a time/shape disclaimer does not establish molecular continuity.

Repair: Use one continuous duplex transfer through the lambda tail with an open delivery lumen, then continuously close cohesive ends. Implement integration/excision as complementary, nonduplicating geometric conversions at a common recombination site; preserve both daughter prophages and the maintained branch.

Verification: Trace actual visible backbone intervals through the tail at early/intermediate entry; verify shrinking residual and growing incoming intervals are contiguous and conserve schematic contour. At .11, .295, .8 and surrounding samples reject two independent complete representations of the same genome. Re-run both daughter-fate and deterministic/resource tests.

Continuity limits: Confirmed molecular conversion discontinuities in issue 01. Right host is enabled at .51 with nonzero size and second chromosome at .5; full topology of the schematic division needs root rendering and is not claimed as a resolved fission trajectory.

## phageAssembly — confirmed_issue

T4 head/tail/fiber morphogenesis; gp21 active/inactive.

**20261004-phageLife-02 · P2 · visible-discontinuity-and-attachment**

Location: `src/processes/modules/phageLife/phageAssemblyProcess.js`, lines 201–204; tail.fibers scale/visibility and fiberPreview.

Across p=.93 +/-1e-7, six long fibers switch from invisible to a world bounding size [1.8,.7704,1.57235]. Their group is scaled by .72 around tail origin; actual fiber roots are .61233 scene units from their intended baseplate attachment. At p=.95 (mature-progeny label enabled), that root gap is still .45358 and only becomes zero at .99. Preview fibers independently remain visible through .95.

The installation step shows a macroscopic fiber set appearing in midair at substantial size and sliding its roots down to the baseplate through global scaling. That fails smooth attachment playback and temporarily contradicts the displayed mature-particle state.

Repair: Animate existing prebuilt fibers continuously from the separate assembly route into their baseplate binding positions at preserved length, or grow/reveal fibers about their actual anchored roots. Remove preview/attached duplicate transition and delay mature labeling until attachment is complete.

Verification: Sample immediately around .93 and .95; require no nonzero-size set appearance, bound root world displacement per small progress step, ensure roots coincide with baseplate when labeled attached/mature, and preserve the inactive-gp21 head block with independent tail assembly.

Continuity limits: Confirmed full-size fiber appearance and transient detached roots, issue 02. Discrete sheath rows/head panels represent component assembly; those individual additions were not alone counted as a defect.

## phagePackaging — confirmed_issue

T4 gp17 ATP-driven packaging through fixed gp20; ATP present/absent.

**20261004-phageLife-03 · P1 · DNA-handedness**

Location: `src/processes/modules/phageLife/phagePackagingProcess.js`, lines 280–307; external rails and base-pair rung positions.

The external duplex uses y increasing with i, x=.09 cos(i*.42), z=+.09 sin(i*.42). With its advancing +Y axis, (r_i cross r_(i+1)) dot axis = -0.00330285967, a left-handed helix. The same sign occurs on both antipodal backbones and is present in both ATP conditions. This differs from the common Frenet-frame duplex helper used for the packaged DNA.

The process presents ordinary double-stranded phage DNA, with no Z-DNA scope. Its exterior substrate is rendered as a left-handed helix while the standard B-DNA structural reference is right-handed. Reflection is a molecular identity error rather than a timing abstraction.

Repair: Correct the external duplex phase/orientation consistently for both rails and base-pair rungs, preferably share one right-handed path helper between external, portal and internal segments. Preserve ATP stall, cleavage, motor release and sealing behavior.

Verification: Compute signed twist from actual world-space rail endpoints around the centerline at several visible indices and progress values for both ATP conditions; require right-handed orientation and pairing. Also check the original ATP-block branch and resource/seek invariants.

Continuity limits: Signed-twist defect in issue 03 is visible throughout playback, including stalled branch. External DNA is piecewise clipped in .06204-unit segments; motor-cycle amplitude snaps at .25/.78. These remain root rendered-review targets; the current numeric check does not establish perceptual smoothness.

## Evidence and boundaries

- `../evidence/phageLife/diagnostics.mjs` and `.json`: 87–91 progress samples per condition; finite attributes/world matrices, 11 irregular seek targets per branch, stable node/geometry/material identity.
- `../evidence/phageLife/existing-science.log`: existing phageLife regression passes; it covers earlier T4 entry and lambda daughter-retention corrections, so its pass does not reject the newly identified faults.
- `../evidence/phageLife/PMC4493910.xml` and `-excerpts.txt`: retrieved primary T4 portal full text.
- No browser, rendering, full test suite, device test or performance run was performed. Geometry inventories and deterministic seeks are separate from smooth playback acceptance.

Primary evidence opened/read:
- [Cryo-EM structure of the bacteriophage T4 portal protein assembly at near-atomic resolution](https://www.nature.com/articles/ncomms8548): Primary cryo-EM: gp20 dodecamer, membrane-associated initiation, gp17 motor docking, headful motor loss before neck/tail/fiber completion; portal-capsid contacts oppose a rotating-portal depiction. Full article opened and XML preserved.
- [1BNA: Structure of a B-DNA dodecamer. Conformation and dynamics](https://www.rcsb.org/structure/1BNA): Opened primary deposited 1.9 Angstrom crystal structure and primary abstract: a right-handed double-stranded B helix; used only for the handedness invariant, not phage-specific sequence or packing conformation.
- [A structural basis for allosteric control of DNA recombination by lambda integrase](https://www.nature.com/articles/nature03657): Opened publisher abstract and figure descriptions: integrase synapses DNA and orders strand cleavage/exchange during integration and excision. Supports conversion of substrate into recombined products, not an extra complete genome.
- [Real-time observations of single bacteriophage lambda DNA ejections in vitro](https://pmc.ncbi.nlm.nih.gov/articles/PMC1976217/): Primary single-molecule experiments; retrieved scientific text identifies one duplex moving from capsid through tail into host. Full-text open was challenged; indexed primary text was readable, so access limitation is retained.
- [Structural remodeling of bacteriophage T4 and host membranes during infection initiation](https://pmc.ncbi.nlm.nih.gov/articles/PMC4568249/): Primary cryo-ET indexed text documents receptor attachment, sheath contraction, tube/periplasm and inner-membrane remodeling. Used to bound the lytic entry overview; full-text open was challenged.

Phase B remains gated on root release.
