# Traffic · fresh process review · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Phase A only; product and tests remain unchanged.

| Model | Actual roots | Conditions | Verdict |
| --- | --- | --- | --- |
| endocytosis | cell | default only; no controls | confirmed_issue |
| autophagy | cell | default only; no controls | confirmed_issue |

## 20261004-traffic-01 · P1 · Endocytosis: dynamin occupies the pit lumen

`endocytosisProcess.js:90–127` gives the visible collar a fixed height and separately shrinks its radius. At progress 0.30 the rendered membrane radius at that height is **0.695274**, but even the collar's conservative outer extent is **0.273**. At 0.34 the membrane radius is **0.422926**. The collar therefore lies inside the extracellular invagination. Over 0.39–0.429999 the membrane geometry is exactly unchanged while the collar radius falls from 0.134067 to 0.072600.

The primary [dynamin cryo-EM study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11265984/) establishes a polymer surrounding and constricting the membrane neck. Repair must derive the membrane neck and cytosolic collar from one physical constriction state, including coherent recruitment and scission. Regressions must measure actual surface/collar geometry, not metadata.

Other reviewed boundaries: LDL monolayer/core/ApoB identity, receptor sidedness, coat removal, luminal carrier cargo, distinct fused-membrane receptor anchors and acidic sorting. [LDLR mutagenesis](https://pubmed.ncbi.nlm.nih.gov/19674976/) and [native LDL cryo-EM](https://pmc.ncbi.nlm.nih.gov/articles/PMC3090388/) support the declared schematic scope. Six stages and all visible text were reviewed in both languages.

## 20261004-traffic-02 · P2 · Autophagy: attached membrane actors teleport at fusion

`autophagyProcess.js:186–219` reuses the lysosomal sphere parameter directly on the entire common envelope. Across `0.65 - 1e-8 → 0.65`, an already visible glycan moves **2.369646 world units** and the V-ATPase moves **0.892791**. Preserve their world anchors at the fusion transition, map them to the corresponding lysosomal lobe and follow the same changing membrane surface continuously.

The pre-fusion membrane midplanes are separated by 0.18; the immediate common envelope differs from their union by up to 0.110173 at sampled profile points. This is recorded for rendered inspection, without inventing a second scientific defect from a topology switch alone.

The inner barrier removal, later enzyme access and cargo degradation are correctly ordered in the current formulas. The [RNAseK primary study](https://www.nature.com/articles/s41467-024-52049-3) supports the barrier's significance; its PMC full text was retrieved and read through Europe PMC after intermittent browser challenges. [1HTI](https://www.rcsb.org/structure/1HTI) and [1LYA](https://www.rcsb.org/structure/1LYA) identify the stated human protein references. Seven bilingual stages, both bilayers, the growing rim, visible cargo/products and terminal state were reviewed. Native folds do not validate the illustrative damage, aggregate arrangement or catalytic trajectories.

## Evidence and remaining gates

- `evidence/traffic/diagnostic.mjs`, `diagnostic.json`: reproducible rendered-profile collar measurements and persistent-actor before/after coordinates.
- `evidence/traffic/sweep.json`: fresh full-interval grid plus boundaries, **130 endocytosis / 133 autophagy samples**, finite buffers, stable inventories and deterministic irregular seeks.
- `evidence/traffic/smoke.log`, `fusion-profile-tests.log`: focused existing checks pass. These do not reject the new failures and are not rendered/scientific acceptance.
- `evidence/traffic/38663399-abstract.txt`, `19674976-abstract.txt`, `PMC11374810.xml` and excerpts: primary-source retrieval records. Intermittent PMC/publisher browser failures are recorded by the source-access explanations in JSON; available primary content was read through the official mirror.

No browser, full-suite test, benchmark, product edit or publication was performed. Root owns rendered continuity/visual acceptance and any shared integration. Awaiting Phase B release for the two confirmed issues.
