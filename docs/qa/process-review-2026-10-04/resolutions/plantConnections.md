# Plant connections · Phase B resolution · 2026-10-04

All three original issue IDs are fixed and locally verified. Additional label issue 04 and CAM storage-scale issue 05 are separately documented in [repair discoveries](../evidence/plantConnections/repair-discoveries.md); Phase A is unchanged. **The owned module is frozen for root rendered review.**

| Issue | Result |
| --- | --- |
| 20261004-plantConnections-01 | Wall-side callose now drives a compatible two-leaflet neck profile; collar width stays behind both cell-facing plasma membranes. All original cargo outcomes remain. |
| 20261004-plantConnections-02 | Photorespiration's inner membrane and five tubular cristae form one continuous indexed surface with ten genuine open junctions. |
| 20261004-plantConnections-03 | CAM uses the same repaired inner membrane. C4 carbon trajectories and pore geometry are preserved. |
| 20261004-plantConnections-04 | Named-object leaders track actual geometry; compartment labels point inside their regions; stage-specific moving metabolite labels retain correct identity. |
| 20261004-plantConnections-05 | CAM storage-volume markers retain their geometry and trajectories but use the actual vacuolar lumen to bound peak radius at 0.36 rather than 1. All 5,100 peak vertices remain inside; fresh native peak/end images pass. Closed within this module's scope. |

The crista repair includes real apertures, shared boundary vertices and open lumina rather than cylinders overlapping an intact envelope. Double envelopes, cut rims, luminal opening rims and membrane-associated details remain. Nonadjacent-triangle self-intersection checks also pass.

Local verification:

- The existing scientific suite passes unchanged SUC2 chain/ATP/proton invariants and its **10001-frame C4 regression**: 4000 rim-triangle and 1700 bond checks, minimum actual rim clearance **0.0022313727**.
- The new topology regression passes **680 membrane/callose triangle checks**, with minimum membrane clearance **0.0118457796** and lipid-head clearance **0.0149329384**. Reconstructed original collar and detached-neck geometry fail the relevant invariants.
- **30 junction checks** cover photorespiration under both GLYK conditions and CAM: one connected oriented membrane, no internal free boundary, no capped opening, no self-intersection or outer-envelope crossing.
- The new label regression passes **432 actual-target checks** across eight conditions and irregular seeks; the original static sucrose anchor is rejected.
- Rendered follow-up for the same issue 04 moves the carbon-balance caption from outside the depicted pathway to the mitochondrial split-reaction region. **24 additional range/projection checks** cover both GLYK conditions, landscape/portrait fitted cameras and irregular seeks, and reject the original caption coordinate. Actual CO₂ geometry and its molecular anchor remain unchanged. The module smoke check passes again; the caption is frozen pending root recapture, while shared capture-layout work owns the CO₂ label-box occlusion. See [rendered review](plantConnections-rendered.md) and [caption regression](../evidence/plantConnections/caption-regression.log).
- All four module smoke tests pass finite buffers/bounds, deterministic seeks, stable node/material/geometry identities and standalone bundles. Only owned files were formatted; whitespace checks pass.
- Final all-control review found the CAM storage-scale issue. Its new regression passes 2,016 branch/progress states and 24,192 marker states, actual peak vertex clearance **0.0324701624**, conservative world bounding-sphere clearance **0.0315494854**. The same real membrane/marker geometry at the old peak radius fails. Original sphere/tonoplast vertex counts remain. Owned science and smoke checks pass again; [all-cases review](plantConnections-rendered-all-cases.md) records the derivation, pre-repair images and fresh recapture verification.

Fresh `conditions-final-d-000/001-c4cam-plant` stage-4/end images were subsequently checked at their original 960×640 resolution. CAM peak and end storage silhouettes remain visibly separated from the complete vacuolar rim, and the C4 counterparts show no leaked CAM storage geometry. Issue 05 is now closed by numerical and targeted rendered evidence; the [all-cases review](plantConnections-rendered-all-cases.md) retains both pre-repair evidence and exact fresh image links. No source or browser changes were made during this final verification.

Evidence: [science log](../evidence/plantConnections/science-repair.log), [final smoke log](../evidence/plantConnections/smoke-repair-final.log), [full resolution](plantConnections.json). Changed source includes the four process files, `anatomy.js`, the new `cristaGeometry.js` and `labelAnchors.js`, and owned regression files.

Scientific support remains the opened primary sources from Phase A, especially [crista-junction electron tomography](https://pubmed.ncbi.nlm.nih.gov/9245766/) for inner-membrane continuity and [plasmodesma cryo-ET](https://www.nature.com/articles/s41477-026-02294-9) for membrane/wall separation. Shapes remain schematics; neuronal dimensions and moss-specific closure kinetics were not transferred to these plant models.

No browser/full-suite/release work was performed. Root must still inspect the revised collars, cristae, reaction-site bodies, labels and continuous playback; no FPS, GPU or physical-device claim is made.
