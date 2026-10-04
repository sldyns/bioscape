# Turnover Phase B · 2026-10-04

All three Phase A findings and four supplementary rendered annotation findings are fixed within the owned module; renewed root rendered acceptance remains open.

| Issue | Change | Evidence |
| --- | --- | --- |
| `20261004-turnover-01` | RNA effectors enter smoothly at p=.38-.43, using isolated fade materials and unchanged final protein detail. | Original regression failed; new epsilon/intermediate/final opacity and branch checks pass. |
| `20261004-turnover-02` | Smoke validates the static untagged substrate directly and enumerates all roots and both controls. Active branches retain the distinct-motion requirement. | All 20 root/condition combinations pass; 42 residues and 41 bonds remain intact; products/tag absent. |
| `20261004-turnover-03` | Sequential RecA entry, RNAP entry at p=.60-.635, and LexA fragment dispersal/clearance at p=.72-.86 replace full-size popping. | Original regression failed; actual opacity/world-position continuity, noncleavable control and previous transcription geometry checks pass. |

Changed files are `rnaSilencingProcess.js`, `bacterialRepairProcess.js`, `molecularDetail.js`, `smoke.mjs`, and `science.test.mjs`; new regression is `continuity.test.mjs`. All are under `src/processes/modules/turnover/`. Proteasome and Cas9 mechanism geometry was unchanged in this first repair batch; their annotation follow-up is recorded below.

Fading clones materials once at construction, isolates each assembly and retains both original and cloned materials in the disposal inventory. Updates allocate no geometry, material or scene node. Actual opacity/transparent/depth-write states join deterministic seek checks. Native full-opacity protein geometry and shared RNA/DNA colors remain unchanged.

Verification completed:

- `smoke.mjs`: all four models and all 20 registered root/condition combinations pass.
- `science.test.mjs`: all prior geometric assertions pass unchanged, including five 1001-frame Cas9/SOS strand-separation branches; the three new continuity tests also pass.
- The new continuity tests were run before repair and reproduced two failures, then passed after repair. Logs are in `evidence/turnover/continuity-before.log`, `continuity-after.log`, `smoke-after.log` and `science-after.log`.
- Only the six owned implementation/test files were formatted; owned diff whitespace check passes.

Root playback review should concentrate on RNA p=.38/.405/.43 and SOS RecA assembly, p=.6175 RNAP entry, p=.79/.84/.86 LexA clearance, both conditions, and label visibility. Blended surfaces need actual rendered review. These measurements establish model-state continuity and retained geometry invariants, not display FPS or full visual acceptance. Shared player-clock repair remains with root, using `evidence/turnover/player-peer.md`.


## Supplementary rendered-label repair

The 25-frame original review is preserved in `resolutions/turnover-rendered.md`. New findings were recorded before implementation in `evidence/turnover/repair-discoveries.json` and `.md`; the immutable Phase A audit was not edited. Root explicitly authorized all four repairs.

| Issue | Repair and direct evidence |
| --- | --- |
| `20261004-turnover-R01` | RNA leader anchors now follow actual AGO/guide/cap, surviving target-UTR backbone and poly(A) residues, moving TNRC6/CCR4-NOT cores and the cleavage marker. Target/cap/tail labels derive activity from their actual visible geometry. All three pairing branches and 15 progress/irregular-seek samples assert each active RNA/effector leader against real named mesh centers, retained RNA segment centers or visible residue centers. Terminal cap/UTR labels are inactive; fully degraded slicing tail label is inactive. |
| `20261004-turnover-R02` | Proteasome leaders now point to the actual Rpn11 core, oscillating ATPase core, always-visible core subunit fold, exposed catalytic site, moving substrate residue, ubiquitin core and peptide curve. Product label activity derives from the peptide object visibility. All 3 roots crossed with 2 tag conditions and 2 shell views at 15 progress samples verify actual object or peptide-curve anchor positions; cutaway catalytic-chamber label remains absent for the whole shell, and absent product/tag labels remain inactive. |
| `20261004-turnover-R03` | Cas9/HNH/RuvC/crRNA/tracrRNA anchors follow parent and local transforms. PAM points at an actual DNA PAM cube. DNA direction and displaced-strand labels end on their own strand geometry. All 3 target conditions at 15 progress samples verify exact HNH/RuvC core identity, actual DNA PAM center, native tracrRNA curve point, guide backbone and correct DNA endpoints/rail. Elevated pre-docking and rejected Cas9 retain correct label identity. |
| `20261004-turnover-R04` | SOS molecular labels follow actual operator, RecA core, LexA catalytic fragment, polymerase lobe, coding/template endpoints and visible response-RNA 5-prime endpoint. The damage-gap caption is explicitly a regional anchor inside the missing-complement gap. RNA-label absence follows transcript visibility, including noncleavable LexA. Both LexA conditions at 15 progress samples and the recorded p=.795 frame assert actual RNA/protein/operator/strand points. The moving 5-prime RNA endpoint remains on the real transcript as it exits RNAP; absent transcripts cannot leave an active RNA label. |

