# neurons — Phase A independent scientific audit

Coverage: all four entries; every bilingual stage, both conditions per model, and every declared root (`cell` for the three specialized mammalian scenes, `paramecium` for cilia). No additional root contexts exist. Reviewed helpers and actual update formulas, sampled 26 boundary/midpoint/end states per model, and inspected the four supplied representative screenshots. Product files were not changed.

**Result: 3 confirmed-issue models, 1 qualified pass, 0 unresolved. Findings: 3 P1 and 1 P2.** Technical finiteness and earlier visual refinement are not scientific approval.

## actionPotential — qualified_pass · high confidence

The local Na/K crossing directions, earlier brief Na opening, later longer K opening, refractory region, regenerated left-to-right excitation, and inactive no-stimulus condition agree with the scene's neuronal scope. Magnification follows one fixed region instead of carrying ions along the axon. The opened [NCBI action-potential chapter](https://www.ncbi.nlm.nih.gov/books/NBK546639/) supports these checks. Voltage traces, leak/pump maintenance and molecular distinction between resting-closed and inactivated gates remain abstractions; no confirmed reversal or causal error found.

## synapse — confirmed_issue · high confidence

- **neurons-01 / P1 — AMPA topology uses a voltage-gated-channel template.** `structural.js:96–109` creates six full membrane-spanning helices in each of four domains even when `receptor=true`; `synapseProcess.js:265–273` uses this for AMPA. Receptor mode only adds external lobes. Replace this branch with three membrane spans plus a cytoplasmic-side M2 re-entrant loop per AMPA subunit, preserving a four-subunit pore and extracellular binding clefts. Verify membrane crossing count and orientation against [RCSB 3KG2](https://www.rcsb.org/structure/3KG2) and the opened [GluA1/A2 structural study](https://www.nature.com/articles/s41467-026-71063-1).
- **neurons-02 / P1 — receptor opens before its displayed ligand arrives.** `synapseProcess.js:362–364,384–409` opens AMPA and starts Na influx at `p=.56`; the nearest glutamate is still approximately `0.396` model units from any upper binding-lobe center, beyond the maximum combined lobe/ligand radii of `0.160`. Derive opening from cleft occupancy or reschedule diffusion. Invariant: displayed AMPA opening/current requires an already bound extracellular ligand. The opened [Chemical Synapses chapter](https://www.ncbi.nlm.nih.gov/books/NBK11009/) establishes the binding-before-gating sequence.

Correct aspects: Ca enters the presynaptic side; calcium block prevents fusion and release while allowing the incoming signal. Glutamate exits through the fusion opening and does not enter the postsynaptic dendrite through AMPA. Lateral glial uptake is consistent with the opened [Glutamate chapter](https://www.ncbi.nlm.nih.gov/books/NBK10807/). Persistent omega shape and omitted retrieval remain accepted abbreviations.

## muscle — confirmed_issue · medium confidence

**neurons-03 / P2 — nucleotide marker ignores condition and does not identify state.** `muscleProcess.js:298–304` hides the purported nucleotide-state markers during `.43–.65` even under low Ca, while the heads remain inactive/primed. The same gold object represents ATP and ADP+Pi without differentiation. Use explicit state-linked labels/colors and retain the comparison's stable primed state. Verify the active sequence separates nucleotide release, ATP-driven detachment and hydrolytic reprime, and that low Ca does not replay active-branch marker changes. See the opened [ATP and muscle-contraction explanation](https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation).

Core mechanics pass: thin filaments translate inward without shortening; Z discs move with them; opposing head rotations agree with inward sliding; ATP detachment precedes reset; final shortened length does not spontaneously recover. The synchronized single-cycle simplification is disclosed. This finding concerns state communication, not a reversed power stroke.

## ciliaryMotion — confirmed_issue · high confidence

**neurons-04 / P1 — bending stretches doublets instead of implementing sliding.** `ciliaryMotionProcess.js:343–381` offsets every tube from the same constant-length centerline using identical material sample indices. There is no doublet-specific longitudinal displacement. Direct geometry measurements show first/fifth complete A-tube axial lengths changing from `4.400/4.400` at rest to `4.6582/4.1574` at `p=.70`; preserving the central axis length is insufficient. Neighbor stalk endpoints also use the same material index (`429–436`). Reparameterize each doublet by conserved arc length with curvature-dependent relative sliding, and track adjacent-tubule contact. Invariant: individual doublet length and material repeat spacing remain constant while relative longitudinal registration changes during bending.

The opened [Molecular Motors chapter, cilia section](https://www.ncbi.nlm.nih.gov/books/NBK26888/) supports the sliding mechanism. Nine A/B doublets plus two central singlets, basal anchoring, ATP-arrest comparison and nonbacterial scope are otherwise consistent. The opened [Paramecium review PDF](https://epscor.w3.uvm.edu/judy/documents/NovelInsights.pdf) confirms organism-specific 9+2 scope. The model is qualitative regarding beat asymmetry and hydrodynamics.

Legacy PMC links that returned challenges were not treated as verified full-text evidence. Successful Bookshelf, RCSB, primary Nature Communications and university-hosted PDF pages are recorded in the JSON. No live browser was used. Full fixes and acceptance invariants are in `neurons.json`; Phase B must wait for global reconciliation.
