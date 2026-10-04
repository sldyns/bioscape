# RNA repair discoveries · 2026-10-04

Two additional issues were confirmed after immutable Phase A; both are fixed locally and await root rendered acceptance.

- **20261004-rna-rendered-01 · P2:** the combined importin alpha/beta label followed returned beta while alpha stayed nuclear. Independent bilingual alpha and beta labels now follow their actual helices. Only exposed-NLS import after p ≥ 0.73 labels alpha as retained in the nucleus; masked-NLS receptors remain cytosolic. Ran text reuses prebuilt GTP/GDP strings.
- **20261004-rna-rendered-02 · P2:** 18 concrete-object anchors were detached from represented geometry. All 20 concrete-object labels now bind existing geometry (including the new alpha label and a small consistency refinement to the already-near-wire lariat anchor). Full object wording and regional annotations remain.

Measurements are minimum distances to visible transformed triangles, including instance transforms. The original snapshot is `label-anchor-before.json`; independent after measurements are `label-anchor-after.json`. Each row below records its worst original sample.

| Process | Object label | Before distance | Worst p / condition | Maximum after distance |
| --- | --- | ---: | --- | ---: |
| rnaProcessing | 5′ cap | 0.533000 | 0.305 / {} | 0.00e+00 |
| rnaProcessing | Exon 1 | 0.245711 | 0.305 / {} | 0.00e+00 |
| rnaProcessing | Exon 2 | 0.245711 | 0.305 / {} | 0.00e+00 |
| rnaProcessing | Spliceosome: RNA + proteins | 0.966455 | 0.305 / {} | 0.00e+00 |
| rnaProcessing | Intron lariat | 0.009970 | 0.82 / {} | 0.00e+00 |
| rnaProcessing | Poly(A) tail · 3′ | 0.706830 | 0.82 / {} | 0.00e+00 |
| nuclearTransport | NLS cargo | 0.412202 | 0.475 / {"nls": "exposed"} | 0.00e+00 |
| nuclearTransport | Importin α / β | 0.329711 | 0.475 / {"nls": "exposed"} | 0.00e+00 |
| nuclearTransport | Ran-GDP | 0.248134 | 1 / {"nls": "exposed"} | 0.00e+00 |
| motorTransport | Minus end − | 0.256739 | 0 / {"motor": "kinesin", "atp": "available"} | 0.00e+00 |
| motorTransport | Plus end + | 0.253319 | 0 / {"motor": "kinesin", "atp": "available"} | 0.00e+00 |
| motorTransport | Membrane cargo | 0.204028 | 0.315 / {"motor": "kinesin", "atp": "available"} | 0.00e+00 |
| motorTransport | Polar microtubule · α/β tubulin | 0.790520 | 0 / {"motor": "kinesin", "atp": "available"} | 0.00e+00 |
| motorTransport | Dynein + dynactin | 0.502031 | 0.715 / {"motor": "dynein", "atp": "available"} | 0.00e+00 |
| organelleImport | TOC · outer envelope | 0.727616 | 0 / {"transit": "present"} | 0.00e+00 |
| organelleImport | TIC · inner envelope | 1.317355 | 0 / {"transit": "present"} | 0.00e+00 |
| organelleImport | N-terminal transit peptide | 0.510835 | 0.355 / {"transit": "present"} | 0.00e+00 |
| organelleImport | ATP-dependent chaperone / motor | 0.538684 | 0.775 / {"transit": "present"} | 0.00e+00 |
| organelleImport | Mature stromal protein | 0.611997 | 0.925 / {"transit": "present"} | 0.00e+00 |

The intron-lariat row is diagnostic context, not one of the 18 defects: its old point was already within the visible wire envelope.

`science.test.mjs` passes 14 registered root/condition configurations and 1,218 actual mesh/instance surface assertions, plus bilingual state, receptor compartment, hidden target and repeated-seek identity checks. The original 18 off-object coordinates fail the same triangle-based invariant when replayed against unchanged target geometry; repaired coordinates pass (`label-negative-control.json`). The group refinement suite also passes.

Logs: `label-repair-science.log`, `label-repair-refinement.log`, `label-repair-negative-control.log`. Diagnostic sources: `label-anchor-diagnostic.mjs`, `label-negative-control.mjs`. Original Phase A audit and original motor repair evidence remain unchanged.

Root still owns rendered review across branches/roots and continuous playback. A correct geometric endpoint is not a guarantee of unobstructed screen projection from every camera angle.

## Additional default-view visibility issue: 20261004-rna-rendered-03

The final all-case gallery confirms a P2 ambiguity at nuclear transport exposed-NLS p=.765: the beta receptor's surface anchor was behind foreground green Ran, making the beta leader appear to identify Ran. The three roots share the same geometry and show the same ambiguity. Root approved a surface-point-only correction.

A single fixed centroid on the existing upper-front beta helix now supplies the anchor (child 8, triangle vertex indices 579/580/571). There is no time-dependent point switching. Molecular geometry, relative positions, Ran's anchor and the camera are unchanged. The helper supports existing triangle centroids in addition to its existing vertex bindings; both remain exact rendered-surface points and use construction-time scratch allocations only.

The camera probe matches the actual default export: sampled visible bounds, FOV 36°, fit factor 1.12, aspect 960/640. The original p=.765 coordinate hits Ran before beta in all three roots; repaired coordinates hit beta. **The preliminary unfitted-camera p=.935 observation is superseded:** the fitted default camera already hits beta there. It is tested for preservation, not misreported as an old failure. Ran's two gallery points hit Ran, and its anchor remains unchanged.

The final regression passes 156 beta/Ran first-hit checks across six root/NLS configurations and 13 gallery/binding/recycling poses; each configuration also checks a constant beta-local anchor through 1,005 repeated/dense seeks. Three original p=.765 coordinates supply negative controls. Existing 1,218 surface checks and the science/refinement suites pass. Logs and per-case evidence are `npc-visibility-science.log`, `npc-visibility-refinement.log`, `npc-visibility-regression.json`, and `npc-visibility-original-anchor-replay.log`.

These checks target the confirmed molecular-identity ambiguity. Real nucleus-envelope/pore-scaffold occlusion during central traversal remains possible and is not bypassed with point jumps or geometry changes. Candidate sweeps in `npc-label-centroid-probe.*` are exploratory evidence; their temporary two-candidate comparison was never implemented. Post-repair NPC capture review remains pending.

## Final sampled rendered verification

All 14 RNA root/control cases now have sampled-frame review. Eight non-NPC cases use the original final batch A; all six NPC cases were recaptured in Chinese as `conditions-final-e-000..005`. Their six seven-frame sheets and each exposed root's p=.765/.935 native 960×640 originals were opened. Beta now points to the purple beta helix, Ran-GTP to the Ran complex, and retained alpha to the separate nuclear alpha structure. All masked branches preserve cytosolic cargo/receptor identity and nuclear Ran-GTP. No new defect was confirmed.

The accepted set contains 98 sampled frames in 14 cases. Discovery plus replacement review covered 20 sheets / 140 captured frames and 17 additionally opened originals. This is native irregular-seek evidence, not continuous playback of every case. See `resolutions/rna-rendered-all-cases.md` for every case, image counts, languages and remaining acceptance boundaries.
