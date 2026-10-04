# yeastLife Phase B resolution

**Frozen for integrator render review.** All eight Phase A findings, four supplementary label findings, and the rendered R05 nuclear handoff are fixed in the owned module. All four IDs and all seven registered yeast-root condition scenarios are covered. Original Phase A is unchanged.

## Changes

- Budding: inherited chromatin plus histone detail follows the closed nucleus; actin and carriers remain within the growing mother/bud PM.
- Fermentation: correct original carbon identity through the first-triose turn and decarboxylation; named-compound labels follow the actual bond state.
- Mating: smooth carrier recycling and MT extension; same-type chromatin identity; leaders attached to real cell/nuclear surfaces.
- Sporulation: exact NE/SPB/spindle and nascent-membrane attachments; cups remain outside the common nucleus, then finish wrapping after partition; smooth carrier resets.
- All four models: named annotation anchors track geometry and conditional visibility, with deterministic label arrays.

## Issue accounting

### 20261004-yeastLife-01 — fixed

Replaced the across-neck chromatin decoration with two persistent inherited populations. Their detailed tubes and 54 histone beads fit the current nuclear lumen; the same objects enter daughter nuclei. The common-envelope profile approaches the daughter contours before partition.

Verification: Actual chromatin tube and histone vertices fit the inner nuclear-envelope profile through .65/.68/.70/.72/.74/.74999 and daughter ellipsoids after .75. Inherited groups retain identity through the nuclear handoff and arbitrary seeks. Historical SPB-to-envelope and spindle-end assertions retained and passing.

### 20261004-yeastLife-02 — fixed

Preallocated actin tubes now deform along the actual growing mother/bud plasma-membrane profiles. Secretory carriers use the same intracellular routes and narrow smoothly at the neck.

Verification: Actual cable and carrier vertices are contained by the real PM profiles across early growth, including .075/.09/.105/.12001/.15/.20/.24/.28. Tube allocations occur once; update only mutates positions/normals/bounds.

### 20261004-yeastLife-03 — fixed

The first triose turns continuously in depth while retaining atom identities. Initial glucose indices 2 and 3 now become CO2; pairs 0-1 and 4-5 remain in ethanol.

Verification: Both oxygen conditions preserve the six original carbon mesh objects. Real C-O bond endpoints identify final CO2 carbons as [2,3]; final C-C bonds retain [0-1,4-5]. Corrected the prior literal expected edge 1-2 to 0-1 and strengthened it with initial-carbon identity checks; all other historical constraints are retained.

### 20261004-yeastLife-04 — fixed

Pheromones and secretory vesicles taper to zero size around each modulo reset and at the end of their active stages.

Verification: Every active repeat boundary is sampled on both sides; any position reset greater than .1 units requires visible extent below 1e-6. Same-type control remains inactive and resource inventory remains fixed.

### 20261004-yeastLife-05 — fixed

After membrane opening, MT tips extend continuously into the shared cytoplasm over .62-.655 instead of jumping .79 scene units.

Verification: Actual cylinder endpoint changes at .62/.625/.635/.645/.655 converge below 2e-5 for a 2e-7 progress step. Existing cytoplasmic, cell-containment and NE anchor regressions remain passing.

### 20261004-yeastLife-06 — fixed

All inherited right-parent chromatin tubes now use the selected parental identity: teal in a/a, rose in compatible a/alpha. Existing chromosome beads and labels remain consistent.

Verification: Actual tube materials checked in same -> compatible -> same control toggles, with both parental populations retained.

### 20261004-yeastLife-07 — fixed

MI/MII spindle ends and SPBs share exact barycentric nuclear-surface anchors. Nascent PSM cups adjoin those anchors and retain a visible attachment as they grow; forward wrapping completes after nuclear partition so inner/outer cups avoid the common NE.

Verification: SPB centers lie within 1e-5 of actual NE triangles across MI, remodeling and MII. Actual spindle cylinder endpoints coincide with their SPBs. Initial PSM basal vertex is .06 units from its .08-radius SPB on the cytoplasmic side. Actual inner/outer cup vertices remain behind the common NE surface at .59001/.6/.65/.7/.74/.78/.799. Persistent spore PM, nucleus inclusion, early intermembrane wall layers and mature layer order historical checks pass.

