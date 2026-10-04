# plantSignals integrated stage-image review · 2026-10-04

Reviewed all **14 supplied stage frames** through the two full sheets, then inspected four relevant **960×640 native originals** at original resolution. The rendered review confirmed two additional P2 annotation defects; they were recorded before repair as `20261004-plantSignals-06` and `-07` in [repair-discoveries](../evidence/plantSignals/repair-discoveries.json). Phase A is unchanged.

## auxin · plant

[Seven-stage sheet](../evidence/browser/sheets/full-a-stable-034-auxin-plant.jpg)

| Progress | Observed stage | Review |
|---|---|---|
| 0 | Repressed ARF / free auxin | Partners remain visible and distinct; named leaders use inherited empty-space offsets. |
| 0.175 | Approaching ligand / repressor | Moving shapes are readable; ligand/repressor labels do not track their true surfaces. |
| 0.355 | Bound pocket / tagging | TIR1–IAA–degron docking is visible; Auxin/TIR1 leaders end above it. Confirmed in the [native frame](../evidence/browser/full-a-stable-034-auxin-plant-stage-3.webp). |
| 0.535 | Tagged repressor moving to proteasome | Conserved chain and moving substrate are visible; repressor/proteasome semantic anchors need actual surfaces. |
| 0.725 | Post-degradation / early transcription | Repressor label is correctly inactive. RNA is short; no claim of continuous unfolding can be made from this sample, which skips the 0.625–0.7 transient. |
| 0.895 | Extended RNA / later tissue response | The RNA leader ends in blank space near the proteasome/inset, rather than on the strand. Confirmed in the [native frame](../evidence/browser/full-a-stable-034-auxin-plant-stage-6.webp). |
| 1 | Final transcription/inset state | RNA, retained ARF and differential tissue sizes remain visible. Dynamic endpoint correction is required; compartment context is separate. |

**Fixed as -06:** TIR1 atoms, proteasome subunit, DNA-bound ARF, Aux/IAA body, RNA nucleotide instance, auxin atom instance and inset wall now provide actual triangle-surface anchors. The latter follow complete transforms after every update, including scaling and instance motion. The nucleus/specimen caption intentionally targets empty nuclear interior. Low-auxin and degraded-substrate active branches are covered by regression.

## plantDefense · plant

[Seven-stage sheet](../evidence/browser/sheets/full-a-stable-035-plantDefense-plant.jpg)

| Progress | Observed stage | Review |
|---|---|---|
| 0 | Separate receptors / external ligand | Compartment separation is clear. FLS2, BIK1 and RBOHD leaders end outside their domains. |
| 0.175 | flg22 approach | Peptide remains extracellular; its legacy offset does not follow its rotation/surface. |
| 0.355 | Bound ligand / BAK1 recruitment | Peptide follows the FLS2 face and BAK1 approaches; label anchors miss full trajectory/depth. |
| 0.525 | Receptor complex / BIK1 activation | Existing geometric interfaces are visible. Empty-space BIK1/RBOHD/FLS2 anchors confirmed in the [native frame](../evidence/browser/full-a-stable-035-plantDefense-plant-stage-4.webp). |
| 0.715 | BIK1 at RBOHD / early electron output | BIK1 and donor move; their legacy label positions remain offset. ROS label is absent before represented ROS. |
| 0.885 | ROS output | ROS particles remain apoplastic. Their static leader endpoint sits above/right of the actual cluster. |
| 1 | Terminal output | ROS and donor labels remain displaced; BIK1/RBOHD leaders terminate in blank cytosol. Confirmed in the [native frame](../evidence/browser/full-a-stable-035-plantDefense-plant-end.webp). |

**Fixed as -07:** named receptor/kinase/ligand/ROS/donor leaders follow true mesh surfaces, including BAK1 depth and BIK1 trajectory. The membrane anchor is a persistent visible head-group instance. Apoplast/Cytosol are explicitly regional captions, so those remain in empty space on their appropriate side of the membrane. ROS/ligand/donor activity is tied to represented output or condition.

## Verification and freeze boundary

- [Current local science regression](../evidence/plantSignals/science-rendered-repair.log): previous five fixes and all prior regressions still pass. New checks validate **97 auxin + 106 plantDefense active anchors** against actual mesh triangles; maximum world gap is **1.11e-16**. Both controls, nine representative progress points and irregular seeks are covered.
- [New mutation checks](../evidence/plantSignals/rendered-mutation-checks.json): restoring each old offset is rejected by its geometric assertion. The source files were not changed on disk during mutation runs.
- Named labels and contextual regions are tested separately; no biological mesh was moved or hidden to accommodate an annotation.
- Only the four owned source/test files were formatted; Prettier and `git diff --check` pass. [Source freeze hashes](../evidence/plantSignals/rendered-freeze.json) identify this reviewable state.
- The supplied screenshots precede these two label repairs. **No post-fix render was produced by this reviewer**, and still images do not prove continuous playback. Root should reload the no-HMR preview and inspect the updated markers/leader layout, with an additional auxin sample near `p=0.65` for the degradation transient. No browser was operated here.
