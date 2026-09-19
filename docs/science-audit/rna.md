# RNA group — independent Phase A science audit

Audited all four entries, every declared root, all stages and control combinations. Read actual geometry/helpers and update formulas, compared Chinese/English explanations, and inspected the four existing representative images in `/tmp/atlas-refinement`. Independently calculated the two topology counterexamples below. No product files, tests, screenshots or browser state were modified. Existing smoke tests were not scientific evidence.

| Model | Roots | Verdict | Findings |
| --- | --- | --- | --- |
| rnaProcessing | cell, plant | confirmed_issue | rna-01, P1 |
| nuclearTransport | cell, plant, yeast | confirmed_issue | rna-02, P1 |
| motorTransport | cell | confirmed_issue | rna-03, P2 |
| organelleImport | plant | qualified_pass | none |

## rnaProcessing — rna-01, P1: disconnected second-step substrate

`rnaProcessingProcess.js:281–329` moves the intron 3′ end away from exon 2 before joining the exons. At progress 0.60, exon 1 ends at (-1.1,0,0), exon 2 starts at (0,0,0), and the intron ends at (0.9,0.725,0). The scene therefore has three separate RNA pieces; the intron/exon-2 gap is 1.15569 model units. Release starts at 0.61, before exon joining finishes at 0.65.

The first reaction leaves a lariat–exon-2 intermediate. The second reaction cleaves that junction while joining the exons; it does not release exon 2 first. Opened evidence: [Fica et al., primary C* spliceosome structure](https://pubmed.ncbi.nlm.nih.gov/28076345/) (abstract and figure legends) and [official processing chapter](https://www.ncbi.nlm.nih.gov/books/NBK9864/).

**Correction invariant:** keep the intron covalently connected to exon 2 during approach; perform a bond swap only when the exon ends coincide; release the lariat afterwards. Both roots must preserve precursor → exon 1 + lariat–exon 2 → ligated exons + lariat connectivity. Final cap/tail orientation and nuclear location otherwise match the limited transcript scope. Confidence: high.

## nuclearTransport — rna-02, P1: intersecting pore-rim leaflets

`nuclearTransportProcess.js:119–153` uses `x=(0.46+face*0.085)*cos(t)` but `r=1.21-(0.22-face*0.085)*sin(t)`. The opposing changes in ellipse axes make the two leaflets intersect. Direct intersection of the actual 18-segment radial polylines gives `(x,r)=(±0.352891,1.107221)`. Revolution produces two crossing arcs around the pore at every stage, NLS condition and root.

Opened primary evidence: [Schuller et al., in-cell NPC cryo-ET](https://www.nature.com/articles/s41586-021-03985-3), main text and membrane profile in Fig. 2. The pore rim joins inner and outer nuclear membrane in a continuous bilayer; its leaflets cannot cross and invert. The import direction, masked-cargo retention, nuclear RanGTP association and cytoplasmic receptor reset otherwise follow the [classical import pathway](https://www.ncbi.nlm.nih.gov/books/NBK9927/).

**Correction invariant:** offset a smooth midsurface along its normal; maintain positive leaflet separation and matching membrane-face endpoints, keeping the central channel distinct from perinuclear space. Retest both NLS conditions across all roots. Confidence: high.

## motorTransport — rna-03, P2: dynein uses the kinesin walking rule

`motorTransportProcess.js:331–363` applies the same constant stride, alternating `count % 2` head selection and lift to both motors. Dynein reverses the sign and changes architecture, but its entire walking trajectory is a mirrored kinesin trajectory. This conflicts with the intended comparison and the text about dynein variability.

Opened primary evidence: [Yildiz et al., kinesin hand-over-hand motion](https://pubmed.ncbi.nlm.nih.gov/14684828/) and [Elshenawy et al., mammalian dynein–dynactin stepping](https://www.nature.com/articles/s41589-019-0352-0). The latter reports variable, lateral and backward steps. This is a representational ambiguity, **not** an assertion that an alternating dynein step is impossible.

**Correction invariant:** use separate deterministic illustrative head-event sequences, retaining regular kinesin alternation and a genuinely variable dynein trajectory with net minus-end motion. Both ATP-depleted branches must stay stationary along the track. Track polarity, selected motor architecture and cargo direction otherwise agree with the stated animal-cell scope. Confidence: medium.

## organelleImport — qualified pass

The plant-only, stromal-protein scope is coherent. Two bilayers, TOC/TIC channels and an intermembrane connection are present. The N terminus leads into the stroma; the peptide is extended on the channel axis while crossing both membranes. The trailing end reaches x=0.83 beyond the inner channel before final folding. Transit-absent cargo stays cytoplasmic, and the N-terminal transit segment is separated from mature protein on the stromal side.

Opened primary evidence: [Chen et al., TIC236 in land plants](https://pubmed.ncbi.nlm.nih.gov/30464337/), [Richter and Lamppa, SPP cleavage and turnover](https://pubmed.ncbi.nlm.nih.gov/10508853/), and [Liu et al., stromal Hsp70 ATP energetics in moss](https://academic.oup.com/plcell/article-abstract/26/3/1246/6099828). The cited [2023 TOC–TIC structure](https://pubmed.ncbi.nlm.nih.gov/36702157/) is from *Chlamydomonas*, so it does not establish a universal land-plant subunit layout. The existing functional-schematic scope avoids that assertion.

Limits: generic channel subunit motifs and mature fold; no quantitative contour length, kinetic or energy accounting; ATP/GTP chemistry is textual; later transit-peptide degradation is omitted. No confirmed scientific defect identified within this scope. Confidence: medium.

## Totals

4/4 entries covered: **3 confirmed_issue, 1 qualified_pass, 0 unresolved**. Three findings: **2 P1 topology errors, 1 P2 comparative-animation ambiguity**. Full checks, exact formulas, scope limits, sources and proposed verification invariants are recorded in `rna.json`. Phase A only; corrections await global reconciliation.