All four product definitions now use the module-local `labelAnchors.js`. It preallocates one scratch vector per label, applies real object world transforms, and writes into existing position arrays. No label, vector, node, geometry or material is allocated by the new anchor setters during update. Sampled RNA-scaffold/product-curve points are also allocated only during construction. Inactive RNA anchors receive deterministic fallback coordinates while remaining inactive. Molecular geometry, branch mechanisms, native dimensions and existing scientific tests remain unchanged by these annotation repairs.

`labels.test.mjs` has four geometry/visibility tests plus one shared resource/identity/seek test, imported by the owned science entry. The four geometry tests first failed on the original AGO, Rpn11, HNH and response-RNA offsets; all five tests pass after repair. They cover all 20 registered root/condition combinations, 15 progress values including irregular seeks and the reviewed stage values. Evidence: `evidence/turnover/labels-before.log`, `labels-after.log`, `smoke-labels-after.log`, and `science-labels-after.log`. The final owned smoke and science entry pass, including previous five 1001-frame bubble branches, prior scientific assertions, three continuity tests and five label tests. No shared runner, browser, full-suite or publication action was performed.

Renewed native-resolution images and continuous playback remain root gates. Inspect both nuclease leaders during Cas9 docking and all RNA/cap terminal labels; geometry tests do not establish label-box layout, transparency composition or final small-cut visual legibility.


## R02 default-camera chamber follow-up and R05 ownership

The `full-b1` review found the correctly identified beta5 site hidden by the right wall. Root authorized a focused R02 follow-up without duplicating the issue. Only `proteasomeProcess.js` and the existing `labels.test.mjs` were edited. The chamber caption now points to **actual beta catalytic site 1 (beta2)**, visibly exposed through the cutaway. Other model files and molecular geometry remain frozen.

The exact default 960×640 camera was recreated with ProcessScene's 36-degree perspective and sampled-animation fit. Actual first-hit triangle raycasts show the old site's line of sight hitting `20S protein volume 1 0` first (projected point approximately 539.28, 401.42), while the selected site itself is the first visible hit (approximately 479.16, 386.17). Of all six existing catalytic sites, sites 1 and 4 were exposed at each of the seven stage values. The full diagnostic is `evidence/turnover/proteasome-chamber-ray.mjs` and `.json`.

The original R02 direct named-object identity test is retained, with its intended target explicitly updated to the selected beta2 site. A new ray-first-hit test failed on the old anchor and passes after repair across all three roots, both tag conditions and 107 times: **642 default-view checks**. It also confirms the old site's wall occlusion, and the original whole-shell inactive-label assertions remain. All six label tests pass; logs are `evidence/turnover/chamber-ray-before.log` and `chamber-ray-after.log`. Renewed root capture remains necessary for rendered label layout.

**R05 is recorded exactly once with `pending_root_repair`**, based on the Chinese text-box/model overlaps in `resolutions/turnover-rendered-final.md`. Root assigns shared `sceneCapture` layout to regulation. Turnover did not edit the shared renderer or assume that repair was complete.

Final focused validation: owned science entry passes all existing science/bubble assertions and all nine continuity/label tests; owned smoke passes all 20 root/control combinations. Logs: `evidence/turnover/science-chamber-after.log` and `smoke-chamber-after.log`. Owned diff whitespace check passes.
