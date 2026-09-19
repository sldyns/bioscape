# Independent peer acceptance: regulation + transcription

Reviewer: p_membrane. Read-only review of the three issue resolutions, product geometry and local tests; no product files in this group modified. Review concerns the identified scientific defects, not browser visual approval.

| Issue | Peer verdict | Evidence |
| --- | --- | --- |
| regulation-01 | Qualified pass | Actual nascent RNA tube-ring center follows the catalytic mesh, opened template stays alongside it; altered binding site produces no RNA. Independent 201-frame progress sweep: maximum visible RNA/catalytic separation 5.81e-8. |
| regulation-02 | Qualified pass | Both original linker backbones remain, base-pair bonds melt only locally before productive RNA appears, Pol II advances along template sugars, and both released RNA centerlines match their nascent predecessors. Independent sweep maximum RNA/catalytic separation 5.54e-8. At .74 RNA 1 replaces the nascent chain; at .87 a distinct second nascent chain begins while RNA 1 persists; at .99 both products persist. Impaired condition produces neither product. |
| regulation-03 | Qualified pass after peer correction | Original RNA is split at its existing .4 cut coordinate; both products meet there, combined arc length and old nucleotide positions are conserved at the cut. The full-transform termination anchor defect found below was corrected and independently rechecked. |

## Confirmed follow-up, now corrected: regulation-03 termination anchor

`src/processes/transcriptionProcess.js`: polymerase placement around lines 217–225 moves the entire enzyme upward/backward from .94. The downstream RNA path around lines 302–306 still starts at world `[center, -.39, .32]`. The existing test follows only `polymerase.position.x` and fixed world y/z, so it misses this discrepancy.

An independent geometry probe tracked the local catalytic coordinate `[0, -.47, .32]` through the actual `RNA-polymerase-II-schematic.matrixWorld`; this coordinate coincides with the downstream 3′ end at .94. Distances to the first downstream backbone segment's actual endpoint then become:

| Progress | 3′–enzyme catalytic displacement | Downstream RNA visible |
| --- | --- | --- |
| .94 | 4.86e-8 | yes |
| .95 | .05468 | yes |
| .96 | .19140 | yes |
| .97 | .36912 | yes |
| .98 | .54685 | yes |
| .99 | .68356 | yes |

The .95–.96 interval still extends the downstream transcript, so it must not lose the polymerase/template reaction relation. Reported to p_genome and root; author confirmed and corrected event order by retaining the polymerase at the template until remnant processing completes. Merely moving RNA to an enzyme that has already left the template would not resolve the causal order.

## Verification and evidence boundaries

- `node src/processes/modules/regulation/science.test.mjs`: passes updated actual-geometry checks, both controls, deterministic seeks and fixed resources, including full polymerase-transform anchoring and delayed departure.
- Independent read-only Node probes: 201-point progress sweeps for each regulatory model; both release boundaries and silent intervals; downstream RNA instance endpoint compared with full polymerase world matrix.
- Source opened: [RCSB 5C44 / Barnes et al. 2015](https://www.rcsb.org/structure/5C44). The structural record describes a transcribing Pol II complex with full bubble, RNA and separated template/non-template strands. It supports retained nucleic-acid engagement during synthesis; the record is yeast, so the mammalian regulatory scene uses it only as conserved mechanistic reference, not an atomic mammalian fit.
- The supplied Eaton et al. PMC URL returned a recaptcha challenge; the primary paper abstract and figure summaries were then opened via [PubMed PMID 29432121](https://pubmed.ncbi.nlm.nih.gov/29432121/). It supports prior cleavage and subsequent degradation of polymerase-associated RNA before efficient termination in the examined protein-coding context.

Protein folds and timings remain declared schematics. Cleavage markers are not a literal nucleotide inventory. This review did not operate the browser or claim atomic accuracy.

## Independent recheck after author correction

Author separated downstream processing (.94–.98) from enzyme departure (.98–1). A fresh 120-frame probe from .860 to .979 compared the actual downstream first-segment endpoint with the full polymerase world transform: maximum error 1.19e-7. At .98/.99/1 the downstream remnant is absent, while Pol II departs only afterward. No regulatory product file was edited by this reviewer. All three original fixes now receive qualified scientific acceptance within the stated teaching scope.
