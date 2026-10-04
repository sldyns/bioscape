# yeastLife — independent Phase A audit, 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. All four registered IDs audited; all use only `yeast` root. Seven total condition scenarios. **4 confirmed-issue models, 8 issues: 4 P1 and 4 P2.** No product/test changes.

Existing focused science and smoke tests pass; the new geometry and motion diagnostics expose gaps those tests do not cover. Complete measurements: `../evidence/yeastLife/diagnostics.json`; reproducible diagnostic script: `../evidence/yeastLife/diagnose.mjs`.

## Coverage and evidence

All bilingual intros/stages/control labels/labels/legends, roots and condition notes were read. All piecewise timeline expressions and visibility/modulo switches were traced. Every condition was exercised by the module smoke. Source access limitations and successful primary full-text mirror retrievals are recorded in JSON. No rendered acceptance claimed.

## yeastBudding — confirmed_issue

S. cerevisiae vegetative budding; ploidy intentionally unspecified and conserved by mitosis; no controls.

### 20261004-yeastLife-01 · P1 · nuclear-compartment geometry

Code: `src/processes/modules/yeastLife/yeastBuddingProcess.js:83-99; 211-230; 305-309`.

The three visible chromatin tubes are stretched only along x while the nuclear neck narrows radially. At p=.749, 288/1971 actual tube vertices exceed the full underlying nuclear-envelope profile; maximum radial excess is .202961 scene units. The failure is already present at p=.65 (45 vertices) and is not the intentional front cutaway.

The persistent chromosome/chromatin representation crosses out of an envelope explicitly described as intact closed mitosis. DNA bead fitting does not constrain the separate detailed chromatin tubes.

Repair invariant: Measure actual chromatin tube vertices against actual envelope cross sections over .60-.76, including irregular seeks and the daughter handoff; assert containment with margin and inheritance rather than checking only DNA beads.

### 20261004-yeastLife-02 · P1 · cytoplasmic-compartment geometry

Code: `src/processes/modules/yeastLife/yeastBuddingProcess.js:128-138; 295-298`.

Cables are fixed curves extending to local x=1.4 and y=+/-.45; update changes only x scale. At p=.2, 112/1170 cable vertices are outside the underlying cell envelope (max radial excess .29915). At p=.12001 the cable ends extend beyond the small bud axial bound.

Actin cables supporting polarized intracellular transport must remain within the connected mother-bud cytoplasm; the visible early cable runs into extracellular space rather than following the expanding bud.

Repair invariant: Sample all rendered cable vertices through early growth, especially .12-.30, against actual mother and daughter plasma-membrane profiles; verify smooth growth and finite/stable geometry inventories.

