# plantSignals additional rendered discoveries

These two new P2 findings come from all seven supplied stages per process and native 960×640 inspection. Phase A is unchanged.

- **20261004-plantSignals-06 / auxin**: bound Auxin/TIR1, DNA/ARF and RNA leaders still use empty-space layout offsets. Repressor and tissue anchors also need their real geometry/transforms. Native stage-3 and stage-6 images confirm it.
- **20261004-plantSignals-07 / plantDefense**: receptor, BIK1/RBOHD, peptide, ROS and NADPH anchors miss their named targets or omit changing coordinates. Native stage-4 and end images confirm it.

`ProcessScene.jsx` directly projects `label.position` into the leader endpoint, so this is not a harmless label-placement preference. Fix named anchors against actual mesh/instance surfaces; check all dynamic/active branches. Apoplast, Cytosol and Nucleus are contextual region annotations and should stay in their correct empty compartment instead of being forced onto a protein surface.

[Structured evidence](repair-discoveries.json) records coordinates, image names, proposed fixes and regression invariants.
