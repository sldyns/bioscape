# Translation group — Phase B resolutions

All five original finding IDs are addressed. Product changes are confined to `src/processes/modules/translation/`; Phase A audit evidence remains unchanged. `alternativeSplicing` is unchanged.

| ID | Correction | Actual-geometry verification |
|---|---|---|
| translation-01 | Replaced hollow ribosome and RNA array with registered human 4UG0 backbone. | All 17,156 C4′/Cα positions and every gap-respecting backbone segment checked against source arrays; both subunits share one transform. |
| translation-02 | Continuous L-shaped tRNAs; local ester/peptide-bond switch; incoming amino acid retained in chain. | Rendered bond endpoints meet molecular anchors in intermediate frames; CCA markers meet RNA backbone ends; peptide continuity persists. |
| translation-03 | Separate labeled internal-reaction enlargement with constrained peptide exit path. | Entire internal peptide including bead radius remains inside path; release clears outlet before lateral motion. |
| translation-04 | Folding uses the same real 80S reference and a separate labeled outlet enlargement. | Three roots × two Hsp70 branches; reference coordinates and nascent-chain continuation verified. |
| translation-05 | One FeMo in each alpha domain; relay/substrate positions follow selected catalytic half. | Both actual cofactor meshes remain in alpha projection above beta tier in both oxygen branches. |

The translation reference is larger and closer than its first Phase B version. Blue-grey identifies rRNA, gold identifies ribosomal proteins; mRNA, the two tRNAs and peptide remain separately identified. The right-hand heading explicitly says the reaction occurs **inside the ribosome**, shown separately at enlarged scale. The original unconnected-stem helper was removed. Both 4UG0 subunits preserve their original shared frame; no subunit is independently normalized or stretched.

Verification completed:

- `node src/processes/modules/translation/science.test.mjs`: 14 root/control combinations, 2,814 frames passed, plus all-source residue/edge registration checks, deterministic seeks, finite transforms and stable resource inventory.
- `node src/processes/modules/translation/refinementSmoke.mjs`: all nine root entries and all branches passed; finite vertex/instance data, stable resources and in-memory browser bundles for all four modules passed. Its large-array spread was changed to an iterative append so experimental instance arrays do not exceed the JS argument limit.
- Only owned files were formatted. No browser or full-workspace verification was run.

The reference is a residue backbone from [human 4UG0](https://www.rcsb.org/structure/4UG0), explicitly representative in other eukaryotic contexts. The adjacent PTC/tRNA/exit-path mechanism is **not** fitted atomic motion; it preserves the connectivity/order supported by [the primary translating plant ribosome study](https://www.nature.com/articles/s41477-023-01407-y). The nitrogenase remains a topology-preserving schematic informed by [3U7Q](https://www.rcsb.org/structure/3U7Q), not an all-atom catalytic pocket.

Remaining boundaries: no simulated transition-state chemistry, exact 4UG0 PTC/tunnel mapping, complete elongation-factor/recycling cycle, sequence-specific folding pathway, or nitrogenase E-state sequence is claimed. Local tests establish the stated geometry and animation invariants; final visual acceptance remains with root.

## Peer-review and narrow-layout follow-up

The regression now checks the actual terminal RNA bead against CCA, all 47 rendered links in each tRNA, and effective visibility through ancestors for active molecular objects. Three independent in-memory mutations must fail: a hidden P-tRNA parent, a real RNA end displaced by +0.6, and a hidden reaction parent. The full 2,814-frame suite and all three mutation checks pass. The translation browser bundle also passes.

No molecular geometry was changed in this follow-up. Left/right titles have bilingual compact text for the shared narrow-layout renderer; P/A and 5′/3′ priorities exceed secondary technical notes. Strand-end labels are moved below the site labels and follow mRNA movement. Root owns the final 390-pixel display check; this report does not claim that screenshot acceptance before it occurs.
