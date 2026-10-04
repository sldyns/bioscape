# bacterialSignals · rendered review and repair · 2026-10-04

Reviewed all 28 phase/stage images across chemotaxis, twoComponent, quorumSensing and biofilm in the bacterium root from `evidence/browser/gallery-index.json`. All four stage sheets and representative native 960 × 640 originals (chemotaxis stage 5, twoComponent stage 4, quorumSensing stage 6, biofilm start) were visually inspected. The pre-existing scientific repairs are consistent with those frames; the static gallery does not establish continuous playback acceptance.

The rendered frames confirmed four new label defects. They were recorded before editing as issues 20261004-bacterialSignals-06 through -09 in `evidence/bacterialSignals/repair-discoveries.json` and `.md`. The Phase A audit is unchanged. Each issue has exactly one closure in `resolutions/bacterialSignals.json` and the matching Markdown report.

## Corrections

- Chemotaxis: all seven labels now use actual envelope/receptor/protein/motor/track mesh surfaces. CheY-P follows its moving sphere; the cell-contained anchors include tumble rotation.
- NarX–NarL: membrane and protein labels use real surfaces; the His anchor is on the physical donor residue. ATP/ADP and NarL/Asp follow translation/rotation and change wording with visible state. RNA follows its rendered free end. DNA endpoint leaders use actual instanced cylinder endpoints. Nitrate is an independent visibility-gated label; periplasm/cytoplasm are explicitly compartment regions.
- Quorum sensing: LuxI, LuxR, lux box, operon tabs, free AHL and strand labels now track actual surfaces/endpoints. LuxR is named without AHL before binding and throughout dilution.
- Biofilm: labels track the actual solid surface, cell attachment/release, Psl/eDNA/protein structures, NO and scaled c-di-GMP inset. Invisible matrix/inset/cue structures no longer retain active labels. Psl initially follows the visible adhesion tether, then the visible scaffold.

The module-local anchor helper preserves label, position-array and bilingual-text identity, uses actual mesh vertices/instance matrices, applies parent transforms and inherits visibility. No geometry, material or scene node is created during update. No shared renderer or other module was changed.

## Verification

`node src/processes/modules/bacterialSignals/science.test.mjs` passed all existing biological geometry, carrier continuity, finite/stable resource, deterministic seeking and module bundle checks. It now imports `labels.test.mjs`, which passed 3090 active leader-to-actual-triangle checks across all four models, both condition branches, 26 progress values and two parent-transform states. The same test checks actual-target visibility, ATP/ADP/LuxR wording and stable deterministic labels.

Six in-memory mutation probes restored the four label failures, removed parent transforms or falsely labeled unliganded LuxR with AHL. Every mutation was rejected by the intended assertion. Product files were not mutated by these probes. Logs and compact results are in `evidence/bacterialSignals/rendered-followup-science.log`, `rendered-label-negative-probes.json` and the matching per-probe logs. The five earlier biological/motion mutation probes remain separately recorded.

## Integration boundary

Owned source is frozen for root's refreshed gallery pass. Re-render the seven stages of all four bacterium models, including absent nitrate, diluted AHL and no-NO controls as needed to confirm suppression and wording. Final projected-label spacing and occlusion have not been observed after this repair, and are not claimed as accepted. Continuous playback, physical devices, publication and fixed performance remain separate gates. No browser operation, full suite, unowned edit or delegated agent was used by this reviewer.
