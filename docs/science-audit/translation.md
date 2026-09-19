# Translation group — Phase A scientific audit

Read-only audit of all four entries and every declared root/control. Product code was not changed; no browser was operated. Code/formula inspection covers the full timeline; a Node run exercised 101 progress points in each of 14 root/condition combinations. The provided translation screenshot was inspected. Runtime success is not scientific approval.

| Model | Roots / controls | Verdict | Findings |
|---|---|---|---|
| translation | cell, plant, yeast, paramecium / none | confirmed_issue | 3 P1 |
| proteinFolding | cell, plant, yeast / complete, hold | confirmed_issue | 1 P1, shared cause with translation |
| alternativeSplicing | cell / include, skip | qualified_pass | 0 confirmed |
| nitrogenFixation | bacterium / protected, exposed | confirmed_issue | 1 P1 |

Five finding records, four distinct remediation topics. No P0. Full evidence, fixes and verification invariants are in translation.json.

## translation

- **translation-01, P1 — invented ribosome topology.** `molecularDetails.js:157–235` builds a thin empty bowl with six regularly spaced disconnected RNA hairpins, one transverse stem, and seven more separate stems in the small subunit. The screenshot confirms this. RNA can form helices; the problem is an empty container with decorative RNA, not “RNA must not look helical.” Actual 80S is a compact RNA–protein assembly with registered catalytic/decoding architecture. [Human 4UG0](https://www.rcsb.org/structure/4UG0).
- **translation-02, P1 — peptide detaches during transfer.** `translationProcess.js:138–177` keeps acceptor tips 1.35 units apart while interpolating the C terminus between them. At p=0.41 the endpoint is 0.675 units from either tip; the incoming amino acid simply disappears later. Rebuild L-shaped tRNAs with converging CCA ends at one PTC and animate a connected covalent transfer.
- **translation-03, P1 — peptide bypasses the exit tunnel.** At p=0.49, chain point 5 is `(1.38945,1.99,0.34365)`, 1.20575 units from a tunnel whose radius is ≤0.31 at the same height. Constrain the internal chain to a PTC-to-exit path during transfer/translocation. Primary plant structures resolve tRNA and nascent-chain placement. [Smirnova et al.](https://www.nature.com/articles/s41477-023-01407-y).

mRNA leftward movement is correct in the ribosome-fixed frame; A→P and P→E shifts have the correct relative direction. The ciliate stop-code caveat is appropriate. [NCBI code 6](https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi#SG6). End-state subunit separation is only a recycling preview, not a complete recycling mechanism.

Concrete Phase B route: reuse `src/scene/data/ribosome-4ug0-{largeSubunit,smallSubunit}.json` and the approach in `src/scene/ribosomeReference.js`. Combine datasets before calculating one center/scale/rotation and retain full original intersubunit registration. Do not normalize and position subunits separately. Use a selective cutaway of the resulting dense assembly; preserve missing-residue gaps. Human coordinates can be identified as representative in other eukaryotic roots, not relabeled as their exact structures. Then anchor tRNA CCA, decoding sites, PTC and exit tunnel in that same frame.

## proteinFolding

- **translation-04, P1 — shared false ribosome.** `proteinFoldingProcess.js:18–29` directly reuses the helper above. Fix the common assembly, then re-anchor the proximal nascent chain to its true exit mouth. This is a second affected model, not a fifth independent cause.

The Hsp70 sequence of J-protein-assisted capture, ADP retention, exchange-factor appearance and ATP-associated opening is directionally consistent. Hold/complete change geometry and endpoint. Both languages identify the final alpha/beta fold as illustrative rather than universal. [ATP-bound Hsp70 primary structure](https://www.nature.com/articles/nsmb.2583?error=cookies_not_supported), [primary client-binding study](https://www.nature.com/articles/nature20137). These studies support mechanism; they do not certify the scene’s invented eukaryotic atomic geometry.

## alternativeSplicing

**Qualified pass, medium confidence for pathway topology.** Inclusion removes introns6/7 and joins6–7–8; skipping removes the continuous exon7-containing interval and joins6–8. Branch links, donor-before-acceptor cleavage, 5′→3′ order and nuclear output are consistent. Both languages identify human SMN2 and impaired SMNΔ7; no protein is produced by the nuclear scene. [Primary SMN study, full text retrieved](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC26877/), [splicing chemistry](https://www.ncbi.nlm.nih.gov/books/NBK9864/), [SMNΔ7 stability cross-check](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6026014/).

This does not certify the generic spliceosome surface/U2–U6 icon layout as a structural reconstruction. Lariat chemistry is represented by graph connections and labels, not atoms; nearly overlapping final branch endpoints need later visual review. No definite false exon or branch connectivity was found.

## nitrogenFixation

- **translation-05, P1 — FeMo in the beta tier.** `nitrogenFixationProcess.js:37–81` puts beta-colored lobes at y=-0.75 and the second FeMo cofactor at y=-0.71. Each FeMo belongs inside its alpha subunit, paired with a P cluster at that alpha–beta interface. Rebuild both catalytic halves in one topology-preserving coordinate frame. [A. vinelandii 3U7Q](https://www.rcsb.org/structure/3U7Q).

The MoFe cutaways were also examined for the empty-container problem: each of four lobes contains local sheets/helices, unlike the ribosome’s central bowl and disconnected RNA array. These are still invented fold icons, not a registered protein structure. I do not assign another P1 solely for using helices; the definite error is their cofactor/subunit relationship above. Phase B should retain dense domain/pocket identity and avoid suggesting a membrane-like sac around metal clusters.

The eight-electron/sixteen-ATP net cycle, H2 coproduct, P→FeMo followed by Fe→P replenishment and later ATP hydrolysis match the opened primary study. [Duval et al., full text retrieved](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3799366/). Oxygen exposure suppresses subsequent turnover/products and is scoped to protection failure in an aerobic diazotroph. N2 placement and simultaneous product reveal are a net-reaction cartoon, not verified E-state intermediate chemistry. Exact cluster coordination and flavodoxin anatomy are outside the supported model.

## Evidence boundary

Primary/structural sources were opened; where the web tool returned a PMC CAPTCHA, the original NCBI full text was retrieved with urllib and inspected. No claim is based only on a source title. The JSON distinguishes these retrievals and the specific observations supported. No code fixes or visual acceptance were performed in Phase A.
