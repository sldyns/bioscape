# yeastLife supplementary repair discoveries

Requested by integrator during final checks. Original Phase A remains immutable. Native/export leaders use `label.position` as the structure target. Before measurements: `label-anchor-before.json`; source fixtures and hashes: `label-anchor-baseline/`.

## 20261004-yeastLife-R01 · P2 · yeastBudding

Bud, mother, neck and nuclear-envelope leader anchors contain text-placement offsets. At p=.15 the bud leader is 1.286 scene units beyond actual bud bounds; the envelope label stays at [-1.1,.8,.6] while the nucleus changes shape and position.

Repair: Bind cell/envelope leaders to actual surface vertices, and track the bud and mother/neck through growth/separation.

## 20261004-yeastLife-R02 · P2 · yeastFermentation

PDC/ADH and named metabolites use fixed off-body anchors. PDC is .737 units outside enzyme bounds at p=.5. At p=.72 the ethanol label is active while reduction=.550 and the encoded carbonyl double bond remains; glucose, pyruvate and CO2 visibility also uses unrelated coarse time thresholds.

Repair: Bind each named compound/cofactor/enzyme to its actual persistent geometry. Align compound visibility with the encoded bond-change state and add a neutral glycolysis-carbon transition label instead of prematurely calling the intermediate glucose/pyruvate/ethanol.

## 20261004-yeastLife-R03 · P2 · yeastMating

Parental-cell and nuclear/fusion leaders retain detached layout positions. At p=.7 the nuclear-congression leader is .719 units outside the moving left nuclear envelope bounds; plasmogamy and zygote labels likewise terminate away from their named structure.

Repair: Anchor cell-type labels to their cell envelope surfaces, fusion to the real junction, and nuclear congression/fusion to a continuous parent-to-fused-envelope site.

## 20261004-yeastLife-R04 · P2 · yeastSporulation

Replication/MI/MII, prospore membrane and mature spore labels point at static text offsets. At p=.72 the PSM leader is 1.171 units outside the selected growing membrane bounds; the static top caption also omits that a/alpha diploid is the starting state.

Repair: Anchor chromosome action labels to inherited chromatid centromeres, PSM to its actual leading edge, and mature spore to a visible wall layer. Clarify starting diploid scope and retain regional condition notes.

## 20261004-yeastLife-R05 · P2 · yeastSporulation

Confirmed by native English default-yeast critical frames .799/.801: the broad common envelope disappears and four small nuclei replace it in 0.002 progress. The original late constriction only compresses z, leaving the x/y silhouette unchanged. Baseline source and original-image hashes: `nuclear-handoff-baseline/manifest.json`. Root explicitly authorized registration and correction after visual evidence. Preserve real membrane partition and source-backed closed nuclear-envelope/SPB/PSM mechanism; do not hide or shrink the issue.
