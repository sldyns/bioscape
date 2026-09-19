# plantConnections — Phase A independent scientific audit

Coverage: all four entries; all declared roots (`plant`); every bilingual stage, intro, label, control, keyframe and shared anatomy helper. Read-only Node evaluation exercised every stage/control and sampled C4 transport densely. Four existing `/tmp/atlas-refinement` screenshots were inspected. No product/model/test file was edited, and no browser was operated.

**Result: 2 confirmed_issue, 2 qualified_pass, 0 unresolved. Three findings: 2 × P1, 1 × P2.** These are bounded scientific judgments, not an absolute guarantee.

## plantTransport — confirmed_issue

Direction and energy causality are correct: cytosolic ATP drives H+ export; proton return drives SUC2 uptake. The no-ATP comparison explicitly starts without an existing gradient and correctly blocks net uptake.

- **plantConnections-01 · P1 · false protein connectivity.** All adjacent pump/SUC2 helix connectors are drawn on the extracellular end (`plantTransportProcess.js:83`, `:158`). Interior helix tops acquire two links and their lower ends dangle, producing an incorrect peptide graph. Rebuild connections from a verified topology or omit unsupported connectors. Verify one unbranched chain and correct membrane sides. The actual SUC-family structure has two six-helix domains and a cytoplasmic interdomain linker; the AHA2 structure supports ten helices and cytosolic N/P/A domains. Sources: [SUC1 primary structure](https://www.nature.com/articles/s41477-023-01421-0), [AHA2 primary structure PDF](https://www.esalq.usp.br/lepse/imgs/conteudo_thumb/Crystal-structure-of-the-plasma-membrane-proton-pump-1.pdf).
- **plantConnections-02 · P2 · energy-count ambiguity.** Nine tracked H+ cross during one visible ATP→ADP+Pi event (`:205–221`, `:244–258`). This invites a 9:1 stoichiometry reading. Match ATP/proton cycles, or separate a single tracked event from a non-stoichiometric background gradient. The primary AHA2 paper describes one proton per ATP; it does not support the current apparent count.

The sucrose glyph and protein folds remain schematic rather than atomistic. No SUC2 atomic reconstruction is claimed.

## plasmodesmata — qualified_pass

Actual lumen deformation matches the callose control. Small cargo travels outside the appressed ER and inside the PM-lined sleeve, while cortical ER remains continuous on both sides. Open condition delivers four tracked small solutes; the narrowed condition delivers the early solute and stops three later ones. Untargeted large cargo is excluded in both, without claiming all protein/RNA traffic follows one mass cutoff.

Sources: [Vatén et al. primary abstract at an author institution](https://cris.fau.de/publications/107137404/), [1991 ultrastructure paper, official full text](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2288846/fullTextXML). The ultrastructure specimen is a fern; its topology supports the schematic, while the Arabidopsis study supports the root callose mechanism. Dimensions, spokes, probe sizes and binary blocking remain illustrative.

## photorespiration — qualified_pass

The four tracked carbons follow the correct main chloroplast→peroxisome→mitochondrion→peroxisome→chloroplast order. Two glycines yield a three-carbon serine skeleton plus one CO2 and ammonia; no carbon object disappears. GLYK absence blocks phosphate transfer/final recovery. Both languages correctly exclude the two accompanying Rubisco 3-PGA products from the tracked pool, identify ATP cost, and state that NH3 requires reassimilation.

Sources: [PLGG1 primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC3581909/), [GLYK primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC1182498/). Cofactors, amino donors, full nitrogen recycling, transport kinetics and cytosolic bypasses remain explicitly omitted. This is a carbon-skeleton demonstration, not quantitative flux or atom-resolved chemistry.

## c4cam — confirmed_issue

Maize NADP-ME spatial separation and K. fedtschenkoi NAD-ME nighttime storage/daytime decarboxylation are appropriately scoped. Four carbon objects persist, one is released near the Rubisco compartment, the C4 3C acceptor returns, and PPDK's ATP→AMP+PPi cost is stated. Both strategy controls and all stage transitions were checked.

- **plantConnections-03 · P1 · pyruvate crosses outside the symplastic pore.** Lower pore center `(y,z)=(-0.83,0)`, radius `0.2`; shared-wall half-width `0.14` (`c4camProcess.js:141–195`). At `p=0.7443`, carbon 0 is `(0.13812484,-0.63204468,0.14283926)`. Its center alone is `0.24410932` from the pore axis, and its outer extent is `0.32910932`. Interpolation between the return keyframes (`:397–408`) therefore crosses the drawn membrane/wall region. Add valid entry/exit waypoints with a channel-aligned crossing segment; validate every atom, its radius and the desmotubule over dense progress samples.

Biological evidence: [membrane-lined symplastic channels](https://cris.fau.de/publications/107137404/), [K. fedtschenkoi mitochondrial NAD-ME primary study](https://eprints.gla.ac.uk/190108/), [maize pathway primary study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3875822/). The cited [PPC1 study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7145507/) uses **K. laxiflora**, so it supports genus-level CAM context rather than K. fedtschenkoi-specific kinetics.

Native PMC/PubMed opens intermittently returned bot checks. Successful publisher/author pages and official XML were opened; remaining primary text was read through the retrieved index and access limits are recorded in JSON. No claim of scientific validation rests solely on a citation title, userData, or a technical smoke pass. Phase B fixes remain pending the global audit reconciliation.
