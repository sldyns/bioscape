# bacterialSignals — Phase A scientific audit

Independent reviewer: `p_bacterial_core`. Product files remain unchanged. Covered **4/4 registered IDs**, their six bilingual stages, both controls, all geometry/update helpers, and supplied representative screenshots. Read-only Node sampling included stage boundaries, intermediate transfer/activation frames and endpoints. Numerical execution was used to inspect geometry/state, not as scientific approval.

**Verdicts: 4 confirmed_issue, 0 qualified_pass, 0 unresolved. Findings: 5 P1, 0 P0/P2.** Findings 03 and 04 share one helper defect and should receive one implementation fix.

| Model | Main result | Confidence |
| --- | --- | --- |
| chemotaxis | **01:** run helices are right-handed; no filament reverses rotation during the purported CW tumble. | High |
| twoComponent | **02:** free-flying, briefly duplicated phosphate replaces a NarX–NarL encounter. **03:** mirrored DNA in shared transcription helper. | High |
| quorumSensing | **04:** mirrored DNA in the same helper. The specified LuxI/AHL/LuxR branch, retention/dilution distinction and conditional light output are otherwise coherent. | High |
| biofilm | **05:** extracellular DNA helices are mirrored. The selected PAO1/Psl/NO pathway and partial dispersal remain appropriately qualified. | High |

## chemotaxis — bacterialSignals-01

`chemotaxisProcess.js:303–321` uses the same phase `t*36+p*32+f` during runs and tumbles. Only spreading and cell wobble change. Along the posterior tail, decreasing x with y=sin(phase), z=cos(phase) gives **right-handed** helices; signed derivative analysis confirms the sign. `motorState` labels do not describe the actual geometry.

[Darnton et al., direct imaging of E. coli flagella](https://pmc.ncbi.nlm.nih.gov/articles/PMC1855780/) reports normal left-handed run filaments and reversal-associated unbundling/polymorphic changes. Fix the normal handedness and continuous motor phase; reverse selected motors during tumbles with appropriate reassembly. Verify chirality and signed angular velocity from geometry, preserving motor-hook continuity. The experiment also reports rare reversals without a handedness change, so the fix must not turn that association into an absolute rule.

Che signaling direction and adaptation caveat are coherent in both languages. The fixed tracks are explicitly examples, not measured or deterministic navigation rules.

## twoComponent — bacterialSignals-02 and 03

**02 — direct transfer becomes a phosphate courier.** `twoComponentProcess.js:229–251` moves phosphate across roughly 2.5 scene units while NarL stays remote from NarX. At p=.54 the phosphate is (-.86,-.5,.35), between the proteins; at p=.62–.63 both the transit marker and NarL-bound marker are visible. [NarX primary structural work](https://pmc.ncbi.nlm.nih.gov/articles/PMC3749045/) supports ATP-dependent His phosphorylation followed by transfer to the response-regulator Asp. Model a protein encounter and one conserved phosphoryl marker, then regulator departure toward DNA. Verify contact distance and exclusive marker ownership, including the .62 transition.

**03 — regulatory DNA is left-handed.** `structuralDetails.js:170–177` produces `(x,sin(kx),cos(kx))` outside the opening bubble. This is a left-handed helix in the scene's right-handed coordinates. [NLM's B-DNA definition](https://www.ncbi.nlm.nih.gov/mesh/68059371) identifies the ordinary right-handed form; [NarL–DNA structural evidence](https://www.rcsb.org/structure/1JE8) does not justify mirroring the complete duplex. Reverse one transverse sign consistently and verify signed torsion at unperturbed spans in both conditions.

Periplasm/cytoplasm placement, nitrate specificity, ATP→ADP marker count, His→Asp order, anaerobic/FNR scope and omission of basal activity are otherwise correctly qualified. Exact NarL oligomerization/contact geometry remains schematic.

## quorumSensing — bacterialSignals-04

Same `transcriptionDetail.point()` handedness defect as 03; fix once in the owned shared helper, checking both consumers. RNA itself is a single wavy strand and is not a disguised DNA duplex.

[Urbanowski et al.'s primary LuxR experiments](https://pubmed.ncbi.nlm.nih.gov/14729687/) verify ligand-dependent lux-box binding/transcription and reversible dilution effects. [The opened LuxI–LuxR primer](https://pmc.ncbi.nlm.nih.gov/articles/PMC10569067/) supports the model's explicit need for other permissive conditions. LuxI is cytoplasmic, LuxR is a soluble regulator, the signal identity is specific, and the two branches retain the same population size. Added LuxI and halos are qualitative feedback/output symbols, not calibrated kinetics or intensity. No additional unconditional AHL-to-light claim was found.

## biofilm — bacterialSignals-05

`biofilmProcess.js:280–304` independently repeats the mirrored `(increasing x,sin(angle),cos(angle))` construction for all six eDNA fibers. Correct one transverse sign while preserving paired links and extracellular placement. Verify each backbone's chirality after maturation and during partial dispersal under both controls.

[Primary Psl matrix imaging](https://pubmed.ncbi.nlm.nih.gov/19325879/) and [primary NO/PDE/c-di-GMP work](https://pubmed.ncbi.nlm.nih.gov/19801410/) support the named case. Heterogeneity is limited but not falsely erased: only cells 12/15/18/20 leave; the other 20 representative cells remain, and local matrix persists. Tracing the fiber graph confirms all four leavers' incident modeled Psl links are removed. The no-cue branch remains attached. Metabolic gradients, dormancy, lysis and eDNA production are omitted, which should remain an explicit abstraction rather than a claim that they do not occur.

## Boundary

This is a pre-fix audit. No model, shared renderer, thumbnail or product test file was changed, and no browser was operated. Existing screenshots represent p=.55 only; all-stage conclusions come from formulas and read-only geometry evaluation. Precise protein folds, molecular counts and kinetic rates have not received structural or experimental validation. JSON contains individual fixes and verification invariants for Phase B reconciliation.
