# RNA / intracellular transport · Phase A · 2026-10-04

Baseline `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and tests were not edited. Four models, 14 registered root/condition configurations reviewed. One confirmed issue; three qualified passes. Phase B remains gated on integrator release.

| Model | Actual roots | Conditions | Verdict |
| --- | --- | --- | --- |
| rnaProcessing | cell, plant | none | qualified_pass |
| nuclearTransport | cell, plant, yeast | NLS exposed / masked | qualified_pass |
| motorTransport | cell | kinesin / dynein × ATP available / depleted | confirmed_issue |
| organelleImport | plant | transit present / absent | qualified_pass |

## Confirmed issue

**20261004-rna-01 · P1 · Dynein's supporting stalks do not touch the microtubule.** In `src/processes/modules/rna/motorTransportProcess.js:391-398`, each stalk ends at y=-0.42, z=±0.13 with radius 0.044. Exact distances to the rendered tubulin triangle surfaces at 14 planted-head states are 0.05166–0.08182. Even subtracting the full stalk-radius envelope leaves **0.00766–0.03782** of clearance. At rest both tips are separated. Existing tests show that the supporting foot stays fixed, but never test attachment to the track.

Repair should add/position real terminal binding geometry against the actual track surface while retaining the existing dynein ring/stalk architecture, variable gait, backward event, ATP condition and deterministic seeks. Regression must measure real transformed surfaces through all planted intervals and confirm swing detachment/rebinding. Primary motor evidence: [Elshenawy et al. 2019](https://pubmed.ncbi.nlm.nih.gov/31501589/), retrieved live; variable dynein stepping is supported and is not the defect.

## Qualified passes and limits

- **RNA processing:** 1,005 progress values per root verify covalent exon/intron and branch junctions; first-step lariat intermediate retains exon 2 until ligation. Cap, 3′ cleavage and poly(A) direction agree with bilingual text. [Fica et al. 2017](https://pubmed.ncbi.nlm.nih.gov/28076345/) supports conserved two-step topology, not an exact animal/plant spliceosome shape. Transient enzyme visibility and segment-by-segment poly(A) growth still need rendered playback review.
- **Nuclear transport:** all three roots and both NLS branches reviewed. All pore sections retain distinct joined leaflets. Supplemental actual-vertex checks include cargo, importin α/β and Ran: maximum radial envelope-slab extent is 0.90011 against a conservative minimum leaflet radius of 0.905. Ran-dependent unloading, β recycling and cytosolic hydrolysis are ordered correctly; omitted α/CAS recycling is stated. [Schuller et al. 2021](https://pubmed.ncbi.nlm.nih.gov/34646014/) and [Lee et al. 2005](https://pubmed.ncbi.nlm.nih.gov/15864302/) support architecture and receptor disassembly. Generic geometry is not a species-specific atomic fit.
- **Chloroplast import:** both transit conditions reviewed; actual visible chain vertices stay within radius 0.15468 in membrane slabs versus 0.43 pore radius. N-terminus enters first, mature-chain continuity is retained, cleavage precedes folding, and absent-transit cargo stays outside. [Liu et al. 2023](https://pubmed.ncbi.nlm.nih.gov/36702157/) is explicitly algal architecture evidence; [Richter and Lamppa 1999](https://pubmed.ncbi.nlm.nih.gov/10508853/) supports transit-peptide cleavage. Motor identities, precise receptor contacts and atomistic folding are outside this functional schematic.

## Evidence

- `evidence/rna/refinement.log`: all four existing module smoke/refinement checks pass.
- `evidence/rna/science.log`: existing actual RNA linkage, nuclear pore and motor gait regressions pass.
- `evidence/rna/diagnostic.mjs` / `.json`: 401 samples per configuration, six irregular seek sequences, stable resources and exact triangle-based dynein contact measurements. All 14 configurations remain finite, deterministic and resource-stable.
- `evidence/rna/clearance.mjs` / `.json`: receptor/cargo membrane clearance at 201 frames per NPC configuration; actual peptide membrane clearance at 301 frames per import condition.
- `evidence/rna/primary-*.json` and `sources.json`: live primary-paper metadata/abstracts. Nature/NCBI sometimes returned cookie or recaptcha errors; successful Europe PMC primary abstract retrieval is recorded separately and no inaccessible full text is represented as read.

All stages, boundary formulas, terminal states, bilingual entries/introductions/labels/controls and shared condition notes were read. No model has additional specialized roots in `processesByRoot`. Visibility switches were inspected without treating every appearance/disappearance as a defect. Numeric sampling and existing regressions do not constitute rendered, continuous-playback, physical-device or performance acceptance.
