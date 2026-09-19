# plantWater — Phase A independent scientific audit

Reviewed all four entries, all six stages per model, both control branches, Chinese/English content, labels, shared geometry, and the only declared root (`plant`; no context overrides). Evaluated every stage start, intermediate midpoint and endpoint for each branch, and inspected the four existing representative screenshots. Product files and browser were not changed.

**Result: 1 confirmed_issue, 3 qualified_pass, 0 unresolved. Findings: 1 P1 + 1 P2.** These are scope-limited scientific judgments, not general visual approval.

## chloroplastMovement — confirmed_issue

- **plantWater-01 · P1 · organelle crosses cell boundaries during corner turns.** Cell membrane limits are x=±2.5 and y=±2.65 (`chloroplastMovementProcess.js:100–109`). The lines 176–192 path first translates and only later rotates a finite-size chloroplast. A 201-point sweep of each genotype's actual transformed geometry found y=−2.807803 at p=.235 and x=−2.737817 at p=.725 in wild type. Both genotypes share the accumulation-phase bottom-wall violation. This contradicts relocation within peripheral cytoplasm. Primary observations locate the movement machinery between chloroplast and plasma membrane. [Kadota et al.](https://pubmed.ncbi.nlm.nih.gov/19620714/)
- **Fix:** Use an orientation-aware rounded-corner route with whole-envelope clearance, preserving the two stable orientations. Regress p=.235/.725 and sweep both branches for membrane containment and vacuole exclusion; center-only assertions are insufficient.
- **plantWater-02 · P2 · incorrect primary-paper attribution.** `sources[1]` says Kagawa, but DOI 10.1038/35073622 and the supplied title belong to **Jarillo et al.** Correct the author or replace the full citation consistently. The publisher archive was opened and identifies Jarillo; Kagawa's related study is a separate Science article. [Nature archive](https://www.nature.com/nature/articles?page=633&searchType=journalSearch&sort=PubDate&type=letter)

The downward beam, weak-light periclinal accumulation, strong-light wild-type avoidance and phot2-loss branch are otherwise consistent with the reviewed primary evidence. The intermediate geometry invalidates acceptance despite correct endpoint states. [Sakai et al.](https://pubmed.ncbi.nlm.nih.gov/11371609/)

## plasmolysis — qualified_pass

The impermeant-solute scope, fixed porous wall, separately retained plasma membrane/tonoplast, outward water-loss stage and conditional dilute-bath recovery agree across both languages and branches. External solute does not acquire a path into the protoplast. [OpenStax osmosis/tonicity](https://openstax.org/books/biology/pages/5-2-passive-transport)

Remaining abstraction: smooth proportional retraction omits Hechtian connections, cortical ER and membrane-area accommodation; the model should not be used to infer complete detachment at all wall sites. These retained connections are directly observed in onion cells. Water dots are projected section indicators, not an aquaporin model. [Oparka, Prior and Crawford](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1365-3040.1994.tb00279.x)

## stomata — qualified_pass

Blue light precedes outward proton pumping, ion uptake, water uptake and opening. ABA gates the later efflux/closure sequence; sustained blue light preserves opening. The two guard-cell surfaces surround a real pore, and the specimen explicitly excludes universal plant-shape claims. The H+-ATPase/K+ opening mechanism and ABA-dependent anion-channel requirement are supported by opened primary sources. [Kinoshita et al., primary PDF](https://www.esalq.usp.br/lepse/imgs/conteudo_thumb/phot1-and-phot2-mediate-blue-light-regulation-of-stomatal-opening.pdf), [Vahisalu et al.](https://pubmed.ncbi.nlm.nih.gov/18305484/)

Remaining abstraction: particles are projected above the cutaway; separate molecular channels and the anion-before-K+ causal sequence are explained in text rather than resolved geometrically. `protonPump` internal metadata stops at .6 even in the sustained-light branch; it must not be exposed as a physiological pump-shutdown claim. Confidence medium because these are tissue-level illustrations, not validated membrane transport trajectories.

## plantLongDistanceTransport — qualified_pass

The model explicitly combines root/stem/leaf tissues at compressed scale. Root uptake feeds an upward **liquid** column, distinct vapor passes through leaf air space, and narrowing slows transport without reversing flow or emptying xylem. Mature vessel lumina lack protoplasts, side pits retain primary-wall membranes, and perforations remain open. No active xylem water pump is suggested. [OpenStax transport](https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants), [Wei, Tyree and Steudle, direct xylem-pressure study](https://pubmed.ncbi.nlm.nih.gov/10594106/)

Remaining abstraction: radial root barriers and parallel routes are explicitly compressed; the wet-wall/vapor transition is not molecule-resolved. Internal `poreOpening=0` accompanies a geometrically narrow residual pore and should not be presented as a measured sealed aperture. Confidence medium for the intentionally combined scales.

Detailed evidence, code locations, source-access limitations, repair invariants and per-model confidence are in `plantWater.json`. No corrections were performed during Phase A.
