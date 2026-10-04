# RNA / intracellular transport · Phase B · 2026-10-04

**20261004-rna-01 fixed locally; rendered acceptance remains pending.** Both dynein stalks now end in preallocated globular microtubule-binding domains with helix detail. Their centers remain attached to the existing stalk tips; their surfaces reach the actual tubulin track when planted and lift away with the swinging head. Existing motor rings, stalks, variable dynein gait, reverse step, ATP branch and cargo route are unchanged. Bilingual stage wording now identifies the terminal binding domains.

Primary evidence added to the model: [Redwine et al. 2012](https://pubmed.ncbi.nlm.nih.gov/22997337/), opened live; cryo-EM and functional work establish the terminal microtubule-binding domain and its coupling to track binding/release. The new surface remains a functional schematic, not an atomic fit.

Changed files:

- `src/processes/modules/rna/motorTransportProcess.js`
- `src/processes/modules/rna/science.test.mjs`

The new regression uses **actual triangle intersections** through `MeshBVH.intersectsGeometry`, applying each tubulin instance and binding-domain world transform. It verifies 90 planted contacts, 10 detached midswings, 10 ATP-depleted contacts and continuous stalk-to-domain attachment. Replaying the original model fails at the first planted state with “no tubulin surface contact,” confirming that the invariant rejects the original geometry rather than only checking names or metadata.

Both existing group suites pass. RNA linkage, NPC leaflet topology/cargo trajectories, motor gait/direction/ATP invariants and all 14 root/condition smoke configurations remain intact. Stable resources, material disposal inventory, deterministic seeks, finite geometry/bounds and browser bundling pass. The motor now has 65 scene nodes (previously 57); no scene node, geometry or material is allocated during update. Only the two owned changed files were formatted.

Logs are retained as `evidence/rna/phase-b-science.log`, `phase-b-refinement.log` and `phase-b-negative-control.log`. The negative-control source replay is `evidence/rna/baseline-motor-replay.mjs`; original Phase A records remain unchanged.

`rnaProcessing`, `nuclearTransport` and `organelleImport` received no product changes. The single audited issue is accounted for, with none left unresolved locally. Root still needs continuous rendered playback and visual acceptance, especially dynein planted/swing states and the pre-existing staged visibility transitions noted in Phase A. No browser, full-workspace suite or publication was performed by this reviewer.

## Authorized rendered-review follow-up: labels

**20261004-rna-rendered-01 and 20261004-rna-rendered-02 are fixed locally.** These two discoveries supplement the original single-issue Phase A audit; its files and original motor contact evidence remain unchanged. The earlier unchanged-model statement describes the initial motor-only repair. The later authorized label repair now affects all four models and the owned geometry helper.

The NPC has independent prebuilt alpha and beta labels following their actual receptor helices. After exposed-NLS cargo release, alpha is identified as retained in the nucleus while beta follows its own return to the cytosol. Masked-NLS alpha remains a generic cytosolic alpha label. Both language strings and Ran-GTP/GDP states are checked; text objects, label objects and position arrays are reused.

The concrete-object sweep confirmed 18 detached anchors, with original distances up to 1.317355 scene units. All 20 concrete-object labels now attach to existing triangle vertices or tubulin instances, including the new alpha identity and an already-near-wire lariat point refined for consistency. The lariat's prior 0.00997 surface distance is diagnostic context and is not counted as an empty-space defect. Full object names and regional annotations remain intact. No geometry, movement, controls or camera changes were required for this follow-up.

The regression passes 14 registered root/condition configurations and 1,218 actual target mesh/instance surface checks. It includes hidden-object branches, bilingual identity and receptor compartment state, repeated seeks, and stable label/text/array identities. All 18 original off-object coordinates are rejected by the same triangle-based invariant when replayed against unchanged target geometry; repaired coordinates pass. Independent broad-object surface measurements give maximum after distance zero at sampled points. Existing science and refinement checks still pass, including all dynein contact assertions.

Changed source files in this follow-up: `refinementGeometry.js`, `rnaProcessingProcess.js`, `nuclearTransportProcess.js`, `motorTransportProcess.js`, `organelleImportProcess.js` and `science.test.mjs`, all under `src/processes/modules/rna/`.

Per-object evidence and limits: `evidence/rna/repair-discoveries.json` and `.md`, with immutable `label-anchor-before.json`, independent `label-anchor-after.json`, and `label-negative-control.json`. Logs: `label-repair-science.log`, `label-repair-refinement.log`, and `label-repair-negative-control.log`. Root still owns all-branch/root rendered review and continuous-playback acceptance; geometric endpoint correctness alone does not close screen-projection acceptance.

## Default-camera beta/Ran identity follow-up

**20261004-rna-rendered-03 is fixed locally, awaiting the six-case NPC recapture.** The all-case gallery exposed a distinct screen-projection issue at exposed-NLS p=.765: beta's true contact-side surface point was hidden by bound Ran. The new anchor is one fixed centroid of an existing upper-front beta helix triangle. It remains on beta throughout the animation, without point switching or any geometry, relative protein pose, Ran anchor or camera change.

The actual fitted 960×640 default camera is reproduced for first-hit assertions. All 156 beta/Ran assertions pass across the three roots, both NLS branches and 13 gallery/binding/recycling poses; each configuration preserves one local point through 1,005 seeks. All three roots reject the previous p=.765 anchor as foreground Ran. The fitted-camera old .935 point already resolves to beta, correcting the earlier unfitted probe; .935 is a preservation check. The existing scientific, physical-surface and refinement suites remain passing. Root intentionally preserves reasonable membrane/pore occlusion during central passage and does not require arbitrary-view/all-time visibility.

Evidence and exact scope are appended to `evidence/rna/repair-discoveries.md` and `.json`; per-root first-hit records are in `npc-visibility-regression.json`. No shared label-box issue is duplicated here.

## Final sampled rendered verification

All 14 RNA root/control cases now have sampled-frame review. Eight non-NPC cases use the original final batch A; all six NPC cases were recaptured in Chinese as `conditions-final-e-000..005`. Their six seven-frame sheets and each exposed root's p=.765/.935 native 960×640 originals were opened. Beta now points to the purple beta helix, Ran-GTP to the Ran complex, and retained alpha to the separate nuclear alpha structure. All masked branches preserve cytosolic cargo/receptor identity and nuclear Ran-GTP. No new defect was confirmed.

The accepted set contains 98 sampled frames in 14 cases. Discovery plus replacement review covered 20 sheets / 140 captured frames and 17 additionally opened originals. This is native irregular-seek evidence, not continuous playback of every case. See `resolutions/rna-rendered-all-cases.md` for every case, image counts, languages and remaining acceptance boundaries.