### 20261004-yeastLife-08 — fixed

Secretory vesicles taper to zero before each reset and as the stage begins/ends; their node identities and routes remain deterministic.

Verification: Every active modulo reset in .59-.82 is sampled on both sides and has vanishing visible extent. Rich nutrient control remains inactive.

### 20261004-yeastLife-R01 — fixed

Mother, bud, neck and nuclear-envelope leaders now terminate on actual current surface vertices and follow growth/partition/separation.

Verification: Actual vertex-to-label distance below 1e-6 at 11 timeline samples; active targets are visible. Label arrays keep their identity and values are deterministic on irregular seeks.

### 20261004-yeastLife-R02 — fixed

Named metabolite/cofactor/enzyme leaders now target persistent real mesh positions. Glucose, pyruvate, acetaldehyde, ethanol and CO2 labels follow actual bond-state visibility; a neutral glycolysis-carbon label covers the omitted intermediate steps.

Verification: Both oxygen conditions checked at 15 timeline samples. Leaders agree with real carbon, cofactor, ATP, environmental O2 and enzyme domain centers to 1e-6. Named compound visibility is derived in the regression from actual C-C/C-O/double-bond/hydroxyl visibility, rejecting premature ethanol and CO2 labels. Active labels never target hidden geometry; deterministic labels and stable position arrays verified.

### 20261004-yeastLife-R03 — fixed

Parental type, local fusion, nuclear-congression and zygote leaders now follow actual cell/nuclear envelope vertices. The congression anchor reaches the parent contact point before following the fused neck.

Verification: Both mating conditions checked at 10 samples including .76999/.77 nuclear handoff. Leaders agree with actual vertices to 1e-6; active targets visible; deterministic labels verified.

### 20261004-yeastLife-R04 — fixed

Chromosome action leaders follow inherited centromeres, PSM follows its actual growing leading edge, and mature-spore annotation follows the visible wall. The diploid caption explicitly identifies the starting state in both languages.

Verification: Both nutrient conditions checked at 13 samples, including cup closure and sequential wall deposition. Active named leaders match real centromere/membrane/wall targets to 1e-6 and do not outlive visible targets. Bilingual starting-state wording and deterministic labels verified.

### 20261004-yeastLife-R05 — fixed

Replaced z-only flattening with a real deforming four-lobed nuclear lumen and shrinking connecting necks. The paired membrane surfaces approach the actual daughter surfaces before partition; SPB/PSM anchors still use real indexed triangles. Fixed preallocated-buffer snapshots to retain every scalar without a spread-argument overflow.

Verification: Same new R05 assertion fails against saved old source: common surface must converge to real daughter surfaces before handoff. At .799, 95th-percentile actual surface distance to daughters decreases from .5959 to .0061 units; reverse distance is .0052. Only 1.56% of equal-area samples remain >.05 units on disappearing connecting necks; surface area is 1.022 times the daughters rather than 2.618. Four actual membrane surface trajectories sampled every .001 progress across .68-.802 stay below .02 world units per step, including .8. Existing SPB/PSM nonintersection, chromosome, wall, label and all seven scenario/seek checks remain passing. Node update-only comparison retained; browser GPU/FPS and new rendered frames remain for integrator.

## Verification and boundaries

- `node src/processes/modules/yeastLife/science.test.mjs`: PASS — original regressions, eight new geometric/motion invariants, four supplementary label findings, and the R05 actual membrane surface/trajectory regression.
- `node src/processes/modules/yeastLife/smoke.mjs`: PASS — finite buffers/bounds, deterministic seeks, fixed scene/resources, all controls and standalone bundles.
- Only owned files formatted. The prior fermentation expected edge was corrected using a stronger actual-carbon identity invariant; no unrelated regression was weakened.

Logs: `../evidence/yeastLife/final-science.log`, `final-smoke.log`. Supplementary evidence: `repair-discoveries.json`, `label-anchor-before.json` and retained pre-label source fixtures. Freeze hashes: `frozen-sha256.json`.

All seven condition static-frame cases have been reviewed (79 indexed frames, 54 distinct hashes), and fresh R05 .799/.801 main membrane contours are visually closed; see yeastLife-rendered-all-cases.md. No full-suite, physical-device or deployment acceptance is claimed. Native continuous playback remains a separate integrator gate.
