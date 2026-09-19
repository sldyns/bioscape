# Phase A — phageLife independent scientific audit

Coverage: all four `phageLife/entries.js` IDs plus explicitly assigned legacy `infection`. **2 confirmed-issue models, 3 qualified passes, 0 unresolved models. Two P1 findings; no P0.** This is an audit, not approval of atomic accuracy or all visual details.

Read all bilingual stage/intro/control/label/metadata text, declared roots (all `phage`), geometry helpers and update formulas. Ran read-only in-memory stage/condition traversal, including both branches and end states; inspected the five existing `/tmp/atlas-refinement/` screenshots. Only this Markdown and companion JSON were written. No browser or model edits.

## phageLytic — confirmed_issue

**phageLife-01 · P1 · detached DNA and reversed-looking entry growth.** In `phageLyticProcess.js:238–244`, `incoming.scale.y = entry` scales the entire delivery strand about the host origin. At progress `.05`, measured incoming DNA occupies world y `.045701–.515077`; the visitor origin is `2.370792` and its tail tip is `1.762792`. The incoming DNA is therefore detached by more than 1.2 scene units and grows upward from the cytoplasm toward the particle, while the capsid DNA independently shrinks. This contradicts the visible continuous tail-to-cytoplasm delivery event, even as an overview. T4 cryo-ET describes a connected tail/envelope delivery route. [Hu et al. primary record](https://pubmed.ncbi.nlm.nih.gov/26283379/), [EMD-6082](https://www.ebi.ac.uk/emdb/EMD-6082).

Fix in Phase B: use one continuous head→tail→envelope→cytoplasm centerline with an advancing DNA interval/leading end; anchor its outlet in world space. Verify `.03/.05/.10/.15` for molecular continuity and inward progression, rather than checking `genomeEntered` alone.

Other stages were checked: RNA is single-stranded in the host-expression schematic; T4 is lytic only; DNA amplification precedes packaging; head/tail joining precedes release; the host has inner membrane, peptidoglycan and outer membrane. Replication and fiber-attachment detail remain compressed.

## phageLysogenic — confirmed_issue

**phageLife-02 · P1 · stable lysogen loses its chromosome at the endpoint.** `phageLysogenicProcess.js:307` sets the left chromosome visibility to `p < .97` regardless of the selected fate. At `p=1, fate=maintain`, the left chromosome parent is hidden, the right is visible, both envelopes stay intact, and the final text says both cells retain prophages. This is a branch-specific false biological outcome. An uninduced lysogen copies and retains the integrated prophage with its chromosome. [Recombination review, abstract and Figures 1–2](https://pubmed.ncbi.nlm.nih.gov/38372210/).

Fix in Phase B: condition late left-chromosome disappearance on induced lysis. At `.96/.975/1` in maintain, both complete chromosomes and integrated inserts must remain effectively visible inside their own intact daughters, with no excision/virions. Induce must preserve the right chromosome while permitting left lysis.

Other steps match the stated lambda scope: noncontractile tail; circularization; attP×attB integration; CI repression; inheritance; RecA-associated induction; excision and lytic development. Late replication/packaging is only an overview, not a resolved lambda concatemer/cos model.

## phageAssembly — qualified_pass

All six stages and active/inactive gp21 branches checked. Empty prohead/scaffold and independent tail form first; active proteolysis clears the scaffold, packaging precedes neck sealing, head/tail join, and fibers appear last. Inactive gp21 retains scaffold and prevents head loading/joining while tail formation continues. Final head-neck/tail termini align numerically. The inner-membrane association and gp13/gp14 sequence agree with the reviewed T4 morphogenesis account. [T4 head assembly review](https://pmc.ncbi.nlm.nih.gov/articles/PMC9958956/), [primary portal structure 6UZC](https://www.rcsb.org/structure/6UZC).

Qualification: DNA loading is represented by increasing interior occupancy without an exterior feed strand. This can serve as a morphology overview but does not establish strand continuity or ATP chemistry; do not use this scene as the detailed proof of packaging mechanism. Protein relief and counts not explicitly identified remain schematic.

## phagePackaging — qualified_pass

Both ATP conditions and all six stages checked. Twelve gp20 subunits and five gp17 subunits are distinct; gp20 is fixed. ATP absence holds zero lumen loading and prevents cleavage/release/seal outcomes. In the active branch, filling precedes a cut gap and motor departure; gp13/gp14 sealing follows. The mode is T4 headful packaging, with no lambda cos mechanism asserted. [Active-motor primary study](https://www.nature.com/articles/s41467-021-26800-z), [primary portal deposition](https://www.rcsb.org/structure/6UZC).

Qualification: external and packaged DNA use separate draw-range representations connected by a thin axial segment; exact length conservation and both backbone junctions are not demonstrated. Terminal redundancy/circular permutation are omitted. Subunit oscillation is illustrative, not evidence of a strict universal ATP-firing order.

## infection — qualified_pass

All three stages checked in the legacy model and its structural helpers. Two host bilayers and intervening peptidoglycan are present. Sheath shortening leaves rigid tail length fixed, membrane bulging reaches the tail tip, and a contiguous duplex interval moves from the extracellular head to cytoplasm. The capsid remains outside. The explicit T4 intro/catalog scope prevents the T2 structural-root label from silently implying a precise T2 mechanism.

The primary study describes periplasmic tail penetration and outward cytoplasmic-membrane curvature; the EMDB record separately documents a contracted T4 retaining its genome before transfer. [Hu et al.](https://pubmed.ncbi.nlm.nih.gov/26283379/), [EMD-6082](https://www.ebi.ac.uk/emdb/EMD-6082).

Qualification: receptor identity, force balance and exact transmembrane protein arrangement are not modeled. Hu PMC/publisher rendering was blocked; the full indexed primary abstract was retrieved through Europe PMC's core API, and the associated EMDB record was opened. This limitation is recorded in JSON.

## Handoff

Prioritize the two geometry/state defects during Phase B. Retain the T4/lambda distinction and all existing controls. The three qualified passes retain explicit scope limits; smoke tests and attractive surfaces are not substitutes for these scientific checks. No product files were changed.