Sources: [Nuclear envelope morphology constrains diffusion and promotes asymmetric protein segregation in closed mitosis](https://pmc.ncbi.nlm.nih.gov/articles/PMC3384416/), [Timely Endocytosis of Cytokinetic Enzymes Prevents Premature Spindle Breakage during Mitotic Exit](https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1006195), [Role of actin and Myo2p in polarized secretion and growth of Saccharomyces cerevisiae](https://pubmed.ncbi.nlm.nih.gov/10793147/)

Limits: Chromosome counts and timing are schematic. Nuclear replacement at p=.75 and onset of cytoplasmic anatomy still require rendered visual review after containment corrections. No browser review, full-workspace tests, performance benchmark, commit or deployment performed. Phase A product and tests are unchanged.

## yeastFermentation — confirmed_issue

S. cerevisiae cytosolic EMP glycolysis/alcoholic fermentation; high glucose, anaerobic and aerobic controls; two ATP from glycolysis and NAD regeneration schematic.

### 20261004-yeastLife-03 · P1 · carbon-lineage conservation

Code: `src/processes/modules/yeastLife/yeastFermentationProcess.js:169-213`.

The initial chain is object indices 0-1-2-3-4-5. At the final frame indices 0 and 3 become CO2, while ethanol retains pairs 1-2 and 4-5. Thus one terminal glucose carbon becomes CO2 and one central cleavage carbon remains ethanol. This is wrong whichever end of the initial chain is called C1.

EMP fermentation releases original glucose C3/C4 as CO2 and retains C1/C2 and C5/C6 in ethanol. This scene explicitly promises carbon-fate tracking with preserved connectivity; all six atoms surviving is insufficient if the identities take the wrong products.

Repair invariant: Track actual six mesh identities from initial chain adjacency to final C-C bonds/CO2 oxygen bonds under both oxygen conditions. Require CO2 identities to equal the two atoms of the initially broken middle bond and retain six unique carbons throughout.

Sources: [The intramolecular 13C-distribution in ethanol reveals the influence of the CO2-fixation pathway and environmental conditions on the site-specific 13C variation in glucose](https://onlinelibrary.wiley.com/doi/10.1111/j.1365-3040.2011.02308.x), [Nonstatistical 13C distribution during carbon transfer from glucose to ethanol during fermentation is determined by the catabolic pathway exploited](https://pubmed.ncbi.nlm.nih.gov/25538251/)

Limits: The model omits full atoms, glycolysis intermediates, respiratory branch and quantitative flux. Chemical symbol visibility is an intentional state change; no claim of atomistic reaction kinetics. No browser review, full-workspace tests, performance benchmark, commit or deployment performed. Phase A product and tests are unchanged.

## yeastMating — confirmed_issue

S. cerevisiae a/alpha haploids through plasmogamy and karyogamy; compatible and same-type a/a controls; no mating-type switching.

### 20261004-yeastLife-04 · P2 · visible-motion discontinuity

Code: `src/processes/modules/yeastLife/yeastMatingProcess.js:244-251; 271-279`.

At p=.25, visible vesicles cross a modulus boundary and move 1.62060 scene units with radius .06 unchanged. A pheromone wrap at p=(1-6/7)/1.8 moves 1.099998 units with radius .055 unchanged. Both objects are visible immediately before and after the jump.

The fully visible particles teleport across the scene during continuous playback; the issue is an actual finite screen-space trajectory jump, not the existence of a schematic flow loop.

Repair invariant: Sample both sides of every active modulus boundary in the compatible branch; require opacity/size to tend to zero as the positional reset occurs. Check same-type branch remains inactive.

### 20261004-yeastLife-05 · P2 · visible-motion discontinuity

Code: `src/processes/modules/yeastLife/yeastMatingProcess.js:224-229`.

The condition opening >= 1 changes the left MT endpoint from x=-.66 at p=.619999 to x=.13 at p=.62, with y=0/z=.53 and fixed .025 radius; the right side mirrors this .79-unit instant elongation.

A cytoplasmic microtubule visibly snaps across the connection when the opening finishes. The current containment assertions sample on either side but do not detect the sudden growth.

Repair invariant: Actual MT cylinder endpoints sampled around .62 must have a displacement converging to zero as time step shrinks; retain cell and nucleus containment tests for the entire interpolation.

### 20261004-yeastLife-06 · P2 · condition identity / bilingual legend consistency

Code: `src/processes/modules/yeastLife/yeastMatingProcess.js:103-124; 222; 243; 310-315; legend`.

For partner=same the labels become a/a and right chromosome beads change to teal, but mating-inherited-chromatin-1 retains rose tubes (#b68190) while the legend still identifies rose as alpha-parent/alpha-factor. Both inherited chromatin groups stay visible.

The negative-control nucleus simultaneously shows a-type beads and alpha-coded inherited chromatin. This is an important mismatch between the condition, object identity and color explanation.

Repair invariant: Inspect real tube materials in both inherited-chromatin groups through both conditions and repeated toggles; require same a identity in a/a and separate parental colors in compatible mating.

Sources: [Nuclear fusion during yeast mating occurs by a three-step pathway](https://pmc.ncbi.nlm.nih.gov/articles/PMC2080914/)

Limits: Nuclear-envelope double-bilayer fusion is shown as a coarse topology transition, not the resolved three-step molecular pathway; morphology at p=.77 requires integrator visual review. No browser review, full-workspace tests, performance benchmark, commit or deployment performed. Phase A product and tests are unchanged.

## yeastSporulation — confirmed_issue

S. cerevisiae a/alpha diploid meiosis and representative four-spored ascus; starved+acetate and rich controls; one homolog pair and ordered wall compartments.

### 20261004-yeastLife-07 · P1 · SPB / spindle / membrane attachment

Code: `src/processes/modules/yeastLife/yeastSporulationProcess.js:238-245; 310-315; 359-360; prosporeMembrane 75-84`.

MII spindle endpoints remain at z=.02 and y=+/-(.25+1.45*mii)/2. The four visible SPB spheres are fixed at y=+/-.82,z=-.37. Their nearest spindle endpoint gaps are .77287 at p=.52, .45665 at .60, and .39115 at .67/.71, much greater than SPB radius .08. The nascent membrane cup basal pole is z=-.64, a further .27 from the SPB center.

The illustrated organizing bodies are detached from the actual spindles and nascent membrane site, obscuring the SPB-based nuclear-envelope/meiotic-outer-plaque origin explicitly described by the scene.

Repair invariant: Assert actual MII cylinder endpoints meet SPB geometry and actual SPB sites are anchored at the common NE surface throughout MII; assert the initial PSM nucleation site adjoins the outer plaque before growth. Use triangle-surface or analytically exact surface constraints, not nearest arbitrary vertices.

### 20261004-yeastLife-08 · P2 · visible-motion discontinuity

Code: `src/processes/modules/yeastLife/yeastSporulationProcess.js:362-370`.

At p=2/3 the active vesicle with index 8 resets its modulo parameter from almost 1 to 0, jumping .838151 scene units while remaining visible with radius .047. Additional wraps occur across q=.59-.82.

Secretory vesicles visibly teleport from the growing membrane back into cytoplasm during playback instead of undergoing an unobtrusive replenishment transition.

Repair invariant: Check every active modulo boundary and .59/.82 activation edges under starved conditions for vanishing visible extent at reset; rich condition remains inactive and arbitrary seeks deterministic.

Sources: [Recruitment of the lipid kinase Mss4 to the meiotic spindle pole promotes prospore membrane formation in Saccharomyces cerevisiae](https://pmc.ncbi.nlm.nih.gov/articles/PMC10092644/)

Limits: Recombination is a stated color-exchange schematic; it is not a molecular trajectory. Common-envelope handoff at p=.8 and sequential opaque wall appearance require rendered review; no claim of smoothness acceptance based solely on metadata or unit tests. No browser review, full-workspace tests, performance benchmark, commit or deployment performed. Phase A product and tests are unchanged.

## Local checks

- `node src/processes/modules/yeastLife/science.test.mjs`: PASS (historical seven issue assertions).
- `node src/processes/modules/yeastLife/smoke.mjs`: PASS (all four IDs / all controls).
- `node docs/qa/process-review-2026-10-04/evidence/yeastLife/diagnose.mjs`: new defect measurements saved.

Awaiting integrator release of Phase B.
